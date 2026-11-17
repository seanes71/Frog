import {MOBILE_KEY,deviceProfile} from './migration.js?v=word-bank-cycle-20261117';
import {VOCABULARY,puzzleLearningState,puzzlePlan,vocabularyPool,beginPuzzleCheck,answerPuzzleCheck,CYCLE_STAGES,selectCycleStage,learningPrompt} from './curriculum.js?v=mobile-1';
import {Match,freshProfile,loadProfile,claimWelcomeBonus,leagueFor,settle,STAGES,STAGE_UNLOCKS,TRAIL,LEAGUES,FIGHTERS,POWERS,stageAvailable,addRewardedContinuePack,spendRewardedContinue} from './engine.js?v=word-bank-cycle-20261117';
import {CHAPTERS,LESSONS,JOURNEY_CARDS,journeyState,nextLesson,journeyProgress,recordLearning} from './journey.js?v=mobile-1';
import {createCrossword,checkCrossword,crosswordState,awardCrossword,WORDS} from './crossword.js?v=mobile-1';
import {collectionPageUnlocked,highestCollectionPage} from './catalog.js?v=mobile-1';
import {createWordSearch,wordSearchState,wordSearchDifficulty,selectionPath,wordFromSelection,awardWordSearch,WORD_SEARCH_STRENGTHS,selectWordSearchStrength} from './wordsearch.js?v=word-search-exhaustion-recovery-20261117';
import {MOBILE_AVATARS,MOBILE_HAIR_COLORS,MOBILE_BODY_COLORS,mobileAvatar,mobileAvatarArtUrl,mobileAvatarCutoutUrl} from './mobile-avatar-art.js?v=wordsearch-head-artfix-20261117';
const FROGGY_GIRL_ART='assets/golden-showstopper-girl-700.webp';
const FROGGY_BOUTIQUE_GIRL_ART='assets/approved-vegas-cards-cutie-close-crop-reference.png';
const FROGGY_BOY_ART='assets/froggy-boy-faceoff-repaired.png';
const $=s=>document.querySelector(s),KEY=MOBILE_KEY;
let profileKey=KEY;let p;try{p=deviceProfile(localStorage);localStorage.setItem(profileKey,JSON.stringify(p));}catch{p=freshProfile();}
let collectionPage=0;let boutiqueGender=p.fashionGender||'girl';let boutiqueCategory='Outfits';let fashionTryOn={};let fashionSelection='';let boutiqueHairPreviewColor=null;let boutiqueBodyPreviewColor=null;let pendingGameLaunch=null;
let gameAvatarFlow={step:1,pendingMode:null,pendingSeason:null};
let puzzle=null,activeEntry=null,searchPuzzle=null,searchStart=null,searchStarted=false,draggingSearch=false,searchDragged=false,searchDragEnd=null;
let activeLesson=null,lessonAnswered=false;let wordSearchStartedAt=0,wordSearchClock=null;
let match=null,series=null,season=null,screen='home',timers=new Set(),tick=null,seconds=15,epoch=0,toastTimer=null,peek=[],audio=null,audioStarted=false,countdownAudio=null,voiceFrame=null,voiceWatchdog=null;
const rivalNames=['Alex','Jamie','Taylor','Jordan','Riley','Casey','Morgan','Avery','Quinn','Parker','Drew','Skyler'];let lastRival='';
function save(){try{localStorage.setItem(profileKey,JSON.stringify(p));window.dispatchEvent?.(new CustomEvent('frog-progress-saved',{detail:{key:profileKey,profile:p}}));}catch{toast('Your browser could not save progress. Keep this tab open.');}sync();}
function later(fn,ms){const e=epoch;const id=setTimeout(()=>{timers.delete(id);if(e===epoch)fn();},ms);timers.add(id);return id;}
function stopTimers(){stopCountdownVoice();epoch++;timers.forEach(clearTimeout);timers.clear();clearInterval(tick);tick=null;peek=[];}
function toast(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
function welcomeGift(){const bonus=claimWelcomeBonus(p);if(bonus){save();toast(`Welcome! +${bonus} bonus frogs. Tap your balance to visit the shop.`);}}
function frogShop(){openHub('Froggy Shop',`<section class="panel"><h3>🐸 Your Froggy Dough</h3><p><b>${p.bank} frogs</b> ready to spend.</p><div class="actions"><button class="button" data-action="boutique">Open Fashion Boutique</button><button class="button blue" data-action="powers">Choose Super Powers</button></div></section><section class="panel"><h3>Earn More Froggy Dough</h3><p>Play solo, solve nature puzzles, or complete learning activities.</p><div class="actions"><button class="button" data-action="practice">Solo Play</button><button class="button secondary" data-action="journey">Frog Journey</button></div></section><section class="panel"><h3>Unlock Frogs</h3><p>Unlock additional frog characters as you progress. Real-money purchases are not available yet.</p><button class="button secondary wide" disabled>Buy Extra Frogs</button></section><section class="panel"><h3>Extra Froggy Dough</h3><p>Optional real-money purchases are not available yet. Checkout must be connected before purchases can be made.</p><button class="button secondary wide" disabled>Buy Extra Froggy Dough · Coming Soon</button></section>`,'shop');}
function fighter(){return FIGHTERS.find(f=>f.id===p.selected)||FIGHTERS[0];}
function portrait(){const avatar=mobileAvatar(p.gameAvatarId);return `<span class="frog-portrait match-frenzy-portrait" role="img" aria-label="${avatar.name}">${mobileAvatarImage(avatar.id,p.gameHairColor,p.gameBodyColor,'')}</span>`;}

function sync(){const l=journeyProgress(p);$('#bank').textContent=p.bank;const playCount=$('#reward-plays-count');if(playCount)playCount.textContent=Math.max(0,Number(p.rewardContinuations)||0);if($('#selected-name'))$('#selected-name').textContent=mobileAvatar(p.gameAvatarId).name;if($('.selected-avatar'))$('.selected-avatar').innerHTML=portrait();$('.avatar').innerHTML=portrait();if($('#league-name'))$('#league-name').textContent='Your Frog Journey';if($('#league-next'))$('#league-next').textContent=`${l.chapter.icon} ${l.chapter.name}${l.review?' · Review '+l.round:''}`;if($('#league-bar'))$('#league-bar').style.width=`${l.learned/l.total*100}%`;document.body.classList.toggle('reduce-motion',!p.settings.motion);hydrateGameAvatarImages(document);}
function show(view){screen=view;document.body.classList.toggle('home-fit',view==='home');document.body.classList.toggle('hub-fit',view==='hub');for(const id of ['home','hub','game'])$('#'+id).hidden=id!==view;document.body.classList.toggle('playing',view==='game');$('.bottom-nav').hidden=view==='game';window.scrollTo?.(0,0);}
function setNav(tab){document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.action===tab));}
function updateWordSearchClock(){const output=$('#wordsearch-elapsed');if(!output)return;const total=wordSearchStartedAt?Math.floor((Date.now()-wordSearchStartedAt)/1000):0,hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),seconds=total%60,display=hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;output.textContent=display;output.setAttribute('aria-label',`Time playing ${display}`);}
function startWordSearchClock(){if(wordSearchStartedAt)return;wordSearchStartedAt=Date.now();clearInterval(wordSearchClock);updateWordSearchClock();wordSearchClock=setInterval(updateWordSearchClock,1000);const button=$('#wordsearch-timer-start');if(button){button.disabled=true;}}
function resetWordSearchClock(){clearInterval(wordSearchClock);wordSearchClock=null;wordSearchStartedAt=0;updateWordSearchClock();const button=$('#wordsearch-timer-start');if(button){button.disabled=false;button.textContent='Start';}}
function stopWordSearchClock(){resetWordSearchClock();}function home(){stopWordSearchClock();pendingGameLaunch=null;if(searchPuzzle){wordSearchState(p).found=[];save();}stopTimers();searchPuzzle=null;searchStart=null;searchStarted=false;draggingSearch=false;puzzle=null;activeEntry=null;activeLesson=null;lessonAnswered=false;match=null;series=null;season=null;$('#modal').close();$('#wordsearch-timer-controls')?.remove();const content=$('#hub-content');content.replaceChildren();content.classList.remove('pond-adventure-menu');const lookHost=$('#hub-player-look');if(lookHost){lookHost.classList.remove('wordsearch-header-look');lookHost.replaceChildren();lookHost.hidden=true;}const heading=$('#hub-title');heading.classList.remove('wordsearch-title');heading.removeAttribute('aria-label');heading.textContent='Froggy Fashion Boutique';$('.page-heading .back')?.classList.remove('wordsearch-home-button');document.body.classList.remove('wordsearch-screen');show('home');$('#hub').hidden=true;$('#home').hidden=false;$('.bottom-nav').hidden=false;setNav('home');document.body.classList.remove('theme-halloween','theme-winter');sync();startAmbience();}function modal(html){$('#modal-content').innerHTML=html;hydrateGameAvatarImages($('#modal-content'));if(!$('#modal').open)$('#modal').showModal();}
function dismiss(){ $('#modal').close(); }
function alignWordSearchHeader(){if(!document.body.classList.contains('wordsearch-screen'))return;const walletGroup=$('.topbar-wallet-group'),heading=$('#hub .page-heading'),controls=$('#wordsearch-timer-controls');if(!walletGroup||!heading)return;const headingRect=heading.getBoundingClientRect(),walletLeft=Math.max(0,walletGroup.getBoundingClientRect().left-headingRect.left),controlsRect=controls?.getBoundingClientRect(),mobile=window.matchMedia('(max-width:679px)').matches,minimumTitleLeft=mobile?(controlsRect?controlsRect.right-headingRect.left+14:208):0;heading.style.setProperty('--wordsearch-header-start',Math.max(walletLeft,minimumTitleLeft)+'px');}window.addEventListener('resize',()=>requestAnimationFrame(alignWordSearchHeader),{passive:true});function openHub(title,content,tab){dismiss();show('hub');setNav(tab);const isWordSearch=title==='Nature Word Search';document.body.classList.toggle('wordsearch-screen',isWordSearch);const backButton=$('.page-heading .back');if(backButton){backButton.classList.toggle('wordsearch-home-button',isWordSearch);backButton.textContent=isWordSearch?'Home':'�';backButton.setAttribute('aria-label',isWordSearch?'Home':'Back home');}$('.bottom-nav').hidden=isWordSearch;const heading=$('#hub-title');if(isWordSearch){heading.classList.add('wordsearch-title');heading.setAttribute('aria-label',title);heading.innerHTML='<img class="wordsearch-faceoff-logo" src="assets/froggy-faceoff-logo-v1.png" alt="" aria-hidden="true"><span class="wordsearch-title-plaque"><span class="wordsearch-plaque-nature">Nature</span><span class="wordsearch-plaque-search">Word Search</span></span>';}else{heading.classList.remove('wordsearch-title');heading.removeAttribute('aria-label');heading.textContent=title;}const timerControls=$('#wordsearch-timer-controls');if(isWordSearch&&!timerControls){const controls=document.createElement('div');controls.id='wordsearch-timer-controls';controls.className='wordsearch-timer-controls';const startButton=document.createElement('button');startButton.type='button';startButton.id='wordsearch-timer-start';startButton.className='wordsearch-timer-control';startButton.textContent='Start';startButton.setAttribute('aria-label','Start play timer');const timerNode=document.createElement('output');timerNode.id='wordsearch-elapsed';timerNode.className='wordsearch-elapsed';timerNode.textContent='00:00';timerNode.setAttribute('aria-label','Time playing 00:00');const resetButton=document.createElement('button');resetButton.type='button';resetButton.id='wordsearch-timer-reset';resetButton.className='wordsearch-timer-control';resetButton.textContent='Reset';resetButton.setAttribute('aria-label','Reset play timer');controls.append(startButton,timerNode,resetButton);startButton.addEventListener('click',startWordSearchClock);resetButton.addEventListener('click',resetWordSearchClock);$('#hub .page-heading').insertBefore(controls,heading);}else if(!isWordSearch){timerControls?.remove();stopWordSearchClock();}const lookHost=$('#hub-player-look');if(lookHost){const showLook=isWordSearch||!/froggy fashion boutique|froggy shop|powers|rewards|records|settings/i.test(title);lookHost.classList.toggle('wordsearch-header-look',isWordSearch);lookHost.hidden=!showLook;if(showLook){const avatar=mobileAvatar(p.gameAvatarId);lookHost.innerHTML=mobileAvatarImage(avatar.id,p.gameHairColor,p.gameBodyColor,isWordSearch?'wordsearch-character-art wordsearch-header-frog':'');}}$('#hub-content').classList.toggle('pond-adventure-menu',title==='Explore the Pond');$('#hub-content').innerHTML=content;hydrateGameAvatarImages($('#hub'));if(isWordSearch)updateWordSearchClock();const h=$('#hub-content');h.scrollTop=0;const hub=$('#hub');hub.scrollTop=0;requestAnimationFrame(()=>{alignWordSearchHeader();h.scrollTop=0;hub.scrollTop=0;});}
/* Four optional pond brain games, reachable from Explore Pond. */
let brain={mode:'memory',level:'gentle',cards:[],open:[],matched:[],busy:false,sequence:[],entered:[],answer:0,objects:[],missing:0,timeout:null,followRun:0,followStage:1,pondStage:1,found:[],target:0,round:0};
const brainPool=['🐸','🐢','🦋','🐟','🪷','🐞','🦆','🍄','🌻','🐌','🦀','🪲','🐝'];
function brainClear(){brain.followRun++;if(brain.timeout)clearTimeout(brain.timeout);brain.timeout=null;}
function brainBoost(mode='memory'){brainClear();brain.mode=mode;if(mode==='follow')brain.followStage=1;if(mode==='changed')brain.pondStage=1;brainRound();}
function startFollowWithVoice(){
 brainClear();brain.mode='follow';brain.followStage=1;
 const run=brain.followRun;
 brainFrame('Follow That Frog!',`<div class="frog-trail-head"><h3>Get ready to follow Froggy!</h3></div><div class="frog-trail-scene frog-trail-start"><div class="frog-trail-start-count" aria-live="polite">3</div></div>`);
 const display=document.querySelector('.frog-trail-start-count');
 const valid=()=>run===brain.followRun&&brain.mode==='follow'&&document.contains(display);
 const launch=()=>{if(!valid())return;brain.timeout=null;brainRound();};
 if(!p.settings.sound){brain.timeout=setTimeout(launch,900);return;}
 const voice=new Audio('assets/countdown-voice.mp3');voice.preload='auto';voice.volume=.9;
 let completed=false;let watchdog=null;let animationFrame=null;
 const stopFrames=()=>{if(animationFrame!==null)cancelAnimationFrame(animationFrame);animationFrame=null;};
 const finish=()=>{if(completed)return;completed=true;clearTimeout(watchdog);stopFrames();voice.pause();launch();};
 const paint=()=>{if(!valid()){stopFrames();voice.pause();return;}const t=voice.currentTime||0;display.textContent=t>=3.768?'GO!':t>=2.416?'1':t>=1.335?'2':'3';};
 const frame=()=>{if(completed||!valid()){stopFrames();return;}paint();animationFrame=requestAnimationFrame(frame);};
 voice.ontimeupdate=paint;
 voice.onplaying=()=>{if(!valid())return;paint();if(animationFrame===null)animationFrame=requestAnimationFrame(frame);};
 voice.onended=finish;voice.onerror=finish;
 watchdog=setTimeout(finish,5800);
 voice.play().catch(finish);
}
function brainMenu(){brainClear();home();}
function brainFrame(title,inner){openHub(title,`<div class="${brain.mode==='changed'?'brain-suite pond-immersive-shell':'panel brain-suite'}"><div class="brain-levels">${[['gentle','Gentle'],['standard','Standard'],['challenge','Challenge']].map(([id,name])=>`<button class="button ${brain.level===id?'':'secondary'}" data-action="brain-level" data-id="${id}">${name}</button>`).join('')}</div>${inner}<button class="button secondary wide" data-action="home">Back to Home</button></div>`,'home');}
function brainWin(msg){brainFrame('Great Job!',`<h3>🎉 ${msg}</h3><button class="button wide" data-action="brain-again">Play Again</button>`);}
function brainRound(){brainClear();if(brain.mode==='memory'){const pairs=brain.level==='gentle'?3:brain.level==='standard'?5:8;const icons=brainPool.slice(0,pairs);brain.cards=[...icons,...icons];for(let i=brain.cards.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[brain.cards[i],brain.cards[j]]=[brain.cards[j],brain.cards[i]];}brain.open=[];brain.matched=[];brain.busy=false;brainMemory();}else if(brain.mode==='numbers'){let step=brain.level==='gentle'?1+Math.floor(Math.random()*3):brain.level==='standard'?2+Math.floor(Math.random()*6):4+Math.floor(Math.random()*9);let start=1+Math.floor(Math.random()*12);let gap=1+Math.floor(Math.random()*4);brain.answer=start+step*gap;let pattern=Array.from({length:5},(_,i)=>i===gap?'❓':start+step*i);let options=[brain.answer,brain.answer+step,Math.max(0,brain.answer-step)].sort(()=>Math.random()-.5);brainFrame('Froggy Number Challenge',`<h3>Find the missing number</h3><p class="brain-numbers">${pattern.join(' · ')}</p><div class="brain-menu-grid">${options.map(n=>`<button class="button" data-action="brain-number" data-id="${n}">${n}</button>`).join('')}</div><p id="brain-hint" aria-live="polite"></p>`);}else if(brain.mode==='changed'){brain.round++;const count=Math.min(9,(brain.level==='gentle'?4:brain.level==='standard'?6:8)+Math.floor((brain.pondStage-1)/2));const pool=pondAnimalAssets.map(a=>a.id);const previous=brain.objects.join('|');let fresh=pool.slice();for(let tries=0;tries<8;tries++){fresh=pool.slice().sort(()=>Math.random()-.5);if(fresh.slice(0,count).join('|')!==previous)break;}brain.objects=fresh.slice(0,count);brain.found=[];brain.target=0;brainChanged();}else{brain.sequence=Array.from({length:Math.min(10,(brain.level==='gentle'?3:brain.level==='standard'?4:6)+Math.floor((brain.followStage-1)/2))},()=>Math.floor(Math.random()*Math.min(9,(brain.level==='gentle'?4:brain.level==='standard'?5:6)+Math.floor((brain.followStage-1)/2))));brain.entered=[];brain.busy=true;brainFollow();}}
function brainMemory(){brainFrame('Froggy Memory Training',`<h3>Find the matching pairs</h3><p>${brain.matched.length/2} of ${brain.cards.length/2} pairs</p><div class="brain-card-grid">${brain.cards.map((icon,i)=>`<button class="brain-card ${brain.matched.includes(i)?"brain-matched":""} ${brain.open.includes(i)?"brain-revealed":""}" data-action="brain-card" data-id="${i}" aria-label="Memory card ${i+1}">${brain.matched.includes(i)?'':brain.open.includes(i)?icon:'🌿'}</button>`).join('')}</div>`);}
function brainCard(i){if(brain.busy||brain.open.includes(i)||brain.matched.includes(i)||!brain.cards[i])return;brain.open.push(i);brainMemory();if(brain.open.length===2){brain.busy=true;let [a,b]=brain.open;if(brain.cards[a]===brain.cards[b]){brain.matched.push(a,b);brain.open=[];brain.busy=false;if(brain.matched.length===brain.cards.length)brainWin('All pairs matched!');else brainMemory();}else brain.timeout=setTimeout(()=>{brain.open=[];brain.busy=false;brainMemory();},1200);}}
/* Hand-drawn vector wildlife: transparent, naturally shaded, not floating emoji. */
const pondWildlife={
'🐸':'<ellipse cx="50" cy="63" rx="31" ry="20" fill="#416e30"/><ellipse cx="50" cy="51" rx="27" ry="22" fill="#6c9841"/><circle cx="34" cy="32" r="12" fill="#719f45"/><circle cx="66" cy="32" r="12" fill="#719f45"/><circle cx="34" cy="32" r="6" fill="#d6ca83"/><circle cx="66" cy="32" r="6" fill="#d6ca83"/><circle cx="35" cy="32" r="3" fill="#1c3324"/><circle cx="65" cy="32" r="3" fill="#1c3324"/><path d="M36 62Q50 72 64 62" fill="none" stroke="#304c29" stroke-width="3"/><ellipse cx="22" cy="77" rx="16" ry="7" fill="#486b31"/><ellipse cx="78" cy="77" rx="16" ry="7" fill="#486b31"/>',
'🐢':'<ellipse cx="50" cy="63" rx="34" ry="23" fill="#4d6741"/><ellipse cx="50" cy="57" rx="29" ry="23" fill="#777b45"/><path d="M50 35L33 51L40 71L62 75L72 52Z M33 51L20 58 M72 52L82 58 M40 71L34 82 M62 75L68 83" fill="none" stroke="#414d32" stroke-width="3"/><ellipse cx="85" cy="64" rx="12" ry="11" fill="#687f4d"/><circle cx="90" cy="61" r="2" fill="#18291c"/><ellipse cx="24" cy="84" rx="11" ry="6" fill="#536f43"/><ellipse cx="71" cy="85" rx="11" ry="6" fill="#536f43"/>',
'🦋':'<path d="M49 49C9 1 0 44 30 55C2 70 29 94 49 59C71 98 99 73 69 55C101 37 83 3 51 49Z" fill="#a58e49" stroke="#564e2d" stroke-width="3"/><path d="M48 49C20 20 17 44 38 53M52 49C78 20 83 43 62 53" fill="none" stroke="#d4c681" stroke-width="5"/><path d="M50 43L50 70" stroke="#342d24" stroke-width="6"/><path d="M49 44Q37 24 33 27M51 44Q63 24 67 27" fill="none" stroke="#342d24" stroke-width="2"/>',
'🐟':'<path d="M17 51L3 33L5 73L18 60Q43 22 76 42Q94 53 76 65Q43 87 17 51Z" fill="#648e83" stroke="#315d59" stroke-width="3"/><path d="M36 42Q51 18 65 38L57 45M35 65Q52 85 65 69" fill="#89aaa1" stroke="#315d59" stroke-width="2"/><circle cx="74" cy="49" r="3" fill="#193a38"/><path d="M22 48Q48 56 73 57" fill="none" stroke="#b7c4ad" stroke-width="3"/>',
'🪷':'<ellipse cx="49" cy="76" rx="44" ry="13" fill="#4d8650"/><path d="M50 70Q8 58 24 30Q45 40 50 70M50 70Q92 58 76 30Q55 40 50 70M50 72Q32 37 50 13Q68 37 50 72" fill="#c18f9f" stroke="#866b7a" stroke-width="2"/><ellipse cx="50" cy="70" rx="9" ry="7" fill="#c9a94e"/>',
'🐞':'<ellipse cx="50" cy="59" rx="27" ry="31" fill="#7b432f" stroke="#392f25" stroke-width="3"/><path d="M50 31V89" stroke="#302b23" stroke-width="4"/><circle cx="38" cy="46" r="5" fill="#302a23"/><circle cx="65" cy="54" r="6" fill="#302a23"/><circle cx="38" cy="71" r="5" fill="#302a23"/><ellipse cx="50" cy="29" rx="16" ry="10" fill="#2e3526"/>',
'🦆':'<ellipse cx="44" cy="66" rx="32" ry="20" fill="#7d8064"/><path d="M47 58Q45 30 62 27Q78 23 78 40L75 58" fill="#8d9477"/><ellipse cx="68" cy="35" rx="15" ry="13" fill="#84916d"/><path d="M79 37L99 42L78 47Z" fill="#a68d54"/><circle cx="72" cy="32" r="2.7" fill="#222b23"/><path d="M30 59Q43 39 59 60" fill="#a4a48b" stroke="#58674e" stroke-width="2"/>',
'🐌':'<path d="M15 74Q45 90 91 76L91 69Q70 67 67 51" fill="#8e8261" stroke="#514c37" stroke-width="3"/><circle cx="44" cy="53" r="27" fill="#796b4a" stroke="#514633" stroke-width="4"/><path d="M60 51Q56 30 40 35Q25 41 32 59Q42 71 52 56Q57 44 45 45" fill="none" stroke="#b3a178" stroke-width="5"/><path d="M82 68V32M91 69V34" stroke="#70694b" stroke-width="4"/><circle cx="82" cy="30" r="4" fill="#615b42"/><circle cx="91" cy="32" r="4" fill="#615b42"/>',
'🐝':'<ellipse cx="49" cy="55" rx="27" ry="19" fill="#a58d42" stroke="#3b3926" stroke-width="3"/><path d="M42 37V73M58 37V73" stroke="#3b3926" stroke-width="9"/><ellipse cx="35" cy="34" rx="15" ry="10" fill="#c4d3c5" opacity=".7" transform="rotate(-25 35 34)"/><ellipse cx="65" cy="34" rx="15" ry="10" fill="#c4d3c5" opacity=".7" transform="rotate(25 65 34)"/>'
};
function pondCreature(icon){return '<svg class="pond-wildlife-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'+(pondWildlife[icon]||pondWildlife['🐸'])+'</svg>';}
const pondArtLibrary={
 '🐸':[4113,4114,4115,4116,4117,4118,4136],
 '🐢':[4119,4120],
 '🐟':[4121,4122,4123,4124],
 '🦆':[4125,4126],
 '🦋':[4129,4130],
 '🪷':[4139],
 '🦉':[4131],
 '🐿️':[4134,4135],
 '🐦':[4132,4133],
 '🪻':[4137,4138,4140,4141,4142]
};
// Individual transparent animal PNGs uploaded by the player; the approved pond art is unchanged.
const pondAnimalAssets=[{"id":"frog_big","name":"frog","src":"assets/IMG_4154.png","type":"shore"},{"id":"frog_small","name":"little frog","src":"assets/IMG_4155.png","type":"shore"},{"id":"turtle","name":"turtle","src":"assets/IMG_4156.png","type":"shore"},{"id":"duckling","name":"duckling","src":"assets/IMG_4157.png","type":"shore"},{"id":"mallard","name":"mallard duck","src":"assets/IMG_4158.png","type":"shore"},{"id":"goldfish","name":"goldfish","src":"assets/IMG_4159.png","type":"water"},{"id":"butterfly_pink","name":"pink butterfly","src":"assets/IMG_4160.png","type":"air"},{"id":"butterfly_orange","name":"orange butterfly","src":"assets/IMG_4161.png","type":"air"},{"id":"bee","name":"bee","src":"assets/IMG_4162.png","type":"air"},{"id":"ladybug","name":"ladybug","src":"assets/IMG_4163.png","type":"air"},{"id":"dragonfly","name":"dragonfly","src":"assets/IMG_4164.png","type":"air"},{"id":"cardinal","name":"cardinal","src":"assets/IMG_4165.png","type":"tree"},{"id":"blue_jay","name":"blue jay","src":"assets/IMG_4166.png","type":"tree"},{"id":"squirrel","name":"squirrel","src":"assets/IMG_4167.png","type":"land"},{"id":"fox","name":"fox","src":"assets/IMG_4168.png","type":"land"},{"id":"raccoon","name":"raccoon","src":"assets/IMG_4169.png","type":"land"},{"id":"fawn","name":"fawn","src":"assets/IMG_4170.png","type":"land"},{"id":"heron","name":"heron","src":"assets/IMG_4171.png","type":"shore"}];
const pondAnimalHabitats={"shore":[[20,68],[37,74],[60,72],[79,72],[25,84],[69,85]],"water":[[27,78],[43,81],[61,82],[76,79],[53,90]],"air":[[17,40],[33,48],[61,40],[78,45],[45,26],[72,58]],"tree":[[17,25],[32,33],[72,30],[82,28],[46,37]],"land":[[15,63],[32,66],[70,64],[83,62],[48,61]]};
function pondObjectName(id){return (pondAnimalAssets.find(a=>a.id===id)||{}).name||'pond visitor';}
function brainChanged(){
 const used=[];
 const icons=brain.objects.map((id,i)=>{
  const animal=pondAnimalAssets.find(a=>a.id===id);
  if(!animal)return '';
  const spots=pondAnimalHabitats[animal.type]||pondAnimalHabitats.shore;
  const startAt=(brain.round*3+i*2)%spots.length;
  const ordered=spots.map((_,j)=>spots[(j+startAt)%spots.length]);
  const chosen=ordered.find(p=>used.every(q=>Math.hypot(p[0]-q[0],(p[1]-q[1])*1.15)>15))||ordered[0];
  used.push(chosen);
  const size=brain.level==='challenge'?15:brain.level==='standard'?19:23;
  const found=brain.found.includes(i);
  return `<button type="button" class="pond-hidden-object pond-png-creature ${found?'located':''}" style="left:${chosen[0]}%;top:${chosen[1]}%;--pond-animal-size:${size}px" data-action="brain-find" data-id="${i}" aria-label="${animal.name}" ${found?'disabled':''}><img src="${animal.src}" alt="" draggable="false" loading="eager"></button>`;
 }).join('');
 const target=brain.objects[brain.target];
 brainFrame('Find Nature!',`<div class="pond-clue-board"><h3>🔎 Find the ${pondObjectName(target)}!</h3><p class="muted">Level ${brain.pondStage} · ${brain.found.length} of ${brain.objects.length} found</p><p id="brain-hint" aria-live="polite">Look closely among the leaves, branches, water and shoreline!</p></div><div class="pond-find-scene pond-animal-game" style="background-image:url('assets/IMG_4108.jpeg')!important" role="group" aria-label="Find the hidden animals in the pond">${icons}</div>`);
}
function brainFind(i){
 if(brain.mode!=='changed'||brain.found.includes(i))return;
 if(i!==brain.target){const hint=document.getElementById('brain-hint');if(hint)hint.textContent='Not that one! Look for the '+pondObjectName(brain.objects[brain.target])+'.';return;}
 brain.found.push(i);playCorrect();
 if(brain.found.length===brain.objects.length){brain.busy=true;const scene=document.querySelector('.pond-find-scene');if(scene){const banner=document.createElement('div');banner.className='pond-discovery-win';banner.setAttribute('role','status');const cheers=['GOOD!','GREAT!','FABULOUS!','WONDERFUL!','SUPER!','AMAZING!','BRILLIANT!','FANTASTIC!','EXCELLENT!'];banner.textContent=cheers[Math.floor(Math.random()*cheers.length)];scene.append(banner);}brain.pondStage++;brain.timeout=setTimeout(()=>{if(brain.mode==='changed')brainRound();},2300);return;}
 brain.target=brain.objects.findIndex((_,j)=>!brain.found.includes(j));brainChanged();
}
function brainFollow(){
 const count=Math.min(9,(brain.level==='gentle'?4:brain.level==='standard'?5:6)+Math.floor((brain.followStage-1)/2));
 const colors=['#76d84b','#ffcf53','#f28ad3','#84d9ff','#bda3ff','#ff9876'];
 brainFrame('Follow That Frog!',`<div class="frog-trail-head"><h3 id="brain-instruction">Watch Froggy hop across the pond!</h3><p id="frog-trail-progress">Level ${brain.followStage} · ${brain.sequence.length} hops · ${count} lily pads</p></div><div class="frog-trail-scene" aria-label="Follow the frog's hopping path"><div class="frog-trail-water"></div><div class="frog-trail-pads">${Array.from({length:count},(_,i)=>`<button class="brain-pad frog-trail-pad" style="--pad-glow:${colors[i]}" data-action="brain-pad" data-id="${i}" aria-label="Lily pad ${i+1}"><span class="frog-trail-flower">🪷</span><span class="frog-trail-number">${i+1}</span><span class="frog-trail-visitor">🐸</span></button>`).join('')}</div><div class="frog-trail-ripples">💦 &nbsp; 🪷 &nbsp; 💧 &nbsp; 🐟 &nbsp; 💦</div></div><p id="frog-trail-status" aria-live="polite">Watch carefully, then tap the pads in the same order!</p>`);
 const buttons=Array.from(document.querySelectorAll('.frog-trail-pad'));
 const run=++brain.followRun;
 const speed=brain.level==='gentle'?880:brain.level==='standard'?690:530;
 brain.sequence.forEach((n,i)=>setTimeout(()=>{
  if(run!==brain.followRun||brain.mode!=='follow'||!document.contains(buttons[n]))return;
  buttons[n].classList.add('lit','hopping');
  const label=document.getElementById('frog-trail-progress');if(label)label.textContent=`Hop ${i+1} of ${brain.sequence.length} — watch Froggy!`;
  setTimeout(()=>buttons[n]?.classList.remove('lit','hopping'),Math.round(speed*.68));
 },650+i*speed));
 brain.timeout=setTimeout(()=>{
  if(run!==brain.followRun||brain.mode!=='follow')return;
  brain.busy=false;
  const el=document.getElementById('brain-instruction');if(el)el.textContent='Your turn! Follow Froggy’s trail!';
  const label=document.getElementById('frog-trail-progress');if(label)label.textContent=`Your hops: 0 / ${brain.sequence.length}`;
 },750+brain.sequence.length*speed);
}
function brainPad(i){
 if(brain.busy||brain.mode!=='follow')return;
 const btn=document.querySelector(`.frog-trail-pad[data-id="${i}"]`);
 if(btn){btn.classList.add('lit','hopping');setTimeout(()=>btn.classList.remove('lit','hopping'),400);}
 brain.entered.push(i);
 if(brain.sequence[brain.entered.length-1]!==i){
  brain.busy=true;const scene=document.querySelector('.frog-trail-scene');if(scene){const sign=document.createElement('div');sign.className='frog-trail-croak-sign';sign.setAttribute('role','status');sign.setAttribute('aria-label','Croak! Try again');sign.textContent='CROAK!';scene.append(sign);}const el=document.getElementById('brain-instruction');if(el)el.textContent='Oops! Froggy splashed! 💦';
  const status=document.getElementById('frog-trail-status');if(status)status.textContent='Watch the trail again and give it another try.';
  brain.timeout=setTimeout(()=>brainRound(),1100);
 }else{
  const label=document.getElementById('frog-trail-progress');if(label)label.textContent=`Your hops: ${brain.entered.length} / ${brain.sequence.length}`;
  if(brain.entered.length===brain.sequence.length){
   brain.busy=true;
   const el=document.getElementById('brain-instruction');if(el)el.textContent='🎉 You did it! 🐸';
   const status=document.getElementById('frog-trail-status');if(status)status.textContent='Next set coming up!';
   const scene=document.querySelector('.frog-trail-scene');if(scene){const banner=document.createElement('div');banner.className='frog-trail-win-banner';banner.setAttribute('role','status');const cheers=['GOOD!','GREAT!','FABULOUS!','WONDERFUL!','SUPER!','AMAZING!','BRILLIANT!','FANTASTIC!','EXCELLENT!'];banner.textContent=cheers[(brain.followStage-1)%cheers.length];scene.append(banner);}
   brain.followStage++;
   brain.timeout=setTimeout(()=>{if(brain.mode==='follow')brainRound();},1150);
  }
 }
}
function explore(){openHub('Explore the Pond',`<div class="panel pond-adventure-menu"><h3>Choose your adventure</h3><details class="learning-pace"><summary>Learning pace: ${p.settings.learning==='gentle'?'Gentle':p.settings.learning==='challenge'?'Deep Dive':'Explorer'}</summary><div class="tabs">${[['gentle','Gentle'],['explore','Explorer'],['challenge','Deep Dive']].map(([id,name])=>`<button class="button ${p.settings.learning===id?'':'secondary'}" data-action="learning-pace" data-id="${id}">${name}</button>`).join('')}</div><p class="muted">Gentle keeps hints close. Explorer uses short recall checks. Deep Dive adds reasoning questions. Choose what feels good today.</p></details><div class="adventure-choice"><button class="button wide" data-action="cycle">Frog Life Cycle</button><p class="muted">Remember the stages from egg to adult.</p></div><div class="adventure-choice"><button class="button secondary wide" data-action="healthy-pond">A Healthy Pond</button><p class="muted">Discover how water, land, and living things connect.</p></div></div>`,'home');}
let fashionOverlaySequence=0;
const FASHION_ITEMS=[
{id:'vegas-cards',name:'Country Cutie',category:'Outfits',price:0,kind:'outfit',tone:'#2878c8',accent:'#f4d34f',detail:'Card-suit ruffle top · blue short overalls'},
{id:'gold-showstopper',name:'Golden Showstopper',category:'Outfits',price:180,kind:'outfit',tone:'#d7a52b',accent:'#fff0a6',detail:'Gold stage jacket · satin shorts'},
{id:'pond-party',name:'Pond Party',category:'Outfits',price:95,kind:'outfit',tone:'#e65d91',accent:'#ffe0ef',detail:'Bright party top · playful shorts'},
{id:'card-ruffle',name:'Card-Suit Ruffle Top',category:'Tops',price:45,kind:'top',tone:'#fff4e7',accent:'#d83d55',detail:'Ruffled blouse with tiny suit motifs'},
{id:'vegas-jacket',name:'Vegas Gold Jacket',category:'Tops',price:65,kind:'top',tone:'#d6a52a',accent:'#fff0a6',detail:'Gold-trimmed show jacket'},
{id:'pond-party-top',name:'Pond Party Top',category:'Tops',price:40,kind:'top',tone:'#e65d91',accent:'#ffe0ef',detail:'Bright pink party top with pearl trim'},
{id:'blue-overalls',name:'Blue Short Overalls',category:'Bottoms',price:40,kind:'bottom',tone:'#2878c8',accent:'#f4d34f',detail:'Denim shorts · one strap hanging'},
{id:'gold-shorts',name:'Gold Stage Shorts',category:'Bottoms',price:35,kind:'bottom',tone:'#d6a52a',accent:'#fff0a6',detail:'Satin shorts with gold trim'},
{id:'pond-party-shorts',name:'Pond Party Shorts',category:'Bottoms',price:30,kind:'bottom',tone:'#e65d91',accent:'#ffe0ef',detail:'Playful pink shorts with scalloped trim'},
{id:'girl-sweetheart-overalls',name:'Sweetheart Overalls',category:'Outfits',price:200,kind:'outfit',tone:'#e46e9d',accent:'#ffe0ef',detail:'Pink overalls / heart details'},
{id:'girl-sunshine-dress',name:'Sunshine Dress',category:'Outfits',price:250,kind:'outfit',tone:'#f1c841',accent:'#fff2a0',detail:'Sunny yellow skirt / floral top'},
{id:'girl-denim-classic',name:'Denim Classic',category:'Outfits',price:250,kind:'outfit',tone:'#347dbb',accent:'#e8f5ff',detail:'Blue overalls / flower patch'},
{id:'girl-pretty-in-pink',name:'Pretty in Pink',category:'Outfits',price:300,kind:'outfit',tone:'#e95f9b',accent:'#ffd8ec',detail:'Pink ruffle dress / heart trim'},
{id:'girl-lily-explorer',name:'Lily Explorer',category:'Outfits',price:300,kind:'outfit',tone:'#b48a42',accent:'#f4d48c',detail:'Explorer shorts / garden hat'},
{id:'gold-high-tops',name:'Gold Badge High-Tops',category:'Shoes',price:55,kind:'shoes',tone:'#171a20',accent:'#e5bd55',detail:'Black, white and gold · no logos'},
{id:'pink-heart-high-tops',name:'Pink Heart High-Tops',category:'Shoes',price:0,kind:'shoes',tone:'#f7a3c6',accent:'#fff1f7',detail:'Signature pink-and-white heart sneakers'},
{id:'red-frog-kicks',name:'Red Frog Kicks',category:'Shoes',price:55,kind:'shoes',tone:'#c9363b',accent:'#e9c65d',detail:'Red shoes with gold frog-pad badges'},
{id:'blonde-wave',name:'Blonde Stage Waves',category:'Hair & Accessories',price:0,kind:'hair',tone:'#efc65d',accent:'#fff0a6',detail:'Soft blonde waves with a gold clip'},
{id:'vegas-bow',name:'Vegas Bow',category:'Hair & Accessories',price:25,kind:'accessory',tone:'#e84d88',accent:'#f5d16a',detail:'Satin bow with gold center'},
{id:'boy-vegas-hottie',gender:'boy',name:'Street Star',category:'Outfits',price:220,kind:'outfit',tone:'#25243a',accent:'#e7bd56',detail:'Open Vegas shirt · tailored red shorts'},
{id:'boy-gold-champion',gender:'boy',name:'Golden Champion',category:'Outfits',price:180,kind:'outfit',tone:'#c99627',accent:'#fff0a6',detail:'Gold-trim jacket · matching stage shorts'},
{id:'boy-pond-player',gender:'boy',name:'Pond Party Player',category:'Outfits',price:95,kind:'outfit',tone:'#287da2',accent:'#f4d46a',detail:'Blue party shirt · sporty shorts'},
{id:'boy-open-shirt',gender:'boy',name:'Open Vegas Shirt',category:'Tops',price:45,kind:'top',tone:'#27243a',accent:'#e8c36d',detail:'Open-front shirt with gold piping'},
{id:'boy-gold-jacket',gender:'boy',name:'Gold Ring Jacket',category:'Tops',price:65,kind:'top',tone:'#c99627',accent:'#fff0a6',detail:'Satin gold jacket with black lapel'},
{id:'boy-pond-shirt',gender:'boy',name:'Blue Pond Shirt',category:'Tops',price:40,kind:'top',tone:'#277da7',accent:'#d7f3ff',detail:'Blue short-sleeve shirt with bright trim'},
{id:'boy-red-shorts',gender:'boy',name:'Red Stage Shorts',category:'Bottoms',price:0,kind:'bottom',tone:'#bd303b',accent:'#f4d46a',detail:'Red shorts with gold waistband'},
{id:'boy-gold-shorts',gender:'boy',name:'Gold Stage Shorts',category:'Bottoms',price:35,kind:'bottom',tone:'#c99627',accent:'#fff0a6',detail:'Gold satin shorts with contrast piping'},
{id:'boy-blue-shorts',gender:'boy',name:'Blue Match Shorts',category:'Bottoms',price:40,kind:'bottom',tone:'#2679b8',accent:'#e7d16a',detail:'Blue athletic shorts with gold stripe'},
{id:'boy-red-frog-kicks',gender:'boy',name:'Red Frog Kicks',category:'Shoes',price:0,kind:'shoes',tone:'#c9363b',accent:'#e9c65d',detail:'Red shoes with gold frog-pad badges'},
{id:'boy-gold-kicks',gender:'boy',name:'Black & Gold High-Tops',category:'Shoes',price:55,kind:'shoes',tone:'#171a20',accent:'#e5bd55',detail:'Black high-tops with gold frog-pad badges'},
{id:'boy-golden-sprout',gender:'boy',name:'Golden Hair Sprout',category:'Hair & Accessories',price:0,kind:'hair',tone:'#efc65d',accent:'#fff0a6',detail:'Signature golden frog hair sprout'},
{id:'boy-gold-chain',gender:'boy',name:'Vegas Gold Chain',category:'Hair & Accessories',price:25,kind:'accessory',tone:'#d6a52a',accent:'#fff0a6',detail:'Light gold chain with frog charm'},
{id:'boy-beach-breeze',gender:'boy',name:'Beach Breeze',category:'Outfits',price:265,kind:'outfit',tone:'#1984ad',accent:'#ffcf4a',detail:'Tropical shirt / sunset shorts'},
{id:'boy-cool-explorer',gender:'boy',name:'Cool Explorer',category:'Outfits',price:245,kind:'outfit',tone:'#828b48',accent:'#f3e3b6',detail:'Trail jacket / explorer shorts'}];
function fashionState(gender=boutiqueGender){
 if(gender==='boy'){
  p.boyFashion ||= {unlocked:['boy-vegas-hottie','boy-red-frog-kicks','boy-red-shorts','boy-golden-sprout'],equipped:{outfit:'boy-vegas-hottie',top:'',bottom:'',shoes:'boy-red-frog-kicks',hair:'boy-golden-sprout',accessory:''}};
  p.boyFashion.unlocked ||= ['boy-vegas-hottie','boy-red-frog-kicks','boy-red-shorts','boy-golden-sprout'];
  p.boyFashion.equipped ||= {outfit:'boy-vegas-hottie',top:'',bottom:'',shoes:'boy-red-frog-kicks',hair:'boy-golden-sprout',accessory:''};
  return includeOwnedOutfitParts(p.boyFashion,'boy');
 }
 p.fashion ||= {unlocked:['vegas-cards','card-ruffle','blue-overalls','pink-heart-high-tops','blonde-wave'],equipped:{outfit:'',top:'card-ruffle',bottom:'blue-overalls',shoes:'pink-heart-high-tops',hair:'blonde-wave',accessory:''}};
 p.fashion.unlocked ||= ['vegas-cards','blonde-wave'];p.fashion.equipped ||= {};
 if(!p.fashion.unlocked.includes('pink-heart-high-tops'))p.fashion.unlocked.push('pink-heart-high-tops');
 if(!p.fashion.equipped.shoes||p.fashion.equipped.shoes==='gold-high-tops')p.fashion.equipped.shoes='pink-heart-high-tops';
 return includeOwnedOutfitParts(p.fashion,'girl');
}
const FASHION_OUTFIT_PARTS={'vegas-cards':['card-ruffle','blue-overalls','pink-heart-high-tops'],'gold-showstopper':['vegas-jacket','gold-shorts','gold-high-tops'],'pond-party':['pond-party-top','pond-party-shorts','pink-heart-high-tops'],'boy-vegas-hottie':['boy-open-shirt','boy-red-shorts','boy-red-frog-kicks'],'boy-gold-champion':['boy-gold-jacket','boy-gold-shorts','boy-gold-kicks'],'boy-pond-player':['boy-pond-shirt','boy-blue-shorts','boy-red-frog-kicks']};
const FASHION_FULL_LOOK_ART={girl:{'vegas-cards':'assets/match-frenzy-country-cutie.webp','gold-showstopper':'assets/golden-showstopper-girl-700.webp','girl-sweetheart-overalls':'assets/match-frenzy-sweetheart-overalls.png','girl-sunshine-dress':'assets/match-frenzy-sunshine-dress.webp','girl-denim-classic':'assets/match-frenzy-denim-classic.png','girl-pretty-in-pink':'assets/match-frenzy-pretty-in-pink.webp','girl-lily-explorer':'assets/match-frenzy-lily-explorer.png'},boy:{'boy-vegas-hottie':'assets/match-frenzy-street-star.webp','boy-beach-breeze':'assets/match-frenzy-beach-breeze.webp','boy-cool-explorer':'assets/match-frenzy-cool-explorer.webp'}};
const MATCH_FRENZY_OUTFITS={girl:['vegas-cards','girl-sweetheart-overalls','girl-sunshine-dress','girl-denim-classic','girl-pretty-in-pink','girl-lily-explorer'],boy:['boy-vegas-hottie','boy-beach-breeze','boy-cool-explorer']};
const MATCH_FRENZY_HAIR_STEMS={girl:{'vegas-cards':'country-cutie','girl-sweetheart-overalls':'sweetheart-overalls','girl-sunshine-dress':'sunshine-dress','girl-denim-classic':'denim-classic','girl-pretty-in-pink':'pretty-in-pink','girl-lily-explorer':'lily-explorer'},boy:{'boy-vegas-hottie':'street-star','boy-beach-breeze':'beach-breeze','boy-cool-explorer':'cool-explorer'}};
const FASHION_HAIR_COLORS=[{id:'gold',name:'Gold'},{id:'blue',name:'Blue'},{id:'green',name:'Green'},{id:'pink',name:'Pink'},{id:'purple',name:'Purple'},{id:'rainbow',name:'Rainbow'},{id:'red',name:'Red'}];
const BOUTIQUE_HAIR_COLORS=[{id:'blonde',name:'Blonde',art:'gold',price:0},{id:'black',name:'Black',art:'black',price:15},{id:'brown',name:'Brown',art:'brown',price:15},{id:'blue',name:'Blue',art:'blue',price:15},{id:'green',name:'Green',art:'green',price:15},{id:'pink',name:'Pink',art:'pink',price:15},{id:'purple',name:'Purple',art:'purple',price:15},{id:'red',name:'Red',art:'red',price:15},{id:'rainbow',name:'Rainbow',art:'rainbow',price:30}];
function mobileAvatarImage(id,hair='blonde',body='green',classes=''){const avatar=mobileAvatar(id);return `<img class="mobile-avatar-art ${classes}" data-game-avatar-art="${avatar.id}" data-hair-color="${hair}" data-body-color="${body}" src="${avatar.art}" alt="${avatar.name}" draggable="false">`;}
function hydrateGameAvatarImages(root=document){if(!root?.querySelectorAll)return;root.querySelectorAll('[data-game-avatar-art]').forEach(img=>{const id=img.dataset.gameAvatarArt,hair=img.dataset.hairColor,body=img.dataset.bodyColor,key=`${id}|${hair}|${body}`;if(img.dataset.artKey===key)return;img.dataset.artKey=key;const renderArt=img.classList.contains('wordsearch-character-art')?mobileAvatarCutoutUrl:mobileAvatarArtUrl;renderArt(id,hair,body).then(src=>{if(img.isConnected&&img.dataset.artKey===key)img.src=src;}).catch(()=>{});});}
function mobilePlayerAvatar(){return mobileAvatar(p.gameAvatarId);}
function mobileRivalAvatar(){const index=MOBILE_AVATARS.findIndex(avatar=>avatar.id===p.gameAvatarId);return MOBILE_AVATARS[(index+1)%MOBILE_AVATARS.length]||MOBILE_AVATARS[0];}
function hairArtForLook(gender,id,color=p.hairColor||'gold'){const stem=MATCH_FRENZY_HAIR_STEMS[gender]?.[id];if(!stem||(color==='gold'&&id!=='girl-pretty-in-pink'))return FASHION_FULL_LOOK_ART[gender][id];return `assets/match-frenzy-${stem}-hair-${color}.png`;}
function matchFrenzyLook(gender,id,hairColor=p.hairColor||'gold'){const ids=MATCH_FRENZY_OUTFITS[gender]||MATCH_FRENZY_OUTFITS.girl;const lookId=ids.includes(id)?id:ids[0];const item=FASHION_ITEMS.find(entry=>entry.id===lookId);return {id:lookId,item,art:hairArtForLook(gender,lookId,hairColor)};}
function equippedMatchFrenzyLook(gender=p.fashionGender||boutiqueGender){const f=fashionState(gender);return matchFrenzyLook(gender,f.equipped.outfit);}
function activeMatchFrenzyLook(){const f=fashionState(boutiqueGender);return matchFrenzyLook(boutiqueGender,fashionTryOn.outfit||f.equipped.outfit);}
function gameAvatarMarkup(avatar,label,side,hair=p.gameHairColor,body=p.gameBodyColor){return `<figure class="game-avatar ${side}" aria-label="${label}: ${avatar.name}">${fashionAvatarMarkup(avatar.id,hair,body,avatar.gender)}<figcaption>${label}</figcaption></figure>`;}
function renderGameCharacters(){const host=$('#game-characters');if(!host||!match)return;const player=mobilePlayerAvatar(),rival=mobileRivalAvatar(),wardrobe=fashionState(player.gender),wardrobeKey=JSON.stringify(wardrobe.equipped);const key=`${match.mode}:${player.id}:${p.gameHairColor}:${p.gameBodyColor}:${wardrobeKey}:${rival.id}`;if(host.dataset.lookKey===key)return;host.dataset.lookKey=key;host.classList.toggle('solo',match.mode==='solo');host.innerHTML=match.mode==='solo'?gameAvatarMarkup(player,'YOU','player'):gameAvatarMarkup(player,'YOU','player')+gameAvatarMarkup(rival,'RIVAL','rival','blonde','green');hydrateGameAvatarImages(host);}
function includeOwnedOutfitParts(f,gender){FASHION_ITEMS.filter(item=>item.kind==='outfit'&&(item.gender||'girl')===gender&&f.unlocked.includes(item.id)).forEach(item=>(FASHION_OUTFIT_PARTS[item.id]||[]).forEach(part=>{if(!f.unlocked.includes(part))f.unlocked.push(part);}));return f;}
function fashionSlot(item){return item.kind==='outfit'?'outfit':item.kind==='top'?'top':item.kind==='bottom'?'bottom':item.kind==='shoes'?'shoes':item.kind==='hair'?'hair':'accessory';}
function fashionPreviewItems(f=fashionState(boutiqueGender),gender=boutiqueGender,tryOn=fashionTryOn,overrides={}){
 const selected={},outfitId=tryOn.outfit||f.equipped.outfit;
 const outfit=FASHION_ITEMS.find(item=>item.id===outfitId&&(item.gender||'girl')===gender);
 if(outfit)(FASHION_OUTFIT_PARTS[outfit.id]||[]).forEach(id=>{const part=FASHION_ITEMS.find(item=>item.id===id);if(part)selected[fashionSlot(part)]=id;});
 else ['top','bottom','shoes','hair','accessory'].forEach(slot=>{if(f.equipped[slot])selected[slot]=f.equipped[slot];});
 ['top','bottom','shoes','hair','accessory'].forEach(slot=>{
  const item=FASHION_ITEMS.find(entry=>entry.id===tryOn[slot]&&(entry.gender||'girl')===gender);
  if(item)selected[slot]=item.id;
 });
 Object.assign(selected,overrides);
 return selected;
}
function fashionGarmentLayer(item,gender,fabricId=`fabric-${item.id}`){
 const fill=`url(#${fabricId})`,accent=item.accent||'#fff0a6';
 if(item.kind==='top'&&gender==='girl'){
  if(item.id==='vegas-jacket')return `<g><path d="M35 47Q40 44 46 48L50 51L48 69Q43 69 39 66L34 59L31 55Z M55 51L59 48Q65 44 69 48L72 55L68 59L63 66Q59 69 54 69Z" fill="${fill}" stroke="${accent}" stroke-width="1.2" stroke-linejoin="round"/><path d="M47 50L50 53L54 50L57 67L47 67Z" fill="#fff5e8" stroke="#e8d4b8" stroke-width=".7"/><path d="M46 49L50 54L47 62M57 49L53 54L56 62M49 57L52 57" fill="none" stroke="${accent}" stroke-width="1.2" stroke-linecap="round"/><path d="M39 64Q49 68 60 64" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1"/></g>`;
  return `<g><path d="M35 47Q40 44 46 48L50 51L54 48Q61 44 67 48L70 56L64 61L61 56L60 68Q50 72 40 68L39 56L36 61L31 56Z" fill="${fill}" stroke="${accent}" stroke-width="1.2" stroke-linejoin="round"/><path d="M43 48Q50 54 59 48M50 53V67" fill="none" stroke="${accent}" stroke-width="1.2" stroke-linecap="round"/><path d="M40 64Q50 68 60 64" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1"/></g>`;
 }
 if(item.kind==='top'&&gender==='boy'){
  if(item.id==='boy-pond-shirt')return `<g><path d="M47 92Q53 88 60 92L72 100L85 92Q94 88 101 93L108 101Q111 105 114 114L103 120L97 109L97 140Q73 148 49 140L49 109L43 120L32 114L38 102Q41 96 47 92Z" fill="${fill}" stroke="${accent}" stroke-opacity=".7" stroke-width="1.1" stroke-linejoin="round"/><path d="M62 96Q72 105 83 96M43 114L49 116M103 116L112 114M50 136Q73 142 96 136" fill="none" stroke="${accent}" stroke-opacity=".65" stroke-width=".9" stroke-linecap="round"/><path d="M68 111L72 108L76 111L72 115Z" fill="${accent}" fill-opacity=".72"/></g>`;
  const lapel=item.id==='boy-gold-jacket'?'#25243a':item.tone;
  return `<g><path d="M39 93Q44 88 51 90L60 94Q65 97 67 103L63 116L61 136Q56 142 48 140Q41 138 39 132L37 116L32 120L29 114L36 100Q37 96 39 93Z M94 90Q102 88 108 93Q111 96 113 102L118 114L111 120L106 116L104 132Q102 138 95 140Q87 142 82 136L80 116L77 103Q79 97 84 94Z" fill="${fill}" stroke="${accent}" stroke-opacity=".65" stroke-width="1.1" stroke-linejoin="round"/><path d="M53 93L65 101L60 112L51 104ZM95 93L83 101L88 112L97 104Z" fill="${lapel}" stroke="${accent}" stroke-opacity=".75" stroke-width=".8" stroke-linejoin="round"/><path d="M62 98L72 110L82 98M39 128Q47 137 59 137M85 137Q97 137 104 128" fill="none" stroke="${accent}" stroke-opacity=".72" stroke-width="1.05" stroke-linecap="round"/></g>`;
 }
 if(item.kind==='bottom'&&gender==='girl')return `<g><path d="M39 72Q51 76 67 72L69 82Q56 87 38 83Z" fill="${fill}" stroke="${accent}" stroke-width="1.2" stroke-linejoin="round"/><path d="M39 76Q52 80 68 76M53 77L52 84M42 81L49 82M57 82L65 80" fill="none" stroke="${accent}" stroke-width="1.1" stroke-linecap="round"/></g>`;
 if(item.kind==='bottom'&&gender==='boy')return `<g><path d="M39 143Q72 150 108 143L109 152Q73 159 38 152Z" fill="${fill}" stroke="${accent}" stroke-opacity=".78" stroke-width="1.1" stroke-linejoin="round"/><path d="M39 151Q55 156 71 153L70 170Q54 175 38 170Z M74 153Q91 156 108 151L113 170Q94 175 74 170Z" fill="${fill}" stroke="${accent}" stroke-opacity=".68" stroke-width="1.1" stroke-linejoin="round"/><path d="M41 165Q55 170 69 167M76 167Q94 170 110 165M72 154V168" fill="none" stroke="${accent}" stroke-opacity=".68" stroke-width=".9" stroke-linecap="round"/></g>`;
 if(item.kind==='shoes'&&gender==='girl')return `<g><path d="M18 115Q21 110 27 112L34 118Q39 123 37 129Q29 133 18 129Q14 127 16 121Z M61 115Q64 111 70 113L77 119Q81 124 78 129Q69 133 60 129Q57 126 59 121Z" fill="${fill}" stroke="${accent}" stroke-width="1.2" stroke-linejoin="round"/><path d="M16 126Q26 131 37 126L37 130Q28 134 17 130ZM59 126Q69 131 79 126L79 130Q69 134 60 130Z" fill="#fffaf4" stroke="#e8d9cb" stroke-width=".6"/><path d="M22 118L30 124M63 118L72 124M24 121L31 119M64 121L72 119" fill="none" stroke="${accent}" stroke-width="1.3" stroke-linecap="round"/></g>`;
 if(item.kind==='shoes'&&gender==='boy')return `<g><path d="M17 192Q25 188 34 192L43 202L53 214Q56 221 50 225Q31 231 13 224Q9 221 12 214Z M101 192Q111 188 120 192L137 214Q141 221 136 225Q117 231 97 224Q92 221 95 214Z" fill="${fill}" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 219Q31 226 53 218L53 224Q33 232 13 226ZM95 218Q117 226 138 219L137 226Q117 232 96 226Z" fill="#fffaf4" stroke="#dfd1c5" stroke-width=".7"/><path d="M20 205L37 213M106 205L123 213M22 209L35 207M109 207L123 209" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/></g>`;
 if(item.kind==='accessory'&&gender==='girl')return `<g><path d="M66 12Q58 5 57 10Q56 15 64 16Q58 20 63 23Q68 20 67 16Q75 16 74 11Q72 6 66 12Z" fill="${fill}" stroke="${accent}" stroke-width="1.1"/><circle cx="65" cy="15" r="2" fill="${accent}"/></g>`;
 if(item.kind==='accessory'&&gender==='boy')return `<g><path d="M66 89Q77 102 91 89" fill="none" stroke="${fill}" stroke-width="2.2" stroke-linecap="round"/><path d="M79 99L83 104L79 109L75 104Z" fill="${accent}" stroke="#8a6429" stroke-width=".7"/></g>`;
 return '';
}
function fashionGarmentOverlay(gender=boutiqueGender,f=fashionState(gender),tryOn={},overrides={}){
 const selection=fashionPreviewItems(f,gender,tryOn,overrides),defaults=gender==='girl'?{shoes:'pink-heart-high-tops'}:{shoes:'boy-red-frog-kicks'};
 const overlayId=++fashionOverlaySequence;
 const layers=[];
 ['shoes','accessory'].forEach(slot=>{
  const item=FASHION_ITEMS.find(entry=>entry.id===selection[slot]&&(entry.gender||'girl')===gender);
  if(item&&item.id!==defaults[slot]){const fabricId=`fabric-${overlayId}-${item.id}`,art=fashionGarmentLayer(item,gender,fabricId);if(art)layers.push({item,fabricId,art});}
 });
 if(!layers.length)return '';
 const size=gender==='girl'?'96 134':'145 232';
 const defs=layers.map(({item,fabricId})=>`<linearGradient id="${fabricId}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${item.tone||'#b98b45'}"/><stop offset=".58" stop-color="${item.tone||'#b98b45'}"/><stop offset="1" stop-color="#29213a" stop-opacity=".42"/></linearGradient>`).join('');
 return `<svg class="fashion-overlay" viewBox="0 0 ${size}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>${defs}</defs>${layers.map(layer=>layer.art).join('')}</svg>`;
}
function fashionAvatarMarkup(id,hair=p.gameHairColor,body=p.gameBodyColor,gender=mobileAvatar(id).gender,f=fashionState(gender),overrides={}){
 return `<span class="fashion-avatar-art">${mobileAvatarImage(id,hair,body)}${fashionGarmentOverlay(gender,f,{},overrides)}</span>`;
}
function fashionPortrait(){
 const gender=boutiqueGender,look=activeMatchFrenzyLook();
 return `<figure class="boutique-feature-art ${gender}"><img src="${look.art}" alt="${look.item.name}" draggable="false"></figure>`;
}
function fashionProductArt(item){
 const tone=item.tone||'#b98b45',accent=item.accent||'#fff0a6',id='product-fabric-'+item.id;
 let art='';
 const top='<path d="M37 18 L25 25 L12 45 L23 54 L31 43 L29 70 Q50 78 71 70 L69 43 L77 54 L88 45 L75 25 L63 18 L56 25 L44 25Z" fill="url(#'+id+')" stroke="'+accent+'" stroke-width="2.5" stroke-linejoin="round"/><path d="M44 23 Q50 33 56 23 M50 29 L50 65" fill="none" stroke="'+accent+'" stroke-width="2"/><circle cx="50" cy="43" r="2" fill="'+accent+'"/><circle cx="50" cy="53" r="2" fill="'+accent+'"/>';
 const shorts='<path d="M28 56 Q50 62 72 56 L77 84 Q65 88 56 84 Q52 83 50 82 Q48 83 44 84 Q35 88 23 84Z" fill="url(#'+id+')" stroke="'+accent+'" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 62 Q50 68 72 62 M23 78 Q34 82 44 80 M56 80 Q66 82 77 78 M50 64 L50 80" fill="none" stroke="'+accent+'" stroke-width="2"/>';
 if(item.kind==='top')art=top;
 else if(item.kind==='bottom')art=shorts;
 else if(item.kind==='shoes')art='<g stroke="'+accent+'" stroke-width="2.5" stroke-linejoin="round"><path d="M10 48 Q23 39 34 48 L46 65 Q49 72 39 76 L12 76 Q5 73 7 64Z" fill="url(#'+id+')"/><path d="M54 48 Q67 39 78 48 L92 64 Q95 73 85 76 L58 76 Q51 73 52 64Z" fill="url(#'+id+')"/><path d="M8 66 Q26 74 47 66 M52 66 Q73 74 93 66" fill="none" stroke="#fff8e9" stroke-width="4"/><path d="M20 50 L33 64 M64 50 L78 64" fill="none" stroke="'+accent+'" stroke-width="2.5"/><path d="M23 60 Q28 54 33 60 Q28 66 23 60Z M67 60 Q72 54 77 60 Q72 66 67 60Z" fill="'+accent+'"/></g>';
 else if(item.kind==='hair')art='<path d="M20 70 Q6 46 22 25 Q31 8 50 14 Q71 5 80 29 Q95 44 78 69 Q70 57 72 42 Q60 52 50 38 Q41 54 27 48 Q31 60 20 70Z" fill="url(#'+id+')" stroke="'+accent+'" stroke-width="2.5"/><path d="M28 30 Q22 46 34 60 M49 22 Q39 43 49 63 M66 24 Q59 43 70 57" fill="none" stroke="'+accent+'" stroke-width="2" opacity=".8"/>';
 else if(item.kind==='accessory')art=item.gender==='boy'?'<path d="M20 42 Q50 67 80 42" fill="none" stroke="url(#'+id+')" stroke-width="7"/><path d="M50 57 L57 66 L50 75 L43 66Z" fill="'+accent+'" stroke="#8a6429" stroke-width="1.5"/>':'<path d="M50 48 Q25 15 15 35 Q8 55 43 57 Q18 75 35 86 Q50 85 53 61 Q68 85 84 69 Q92 49 57 55 Q88 34 72 20 Q56 13 50 48Z" fill="url(#'+id+')" stroke="'+accent+'" stroke-width="2.5"/><circle cx="51" cy="54" r="7" fill="'+accent+'"/>';
 else art=top+shorts;
 return '<svg class="fashion-product-art" viewBox="0 0 100 100" role="img" aria-label="'+item.name.replace(/&/g,'&amp;')+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".48"/><stop offset=".28" stop-color="'+tone+'"/><stop offset="1" stop-color="#30233f" stop-opacity=".42"/></linearGradient></defs><ellipse cx="50" cy="88" rx="34" ry="5" fill="#4d2b5530"/> '+art+'</svg>';
}
function fashionItemEquipped(item,f=fashionState()){
 if(item.kind==='outfit')return f.equipped.outfit===item.id||(FASHION_OUTFIT_PARTS[item.id]||[]).length>0&&(FASHION_OUTFIT_PARTS[item.id]||[]).every(id=>{const part=FASHION_ITEMS.find(entry=>entry.id===id);return part&&fashionItemEquipped(part,f);});
 if(item.kind==='hair')return f.equipped.hair===item.id&&p.gameHairColor==='blonde';
 if(f.equipped.outfit&&(FASHION_OUTFIT_PARTS[f.equipped.outfit]||[]).includes(item.id))return true;
 return f.equipped[fashionSlot(item)]===item.id;
}
function fashionCard(item){
 const f=fashionState(),owned=f.unlocked.includes(item.id),equipped=fashionItemEquipped(item,f),selected=fashionSelection===item.id;
 return `<button type="button" class="fashion-item${equipped?' is-equipped':''}${selected?' is-selected':''}" data-action="select-boutique-piece" data-id="${item.id}" aria-pressed="${selected}" aria-label="Select ${item.name}. ${owned?'Owned':item.price+' Froggy Dough'}">
  <span class="fashion-swatch">${fashionProductArt(item)}</span>
  <span class="fashion-item-info"><b>${item.name}</b><small>${item.detail}</small><strong>${equipped?'Wearing':owned?'Owned':item.price+' Froggy Dough'}</strong>${selected?'<span class="fashion-selected-label">Selected</span>':''}</span>
 </button>`;
}
function boutiqueLegacy(){
 const isGirl=boutiqueGender==='girl';
 const gender=boutiqueGender;
 const name=isGirl?'Froggy Match Frenzy Girl':'Froggy Match Frenzy Boy';
 const description=isGirl
  ?'Choose a complete Match Frenzy look for your frog.'
  :'Choose a complete Match Frenzy look for your frog.';
  const categories=['Outfits','Hair Color'];
 const icons={'Outfits':'✦','Tops':'♛','Bottoms':'◆','Shoes':'♟','Hair & Accessories':'✧'};
 const items=FASHION_ITEMS.filter(item=>(item.gender||'girl')===gender);
 if(!categories.includes(boutiqueCategory))boutiqueCategory='Outfits';
  const isHairCategory=boutiqueCategory==='Hair Color';
 const visible=items.filter(item=>MATCH_FRENZY_OUTFITS[gender].includes(item.id));
 if(!visible.some(item=>item.id===fashionSelection))fashionSelection=visible[0]?.id||'';
 const selected=items.find(item=>item.id===fashionSelection);
 const f=fashionState(gender);
 const owned=selected?f.unlocked.includes(selected.id):false;
 const equipped=selected?fashionItemEquipped(selected,f):false;
  const hairSelection=FASHION_HAIR_COLORS.find(color=>color.id===(p.hairColor||'gold'))||FASHION_HAIR_COLORS[0];
  const hairPreviewOutfit=fashionTryOn.outfit||f.equipped.outfit||MATCH_FRENZY_OUTFITS[gender][0];
  const cards=isHairCategory?FASHION_HAIR_COLORS.map(color=>{
   const active=color.id===hairSelection.id;
   const art=matchFrenzyLook(gender,hairPreviewOutfit,color.id).art;
   return `<button type="button" class="hair-color-option ${active?'selected':''}" data-action="select-hair-color" data-id="${color.id}" aria-pressed="${active}" aria-label="Use ${color.name} hair">
    <span class="hair-color-preview"><img src="${art}" alt="" draggable="false"></span><span class="hair-color-name">${color.name}</span>
   </button>`;
  }).join(''):visible.map(item=>{
   const itemOwned=f.unlocked.includes(item.id);
   const itemEquipped=fashionItemEquipped(item,f);
   const active=item.id===fashionSelection;
   const art=matchFrenzyLook(gender,item.id).art;
   const price=item.price===0?'Complimentary':item.price+' Froggy Dough';
   return `<button type="button" class="boutique-product ${active?'selected':''} ${itemEquipped?'wearing':''}" data-action="select-boutique-piece" data-id="${item.id}" aria-pressed="${active}">
    <span class="boutique-product-swatch boutique-look-thumb"><img src="${art}" alt="" draggable="false"></span>
    <span class="boutique-product-name">${item.name}</span>
    <span class="boutique-product-detail">${item.detail}</span>
    <strong class="boutique-product-price">${itemEquipped?'Currently Wearing':itemOwned?'In Your Wardrobe':price}</strong>
    <span class="boutique-product-select">${active?'Selected':'View Piece'}</span>
   </button>`;
  }).join('');
 const actionLabel=equipped?'Currently Wearing':owned?'Wear Complete Look':!selected?'Select a look':selected.price===0?'Add to Wardrobe':p.bank<selected.price?`Need ${selected.price} Froggy Dough`:'Purchase & Wear';
  const selectionPanel=isHairCategory
   ?`<div class="boutique-selected-copy"><span>YOUR HAIR COLOR</span><b>${hairSelection.name}</b><small>Applied to ${name} and your website games.</small><strong>Free style choice · saved to your profile</strong></div>`
   :selected?`<div class="boutique-selected-copy"><span>YOUR SELECTION</span><b>${selected.name}</b><small>${selected.detail}</small><strong>${equipped?'Already part of your look':owned?'Ready in your wardrobe':selected.price===0?'Complimentary':selected.price+' Froggy Dough'}</strong></div>
      <div class="boutique-selected-actions">
       <button type="button" class="button secondary" data-action="preview-boutique-piece">Preview</button>
       <button type="button" class="button boutique-purchase" data-action="purchase-selected-fashion" ${equipped||(!owned&&selected&&p.bank<selected.price)?'disabled':''}>${actionLabel}</button>
      </div>`:'<p>Select a piece to see its details.';
 openHub('Froggy Fashion Boutique',`
  <div class="boutique-panel boutique-gold-house">
   <header class="boutique-luxe-header">
    <div class="boutique-crown" aria-hidden="true">♛</div>
    <div class="boutique-luxe-title">
     <span>THE FROGGY COLLECTION</span>
     <h3>Fashion Boutique</h3>
     <small>Dress for your next grand entrance</small>
    </div>
    <div class="boutique-luxe-wallet"><small>YOUR BALANCE</small><b>🐸 ${p.bank}</b><span>Froggy Dough</span></div>
   </header>
   <div class="boutique-genders" role="group" aria-label="Choose a frog collection">
    <button type="button" class="button ${isGirl?'':'secondary'}" data-action="boutique-gender" data-id="girl" aria-pressed="${isGirl}">Girl Collection</button>
    <button type="button" class="button ${!isGirl?'':'secondary'}" data-action="boutique-gender" data-id="boy" aria-pressed="${!isGirl}">Boy Collection</button>
   </div>
   <div class="boutique-look-layout">
   <section class="boutique-showcase ${gender}-showcase" aria-label="${name} showroom">
    <div class="boutique-showcase-copy">
     <span class="boutique-kicker">${gender.toUpperCase()} COLLECTION · EST. FROGGY</span>
     <h3>${name}</h3><p>${description}</p>
     <div class="boutique-showcase-note">Original HD frog artwork · Personal wardrobe</div>
    </div>
    ${fashionPortrait()}
   </section>
   <section class="boutique-department-area" aria-label="Fashion departments">
    <div class="boutique-section-title"><span>THE WARDROBE</span><b>Shop by Department</b></div>
    <nav class="boutique-departments">
     ${categories.map(category=>`<button type="button" class="button ${boutiqueCategory===category?'':'secondary'}" data-action="boutique-department" data-id="${category}" aria-pressed="${boutiqueCategory===category}"><span>${icons[category]}</span><span>${category}</span></button>`).join('')}
    </nav>
   </section>
   <section class="boutique-products-area">
    <div class="boutique-section-title"><span>${gender.toUpperCase()} WARDROBE</span><b>${boutiqueCategory}</b></div>
     <nav class="boutique-view-switch" aria-label="Boutique choices">
      ${categories.map(category=>`<button type="button" class="button ${boutiqueCategory===category?'':'secondary'}" data-action="boutique-department" data-id="${category}" aria-pressed="${boutiqueCategory===category}">${category}</button>`).join('')}
     </nav>
     <div class="boutique-product-grid ${isHairCategory?'hair-color-grid':''}">${cards||'<p class="boutique-empty">More pieces are being prepared for this collection.</p>'}</div>
   </section>
   </div>
   <section class="boutique-selected-panel" aria-live="polite">
     ${selectionPanel}
    <button type="button" class="button secondary boutique-clear" data-action="clear-fashion-look">Clear Preview</button>
   </section>
   <p class="boutique-footnote">Your wardrobe and Froggy Dough are saved with your player profile. Buying a complete outfit also unlocks its matching pieces.</p>
  </div>`,'boutique');
}
function boutique(){
 const categories=['Outfits','Shoes','Accessories','Hair Color'];
 if(!categories.includes(boutiqueCategory))boutiqueCategory='Outfits';
 const avatar=mobileAvatar(p.gameAvatarId),playerGender=avatar.gender||'girl';
 boutiqueGender=playerGender;
 const isHairCategory=boutiqueCategory==='Hair Color';
 const isProductCategory=boutiqueCategory==='Shoes'||boutiqueCategory==='Accessories';
 const outfitIds=[...MATCH_FRENZY_OUTFITS.girl,...MATCH_FRENZY_OUTFITS.boy];
 const outfitItems=outfitIds.map(id=>FASHION_ITEMS.find(item=>item.id===id)).filter(Boolean);
 const visible=boutiqueCategory==='Shoes'
  ?FASHION_ITEMS.filter(item=>item.kind==='shoes'&&(item.gender||'girl')===playerGender)
  :boutiqueCategory==='Accessories'
   ?FASHION_ITEMS.filter(item=>(item.kind==='hair'||item.kind==='accessory')&&(item.gender||'girl')===playerGender)
   :outfitItems;
 const currentHair=BOUTIQUE_HAIR_COLORS.find(color=>color.id===p.gameHairColor)||BOUTIQUE_HAIR_COLORS[0];
 const currentBody=MOBILE_BODY_COLORS.find(color=>color.id==='green')||MOBILE_BODY_COLORS[0];
 const hairOwned=new Set(Array.isArray(p.hairColorsOwned)?p.hairColorsOwned:['blonde']);
 const hairCards=BOUTIQUE_HAIR_COLORS.map(color=>{
  const active=color.id===currentHair.id;
  const owned=hairOwned.has(color.id);
  const status=active?'CURRENT HAIR':owned?'OWNED · SELECT':color.price===0?'FREE':`BUY · ${color.price} DOUGH`;
  return `<button type='button' class='boutique-avatar-card ${active?'selected playing':''}' data-action='purchase-boutique-hair-color' data-id='${color.id}' aria-pressed='${active}' aria-label='${color.name} hair. ${owned?'Owned':color.price+' Froggy Dough'}'>
    <span class='boutique-avatar-card-art'>${fashionAvatarMarkup(avatar.id,color.id,'green',playerGender)}</span><b>${color.name}</b><small>Green frog · full hair art</small><strong>${status}</strong>
  </button>`;
 }).join('');
 const outfitCards=outfitItems.map(item=>{
  const itemGender=item.gender||'girl';
  const itemState=fashionState(itemGender);
  const itemOwned=itemState.unlocked.includes(item.id);
  const active=item.id===p.gameAvatarId;
  const canBuy=item.price===0||p.bank>=item.price;
  const outfitAvatar=MOBILE_AVATARS.find(choice=>choice.id===item.id);
  const outfitState={...itemState,equipped:{...itemState.equipped,outfit:item.id}};
  const art=outfitAvatar?fashionAvatarMarkup(outfitAvatar.id,currentHair.id,'green',itemGender,outfitState):`<img src='${matchFrenzyLook(itemGender,item.id,currentHair.art).art}' alt='${item.name}' draggable='false'>`;
  const status=active?'PLAYING NOW':itemOwned?'CHOOSE TO PLAY':item.price===0?'CHOOSE FREE':canBuy?`BUY · ${item.price} DOUGH`:`${item.price} DOUGH · NEED ${item.price-p.bank}`;
  const priceLabel=item.price===0?'Free':`${item.price} Froggy Dough`;
  const label=active?'Currently selected for all games':itemOwned?'Choose to play':`Buy ${item.name} for ${priceLabel}`;
  return `<button type='button' class='boutique-avatar-card ${active?'selected playing':''}' data-action='choose-boutique-avatar' data-id='${item.id}' data-gender='${itemGender}' aria-pressed='${active}' aria-label='${item.name}. ${label}'>
   <span class='boutique-avatar-card-art'>${art}</span><b>${item.name}</b><small>${item.detail}</small><strong>${status}</strong>
  </button>`;
 }).join('');
 const productCards=isProductCategory?visible.map(item=>{
  const itemGender=item.gender||'girl';
  const itemState=fashionState(itemGender);
  const owned=itemState.unlocked.includes(item.id);
   const selected=item.id===fashionSelection;
   const equipped=fashionItemEquipped(item,itemState);
  const canBuy=item.price===0||p.bank>=item.price;
   const status=equipped?'CURRENTLY WEARING':owned?'OWNED · TAP TO WEAR':item.price===0?'FREE · TAP TO WEAR':canBuy?`BUY · ${item.price} DOUGH`:`${item.price} DOUGH · NEED ${item.price-p.bank}`;
   return `<button type='button' class='boutique-avatar-card ${equipped?'playing':''} ${selected?'selected':''}' data-action='select-boutique-piece' data-id='${item.id}' data-gender='${itemGender}' aria-pressed='${equipped}' aria-label='${item.name}. ${equipped?'Currently wearing':owned?'Tap to wear':item.price+' Froggy Dough'}'>
   <span class='boutique-avatar-card-art'>${fashionAvatarMarkup(avatar.id,item.kind==='hair'?'blonde':currentHair.id,'green',playerGender,itemState,{[fashionSlot(item)]:item.id})}</span><b>${item.name}</b><small>${item.detail}</small><strong>${status}</strong>
  </button>`;
 }).join(''):'';
 const selectedProduct=visible.find(item=>item.id===fashionSelection);
 const selectedState=selectedProduct?fashionState(selectedProduct.gender||'girl'):null;
 const selectedOwned=selectedProduct?selectedState.unlocked.includes(selectedProduct.id):false;
 const selectedEquipped=selectedProduct?fashionItemEquipped(selectedProduct,selectedState):false;
 const canBuySelected=selectedProduct&&(selectedProduct.price===0||p.bank>=selectedProduct.price);
 const preview=fashionAvatarMarkup(avatar.id,currentHair.id,'green',playerGender);
 const selectionPanel=isHairCategory
  ?`<figure class='boutique-live-avatar'>${preview}<figcaption>YOUR PLAYER</figcaption></figure><div class='boutique-selected-copy'><span>HAIR COLOR · GREEN FROG</span><b>${currentHair.name} - ${avatar.name}</b><small>Uses the approved full-look hair artwork.</small><strong>Saved across Froggy Faceoff games.</strong></div><button type='button' class='button boutique-apply' data-action='purchase-boutique-hair-color' data-id='${currentHair.id}' disabled>USING ${currentHair.name.toUpperCase()}</button>`
  :isProductCategory&&selectedProduct
   ?`<figure class='boutique-live-avatar'>${preview}<figcaption>YOUR PLAYER</figcaption></figure><div class='boutique-selected-copy'><span>${boutiqueCategory.toUpperCase()}</span><b>${selectedProduct.name}</b><small>${selectedProduct.detail}</small><strong>${selectedOwned?'In your wardrobe':selectedProduct.price===0?'Free':`${selectedProduct.price} Froggy Dough`}</strong></div><button type='button' class='button boutique-apply' data-action='purchase-selected-fashion'>${selectedEquipped?'OWNED':selectedOwned?'ADD TO LOOK':canBuySelected?`BUY · ${selectedProduct.price} DOUGH`:`NEED ${selectedProduct.price-p.bank} MORE DOUGH`}</button>`
   :`<figure class='boutique-live-avatar'>${preview}<figcaption>YOUR PLAYER</figcaption></figure><div class='boutique-selected-copy'><span>YOUR PLAYER FROG</span><b>${avatar.name}</b><small>${currentHair.name} hair - ${currentBody.name}</small><strong>${pendingGameLaunch?'Choose an outfit to continue to play.':'Your choice is saved across Froggy Faceoff games.'}</strong></div><span class='button boutique-apply boutique-player-status' aria-label='Green frog with ${currentHair.name} hair'>GREEN FROG</span>`;
 const tabs=categories.map(category=>`<button type='button' class='button ${boutiqueCategory===category?'':'secondary'}' data-action='boutique-department' data-id='${category}' aria-pressed='${boutiqueCategory===category}'>${category==='Outfits'?'Full Outfits':category}</button>`).join('');
 const cards=isHairCategory?hairCards:isProductCategory?productCards:outfitCards;
 const ariaLabel=isHairCategory?'Hair color choices':isProductCategory?`${boutiqueCategory} choices`:'Complete outfit choices';
 openHub('Froggy Fashion Boutique',`<div class='boutique-panel boutique-gold-house boutique-avatar-store'>
  <header class='boutique-gallery-header'><span>FROGGY WARDROBE</span><b>${p.bank} Froggy Dough</b></header>
  <nav class='boutique-view-switch' aria-label='Boutique choices'>${tabs}</nav>
  <div class='boutique-product-grid boutique-avatar-grid ${isHairCategory?'hair-color-grid':''}' aria-label='${ariaLabel}'>${cards}</div>
  <section class='boutique-selected-panel' aria-live='polite'>${selectionPanel}</section>
 </div>`,'boutique');
}
function fighters(){pendingGameLaunch=null;boutiqueCategory='Outfits';boutique();}
function openGameAvatarSetup(pendingMode=null,pendingSeason=null){pendingGameLaunch=pendingMode?{mode:pendingMode,season:pendingSeason}:null;boutiqueCategory='Outfits';boutique();}
function renderGameAvatarSetup(){
 const step=gameAvatarFlow.step,avatar=mobilePlayerAvatar(),hair=MOBILE_HAIR_COLORS.find(color=>color.id===p.gameHairColor)||MOBILE_HAIR_COLORS[2],bodyId=step===1?'green':p.gameBodyColor,body=MOBILE_BODY_COLORS.find(color=>color.id===bodyId)||MOBILE_BODY_COLORS[0];
 let choices='';
 if(step===1)choices=`<div class="game-avatar-choice-grid hair-choice-grid">${MOBILE_HAIR_COLORS.map(color=>`<button type="button" class="game-avatar-choice ${p.gameHairColor===color.id?'selected':''}" data-action="choose-game-hair" data-id="${color.id}" aria-pressed="${p.gameHairColor===color.id}"><span class="game-avatar-choice-art">${mobileAvatarImage(avatar.id,color.id,'green')}</span><b>${color.name}</b></button>`).join('')}</div>`;
 else if(step===2)choices=`<div class="game-avatar-choice-grid body-choice-grid">${MOBILE_BODY_COLORS.map(color=>`<button type="button" class="game-avatar-choice ${p.gameBodyColor===color.id?'selected':''}" data-action="choose-game-body" data-id="${color.id}" aria-pressed="${p.gameBodyColor===color.id}"><span class="game-avatar-choice-art">${mobileAvatarImage(avatar.id,p.gameHairColor,color.id)}</span><b>${color.name}</b><i class="game-body-swatch" style="--body-swatch:${color.swatch}" aria-hidden="true"></i></button>`).join('')}</div>`;
 else choices=`<div class="game-avatar-choice-grid exact-avatar-grid">${MOBILE_AVATARS.map(choice=>`<button type="button" class="game-avatar-choice ${p.gameAvatarId===choice.id?'selected':''}" data-action="choose-game-avatar" data-id="${choice.id}" aria-pressed="${p.gameAvatarId===choice.id}"><span class="game-avatar-choice-art">${mobileAvatarImage(choice.id,p.gameHairColor,p.gameBodyColor)}</span><b>${choice.name}</b></button>`).join('')}</div>`;
 const instructions=step===1?'Pick hair color. Your frog stays green here; only the hair changes.':step===2?'Pick your frog color. Your selected hair, outfit, shoes, and accessories stay intact.':'Choose the complete wardrobe and avatar you will play as in Froggy Faceoff.';
 const nextLabel=step===1?'Pick Frog Color →':step===2?'Choose Your Avatar →':'Play as This Avatar';
 const selectedSummary=`${hair.name} hair · ${body.name}`;
 openHub('Customize Your Frog',`<section class="game-avatar-setup" aria-label="Player character setup">
  <header class="game-avatar-setup-heading"><span>STEP ${step} OF 3</span><h3>${step===1?'Choose Hair Color':step===2?'Choose Frog Color':'Choose Your Wardrobe'}</h3><p>${instructions}</p></header>
  <div class="game-avatar-current"><figure>${mobileAvatarImage(avatar.id,p.gameHairColor,body.id)}</figure><div><small>YOUR PLAYER PREVIEW</small><b>${avatar.name}</b><span>${selectedSummary}</span></div></div>
  ${choices}
  <footer class="game-avatar-setup-actions"><button type="button" class="button secondary" data-action="cancel-game-avatar">Home</button><div>${step>1?'<button type="button" class="button secondary" data-action="back-game-avatar">← Back</button>':''}<button type="button" class="button" data-action="next-game-avatar">${nextLabel}</button></div></footer>
 </section>`,'home');
}
function completeGameAvatarSetup(){p.gameAvatarSetupComplete=true;save();const {pendingMode,pendingSeason}=gameAvatarFlow;gameAvatarFlow={step:1,pendingMode:null,pendingSeason:null};if(pendingMode)chooseMode(pendingMode,pendingSeason);else home();}
function learningBank(query=''){const text=query.toLowerCase(),items=LESSONS.filter(l=>(CHAPTERS[l.chapter].name+' '+l.fact).toLowerCase().includes(text));openHub('Frog & Nature Bank',`<div class="panel"><label for="bank-search">Explore frog growth, habitats, and species</label><input id="bank-search" type="search" placeholder="Search: tadpole, rainforest, insects…" value="${query.replace(/[&<>"']/g,'')}" class="bank-search"><p class="muted">${items.length} discoveries · Read at your own pace. Sources open with each fact.</p><div id="bank-facts">${items.map(l=>`<article class="bank-fact"><h3>${CHAPTERS[l.chapter].icon} ${CHAPTERS[l.chapter].name}</h3><p>${l.fact}</p><a class="source-link" href="${l.source}" target="_blank" rel="noopener">Read the source</a></article>`).join('')||'<p>No matching discoveries. Try a different nature word.</p>'}</div><button class="button wide" data-action="journey">Practice What You Learn</button></div>`,'rewards');}

