extends Control
# Frog Match Battle - independent Godot 4 prototype
const N = 7
const GOAL = 350
const MAX_MOVES = 20
const PALETTE = ["#f76f77", "#ffc34c", "#ad8cfa", "#55c9a3", "#ff91cb", "#73bcff"]
const GLYPHS = ["✿", "★", "◆", "●", "♥", "✦"]
var rng = RandomNumberGenerator.new()
var cells = []
var tiles = []
var score = 0
var moves = 0
var selected = -1
var locked = false
var ended = false
var generation = 0
var board: Control
var status: Label
var score_label: Label
var moves_label: Label
var touch_index = -1
var pointer_down = -1
var pointer_origin = Vector2.ZERO
var touch_origin = Vector2.ZERO

func _ready():
	rng.randomize()
	var background = ColorRect.new()
	background.color = Color("#368f79")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	var layout = VBoxContainer.new()
	layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layout.offset_left = 14
	layout.offset_right = -14
	layout.offset_top = 18
	layout.offset_bottom = -16
	layout.add_theme_constant_override("separation", 12)
	add_child(layout)
	var heading = Label.new()
	heading.text = "Frog Match Battle"
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heading.add_theme_font_size_override("font_size", 32)
	layout.add_child(heading)
	var info = HBoxContainer.new()
	layout.add_child(info)
	score_label = Label.new()
	score_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_child(score_label)
	moves_label = Label.new()
	info.add_child(moves_label)
	status = Label.new()
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layout.add_child(status)
	board = Control.new()
	board.custom_minimum_size = Vector2(280, 280)
	board.size_flags_vertical = Control.SIZE_EXPAND_FILL
	board.clip_contents = true
	layout.add_child(board)
	board.resized.connect(_place_tiles)
	var restart = Button.new()
	restart.text = "New Round"
	restart.pressed.connect(new_round)
	layout.add_child(restart)
	new_round()

func _geometry():
	var side = min(board.size.x, board.size.y)
	return {"cell": side / N, "origin": (board.size - Vector2.ONE * side) * 0.5}

func _tile_position(i):
	var g = _geometry()
	return g.origin + Vector2(i % N, int(i / N)) * g.cell

func _place_tiles():
	if locked or tiles.size() != N * N:
		return
	var cell = _geometry().cell
	for i in range(N * N):
		tiles[i].position = _tile_position(i)
		tiles[i].size = Vector2.ONE * cell

func _create_tile(i):
	var root = Control.new()
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	var face = Panel.new()
	face.mouse_filter = Control.MOUSE_FILTER_IGNORE
	face.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	face.offset_left = 3
	face.offset_top = 3
	face.offset_right = -3
	face.offset_bottom = -3
	var style = StyleBoxFlat.new()
	style.bg_color = Color(PALETTE[cells[i]])
	style.corner_radius_top_left = 100
	style.corner_radius_top_right = 100
	style.corner_radius_bottom_left = 100
	style.corner_radius_bottom_right = 100
	style.shadow_color = Color(0, 0, 0, 0.25)
	style.shadow_size = 3
	face.add_theme_stylebox_override("panel", style)
	root.add_child(face)
	var symbol = Label.new()
	symbol.text = GLYPHS[cells[i]]
	symbol.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	symbol.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	symbol.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	symbol.add_theme_font_size_override("font_size", 24)
	symbol.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(symbol)
	root.gui_input.connect(func(event): _tile_input(i, event))
	return root

func _refresh():
	for tile in tiles:
		board.remove_child(tile)
		tile.queue_free()
	tiles.clear()
	for i in range(N * N):
		var tile = _create_tile(i)
		board.add_child(tile)
		tiles.append(tile)
	_place_tiles()

func _tile_input(i, event):
	if locked or ended:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			touch_index = i
			touch_origin = event.position
		elif touch_index >= 0:
			var start = touch_index
			touch_index = -1
			_gesture(start, event.position - touch_origin)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			pointer_down = i
			pointer_origin = event.global_position
		elif pointer_down >= 0:
			var start = pointer_down
			pointer_down = -1
			_gesture(start, event.global_position - pointer_origin)

