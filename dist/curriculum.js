import {LESSONS,nextLesson,recordLearning} from './journey.js?v=mobile-1';
// Reviewed vocabulary, tied to the same source-backed discoveries as the Journey.
const groups={
 'pond-web':[['ECOSYSTEM','Living things and their surroundings working together.'],['WETLAND','A watery habitat with connected plants and animals.']],
 'pond-recycling':[['DETRITUS','Small pieces of broken-down plant material.'],['RECYCLE','Reuse materials as they pass through a living system.']],
 'pond-connections':[['SURROUNDINGS','The area around a pond that helps shape its habitat.'],['CONNECTION','A link between water and surrounding habitat.']],
 'eggs-first':[['EGG','Before a tadpole in the familiar life cycle.'],['TADPOLE','Young stage between egg and froglet.'],['FROGLET','Young frog after the tadpole stage.'],['ADULT','Fully grown frog stage.'],['FROG','Animal whose familiar stages include egg and tadpole.'],['CYCLE','Life ___: stages from egg to adult.'],['STAGE','One step in an animal’s development.'],['SPECIES','Different frog ___ can develop differently.']],
 'egg-sites':[['LEAF','Poison frogs may lay eggs in ___ litter.'],['MOIST','Slightly wet: describes many poison frog egg sites.'],['LAND','Some frogs lay eggs here rather than in ponds.'],['BROMELIAD','A plant used by some poison frogs for eggs.']],
 'tadpole-order':[['YOUNG','A tadpole is a ___ frog stage.']],
 'tadpole-ride':[['BACK','Where a poison frog parent carries tadpoles.'],['STREAM','Flowing water where tadpoles may be carried.'],['POOL','Small body of water used by tadpoles.'],['WATER','Liquid needed at a tadpole’s destination.']],
 'froglet-order':[['LEGS','Body parts that develop as a tadpole grows.'],['GROW','What young frogs do as they develop.']],
 'froglet-cycle':[['ORDER','Egg, tadpole, froglet: the familiar stage ___.']],
 'adult-food':[['INSECTS','Main food of adult White’s tree frogs.'],['MOTHS','Winged insects eaten by White’s tree frogs.'],['LOCUSTS','Jumping insects eaten by White’s tree frogs.'],['ROACHES','Insects eaten by White’s tree frogs.']],
 'adult-calls':[['CALL','Sound that can help identify a frog species.'],['MATE','A frog may call to attract this partner.'],['DISTRESS','A frog may call to signal trouble, or ___.'],['TERRITORY','An area a frog may defend with calls.']],
 'pool-season':[['VERNAL','___ pools hold water for part of the year.'],['SEASONAL','Describes a pond that can dry out each year.'],['DRY','Vernal pools can ___ out.'],['POND','Still body of water; some are seasonal.']],
 'pool-woodfrog':[['WOOD','___ frogs breed in vernal pools.'],['FISH','These cannot live year-round in pools that dry out.'],['BREED','What wood frogs use vernal pools to do.']],
 'tree-home':[['TREE','Typical home of White’s tree frogs.'],['RAIN','Water source collected in leaves and tree crevices.'],['LEAVES','Flat plant parts that can collect rainwater.'],['CREVICE','A narrow opening in a tree that can hold water.']],
 'tree-climbing':[['TOE','___ pads help red-eyed tree frogs climb.'],['PADS','Adhesive toe ___ grip surfaces.'],['CLIMB','What adhesive toe pads help a tree frog do.'],['ADHESIVE','Describes toe pads that stick to surfaces.']],
 'rainforest-home':[['FOREST','Wet tropical ___: a poison frog habitat.'],['TROPICAL','Describes warm forests near the equator.'],['AMERICA','Poison frogs live in Central and South ___.']],
 'night-frogs':[['NIGHT','When red-eyed tree frogs become active.'],['DAY','When red-eyed tree frogs sleep.'],['NOCTURNAL','Active at night.'],['SLEEP','What red-eyed tree frogs do during the day.']],
 'healthy-pools':[['FOOD','Frogs belong to a ___ web.'],['WEB','A food ___ links animals that eat one another.']],
 'protect-habitat':[['CLEAN','Keep waterways this way to help frog habitats.'],['HABITAT','The place an animal lives.'],['PROTECT','Help keep frog homes safe.'],['WATERWAY','A stream or other water route worth keeping clean.']]
};
export const VOCABULARY=Object.entries(groups).flatMap(([lessonId,words])=>words.map(([word,clue])=>({word,clue,lessonId})));
export function puzzleLearningState(p){p.puzzleLearning ||= {checks:0,firstTry:0,attempts:0,pending:null,cycleOrder:[],cycleRounds:0};return p.puzzleLearning;}
export function puzzlePlan(p,mode){const state=mode==='crossword'?p.crossword:p.wordSearch;if(!state.plan){const j=p.journey||{learned:[],reviews:0},learned=LESSONS.filter(l=>j.learned.includes(l.id));const review=state.level%3===0&&learned.length;const lesson=review?learned[Math.floor(state.level/3-1)%learned.length]:nextLesson(p);state.plan={lessonId:lesson.id,learned:learned.map(l=>l.id),legacy:mode==='crossword'?Object.keys(state.letters||{}).length>0:(state.found||[]).length>0};}return state.plan;}
export function vocabularyPool(plan){if(plan.legacy)return undefined;return VOCABULARY.map(v=>[v.word,v.clue,v.lessonId,v.lessonId===plan.lessonId?0:plan.learned.includes(v.lessonId)?1:2]);}
export function beginPuzzleCheck(p,mode,puzzle){const state=puzzleLearningState(p);state.pending={mode,lessonId:puzzle.plan.lessonId,level:puzzle.level,attempts:0};return state.pending;}
export function answerPuzzleCheck(p,choice){const state=puzzleLearningState(p),pending=state.pending;if(!pending)return null;const lesson=LESSONS.find(l=>l.id===pending.lessonId);if(!lesson)return null;state.attempts++;pending.attempts++;if(choice!==learningPrompt(p,lesson).answer)return {correct:false,lesson};const learning=recordLearning(p,lesson.id,lesson.answer);state.checks++;if(pending.attempts===1)state.firstTry++;state.pending=null;return {correct:true,lesson,mode:pending.mode,currency:learning.currency,firstTry:pending.attempts===1};}