function powers(){openHub('Your Super Powers',`<div class="panel"><h3>Power up your next match</h3><p class="muted">Bought powers stay in your inventory until you use them. Earn frogs by completing matches.</p>${POWERS.map(f=>`<div class="power-row"><span class="badge">${f.icon}</span><div><b>${f.name}</b><small>${f.desc}</small><small>Owned: ${p.inventory[f.id]||0}</small></div><button class="button" data-action="buy-power" data-id="${f.id}" ${p.bank<f.price?'disabled':''}>${f.price} 🐸</button></div>`).join('')}</div>`,'powers');}
function leagues(){const j=journeyProgress(p);openHub('Your Frog Journey',`<div class="panel"><h3>Grow. Explore. Remember.</h3><p>Start with a frog’s growth, then discover frog habitats and species. Short learning checks move your journey forward.</p><p class="muted">${j.learned} / ${j.total} lessons learned${j.review?' · Review adventure '+j.round:''}. Completed lessons stay available to revisit. Review adventures keep going with this lesson set; more chapters can be added.</p><span class="meter"><i style="width:${j.learned/j.total*100}%"></i></span><button class="button wide journey-play" data-action="learn-next">${j.review?'Continue Reviewing':'Continue Your Journey'}</button>${CHAPTERS.map((c,i)=>{const lessons=LESSONS.filter(l=>l.chapter===i),done=lessons.filter(l=>journeyState(p).learned.includes(l.id)).length,unlocked=i<=j.lesson.chapter||done===lessons.length;return `<div class="league-row chapter-row"><span class="badge">${c.icon}</span><div><button class="chapter-button" data-action="learn-chapter" data-id="${i}" ${unlocked?'':'disabled'}><b>${c.name}</b><small>${done} / ${lessons.length} lessons · ${done===lessons.length?'Revisit anytime':unlocked?'Learn & play':'Discover after the earlier chapter'}</small></button></div></div>`;}).join('')}<p class="muted">Facts use National Park Service, Smithsonian, and EPA resources. The familiar egg → tadpole → froglet → adult pattern has exceptions among species.</p></div>`,'rewards');}
function learn(id=null){const lesson=id?LESSONS.find(l=>l.id===id):nextLesson(p);if(!lesson)return;activeLesson=lesson;lessonAnswered=false;season=null;series=null;document.body.classList.remove('theme-halloween','theme-winter');newRound('solo',12);}
function learningCheck(){if(!activeLesson)return;const l=activeLesson,q=learningPrompt(p,l);modal(`<div class="learning-check"><h2>${CHAPTERS[l.chapter].icon} Pond Discovery</h2><p>${l.fact}</p><p class="question">${q.question}</p>${q.choices.map((c,i)=>`<button class="button secondary" data-action="learning-answer" data-index="${i}">${c}</button>`).join('')}<p class="learning-feedback" id="learning-feedback" aria-live="polite"></p><a class="source-link" href="${l.source}" target="_blank" rel="noopener">Learn more from the source</a><div class="actions"><button class="button secondary" data-action="home">Home</button></div></div>`);}
function learningAnswer(choice){if(!activeLesson||lessonAnswered)return;const q=learningPrompt(p,activeLesson);const result=choice===q.answer?recordLearning(p,activeLesson.id,activeLesson.answer):{correct:false};if(!result.correct){$('#learning-feedback').textContent='Have another look at the fact above, then try again.';return;}lessonAnswered=true;save();const j=journeyProgress(p);modal(`<h2>Discovery Remembered!</h2><p>+${result.currency} frogs · ${result.review?'Memory strengthened':'New lesson learned'}</p><p>${activeLesson.fact}</p><p class="journey-notice">Next: ${j.chapter.name}${j.review?' · Review adventure '+j.round:''}</p><div class="actions"><button class="button secondary" data-action="journey">Your Journey</button><button class="button" data-action="learn-next">Keep Exploring</button></div>`);}