func _gesture(i, delta):
	if delta.length() < 18:
		_select(i)
		return
	var j = i
	if abs(delta.x) > abs(delta.y):
		j += 1 if delta.x > 0 else -1
	else:
		j += N if delta.y > 0 else -N
	if j >= 0 and j < N * N and _adjacent(i, j):
		_swap(i, j)

func _select(i):
	if selected < 0:
		selected = i
		status.text = "Select a neighboring piece"
	elif _adjacent(selected, i):
		var a = selected
		selected = -1
		_swap(a, i)
	else:
		selected = i

func _adjacent(a, b):
	return abs(int(a / N) - int(b / N)) + abs(a % N - b % N) == 1

func _matches():
	var result = {}
	for r in range(N):
		for c in range(N):
			var i = r * N + c
			var value = cells[i]
			if value < 0:
				continue
			if c <= N - 3 and cells[i + 1] == value and cells[i + 2] == value:
				var x = c
				while x < N and cells[r * N + x] == value:
					result[r * N + x] = true
					x += 1
			if r <= N - 3 and cells[i + N] == value and cells[i + 2 * N] == value:
				var y = r
				while y < N and cells[y * N + c] == value:
					result[y * N + c] = true
					y += 1
	return result.keys()

func _has_move():
	for a in range(N * N):
		for b in [a + 1, a + N]:
			if b >= N * N or not _adjacent(a, b):
				continue
			var temp = cells[a]
			cells[a] = cells[b]
			cells[b] = temp
			var valid = not _matches().is_empty()
			temp = cells[a]
			cells[a] = cells[b]
			cells[b] = temp
			if valid:
				return true
	return false

func _new_board():
	for attempt in range(300):
		cells.clear()
		for i in range(N * N):
			cells.append(rng.randi_range(0, 5))
		if _matches().is_empty() and _has_move():
			return

func _stats():
	score_label.text = "Score %d / %d" % [score, GOAL]
	moves_label.text = "Moves %d / %d" % [moves, MAX_MOVES]

func new_round():
	generation += 1
	locked = false
	ended = false
	score = 0
	moves = 0
	selected = -1
	touch_index = -1
	_new_board()
	_refresh()
	status.text = "Match 3 to reach 350 points!"
	_stats()

func _swap(a, b):
	if locked or ended:
		return
	locked = true
	var version = generation
	var first = tiles[a]
	var second = tiles[b]
	var pos_a = first.position
	var pos_b = second.position
	var tween = create_tween().set_parallel(true)
	tween.tween_property(first, "position", pos_b, 0.23).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(second, "position", pos_a, 0.23).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	await tween.finished
	if version != generation:
		return
	var temp = cells[a]
	cells[a] = cells[b]
	cells[b] = temp
	var matched = _matches()
	if matched.is_empty():
		var undo = create_tween().set_parallel(true)
		undo.tween_property(first, "position", pos_a, 0.23)
		undo.tween_property(second, "position", pos_b, 0.23)
		await undo.finished
		if version != generation:
			return
		temp = cells[a]
		cells[a] = cells[b]
		cells[b] = temp
		locked = false
		status.text = "No match. Try another swap!"
		return
	var cleared = await _resolve(matched, version)
	if version != generation:
		return
	score += cleared * 10
	moves += 1
	_refresh()
	_stats()
	if score >= GOAL or moves >= MAX_MOVES:
		ended = true
		status.text = "Goal reached! You win!" if score >= GOAL else "Out of moves. Try again!"
	else:
		status.text = "Great! %d pieces matched!" % cleared
	locked = false

func _resolve(matched, version):
	var total = 0
	for chain in range(12):
		if matched.is_empty() or version != generation:
			break
		total += matched.size()
		for i in matched:
			cells[i] = -1
		# Fixed board; only tile nodes scale away.
		var tween = create_tween().set_parallel(true)
		for i in matched:
			tween.tween_property(tiles[i], "scale", Vector2.ZERO, 0.16)
		await tween.finished
		if version != generation:
			return total
		for c in range(N):
			var keep = []
			for r in range(N - 1, -1, -1):
				if cells[r * N + c] >= 0:
					keep.append(cells[r * N + c])
			for r in range(N - 1, -1, -1):
				var offset = N - 1 - r
				cells[r * N + c] = keep[offset] if offset < keep.size() else rng.randi_range(0, 5)
		_refresh()
		matched = _matches()
	if not _has_move():
		_new_board()
	return total
