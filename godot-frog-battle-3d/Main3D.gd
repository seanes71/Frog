extends Node3D
# Independent 3D prototype. Fixed board, individual 3D mesh tweens.
const N = 7
const GOAL = 350
const MAX_MOVES = 20
const PALETTE = ["#f46e76", "#ffbf49", "#a987ef", "#5cd0a5", "#ff90c9", "#78bcff"]
var rng = RandomNumberGenerator.new()
var cells = []
var pieces = []
var camera: Camera3D
var score = 0
var moves = 0
var selected = -1
var busy = false
var ended = false
var version = 0
var down = -1
var down_pos = Vector2.ZERO
var status: Label
var scoreboard: Label

func _ready():
	rng.randomize()
	_build_world()
	_build_hud()
	new_round()

func _build_world():
	var environment = WorldEnvironment.new()
	var env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#7bd6c1")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color.WHITE
	env.ambient_light_energy = 0.8
	environment.environment = env
	add_child(environment)
	camera = Camera3D.new()
	add_child(camera)
	camera.position = Vector3(0, 10.5, 13)
	camera.look_at(Vector3.ZERO, Vector3.UP)
	camera.fov = 55
	camera.make_current()
	var light = DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-55, -30, -20)
	light.light_energy = 1.4
	add_child(light)
	var base = MeshInstance3D.new()
	var mesh = BoxMesh.new()
	mesh.size = Vector3(7.65, 0.35, 7.65)
	base.mesh = mesh
	base.position.y = -0.26
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color("#226e7a")
	mat.roughness = 0.35
	base.material_override = mat
	add_child(base)
	for r in range(N):
		for c in range(N):
			var well = MeshInstance3D.new()
			var square = BoxMesh.new()
			square.size = Vector3(0.94, 0.035, 0.94)
			well.mesh = square
			well.position = Vector3(c-3, -0.065, r-3)
			var m = StandardMaterial3D.new()
			m.albedo_color = Color("#368d93") if (r+c)%2==0 else Color("#2d8089")
			well.material_override = m
			add_child(well)

func _build_hud():
	var layer = CanvasLayer.new()
	add_child(layer)
	var ui = Control.new()
	layer.add_child(ui)
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_PASS
	var title = Label.new()
	title.text = "Frog Match Battle 3D"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	title.offset_top = 20
	title.add_theme_font_size_override("font_size", 27)
	ui.add_child(title)
	scoreboard = Label.new()
	scoreboard.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	scoreboard.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	scoreboard.offset_top = 75
	ui.add_child(scoreboard)
	status = Label.new()
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	status.offset_top = -120
	status.offset_bottom = -85
	ui.add_child(status)
	var restart = Button.new()
	restart.text = "New Round"
	restart.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	restart.offset_left = 120
	restart.offset_right = -120
	restart.offset_top = -72
	restart.offset_bottom = -22
	restart.pressed.connect(new_round)
	ui.add_child(restart)

func _pos(i):
	return Vector3(i%N-3, 0.24, int(i/N)-3)

func _make_piece(i):
	var root = Node3D.new()
	root.position = _pos(i)
	add_child(root)
	var body = MeshInstance3D.new()
	var mesh = SphereMesh.new()
	mesh.radius = 0.43
	mesh.height = 0.86
	body.mesh = mesh
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(PALETTE[cells[i]])
	mat.metallic = 0.1
	mat.roughness = 0.16
	mat.clearcoat_enabled = true
	mat.clearcoat = 0.8
	body.material_override = mat
	root.add_child(body)
	var shine = MeshInstance3D.new()
	var highlight = SphereMesh.new()
	highlight.radius = 0.11
	highlight.height = 0.22
	shine.mesh = highlight
	shine.position = Vector3(-0.17, 0.23, 0.31)
	var white = StandardMaterial3D.new()
	white.albedo_color = Color(1,1,1,0.7)
	white.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	white.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	shine.material_override = white
	root.add_child(shine)
	return root

func _refresh():
	for piece in pieces:
		remove_child(piece)
		piece.queue_free()
	pieces.clear()
	for i in range(N*N):
		pieces.append(_make_piece(i))

func _matches():
	var result = {}
	for r in range(N):
		for c in range(N):
			var i = r*N+c
			var v = cells[i]
			if v < 0:
				continue
			if c < N-2 and cells[i+1]==v and cells[i+2]==v:
				var x = c
				while x<N and cells[r*N+x]==v:
					result[r*N+x]=true
					x+=1
			if r < N-2 and cells[i+N]==v and cells[i+2*N]==v:
				var y = r
				while y<N and cells[y*N+c]==v:
					result[y*N+c]=true
					y+=1
	return result.keys()

func _adjacent(a,b):
	return abs(int(a/N)-int(b/N))+abs(a%N-b%N)==1