function rewards(tab='trail'){const tabs=`<div class="tabs"><button class="button ${tab==='trail'?'':'secondary'}" data-action="rewards">Trail</button><button class="button ${tab==='records'?'':'secondary'}" data-action="records">Bests</button><button class="button ${tab==='holiday'?'':'secondary'}" data-action="holidays">Events</button><button class="button secondary" data-action="leagues">Journey</button></div>`;let body='';if(tab==='trail'){const track=Math.floor(p.wins/12),offset=track*12;body=`<div class="panel"><h3>Frog Trophy Trail ${track+1}</h3><b>${['Pond Beginnings','Reed Explorers','Forest Friends','Rainforest Ramble','Moonlit Marsh','Mountain Streams','Lotus Adventure','Nature Guardians'][track%8]}</b><p>Five fresh milestones. Frog rewards and a collectible at the finish.</p><p class="muted">${p.wins} completed wins · ${track} trails completed. Solo and rival wins count.</p><span class="meter"><i style="width:${(p.wins-offset)/12*100}%"></i></span>${TRAIL.map((m,i)=>`<div class="trail-row ${p.trail.includes(track*5+i)?'earned':''}"><span class="badge">${p.trail.includes(track*5+i)?'🏆':'🪷'}</span><div><b>${m.name}</b><small>${offset+m.need} total wins · ${m.reward+track*5} frogs${i===4?' + collectible frog':''}</small></div><span class="tag-pill">${p.trail.includes(track*5+i)?'Earned':`${Math.max(0,offset+m.need-p.wins)} to go`}</span></div>`).join('')}<p class="muted">A completed trail opens a new five-stop trail. Earlier rewards stay yours.</p><button class="button secondary wide" data-action="bank">Visit the Learning Bank</button></div>`;}else if(tab==='records'){body=`<div class="panel"><h3>Your Personal Bests</h3><p class="journey-notice">Puzzle learning: ${puzzleLearningState(p).checks} checks completed · ${puzzleLearningState(p).firstTry} correct on the first try.</p><div class="records"><div class="record"><strong>${p.records.accuracy}%</strong><span>Best matching accuracy</span></div><div class="record"><strong>${p.records.comeback}</strong><span>Biggest comeback · points</span></div><div class="record"><strong>${p.records.cards}</strong><span>Highest stage · cards</span></div><div class="record"><strong>${p.wins}</strong><span>Completed wins</span></div></div><p class="muted">Accuracy = matching pairs ÷ pair attempts in a completed win. Comebacks count the largest point deficit recovered in a rival win.</p><button class="button wide" data-action="practice">Beat your best in practice</button></div>`;}else{body=`<div class="panel"><p>Try both seasonal championships in this preview. Each needs five rival-round wins, with its own progress and costume.</p><p class="muted">These are personal challenges against CPU rivals, with no online leaderboard.</p></div>${['halloween','winter'].map(s=>`<div class="panel championship ${s}"><h3>${s==='halloween'?'🎃 Halloween Pond':'❄️ Winter Pond'}</h3><p>Win 5 rival rounds to unlock ${s==='halloween'?'Pumpkin Hopper':'Snowflake Hopper'} and 50 frogs.</p><span class="meter"><i style="width:${Math.min(p.season[s]/5,1)*100}%"></i></span><p class="muted">${Math.min(p.season[s],5)} / 5 wins${p.seasonClaimed.includes(s)?' · Reward earned':''}</p><button class="button wide ${s==='winter'?'blue':''}" data-action="championship" data-id="${s}">Play ${s==='halloween'?'Halloween':'Winter'}</button></div>`).join('')}`;}openHub('Pond Rewards',tabs+body,'rewards');}
function chooseMode(mode,championship=null){if(!p.gameAvatarSetupComplete){openGameAvatarSetup(mode,championship);return;}activeLesson=null;lessonAnswered=false;season=championship;document.body.classList.remove('theme-halloween','theme-winter');if(season)document.body.classList.add('theme-'+season);const avatar=mobilePlayerAvatar();modal(`<h2>${mode==='solo'?(activeLesson?'Frog Journey':'Solo Pond'):season?`${season==='halloween'?'🎃 Halloween':'❄️ Winter'} Championship`:'Rival Showdown'}</h2><p>${mode==='solo'?'Find every pair at your own pace.':'Best of three against a CPU rival. Each turn lasts 15 seconds.'}</p><div class="tabs"><button class="button secondary" data-action="customize-game-avatar" data-id="${mode}" data-season="${championship||''}">Change Player</button><button class="button secondary" data-action="powers">Pick Your Super Powers</button></div><p class="muted">Playing as ${avatar.name}</p><label for="stage-select">Choose your stage</label><select id="stage-select" class="stage-select">${STAGES.map((n,i)=>`<option value="${n}" ${n===p.stage&&stageAvailable(p,n)?'selected':''} ${stageAvailable(p,n)?'':'disabled'}>${n} cards${stageAvailable(p,n)?'':` · unlock at ${STAGE_UNLOCKS[i]} wins`}</option>`).join('')}</select><p class="muted">Progress saves on this device. Connect your account for cloud saving.</p><div class="actions"><button class="button secondary" data-action="cancel-start">Cancel</button><button class="button" data-action="start" data-id="${mode}">Start game</button></div>`);}
function begin(mode){const count=Number($('#stage-select').value);if(!stageAvailable(p,count))return;p.stage=count;save();if(mode==='rival'){const names=rivalNames.filter(n=>n!==lastRival);lastRival=names[Math.floor(Math.random()*names.length)];series={rival:lastRival,you:0,rivalWins:0,cards:count,season};}else series=null;dismiss();newRound(mode,count);}
function newRound(mode=match?.mode||'rival',count=series?.cards||p.stage){stopTimers();match=new Match({mode,cards:count});if(activeLesson){match.learning=true;const mapping=new Map();let topic=0;match.deck.forEach(c=>{if(!mapping.has(c.value))mapping.set(c.value,JOURNEY_CARDS[topic++]);c.value=mapping.get(c.value);});}show('game');$('#mode-label').textContent=mode==='solo'?(activeLesson?'Frog Journey':'Solo Pond'):season?`${season==='halloween'?'Halloween':'Winter'} Championship`:'Rival Showdown';$('#rival-name').textContent=mode==='solo'?'Pairs left':`${series.rival} · CPU`;$('#you-name').textContent=mobilePlayerAvatar().name;renderBoard();renderScores();renderPowers();$('#turn-message').textContent='Get ready to hop!';modal(`<div class="game-start-avatar">${mobileAvatarImage(p.gameAvatarId,p.gameHairColor,p.gameBodyColor)}</div><h2>STARTING GAME</h2><div class="count" aria-live="polite">3</div>`);playCountdownVoice();}
function countdown(n){if(n>0){$('#modal-content .count').textContent=n;later(()=>countdown(n-1),n===2?1081:1352);}else{$('#modal-content .count').textContent='GO!';later(beginCountdownGame,782);}}
function beginCountdownGame(){if(!match||!$('#modal-content .count'))return;stopCountdownVoice();dismiss();$('#turn-message').textContent=match.mode==='solo'?'Find every pair. Take your time!':'Your turn. Find a pair!';startTurn();}
function renderBoard(){
 const count=match.deck.length,landscape=innerWidth>innerHeight;
 const cols=landscape?(count<=18?6:count<=36?8:10):(innerWidth<360?(count<=24?4:6):innerWidth<440?(count<=12?4:6):(count<=12?4:count<=30?6:count<=42?7:8));
 const board=$('#board'),signature=count+':'+cols,geometryChanged=board.dataset?.layout!==signature;
 if(geometryChanged){board.style.setProperty('--cols',cols);board.style.setProperty('--rows',Math.ceil(count/cols));if(board.dataset)board.dataset.layout=signature;}
 const states=match.deck.map((c,i)=>{
  const shown=c.matched||match.revealed.includes(i)||peek.includes(i);
  return {className:`card ${shown?'face':''} ${c.matched?'matched':''}`,disabled:!!(c.matched||match.turn!=='you'||match.lock||$('#modal').open),label:c.matched?'Matched':shown?`Card ${i+1}: ${c.value}`:`Hidden card ${i+1}`,html:shown?(c.value.includes('|')?`<span class="card-word"><span>${c.value.split('|')[0]}</span>${c.value.split('|')[1]}</span>`:c.value):'🪷'};
 });
 const cards=board.querySelectorAll?.('.card');
 if(cards?.length===count){
  for(let i=0;i<count;i++){const card=cards[i],state=states[i];if(card.className!==state.className)card.className=state.className;if(card.disabled!==state.disabled)card.disabled=state.disabled;if(card.getAttribute('aria-label')!==state.label)card.setAttribute('aria-label',state.label);if(card.innerHTML!==state.html)card.innerHTML=state.html;}
 }else board.innerHTML=states.map((state,i)=>`<button class="${state.className}" data-action="card" data-index="${i}" aria-label="${state.label}" ${state.disabled?'disabled':''}>${state.html}</button>`).join('');
 if(geometryChanged)window.frogFitBoard?.();
}