export const CYCLE_STAGES=[{name:'Egg',icon:'🥚',fact:'In the familiar cycle, the young frog begins inside an egg.'},{name:'Tadpole',icon:'💧',fact:'After hatching, the tadpole lives in water and has a tail.'},{name:'Froglet',icon:'🌱',fact:'As legs develop, a young froglet still has a shrinking tail.'},{name:'Adult frog',icon:'🐸',fact:'The familiar adult frog has legs and no tadpole tail. Adults can reproduce, starting another cycle.'}];
export function selectCycleStage(p,index){const state=puzzleLearningState(p);state.cycleOrder ||= [];if(index!==state.cycleOrder.length)return {correct:false,expected:state.cycleOrder.length};state.cycleOrder.push(index);if(state.cycleOrder.length<4)return {correct:true,complete:false};state.cycleRounds=(state.cycleRounds||0)+1;state.cycleOrder=[];p.bank+=2;return {correct:true,complete:true,currency:2};}
export const CHALLENGES={
 'eggs-first':['Why should we call egg → tadpole → froglet → adult a familiar pattern, rather than a rule for every frog?',['Development differs among species','All species grow at the same speed','Every frog skips the egg'],0],
 'egg-sites':['What does laying eggs in moist leaf litter show about frog reproduction?',['Egg sites vary among species','Every species needs a large pond','Egg sites never need moisture'],0],
 'tadpole-order':['A young animal hatches from a frog egg. Which stage would you look for next in the familiar cycle?',['Tadpole','Froglet','Adult frog'],0],
 'tadpole-ride':['Why is a poison frog carrying tadpoles to a pool an example of parental care?',['The parent moves its young to a water habitat','It gives every tadpole an adult body','It changes the pool into leaf litter'],0],
 'froglet-order':['A tadpole develops legs but still has a tail. What is happening?',['It is changing toward the froglet stage','It is returning to the egg stage','It has finished all development'],0],
 'froglet-cycle':['Which observation fits the familiar life cycle?',['A froglet develops after a tadpole','An adult changes into a tadpole','A froglet always develops before an egg'],0],
 'adult-food':['If suitable insects become scarce, which need of adult White’s tree frogs may become harder to meet?',['Finding enough food','Finding enough tree bark to eat','Finding seawater to drink'],0],
 'adult-calls':['Why can listening be useful during a frog survey?',['Calls can help distinguish species','All frogs make one identical call','Calls reveal a frog’s exact age'],0],
 'pool-season':['A pool holds water in spring but dries later. What does this tell you?',['It can be a seasonal habitat','It cannot support any wildlife','It must remain full all year'],0],
 'pool-woodfrog':['Why can seasonal drying make a pool useful for wood frog eggs?',['Fish cannot remain there year-round','Drying creates more fish','Eggs never need to hatch'],0],
 'tree-home':['Why might protecting trees matter to White’s tree frogs?',['Trees provide habitat and places that collect rainwater','Their only food is tree bark','They live exclusively on the pond bottom'],0],
 'tree-climbing':['What is the connection between toe-pad structure and tree-frog behavior?',['Adhesive pads help frogs grip while climbing','Pads are wings for long flights','Pads remove the need for water'],0],
 'rainforest-home':['Which habitat best matches the poison frog discovery?',['A wet tropical forest in Central America','A polar ice sheet','The open ocean'],0],
 'night-frogs':['When would you plan to look for an active red-eyed tree frog?',['At night, because it is nocturnal','At noon, because nocturnal means daytime','Only in winter, because nocturnal means cold'],0],
 'healthy-pools':['Why can a change in frog numbers affect other animals?',['Frogs eat some animals and are eaten by others','Frogs are separate from every food web','No other animal uses the same habitat'],0],
 'protect-habitat':['Which choice supports frog habitats?',['Protect waterways and seasonal pools','Drain all pools permanently','Add rubbish to the water'],0],
 'pond-web':['If one part of a pond food web changes, why might other parts change too?',['Organisms depend on one another for food','Each organism lives completely independently','Only the pond’s color can change'],0],
 'pond-recycling':['How can a fallen leaf connect to a larger wetland animal?',['Broken-down material supports small animals that larger animals eat','The leaf instantly becomes a frog','Leaves have no place in wetland food webs'],0],
 'pond-connections':['Why is protecting only the water surface an incomplete approach?',['Nearby land and water conditions both shape the habitat','Surrounding land never affects water','Every frog spends all its life on the surface'],0]
};
export function learningPrompt(p,lesson){const item=p.settings?.learning==='challenge'?CHALLENGES[lesson.id]:null;if(!item)return lesson;const shift=(LESSONS.findIndex(l=>l.id===lesson.id)+1)%3,choices=item[1].map((_,i)=>item[1][(i+shift)%3]);return {question:item[0],choices,answer:(item[2]-shift+3)%3};}