func _has_move():
	for a in range(N*N):
		for b in [a+1,a+N]:
			if b>=N*N or not _adjacent(a,b):
				continue
			var temp=cells[a]
			cells[a]=cells[b]
			cells[b]=temp
			var valid=not _matches().is_empty()
			temp=cells[a]
			cells[a]=cells[b]
			cells[b]=temp
			if valid:
				return true
	return false

func _fresh():
	for attempt in range(300):
		cells.clear()
		for i in range(N*N):
			cells.append(rng.randi_range(0,5))
		if _matches().is_empty() and _has_move():
			return

func _update():
	scoreboard.text="Score %d / %d      Moves %d / %d" % [score,GOAL,moves,MAX_MOVES]

func new_round():
	version+=1
	busy=false
	ended=false
	selected=-1
	score=0
	moves=0
	_fresh()
	_refresh()
	status.text="Swap neighbors to match three!"
	_update()

func _screen_to_cell(point):
	var origin=camera.project_ray_origin(point)
	var direction=camera.project_ray_normal(point)
	if abs(direction.y)<0.0001:
		return -1
	var t=(0.24-origin.y)/direction.y
	if t<0:
		return -1
	var hit=origin+direction*t
	var c=int(floor(hit.x+3.5))
	var r=int(floor(hit.z+3.5))
	if c<0 or c>=N or r<0 or r>=N:
		return -1
	return r*N+c

func _input(event):
	if busy or ended:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			down=_screen_to_cell(event.position)
			down_pos=event.position
		elif down>=0:
			var a=down
			down=-1
			_gesture(a,event.position-down_pos)
	elif event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT:
		if event.pressed:
			down=_screen_to_cell(event.position)
			down_pos=event.position
		elif down>=0:
			var a=down
			down=-1
			_gesture(a,event.position-down_pos)

func _gesture(a,delta):
	if delta.length()<20:
		if selected>=0 and _adjacent(selected,a):
			var first=selected
			selected=-1
			_swap(first,a)
		else:
			selected=a
			status.text="Select a neighboring piece"
		return
	var p=_pos(a)
	var end=_screen_to_cell(down_pos+delta)
	if end>=0 and _adjacent(a,end):
		_swap(a,end)
	elif end>=0:
		status.text="Swap only neighboring pieces"

func _swap(a,b):
	if busy or ended:
		return
	busy=true
	var current=version
	var first=pieces[a]
	var second=pieces[b]
	var start_a=first.position
	var start_b=second.position
	var tween=create_tween().set_parallel(true)
	tween.tween_property(first,"position",start_b,0.25).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(second,"position",start_a,0.25).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	await tween.finished
	if current!=version:
		return
	var temp=cells[a]
	cells[a]=cells[b]
	cells[b]=temp
	var matched=_matches()
	if matched.is_empty():
		var undo=create_tween().set_parallel(true)
		undo.tween_property(first,"position",start_a,0.2)
		undo.tween_property(second,"position",start_b,0.2)
		await undo.finished
		if current!=version:
			return
		temp=cells[a]
		cells[a]=cells[b]
		cells[b]=temp
		busy=false
		status.text="No match. Try another!"
		return
	var tmp_piece=pieces[a]
	pieces[a]=pieces[b]
	pieces[b]=tmp_piece
	var count=await _resolve(matched,current)
	if current!=version:
		return
	score+=count*10
	moves+=1
	_update()
	if score>=GOAL or moves>=MAX_MOVES:
		ended=true
		status.text="Goal reached! You win!" if score>=GOAL else "Out of moves!"
	else:
		status.text="Great match! +%d points" % (count*10)
	busy=false

func _resolve(matched,current):
	var total=0
	for chain in range(12):
		if matched.is_empty() or current!=version:
			break
		total+=matched.size()
		var pop=create_tween().set_parallel(true)
		for i in matched:
			pop.tween_property(pieces[i],"scale",Vector3.ZERO,0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
		await pop.finished
		if current!=version:
			return total
		for i in matched:
			pieces[i].queue_free()
			pieces[i]=null
			cells[i]=-1
		var fall=create_tween().set_parallel(true)
		for col in range(N):
			var target_row=N-1
			for row in range(N-1,-1,-1):
				var old_index=row*N+col
				if cells[old_index]<0:
					continue
				var new_index=target_row*N+col
				if new_index!=old_index:
					cells[new_index]=cells[old_index]
					pieces[new_index]=pieces[old_index]
					cells[old_index]=-1
					pieces[old_index]=null
					fall.tween_property(pieces[new_index],"position",_pos(new_index),0.32).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
				target_row-=1
			for row in range(target_row,-1,-1):
				var index=row*N+col
				cells[index]=rng.randi_range(0,5)
				pieces[index]=_make_piece(index)
				pieces[index].position=_pos(index)+Vector3(0,3.0+float(target_row-row)*0.5,0)
				fall.tween_property(pieces[index],"position",_pos(index),0.4).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		await fall.finished
		if current!=version:
			return total
		matched=_matches()
	if not _has_move():
		_fresh()
		_refresh()
	return total