function renderScores(){renderGameCharacters();$('#you-score').textContent=match.scores.you;$('#rival-score').textContent=match.mode==='solo'?match.deck.filter(c=>!c.matched).length/2:match.scores.rival;$('#series-score').textContent=match.mode==='solo'?`${match.deck.length} cards`: `${series.you}–${series.rivalWins} · Best of 3`;}
function powerUnavailable(id){if(!match||match.turn!=='you'||match.lock||match.done||$('#modal').open)return true;if(['freeze','clock','safe','shield','snatch'].includes(id)&&match.mode==='solo')return true;if(['double','freeze','safe','shield','harvest'].includes(id)&&match[id])return true;if(id==='snatch'&&match.scores.rival===0)return true;if(id==='echo'&&match.echo>0)return true;if(id==='shuffle'&&match.revealed.length)return true;if(id==='recall'&&match.lastMismatch.filter(i=>!match.deck[i].matched&&!match.revealed.includes(i)).length===0)return true;return false;}
function powerChoices(){return POWERS.filter(f=>p.inventory[f.id]>0).map(f=>`<button class="button wide ${f.id==='vision'?'blue':''}" data-action="use-power" data-id="${f.id}" ${powerUnavailable(f.id)?'disabled':''}>${f.icon} ${f.name} · ${p.inventory[f.id]} owned</button>`).join('')||'<p>Buy powers from Home to bring them into a match.</p>';}
function renderPowers(){$('#game-powers').innerHTML=`<button class="button" data-action="match-powers" ${!match||match.turn!=='you'||match.lock||match.done?'disabled':''}>⚡ Your Super Powers</button>`;}
function matchPowers(){if(!match||match.turn!=='you'||match.lock||match.done)return;const choices=powerChoices();clearInterval(tick);modal('<h2>Your Super Powers</h2>'+choices+'<div class="actions"><button class="button secondary" data-action="stay">Back to Match</button></div>');}


function startTurn(remaining=15){clearInterval(tick);if(!match||match.done)return;renderBoard();renderPowers();seconds=remaining;$('#timer').textContent=match.mode==='solo'?'∞':seconds;$('.clock').classList.remove('hot');if(match.mode==='solo')return;const e=epoch;tick=setInterval(()=>{if(e!==epoch||!match||match.done)return;if(match.lock)return;seconds--;$('#timer').textContent=seconds;$('.clock').classList.toggle('hot',seconds<=5);if(seconds<=0){clearInterval(tick);match.nextTurn();peek=[];renderBoard();$('#turn-message').textContent=match.turn==='rival'?`${series.rival} is thinking…`:'Your turn. Find a pair!';startTurn();}},1000);if(match.turn==='rival')later(botStep,450);}
function botStep(){if(!match||match.done||match.turn!=='rival'||match.lock)return;const i=match.botChoice();if(i!==null)select(i,'rival');}
function select(i,actor='you'){if($('#modal').open)return;const r=match.select(i,actor);if(r.type==='ignored')return;renderBoard();if(actor==='you'){const c=$(`[data-index="${i}"]`);c?.classList.add('hop');}if(r.type==='first'){if(actor==='rival')later(botStep,600);return;}renderScores();renderPowers();if(r.type==='match'){if(actor==='you')playCorrect();$('#turn-message').textContent=actor==='you'?'Great match! Hop again.':`${series.rival} found a pair.`;}else $('#turn-message').textContent='Not a match. Remember these cards!';later(()=>{const state=match.resolve(r.type==='match');peek=[];renderBoard();if(state==='finished'){finish();return;}$('#turn-message').textContent=match.mode==='solo'?'Find the next pair.':match.turn==='you'?'Your turn. Find a pair!':`${series.rival} is thinking…`;startTurn();},r.type==='match'?150:2000);}
function usePower(id){if(powerUnavailable(id)||!p.inventory[id])return;const hidden=match.deck.map((c,i)=>!c.matched&&!match.revealed.includes(i)?i:null).filter(i=>i!==null);let show=[];if(['vision','spotlight','link','recall','lantern'].includes(id)){if(!hidden.length)return;if(id==='vision')show=[...hidden].sort(()=>Math.random()-.5).slice(0,2);if(id==='spotlight')show=[hidden[Math.floor(Math.random()*hidden.length)]];if(id==='lantern')show=hidden;if(id==='recall')show=match.lastMismatch.filter(i=>hidden.includes(i));if(id==='link'){const a=hidden.find(i=>hidden.some(j=>j!==i&&match.deck[j].value===match.deck[i].value));if(a===undefined){toast('Finish the selected pair before using Lily Link.');return;}show=[a,hidden.find(j=>j!==a&&match.deck[j].value===match.deck[a].value)];}if(!show.length)return;peek=show;match.lock=true;renderBoard();later(()=>{peek=[];match.lock=false;renderBoard();renderPowers();},1000);}else if(id==='feast'){match.scores.you+=3;renderScores();toast('Frog Feast: three points!');}else if(id==='snatch'){const points=Math.min(3,match.scores.rival);match.scores.rival-=points;match.scores.you+=points;renderScores();toast(`Frog Snatch: ${points} points!`);}else if(id==='clock'){seconds+=5;$('#timer').textContent=seconds;$('.clock').classList.remove('hot');toast('Five extra seconds!');}else if(id==='shuffle'){const values=hidden.map(i=>match.deck[i].value);for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}hidden.forEach((i,n)=>{match.deck[i].value=values[n];match.memory.delete(i);});match.lastMismatch=[];renderBoard();toast('Hidden cards reshuffled. Matched pairs stayed put.');}else if(id==='echo'){match.echo=2;toast('Echo Hopper ready for your next two pairs!');}else{match[id]=true;const f=POWERS.find(f=>f.id===id);toast(`${f.name} is ready!`);}p.inventory[id]--;save();renderPowers();}


/* Independently articulated SVG frog fighters for the results celebration. */
function victoryCartoonFrog(color){
 const purple=color==='purple',skin=purple?'#ae5bdf':'#77d934',dark=purple?'#7432a9':'#398f27',belly=purple?'#fff1ba':'#fff5c3',glove=purple?'#ee3838':'#287cf3',scarf=purple?'#e33340':'#2469d9';
 return `<svg class="battle-frog ${color}" viewBox="0 0 180 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 <defs><radialGradient id="skin-${color}" cx="35%" cy="24%"><stop stop-color="#e4ffb1"/><stop offset=".38" stop-color="${skin}"/><stop offset="1" stop-color="${dark}"/></radialGradient><radialGradient id="glove-${color}"><stop stop-color="#fff" stop-opacity=".8"/><stop offset=".35" stop-color="${glove}"/><stop offset="1" stop-color="#722d3d"/></radialGradient></defs>
 <g class="frog-rig">
 <g class="frog-leg back-leg"><path d="M81 150 Q46 151 37 179 L18 192 Q10 204 35 202 L73 190 Q91 183 103 165Z" fill="${dark}" stroke="#34542e" stroke-width="3"/></g>
 <g class="frog-leg front-leg"><path d="M104 150 Q135 153 141 175 L160 191 Q169 202 144 202 L118 189 Q99 185 93 166Z" fill="${skin}" stroke="${dark}" stroke-width="3"/></g>
 <ellipse cx="89" cy="124" rx="48" ry="52" fill="url(#skin-${color})" stroke="${dark}" stroke-width="3"/>
 <ellipse cx="91" cy="135" rx="30" ry="35" fill="${belly}"/>
 <path d="M48 101 Q92 116 137 99 L127 114 Q91 125 56 115Z" fill="${scarf}"/>
 <path d="M128 111 Q164 110 159 144 L136 129Z" fill="${scarf}"/>
 <g class="frog-arm rear-arm"><path d="M54 107 Q28 102 23 126" fill="none" stroke="${skin}" stroke-width="19" stroke-linecap="round"/><ellipse cx="21" cy="131" rx="21" ry="22" fill="url(#glove-${color})" stroke="${glove}" stroke-width="3"/></g>
 <ellipse cx="90" cy="69" rx="58" ry="47" fill="url(#skin-${color})" stroke="${dark}" stroke-width="3"/>
 <ellipse cx="60" cy="35" rx="21" ry="24" fill="${skin}" stroke="${dark}" stroke-width="3"/>
 <ellipse cx="121" cy="35" rx="21" ry="24" fill="${skin}" stroke="${dark}" stroke-width="3"/>
 <ellipse cx="62" cy="36" rx="14" ry="18" fill="white"/><ellipse cx="121" cy="36" rx="14" ry="18" fill="white"/>
 <ellipse cx="67" cy="39" rx="8" ry="12" fill="#33252e"/><ellipse cx="126" cy="39" rx="8" ry="12" fill="#33252e"/>
 <circle cx="70" cy="34" r="3.5" fill="white"/><circle cx="129" cy="34" r="3.5" fill="white"/>
 <ellipse cx="76" cy="70" rx="3" ry="2.5" fill="${dark}"/><ellipse cx="108" cy="70" rx="3" ry="2.5" fill="${dark}"/>
 <path d="M63 81 Q92 108 123 80 Q93 93 63 81Z" fill="#652c39"/><path d="M81 91 Q95 83 106 92" fill="none" stroke="#fa8796" stroke-width="6" stroke-linecap="round"/>
 <circle cx="45" cy="79" r="7" fill="#ffb8aa" opacity=".5"/><circle cx="137" cy="79" r="7" fill="#ffb8aa" opacity=".5"/>
 <g class="frog-arm front-arm"><path d="M129 109 Q147 112 146 128" fill="none" stroke="${skin}" stroke-width="18" stroke-linecap="round"/><ellipse cx="146" cy="131" rx="23" ry="24" fill="url(#glove-${color})" stroke="${glove}" stroke-width="3"/><path d="M131 125 Q146 115 157 124" fill="none" stroke="white" stroke-opacity=".5" stroke-width="4"/></g>
 </g></svg>`;
}
function victoryCartoonFight(){const player=mobilePlayerAvatar(),rival=mobileRivalAvatar(),rivalFigure=match?.mode==='solo'?'':`<figure class="avatar-victory-character avatar-victory-rival">${mobileAvatarImage(rival.id,'blonde','green')}<figcaption>RIVAL</figcaption></figure>`;return `<div class="avatar-victory-stage" role="img" aria-label="Your ${player.name} avatar celebrating after the match"><span class="avatar-victory-spark">✨</span><figure class="avatar-victory-character avatar-victory-player">${mobileAvatarImage(player.id,p.gameHairColor,p.gameBodyColor)}<figcaption>YOU</figcaption></figure>${rivalFigure}<span class="avatar-victory-stars">⭐ ✨ ⭐</span></div>`;}
function finish(){clearInterval(tick);const result=settle(p,match,season);if(!result)return;let seriesFinished=false,seriesText='';if(series){series.cards=p.stage;if(result.outcome==='win'){series.you++;series.cards=p.stage;}else if(result.outcome==='loss')series.rivalWins++;seriesFinished=series.you>=2||series.rivalWins>=2;seriesText=`Series score: You ${series.you} · ${series.rival} ${series.rivalWins}`;if(seriesFinished&&series.you>=2){p.bank+=10;result.currency+=10;result.rewards.push('Best-of-three victory: +10 frogs');}}save();renderScores();const won=result.outcome==='win',seriesLost=!!(series&&seriesFinished&&series.you<2),rewardedAdsReady=!!(window.froggyRewardedAds?.ready&&typeof window.froggyRewardedAds.showRewarded==='function'),l=journeyProgress(p);modal(`<div class="dance ${p.settings.motion?'':'still'}" aria-hidden="true">${victoryCartoonFight()}</div><h2>${won?(seriesFinished?'FACEOFF WON!':'YOU WON!'):result.outcome==='tie'?'A CLOSE TIE!':'GOOD BATTLE!'}</h2><p>${match.mode==='solo'?'Pond cleared!':seriesText}</p><p><b>+${result.currency} frogs</b> · ${result.accuracy}% accuracy</p><div class="reward-list">${result.rewards.map(x=>`<div>${x}</div>`).join('')}<div>Your Frog Journey: ${l.chapter.name}</div>${season?`<div>${Math.min(5,p.season[season])}/5 championship wins</div>`:''}</div><div class="actions">${seriesLost?`<button class="button" data-action="use-reward-continue" ${p.rewardContinuations>0?'':'disabled'}>Use 1 extra play (${p.rewardContinuations} left)</button><button class="button secondary" data-action="watch-continue-ad">${rewardedAdsReady?'Watch ad for 5 extra plays':'Watch ad for 5 extra plays · coming soon'}</button>`:''}<button class="button secondary" data-action="home">Home</button><button class="button" data-action="${activeLesson?'learning-check':match.mode==='solo'?'again':seriesFinished?'new-series':'rematch'}">${activeLesson?'Discover & Learn':match.mode==='solo'?(won?'Next Stage · '+p.stage+' cards':'Play Again'):seriesFinished?'New Rival':result.outcome==='tie'?'Replay Tied Round':won?'Rematch? · '+p.stage+' cards':'Rematch?'}</button></div>`);}
function continueRivalSeries(){if(!series)return;if(!spendRewardedContinue(p)){toast('You need a saved extra play to restart this series.');return;}const cards=series.cards,rival=series.rival;series={rival,you:0,rivalWins:0,cards,season};save();dismiss();newRound('rival',cards);}
async function requestRewardedContinueAd(){const provider=window.froggyRewardedAds;if(!provider?.ready||typeof provider.showRewarded!=='function'){toast('Rewarded ads are not connected yet.');return;}try{const result=await provider.showRewarded({placement:'continue-pack-five'});window.froggyRewardedContinueCompleted?.({placement:'continue-pack-five',rewarded:result?.rewarded===true});}catch{toast('The rewarded ad did not finish. No extra plays were added.');}}
window.froggyRewardedContinueCompleted=({placement,rewarded}={})=>{if(placement!=='continue-pack-five'||rewarded!==true)return false;const credits=addRewardedContinuePack(p);save();const useButton=document.querySelector('[data-action="use-reward-continue"]');if(useButton){useButton.disabled=false;useButton.textContent='Use 1 extra play ('+credits+' left)';}toast('Five extra plays added.');return true;};

function lifeCycle(){const state=puzzleLearningState(p),order=state.cycleOrder||[];openHub('Frog Life Cycle',`<div class="panel"><h3>From Egg to Adult</h3><p>Many frogs follow this familiar pattern. Other species can develop differently, and timing varies.</p><details class="puzzle-recall"><summary>Study the stages</summary>${CYCLE_STAGES.map((stage,i)=>`<p><b>${i+1}. ${stage.icon} ${stage.name}</b> — ${stage.fact}</p>`).join('')}<p><a href="${LESSONS[0].source}" target="_blank" rel="noopener">Explore the source</a></p></details><h3>Build the cycle in order</h3><p>Tap the stage that comes next, starting with the egg.</p><p class="journey-notice">${order.length?order.map(i=>CYCLE_STAGES[i].name).join(' → '):'Your cycle starts here…'}</p><div class="grid">${[2,0,3,1].map(i=>`<button class="button secondary" data-action="cycle-stage" data-index="${i}" ${order.includes(i)?'disabled':''}>${CYCLE_STAGES[i].icon} ${CYCLE_STAGES[i].name}</button>`).join('')}</div><p id="cycle-feedback" aria-live="polite"></p><p class="muted">${state.cycleRounds||0} cycles remembered. Complete a cycle to earn 2 frogs.</p><button class="button secondary wide" data-action="journey">Continue Your Frog Journey</button></div>`,'rewards');}
function cycleStage(index){const result=selectCycleStage(p,index);if(!result.correct){$('#cycle-feedback').textContent='Try again. Review the stages above if you need a reminder.';return;}save();if(!result.complete){lifeCycle();$('#cycle-feedback').textContent=CYCLE_STAGES[index].fact;return;}modal(`<h2>Life Cycle Remembered!</h2><p>Egg → Tadpole → Froglet → Adult frog</p><p>Adults can reproduce, beginning another cycle.</p><p>+2 frogs</p><div class="actions"><button class="button secondary" data-action="healthy-pond">Discover a Healthy Pond</button><button class="button" data-action="cycle">Practice Again</button></div>`);}
function healthyPond(){dismiss();const lessons=LESSONS.filter(l=>l.id.startsWith('pond-'));openHub('A Healthy Pond',`<div class="panel"><h3>A Living Team</h3><p>A frog’s home includes water, wet edges, and nearby land. Living things are connected, and different ponds support different communities.</p>${lessons.map(l=>`<article class="bank-fact"><p>${l.fact}</p><a class="source-link" href="${l.source}" target="_blank" rel="noopener">Explore the source</a></article>`).join('')}<p class="journey-notice">Plants & small water animals → food for other animals. Frogs eat insects and can be food for larger animals. These are parts of a food web, rather than a single straight chain.</p><button class="button wide" data-action="learn-chapter" data-id="7">Practice Pond Discoveries</button><button class="button secondary wide" data-action="wordsearch">Practice Nature Words</button></div>`,'rewards');}
function puzzleDiscovery(words,plan){const lesson=LESSONS.find(l=>l.id===plan.lessonId);return `<section class="puzzle-discovery"><h3>${CHAPTERS[lesson.chapter].icon} Today’s Discovery</h3><p>${lesson.fact}</p><a class="source-link" href="${lesson.source}" target="_blank" rel="noopener">Explore the source</a><details><summary>Words & discoveries</summary>${words.map(w=>{const v=VOCABULARY.find(v=>v.word===w)||{clue:WORDS.find(x=>x[0]===w)?.[1]||'Nature vocabulary',lessonId:null},l=LESSONS.find(l=>l.id===v.lessonId);return `<p><b>${w}</b> — ${v.clue} ${l?`<a href="${l.source}" target="_blank" rel="noopener">Source</a>`:''}</p>`;}).join('')}</details><p class="muted">Use the discovery and clues, then try a memory check after the puzzle. Bonus discovery checks are optional. Every third puzzle revisits a learned lesson.</p></section>`;}
function puzzleCheck(){const pending=puzzleLearningState(p).pending;if(!pending)return;const l=LESSONS.find(l=>l.id===pending.lessonId),q=learningPrompt(p,l);modal(`<h2>🌿 Remember Your Discovery</h2><p>${q.question}</p><div class="puzzle-answers">${q.choices.map((choice,i)=>`<button class="button secondary wide" data-action="puzzle-answer" data-index="${i}">${choice}</button>`).join('')}</div><p id="puzzle-learning-feedback" aria-live="polite"></p><details class="puzzle-recall" ${p.settings.learning==='gentle'?'open':''}><summary>Review the discovery</summary><p>${l.fact}</p><a href="${l.source}" target="_blank" rel="noopener">Source</a></details><div class="actions"><button class="button secondary" data-action="home">Save & Return Home</button><button class="button" data-action="skip-puzzle-check">Keep Playing</button></div>`);}
function puzzleAnswer(choice){const result=answerPuzzleCheck(p,choice);if(!result)return;save();if(!result.correct){$('#puzzle-learning-feedback').textContent=`Have another look: ${result.lesson.fact} Try again—there is no penalty.`;return;}const stats=puzzleLearningState(p);modal(`<div class="dance">${portrait(fighter())}</div><h2>Discovery Remembered!</h2><p>${result.lesson.fact}</p><p><b>+${result.currency} frogs</b> for ${result.firstTry?'remembering on your first try':'learning with a retry'}.</p><p class="muted">${stats.checks} puzzle checks completed · ${stats.firstTry} correct on the first try.</p><div class="actions"><button class="button secondary" data-action="home">Home</button><button class="button" data-action="${result.mode}">Next ${result.mode==='crossword'?'Crossword':'Word Search'}</button></div>`);}
function crossword(){if(puzzleLearningState(p).pending){puzzleCheck();return;}stopTimers();match=null;series=null;activeLesson=null;season=null;document.body.classList.remove('theme-halloween','theme-winter');const state=crosswordState(p);const plan=puzzlePlan(p,'crossword');puzzle=createCrossword(state.level,0,vocabularyPool(plan));puzzle.plan=plan;save();activeEntry=puzzle.entries[0];let cells='';const starts=new Map(puzzle.entries.map(e=>[e.r+','+e.c,e.number]));for(let r=0;r<puzzle.rows;r++)for(let c=0;c<puzzle.cols;c++){const key=r+','+c,cell=puzzle.cells.get(key);cells+=cell?`<label class="cross-cell" data-cell="${key}">${starts.has(key)?`<small>${starts.get(key)}</small>`:''}<input data-cross-cell="${key}" value="${state.letters[key]||''}" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" aria-label="Row ${r+1}, column ${c+1}"></label>`:'<span class="cross-block" aria-hidden="true"></span>';}openHub('Pond Crossword',`<div class="panel puzzle-stage"><h3>Nature Puzzle ${state.level}</h3><div class="tabs"><button class="button secondary" data-action="puzzle-discovery">Discovery</button><button class="button secondary" data-action="crossword-clues">Across & Down Clues</button></div><p id="crossword-current" class="current-clue"></p><div class="puzzle-board-space cross-scroll"><div class="cross-grid" style="--cross-cols:${puzzle.cols};--cross-rows:${puzzle.rows}">${cells}</div></div><div class="tabs"><button class="button secondary" data-action="crossword-hint">Give Me a Clue</button><button class="button" data-action="crossword-check">Check Puzzle</button></div><p id="crossword-feedback" aria-live="polite"></p></div>`,'rewards');selectClue(activeEntry.id,false);}
function crosswordHint(){if(!puzzle||crosswordState(p).level!==puzzle.level)return;const state=crosswordState(p),e=activeEntry||puzzle.entries[0];const index=e.word.split('').findIndex((letter,i)=>state.letters[(e.r+(e.dir==='down'?i:0))+','+(e.c+(e.dir==='across'?i:0))]!==letter);if(index<0){$('#crossword-feedback').textContent='This word is correct! Try another clue.';return;}const key=(e.r+(e.dir==='down'?index:0))+','+(e.c+(e.dir==='across'?index:0));state.letters[key]=e.word[index];const input=$(`[data-cross-cell="${key}"]`);if(input)input.value=e.word[index];save();$('#crossword-feedback').textContent=`A free letter for ${e.number} ${e.dir}: ${e.clue}`;}
function wordSearchHint(){if(!searchPuzzle||wordSearchState(p).level!==searchPuzzle.level)return;const state=wordSearchState(p),w=searchPuzzle.placements.find(w=>!state.found.includes(w.word));if(!w)return;searchStart=[w.r,w.c];paintSearch([searchStart]);const dir=w.dr===0?'horizontally':w.dc===0?'vertically':'diagonally';$('#wordsearch-feedback').textContent=`${w.word}: ${VOCABULARY.find(v=>v.word===w.word)?.clue||'Nature word'}. Start at the highlighted letter (row ${w.r+1}, column ${w.c+1}) and look ${dir}. Tap its last letter.`;}
function selectClue(id,focus=true){if(!puzzle)return;activeEntry=puzzle.entries.find(e=>e.id===id);if(!activeEntry)return;$('#crossword-current').textContent=`${activeEntry.number} ${activeEntry.dir}: ${activeEntry.clue}`;const keys=activeEntry.word.split('').map((_,i)=>(activeEntry.r+(activeEntry.dir==='down'?i:0))+','+(activeEntry.c+(activeEntry.dir==='across'?i:0)));document.querySelectorAll('.cross-cell').forEach(c=>c.classList.toggle('active',keys.includes(c.dataset.cell)));if(focus)$(`[data-cross-cell="${keys[0]}"]`)?.focus();}
function checkPuzzle(){if(!puzzle)return;const state=crosswordState(p),checks=checkCrossword(puzzle,state.letters),correct=checks.filter(x=>x.correct).length;$('#crossword-feedback').textContent=`${correct} of ${checks.length} words correct. ${correct===checks.length?'Pond puzzle complete!':'Keep exploring the clues.'}`;for(const entry of puzzle.entries){const ok=checks.find(x=>x.id===entry.id).correct;document.querySelectorAll(`[data-action="crossword-clue"][data-id="${entry.id}"]`).forEach(b=>b.classList.toggle('solved',ok));}const reward=awardCrossword(p,puzzle,state.letters);if(reward){beginPuzzleCheck(p,'crossword',puzzle);save();modal(`<div class="dance">${portrait(fighter())}</div><h2>POND PUZZLE SOLVED!</h2><p>+${reward.currency} frogs</p><p>Nature Puzzle ${reward.nextLevel} is ready.</p><div class="actions"><button class="button secondary" data-action="home">Home</button><button class="button secondary" data-action="puzzle-check">Bonus Discovery · +Frogs</button><button class="button secondary" data-action="skip-puzzle-check">Keep Playing</button></div>`);}}
document.addEventListener('input',e=>{if(e.target.id==='bank-search'){const query=e.target.value;learningBank(query);const input=$('#bank-search');input.focus();input.setSelectionRange?.(query.length,query.length);return;}const key=e.target.dataset?.crossCell;if(!key||!puzzle)return;const letter=e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(-1);e.target.value=letter;const state=crosswordState(p);if(letter)state.letters[key]=letter;else delete state.letters[key];save();if(letter&&activeEntry){const keys=activeEntry.word.split('').map((_,i)=>(activeEntry.r+(activeEntry.dir==='down'?i:0))+','+(activeEntry.c+(activeEntry.dir==='across'?i:0))),idx=keys.indexOf(key);if(idx>=0&&idx<keys.length-1)$(`[data-cross-cell="${keys[idx+1]}"]`)?.focus();}});
document.addEventListener('focusin',e=>{const key=e.target.dataset?.crossCell;if(!key||!puzzle)return;const [r,c]=key.split(',').map(Number),cell=puzzle.cells.get(key);if(!cell)return;const belongs=activeEntry&&activeEntry.word.split('').some((_,i)=>activeEntry.r+(activeEntry.dir==='down'?i:0)===r&&activeEntry.c+(activeEntry.dir==='across'?i:0)===c);if(!belongs)selectClue(cell.across??cell.down,false);});
document.addEventListener('keydown',e=>{const key=e.target.dataset?.crossCell;if(!key||!puzzle)return;let [r,c]=key.split(',').map(Number);const dirs={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};if(!dirs[e.key])return;e.preventDefault();const [dr,dc]=dirs[e.key];do{r+=dr;c+=dc;}while(r>=0&&c>=0&&r<puzzle.rows&&c<puzzle.cols&&!puzzle.cells.has(r+','+c));$(`[data-cross-cell="${r},${c}"]`)?.focus();});
window.addEventListener('pagehide',()=>{if(searchPuzzle){wordSearchState(p).found=[];save();}});
 function wordSearchStrengthChoices(state){return `<div class="wordsearch-strengths tabs" role="group" aria-label="Choose word puzzle strength">${WORD_SEARCH_STRENGTHS.map(choice=>`<button type="button" class="button secondary ${state.strength===choice.id?'selected':''}" data-action="wordsearch-strength" data-id="${choice.id}" aria-pressed="${state.strength===choice.id}">${choice.label}</button>`).join('')}</div>`;}
 function wordSearch(){
  if(puzzleLearningState(p).pending){puzzleCheck();return;}
  stopTimers();match=null;series=null;activeLesson=null;season=null;puzzle=null;searchStart=null;searchStarted=true;draggingSearch=false;document.body.classList.remove('theme-halloween','theme-winter');
  const state=wordSearchState(p),plan=puzzlePlan(p,'wordsearch'),pool=vocabularyPool(plan);
  searchPuzzle=createWordSearch(state.level,pool,state.targetCount,state.usedWords,state.strength);
  if(!searchPuzzle.words.length){
   const selectedIndex=Math.max(0,WORD_SEARCH_STRENGTHS.findIndex(choice=>choice.id===state.strength));
   for(let step=1;step<WORD_SEARCH_STRENGTHS.length;step++){
    const choice=WORD_SEARCH_STRENGTHS[(selectedIndex+step)%WORD_SEARCH_STRENGTHS.length];
    const nextPuzzle=createWordSearch(state.level,pool,choice.min,state.usedWords,choice.id);
    if(!nextPuzzle.words.length)continue;
    const previous=WORD_SEARCH_STRENGTHS[selectedIndex];state.strength=choice.id;state.targetCount=choice.min;state.found=[];searchPuzzle=nextPuzzle;save();toast(`All unused ${previous.label} words are played. Continuing at ${choice.label}.`);break;
   }
  }
  if(!searchPuzzle.words.length){
   // The four strengths span every 3-16-letter word in the 1,000-word bank.
   // If none can build a puzzle, that full bank cycle is complete on this device.
   state.usedWords=[];state.bankCycle++;state.found=[];
   searchPuzzle=createWordSearch(state.level,pool,state.targetCount,state.usedWords,state.strength);
   if(searchPuzzle.words.length){save();toast('You completed the 1,000-word list. A fresh word cycle has started.');}
  }
  if(!searchPuzzle.words.length){modal(`<h2>Word search is refreshing</h2><p>We could not build a puzzle from the saved word list. Close and reopen Nature Word Search to try again.</p><button class="button secondary wide" data-action="home">Home</button>`);return;}
  searchPuzzle.plan=plan;state.usedWords=[...new Set([...state.usedWords,...searchPuzzle.words])];state.found=[];save();
  const player=mobilePlayerAvatar();
  const playerArt=mobileAvatarImage(player.id,p.gameHairColor,p.gameBodyColor,'wordsearch-character-art');
  openHub('Nature Word Search',`<div class="wordsearch-layout">
   <section class="wordsearch-info"><h3>Puzzle ${state.level} · ${searchPuzzle.name}</h3>
    <div class="tabs"><button class="button secondary" data-action="puzzle-discovery">Discovery</button><button class="button secondary" data-action="search-words">Words</button><button class="button secondary" data-action="wordsearch-hint">Clue</button></div>
    <p id="wordsearch-feedback" aria-live="polite">Drag from the first to the last letter of each word. Find ${searchPuzzle.words.length} nature words.</p>${wordSearchStrengthChoices(state)}
   </section>
   <div class="wordsearch-play-area">
    <div class="wordsearch-character wordsearch-player-character">${playerArt}</div>
    <div class="puzzle-board-space search-scroll"><div id="wordsearch-grid" class="search-grid" style="--search-size:${searchPuzzle.size};--search-rows:${searchPuzzle.rows}" aria-label="Word search letter grid">${searchPuzzle.grid.map((row,r)=>row.map((letter,c)=>`<button type="button" class="search-cell" data-action="search-cell" data-row="${r}" data-col="${c}" aria-label="Row ${r+1}, column ${c+1}: ${letter}">${letter}</button>`).join('')).join('')}</div></div>
    <aside class="wordsearch-checklist"><h3 class="wordsearch-list-heading">Find These Words:</h3><div id="wordsearch-words" class="search-words" aria-label="Words to find"></div></aside>
   </div>
  </div>`,'rewards');
  paintSearch();
 }
 function paintSearch(highlight=[]){
 if(!searchPuzzle)return;
 const state=wordSearchState(p),keys=new Set(highlight.map(([r,c])=>r+','+c)),foundCells=new Set();
 searchPuzzle.placements.filter(x=>state.found.includes(x.word)).forEach(x=>x.word.split('').forEach((_,i)=>foundCells.add((x.r+x.dr*i)+','+(x.c+x.dc*i))));
 document.querySelectorAll('.search-cell').forEach(b=>{const key=b.dataset.row+','+b.dataset.col;b.classList.toggle('found',foundCells.has(key));b.classList.toggle('selecting',keys.has(key));});
 const list=$('#wordsearch-words');if(list)list.innerHTML=searchPuzzle.words.map(w=>`<span class="word-target ${state.found.includes(w)?'found':''}"><b>${w}</b></span>`).join('');
}function wordSearchSplash(end){
 const cell=document.querySelector(`.search-cell[data-row="${end[0]}"][data-col="${end[1]}"]`);
 const grid=document.getElementById('wordsearch-grid');
 if(!cell||!grid)return;
 const bounds=grid.getBoundingClientRect(),rect=cell.getBoundingClientRect();
 const splash=document.createElement('span');splash.className='wordsearch-splash';splash.setAttribute('aria-hidden','true');
 splash.style.left=(rect.left+bounds.left*-1+rect.width/2)+'px';
 splash.style.top=(rect.top-bounds.top+rect.height/2)+'px';
 splash.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';
 grid.appendChild(splash);
 setTimeout(()=>splash.remove(),700);
}
function completeSearchSelection(end){if(!searchPuzzle||!searchStart)return;const word=wordFromSelection(searchPuzzle,searchStart,end);searchStart=null;const state=wordSearchState(p);if(!word){paintSearch();$('#wordsearch-feedback').textContent='That is not one of the hidden words. Try another straight line.';return;}if(state.found.includes(word)){$('#wordsearch-feedback').textContent=`${word} is already found.`;paintSearch();return;}state.found.push(word);wordSearchSplash(end);playCorrect();save();paintSearch();$('#wordsearch-feedback').textContent=`${word} found! ${VOCABULARY.find(v=>v.word===word)?.clue||''} ${state.found.length} / ${searchPuzzle.words.length} words.`;const reward=awardWordSearch(p,searchPuzzle);if(reward){beginPuzzleCheck(p,'wordsearch',searchPuzzle);save();const next=wordSearchDifficulty(reward.nextLevel);modal(`<div class="dance">${portrait(fighter())}</div><h2>NATURE WORDS FOUND!</h2><p>+${reward.currency} frogs</p><p>Next: Puzzle ${reward.nextLevel} · ${next.name}<br>${next.size} × ${next.size} · ${next.count} words</p><div class="actions"><button class="button secondary" data-action="home">Home</button><button class="button" data-action="wordsearch-again">Play Again</button><button class="button secondary" data-action="puzzle-check">Bonus Discovery · +Frogs</button><button class="button secondary" data-action="skip-puzzle-check">Keep Playing</button></div>`);}}
/* Pointer Events support mouse, pen and iPhone finger dragging across cells. */
let searchPointerId=null;
function searchCellAt(x,y){return document.elementFromPoint(x,y)?.closest?.('.search-cell')||null;}
document.addEventListener('pointerdown',e=>{
 const cell=e.target.closest?.('.search-cell');
 if(!cell||!searchPuzzle||!searchStarted||(e.pointerType==='mouse'&&e.button!==0))return;
 // Prevent iOS from scrolling or moving focus when the player starts a word drag.
 if(e.cancelable)e.preventDefault();
 searchPointerId=e.pointerId;
 draggingSearch=true;searchDragged=false;
 searchDragEnd=[Number(cell.dataset.row),Number(cell.dataset.col)];
 searchStart=[...searchDragEnd];paintSearch([searchStart]);
});
document.addEventListener('pointermove',e=>{
 if(!draggingSearch||!searchPuzzle||e.pointerId!==searchPointerId)return;
 if(e.cancelable)e.preventDefault();
 const cell=searchCellAt(e.clientX,e.clientY);
 if(!cell||!document.getElementById('wordsearch-grid')?.contains(cell))return;
 const end=[Number(cell.dataset.row),Number(cell.dataset.col)];
 if(end[0]!==searchStart[0]||end[1]!==searchStart[1])searchDragged=true;
 searchDragEnd=end;
 paintSearch(selectionPath(searchPuzzle,searchStart,end));
});
document.addEventListener('pointerup',e=>{
 if(!draggingSearch||e.pointerId!==searchPointerId)return;
 draggingSearch=false;searchPointerId=null;
 const cell=searchCellAt(e.clientX,e.clientY);
 if(cell&&document.getElementById('wordsearch-grid')?.contains(cell)){
  const end=[Number(cell.dataset.row),Number(cell.dataset.col)];
  if(end[0]!==searchStart[0]||end[1]!==searchStart[1]){searchDragged=true;searchDragEnd=end;}
 }
 if(searchDragged){
  completeSearchSelection(searchDragEnd);
 }else{
  searchStart=null;
  paintSearch();
 }
});
document.addEventListener('pointercancel',e=>{
 if(!draggingSearch||e.pointerId!==searchPointerId)return;
 draggingSearch=false;searchPointerId=null;searchStart=null;paintSearch();
});
function settings(){modal(`<h2>Pond Settings</h2><button class="button secondary wide" data-action="account">Account & Cloud Save</button><p class="muted" id="account-status">${window.frogAccountStatus||'Saved on this device'}</p><label class="switch-row">Pond background sounds<input type="checkbox" id="music-setting" ${p.settings.music!==false?'checked':''}></label><label class="switch-row">Frog sounds<input type="checkbox" id="sound-setting" ${p.settings.sound?'checked':''}></label><label class="switch-row">Celebration movement<input type="checkbox" id="motion-setting" ${p.settings.motion?'checked':''}></label><p class="muted">Progress saves on this device. Your original game and Turning Point backups are separate.</p><div class="actions"><button class="button" data-action="save-settings">Done</button></div>`);}
function startMusic(){startAmbience();}
function stopMusic(){audio?.pause();audioStarted=false;}
function stopCountdownVoice(){if(voiceFrame!==null)window.cancelAnimationFrame?.(voiceFrame);voiceFrame=null;clearTimeout(voiceWatchdog);timers.delete(voiceWatchdog);voiceWatchdog=null;if(countdownAudio){countdownAudio.onplaying=countdownAudio.ontimeupdate=countdownAudio.onended=countdownAudio.onerror=null;countdownAudio.pause();countdownAudio.currentTime=0;}if(audio)audio.volume=.2;}
function playCountdownVoice(){
 if(!p.settings.sound){later(()=>countdown(2),1335);return;}
 countdownAudio ||= new Audio('assets/countdown-voice.mp3');countdownAudio.preload='auto';countdownAudio.currentTime=0;countdownAudio.volume=.9;if(audio)audio.volume=.07;
 const currentEpoch=epoch,round=match;let voiceStarted=false,failed=false;
 const valid=()=>epoch===currentEpoch&&match===round&&$('#modal').open&&!!$('#modal-content .count');
 const paint=()=>{if(!valid())return;const t=countdownAudio.currentTime||0;$('#modal-content .count').textContent=t>=3.768?'GO!':t>=2.416?'1':t>=1.335?'2':'3';};
 const frame=()=>{paint();if(valid()&&voiceStarted&&window.requestAnimationFrame)voiceFrame=window.requestAnimationFrame(frame);};
 const fallback=()=>{if(!valid()||failed)return;failed=true;stopCountdownVoice();countdown(2);};
 countdownAudio.ontimeupdate=paint;
 countdownAudio.onplaying=()=>{if(!valid())return;voiceStarted=true;clearTimeout(voiceWatchdog);timers.delete(voiceWatchdog);voiceWatchdog=null;paint();if(voiceFrame===null&&window.requestAnimationFrame)voiceFrame=window.requestAnimationFrame(frame);};
 countdownAudio.onended=()=>{if(valid()){paint();beginCountdownGame();}};
 countdownAudio.onerror=fallback;
 voiceWatchdog=later(()=>{if(!voiceStarted)fallback();},6000);
 countdownAudio.play().catch(fallback);
}


function startAmbience(){if(document.hidden||p.settings.music===false)return;if(!audio){audio=new Audio('assets/pond-croak.mp3');audio.loop=true;audio.volume=.2;}if(!audioStarted){audio.play().then(()=>audioStarted=true).catch(()=>{});}}
function playCorrect(){if(!p.settings.sound)return;const a=new Audio('assets/happy-frog.mp3');a.playbackRate=2;a.volume=.65;a.play().catch(()=>{});}
function leave(){if(match?.lock){toast('Let these cards finish first.');return;}if(match&&!match.done){modal('<h2>Leave this match?</h2><p>This round will end. Your earned frogs and completed rewards stay saved. The next game starts fresh with a new rival.</p><div class="actions"><button class="button secondary" data-action="stay">Keep playing</button><button class="button" data-action="home">Leave match</button></div>');clearInterval(tick);}else home();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;startAmbience();const a=b.dataset.action,id=b.dataset.id;if(a==='shop')frogShop();else if(a==='account'){dismiss();window.openFrogAccount?.();}else if(a==='home')home();else if(a==='explore')explore();else if(a==='brain-menu')brainMenu();else if(a==='brain-mode'){if(id==='numbers')window.location.assign('./froggy-v77/index.html');else if(id==='follow')startFollowWithVoice();else{brain.mode=id;brainRound();}}else if(a==='brain-level'){brainClear();brain.level=id;brainRound();}else if(a==='brain-again')brainRound();else if(a==='brain-card')brainCard(Number(id));else if(a==='brain-number'){if(Number(id)===brain.answer)brainWin('Number pattern solved!');else{const hint=document.getElementById('brain-hint');if(hint)hint.textContent='Not quite. Try another number.';}}else if(a==='brain-find')brainFind(Number(id));else if(a==='brain-pad')brainPad(Number(id));else if(a==='cycle'){dismiss();lifeCycle();}else if(a==='cycle-stage')cycleStage(Number(b.dataset.index));else if(a==='healthy-pond')healthyPond();else if(a==='puzzle-check')puzzleCheck();else if(a==='skip-puzzle-check'){const mode=puzzleLearningState(p).pending?.mode;if(mode){p.puzzleLearning.pending=null;save();dismiss();mode==='crossword'?crossword():wordSearch();}}else if(a==='learning-pace'){if(['gentle','explore','challenge'].includes(id)){p.settings.learning=id;save();explore();}}else if(a==='close-reading')dismiss();else if(a==='puzzle-discovery'){const game=puzzle||searchPuzzle;if(game)modal(puzzleDiscovery(game.entries?game.entries.map(e=>e.word):game.words,game.plan)+'<div class="actions"><button class="button" data-action="close-reading">Back to Puzzle</button></div>');}else if(a==='crossword-clues'){if(puzzle)modal('<h2>Across & Down Clues</h2><div class="cross-clues">'+puzzle.entries.map(e=>`<button data-action="crossword-clue" data-id="${e.id}">${e.number} ${e.dir}: ${e.clue} (${e.word.length})</button>`).join('')+'</div><button class="button secondary wide" data-action="close-reading">Back to Puzzle</button>');}else if(a==='search-words'){modal('<h2>Nature Words</h2><div class="search-words">'+$('#wordsearch-words').innerHTML+'</div><button class="button secondary wide" data-action="close-reading">Back to Puzzle</button>');}else if(a==='crossword-hint')crosswordHint();else if(a==='wordsearch-hint')wordSearchHint();else if(a==='puzzle-answer')puzzleAnswer(Number(b.dataset.index));else if(a==='wordsearch'){dismiss();wordSearch();}else if(a==='search-cell'){/* Dragging handles word selection; taps do nothing. */}else if(a==='bank'){dismiss();learningBank();}else if(a==='collection-next')fighters(collectionPage+1);else if(a==='collection-prev')fighters(collectionPage-1);else if(a==='crossword'){dismiss();crossword();}else if(a==='crossword-clue'){dismiss();selectClue(Number(id));}else if(a==='crossword-check')checkPuzzle();else if(a==='fighters')fighters();else if(a==='boutique')boutique();else if(a==='boutique-gender'){boutiqueGender=id==='boy'?'boy':'girl';p.fashionGender=boutiqueGender;fashionTryOn={};fashionSelection='';save();boutique();}else if(a==='boutique-department')return;else if(a==='try-fashion'){const item=FASHION_ITEMS.find(x=>x.id===id);if(!item)return;const slot=item.kind==='outfit'?'outfit':item.kind==='top'?'top':item.kind==='bottom'?'bottom':item.kind==='shoes'?'shoes':item.kind==='hair'?'hair':'accessory';if(item.kind==='outfit'){fashionTryOn={outfit:id};}else{fashionTryOn[slot]=id;}boutique();toast(item.name+' selected.');}else if(a==='reset-fashion-preview'){fashionTryOn={};boutique();}else if(a==='buy-fashion'){const item=FASHION_ITEMS.find(x=>x.id===id);if(!item)return;const f=fashionState();if(f.unlocked.includes(id))return;if(p.bank<item.price){toast('You need more Froggy Dough for this piece.');return;}p.bank-=item.price;f.unlocked.push(id);(FASHION_OUTFIT_PARTS[id]||[]).forEach(part=>{if(!f.unlocked.includes(part))f.unlocked.push(part);});save();boutique();toast(item.name+' unlocked! Matching pieces are included.');}else if(a==='wear-fashion'){const item=FASHION_ITEMS.find(x=>x.id===id);if(!item)return;const f=fashionState();if(!f.unlocked.includes(id))return;const slot=item.kind==='outfit'?'outfit':item.kind==='top'?'top':item.kind==='bottom'?'bottom':item.kind==='shoes'?'shoes':item.kind==='hair'?'hair':'accessory';if(item.kind==='outfit'){f.equipped.outfit=id;f.equipped.top='';f.equipped.bottom='';}else{f.equipped.outfit='';f.equipped[slot]=id;}delete fashionTryOn[slot];if(item.kind==='outfit'){delete fashionTryOn.top;delete fashionTryOn.bottom;}save();boutique();}else if(a==='powers')powers();else if(a==='rewards')rewards();else if(a==='records')rewards('records');else if(a==='holidays')rewards('holiday');else if(a==='leagues'||a==='journey'){dismiss();leagues();}else if(a==='learn-next'){dismiss();learn();}else if(a==='learn-chapter'){dismiss();const ls=LESSONS.filter(l=>l.chapter===Number(id));learn((ls.find(l=>!journeyState(p).learned.includes(l.id))||ls[0]).id);}else if(a==='learning-answer')learningAnswer(Number(b.dataset.index));else if(a==='learning-check')learningCheck();else if(a==='matching')modal('<h2>Matching Game</h2><p>Choose how you want to play.</p><button class="button wide" data-action="play">⚔️ Rival Play</button><button class="button blue wide" data-action="practice">🐸 Solo Play · No timer</button><div class="tabs"><button class="button secondary" data-action="fighters">Froggy Fashion Boutique</button><button class="button secondary" data-action="powers">Pick Your Super Powers</button></div><button class="button secondary wide" data-action="home">Home</button>');else if(a==='play')chooseMode('rival');else if(a==='practice')chooseMode('solo');else if(a==='championship')chooseMode('rival',id);else if(a==='start')begin(id);else if(a==='cancel-start'){dismiss();season=null;document.body.classList.remove('theme-halloween','theme-winter');}else if(a==='card'&&match)select(Number(b.dataset.index));else if(a==='match-powers')matchPowers();else if(a==='use-power'){if($('#modal').open){dismiss();startTurn(seconds);}usePower(id);}else if(a==='choose-fighter'){const f=FIGHTERS.find(x=>x.id===id);if(!p.owned.includes(id)){if(f.unlock||!collectionPageUnlocked(p,FIGHTERS,Math.floor(FIGHTERS.indexOf(f)/9))||p.bank<f.price){toast('Earn more frogs to unlock this fighter.');return;}p.bank-=f.price;p.owned.push(id);}p.selected=id;save();fighters();}else if(a==='buy-power'){const f=POWERS.find(x=>x.id===id);if(p.bank<f.price)return;p.bank-=f.price;p.inventory[id]=(p.inventory[id]||0)+1;save();powers();toast(`${f.name} added to your powers!`);}else if(a==='rematch'||a==='again'){dismiss();newRound();}else if(a==='new-series'){dismiss();chooseMode('rival',season);}else if(a==='settings')settings();else if(a==='save-settings'){p.settings.music=$('#music-setting').checked;p.settings.sound=$('#sound-setting').checked;if(!p.settings.music)stopMusic();else startMusic();p.settings.motion=$('#motion-setting').checked;if(!p.settings.music){audio?.pause();audioStarted=false;}save();dismiss();}else if(a==='leave')leave();else if(a==='stay'){dismiss();startTurn(seconds);}else if(a==='rules'){if(match?.lock){toast('Let these cards finish first.');return;}clearInterval(tick);modal('<h2>How To Play</h2><p>Flip two cards to find a pair. A matching pair earns one point and another turn. Mismatched cards stay open for two seconds.</p><p>Rival turns last 15 seconds. First to win two rounds wins the showdown. Tied rounds replay.</p><p>Solo Play has no opponent and no timer. Powers come from the shop and can be used on your turn.</p><div class="actions"><button class="button" data-action="stay">Back to game</button></div>');}});
$('#modal').addEventListener('cancel',e=>{e.preventDefault();if($('#modal-content .count'))return;if(searchPuzzle&&wordSearchState(p).level!==searchPuzzle.level){dismiss();wordSearch();return;}if(puzzle&&crosswordState(p).level!==puzzle.level){dismiss();crossword();return;}if(match&&!match.done){dismiss();startTurn();}else if(match?.done)home();else{dismiss();season=null;document.body.classList.remove('theme-halloween','theme-winter');}});
document.addEventListener('pointerdown',()=>{startAmbience();},{passive:true});
document.addEventListener('keydown',()=>{startAmbience();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();audio?.pause();audioStarted=false;if(match&&!match.done){home();toast('Your next match will start fresh.');}}});
addEventListener('pageshow',e=>{if(e.persisted)home();});addEventListener('resize',()=>{if(match)renderBoard();});
/* Remove obsolete home navigation from older cached HTML as well. */
document.querySelectorAll('.game-bubbles button[data-action="explore"],.game-bubbles button').forEach(button=>{
  if(button.dataset.action==='explore'||button.textContent.trim().toLowerCase()==='pond games')button.remove();
});
sync();show('home');welcomeGift();if(new URLSearchParams(location.search).get('open')==='brain'){setTimeout(()=>brainMenu(),250);}

addEventListener('frog-account-profile',e=>{profileKey=e.detail.key;p=loadProfile(JSON.stringify(e.detail.profile));home();welcomeGift();if(new URLSearchParams(location.search).get('open')==='brain')setTimeout(brainMenu,350);});

window.openFroggyBrainGames=brainMenu;
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');if(!button)return;
 const {action,id}=button.dataset;
 if(action==='wordsearch-again'){p.puzzleLearning.pending=null;save();dismiss();wordSearch();return;}
 if(action==='wordsearch-strength'){if(selectWordSearchStrength(p,id)){save();wordSearch();}return;}
 if(action==='customize-game-avatar'){openGameAvatarSetup(id||null,button.dataset.season||null);return;}
 if(action==='use-reward-continue'){continueRivalSeries();return;}
 if(action==='watch-continue-ad'){requestRewardedContinueAd();return;}
 if(action==='choose-game-hair'){if(!MOBILE_HAIR_COLORS.some(color=>color.id===id))return;p.gameHairColor=id;save();renderGameAvatarSetup();return;}
 if(action==='choose-game-body'){if(!MOBILE_BODY_COLORS.some(color=>color.id===id))return;p.gameBodyColor=id;save();renderGameAvatarSetup();return;}
 if(action==='choose-game-avatar'){if(!MOBILE_AVATARS.some(avatar=>avatar.id===id))return;p.gameAvatarId=id;save();renderGameAvatarSetup();return;}
 if(action==='next-game-avatar'){if(gameAvatarFlow.step<3){gameAvatarFlow.step++;renderGameAvatarSetup();}else completeGameAvatarSetup();return;}
 if(action==='back-game-avatar'){if(gameAvatarFlow.step>1){gameAvatarFlow.step--;renderGameAvatarSetup();}else home();return;}
 if(action==='cancel-game-avatar'){gameAvatarFlow={step:1,pendingMode:null,pendingSeason:null};home();return;}
 if(action==='boutique-gender'){fashionTryOn={};fashionSelection='';return;}
 if(action==='purchase-boutique-hair-color'){const option=BOUTIQUE_HAIR_COLORS.find(color=>color.id===id);if(!option)return;p.hairColorsOwned||=['blonde'];if(!p.hairColorsOwned.includes(option.id)){if(p.bank<option.price){toast('You need '+(option.price-p.bank)+' more Froggy Dough for '+option.name+' hair.');return;}p.bank-=option.price;p.hairColorsOwned.push(option.id);}p.gameHairColor=option.id;boutiqueHairPreviewColor=null;save();boutique();toast(option.name+' hair is saved for every game.');return;}
 if(action==='boutique-department')return;
 if(action==='preview-boutique-hair'){
  if(!MOBILE_HAIR_COLORS.some(color=>color.id===id))return;
  boutiqueHairPreviewColor=id;boutique();return;
 }
 if(action==='apply-boutique-hair'){
  const color=MOBILE_HAIR_COLORS.find(entry=>entry.id===boutiqueHairPreviewColor);if(!color)return;
  p.gameHairColor=color.id;boutiqueHairPreviewColor=null;save();boutique();toast(color.name+' hair is saved for every game.');return;
 }
 if(action==='preview-boutique-body'){
  if(!MOBILE_BODY_COLORS.some(color=>color.id===id))return;
  boutiqueBodyPreviewColor=id;boutique();return;
 }
 if(action==='apply-boutique-body'){
  const color=MOBILE_BODY_COLORS.find(entry=>entry.id===boutiqueBodyPreviewColor);if(!color)return;
  p.gameBodyColor=color.id;boutiqueBodyPreviewColor=null;save();boutique();toast(color.name+' frog color is saved for every game.');return;
 }
 if(action==='choose-boutique-avatar'){
  const itemGender=button.dataset.gender||'girl';
  const item=FASHION_ITEMS.find(entry=>entry.id===id&&(entry.gender||'girl')===itemGender&&entry.kind==='outfit');if(!item||!MOBILE_AVATARS.some(avatar=>avatar.id===item.id))return;
  const f=fashionState(itemGender),wasOwned=f.unlocked.includes(item.id),wasSelected=p.gameAvatarId===item.id;
  if(!wasOwned&&!wasSelected){if(p.bank<item.price){toast('You need '+item.price+' Froggy Dough for '+item.name+'.');return;}p.bank-=item.price;f.unlocked.push(item.id);(FASHION_OUTFIT_PARTS[item.id]||[]).forEach(part=>{if(!f.unlocked.includes(part))f.unlocked.push(part);});}
  f.equipped.outfit=item.id;f.equipped.top='';f.equipped.bottom='';
  boutiqueGender=itemGender;p.fashionGender=itemGender;p.gameAvatarId=item.id;p.gameAvatarSetupComplete=true;
  fashionSelection=item.id;fashionTryOn={};boutiqueHairPreviewColor=null;boutiqueBodyPreviewColor=null;save();
  const launch=pendingGameLaunch;pendingGameLaunch=null;
  if(launch){chooseMode(launch.mode,launch.season);return;}
  boutique();toast(wasOwned||wasSelected?item.name+' is now your player frog in every game.':item.name+' purchased for '+item.price+' Froggy Dough and selected for every game.');return;
 } if(action==='select-boutique-piece'){
  const itemGender=button.dataset.gender||'girl';
  const item=FASHION_ITEMS.find(entry=>entry.id===id&&(entry.gender||'girl')===itemGender);if(!item)return;
   boutiqueGender=itemGender;p.fashionGender=itemGender;fashionSelection=item.id;
   const f=fashionState(itemGender);
   if(!f.unlocked.includes(item.id)){
    if(p.bank<item.price){toast('You need '+(item.price-p.bank)+' more Froggy Dough for '+item.name+'.');boutique();return;}
    p.bank-=item.price;f.unlocked.push(item.id);
    (FASHION_OUTFIT_PARTS[item.id]||[]).forEach(part=>{if(!f.unlocked.includes(part))f.unlocked.push(part);});
   }
   if(item.kind==='outfit'){f.equipped.outfit=item.id;f.equipped.top='';f.equipped.bottom='';}
   else{f.equipped.outfit='';f.equipped[fashionSlot(item)]=item.id;if(item.kind==='hair')p.gameHairColor='blonde';}
   fashionTryOn={};save();boutique();toast(item.name+' is ready to wear!');return;
 }
 if(action==='preview-boutique-piece'){
  const item=FASHION_ITEMS.find(entry=>entry.id===fashionSelection&&(entry.gender||'girl')===boutiqueGender);if(!item)return;
  if(item.kind==='outfit')fashionTryOn={outfit:item.id};else fashionTryOn[fashionSlot(item)]=item.id;
  boutique();toast('Trying on '+item.name+'.');return;
 }
 if(action==='purchase-selected-fashion'){
  const item=FASHION_ITEMS.find(entry=>entry.id===fashionSelection&&(entry.gender||'girl')===boutiqueGender);if(!item)return;
  const f=fashionState();
  if(!f.unlocked.includes(item.id)){
   if(p.bank<item.price){toast('You need more Froggy Dough for this piece.');return;}
   p.bank-=item.price;f.unlocked.push(item.id);
   (FASHION_OUTFIT_PARTS[item.id]||[]).forEach(part=>{if(!f.unlocked.includes(part))f.unlocked.push(part);});
  }
  if(item.kind==='outfit'){f.equipped.outfit=item.id;f.equipped.top='';f.equipped.bottom='';}
  else{f.equipped.outfit='';f.equipped[fashionSlot(item)]=item.id;}
  fashionTryOn={};save();boutique();toast(item.name+' is ready to wear!');return;
 }
 if(action==='clear-fashion-look'){fashionTryOn={};boutique();}
},true);
document.addEventListener('click',event=>{
 const button=event.target?.closest?.('.boutique-view-switch [data-action="boutique-department"]');
 if(!button||button.disabled)return;
 const category=button.dataset.id;
 if(!['Outfits','Shoes','Accessories','Hair Color'].includes(category)||category===boutiqueCategory)return;
 event.preventDefault();
 boutiqueCategory=category;
 boutique();
});
window.frogReading=html=>modal(html+'<div class="actions"><button class="button" data-action="close-reading">Back</button></div>');
