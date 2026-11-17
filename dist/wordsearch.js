import {WORDS} from './crossword.js?v=mobile-1';
import {WORD_SEARCH_BANK} from './wordsearch-bank.js?v=owner-word-bank-1';
function seeded(n){let x=n>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function wordSearchDifficulty(level=1,targetCount=null){
 const count=Math.max(5,Math.min(20,Math.floor(Number(targetCount??Math.min(4+level,20))||5)));
 return difficultyForCount(count);
}
export const WORD_SEARCH_STRENGTHS=[
 {id:'5-7',label:'5–7',min:5,max:7,maxWordLength:5},
 {id:'7-10',label:'7–10',min:7,max:10,maxWordLength:7},
 {id:'10-17',label:'10–17',min:10,max:17,maxWordLength:9},
 {id:'17-20',label:'17–20',min:17,max:20,maxWordLength:16},
];
function difficultyForCount(count){
 // Begin with the compact 9x9 board, then grow toward the full 17x15 board.
 const progress=Math.max(0,Math.min(15,Math.floor(Number(count)||5)-5));
 const size=9+Math.floor(progress*8/15);
 const rows=9+Math.floor(progress*6/15);
 const dirs=count<=7?[[0,1],[1,0],[1,1]]:count<=10?[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0]]:[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
 return {size,rows,count,dirs,name:count<=7?'Pond Beginner':count<=10?'Reed Explorer':'Nature Navigator',instructions:'Drag across each word to find it.'};
}
const EASY_WORDS=['FROG','POND','LILY','LEAF','FISH','DUCK','EGG','RAIN','REED','TOAD','MOSS','ROCK','TREE','BIRD','BUG','FLY','SEED','WATER','GREEN','GRASS','SNAIL','SHELL','MUD','SUN','NEST','WING','ROOT','BLOOM','STEM','RIVER'].map(w=>[w,'Nature word',0,0]);
export function wordSearchState(p){
 const state=p.wordSearch||=( {level:1,found:[]} );
 state.level=Math.max(1,Math.floor(Number(state.level)||1));
 state.usedWords=Array.isArray(state.usedWords)?[...new Set(state.usedWords.map(x=>String(x).trim().toUpperCase()).filter(Boolean))]:[];
 state.bankCycle=Math.max(0,Math.floor(Number(state.bankCycle)||0));
 const usedSet=new Set(state.usedWords);
 if(WORD_SEARCH_BANK.every(word=>usedSet.has(word))){state.usedWords=[];state.bankCycle++;}
 if(!Number.isInteger(state.targetCount))state.targetCount=Math.min(state.level+4,20);
 if(!WORD_SEARCH_STRENGTHS.some(x=>x.id===state.strength))state.strength=(WORD_SEARCH_STRENGTHS.find(x=>state.targetCount>=x.min&&state.targetCount<=x.max)||WORD_SEARCH_STRENGTHS[0]).id;
 const selected=WORD_SEARCH_STRENGTHS.find(x=>x.id===state.strength)||WORD_SEARCH_STRENGTHS[0];
 state.targetCount=Math.max(selected.min,Math.min(selected.max,Math.floor(Number(state.targetCount)||selected.min)));
 return state;
}
export function selectWordSearchStrength(profile,id){
 const selected=WORD_SEARCH_STRENGTHS.find(x=>x.id===id);
 if(!selected)return false;
 const state=wordSearchState(profile);
 state.strength=selected.id;state.targetCount=selected.min;state.found=[];delete state.plan;
 return true;
}
export function createWordSearch(level=1,wordPool=WORDS,targetCount=null,usedWords=[],strengthId='5-7'){
 const d=wordSearchDifficulty(level,targetCount),rng=seeded(level*13007+173);
 const grid=Array.from({length:d.rows},()=>Array(d.size).fill(''));
 const source=[...EASY_WORDS,...WORD_SEARCH_BANK.map(w=>[w,'Nature word',0,0]),...(wordPool||WORDS)];
 const maxWordLength=WORD_SEARCH_STRENGTHS.find(x=>x.id===strengthId)?.maxWordLength||5;
 const pool=shuffle(source.filter(x=>x[0].length>=3&&x[0].length<=Math.min(d.size,maxWordLength)),rng).sort((a,b)=>(a[3]||0)-(b[3]||0)).map(x=>x[0]).filter((w,i,a)=>a.indexOf(w)===i);
 const used=new Set((usedWords||[]).map(w=>String(w).toUpperCase()));
 const words=pool.filter(w=>!used.has(w));
 const placed=[];
 for(const word of words){
  const candidates=[];
  for(let r=0;r<d.rows;r++)for(let c=0;c<d.size;c++)for(const [dr,dc] of d.dirs){
   const er=r+dr*(word.length-1),ec=c+dc*(word.length-1);
   if(er<0||ec<0||er>=d.rows||ec>=d.size)continue;
   let ok=true,cross=0;
   for(let i=0;i<word.length;i++){const old=grid[r+dr*i][c+dc*i];if(old&&old!==word[i]){ok=false;break;}if(old)cross++;}
   if(ok)candidates.push({r,c,dr,dc,cross});
  }
  if(!candidates.length)continue;
  shuffle(candidates,rng);
  const leastOverlap=Math.min(...candidates.map(x=>x.cross));
  const leastOverlapCandidates=candidates.filter(x=>x.cross===leastOverlap);
  const bounds=()=>{let minR=Infinity,minC=Infinity,maxR=-Infinity,maxC=-Infinity;for(let r=0;r<d.rows;r++)for(let c=0;c<d.size;c++)if(grid[r][c]){minR=Math.min(minR,r);minC=Math.min(minC,c);maxR=Math.max(maxR,r);maxC=Math.max(maxC,c);}return minR===Infinity?null:{minR,minC,maxR,maxC};};
  const occupied=bounds();
  const spread=entry=>{const endR=entry.r+entry.dr*(word.length-1),endC=entry.c+entry.dc*(word.length-1);if(!occupied)return 0;const minR=Math.min(occupied.minR,entry.r,endR),minC=Math.min(occupied.minC,entry.c,endC),maxR=Math.max(occupied.maxR,entry.r,endR),maxC=Math.max(occupied.maxC,entry.c,endC);return (maxR-minR+1)*(maxC-minC+1);};
  const mostSpread=Math.max(...leastOverlapCandidates.map(spread));
  const best=leastOverlapCandidates.find(x=>spread(x)===mostSpread);
  for(let i=0;i<word.length;i++)grid[best.r+best.dr*i][best.c+best.dc*i]=word[i];
  placed.push({word,...best});
  if(placed.length===d.count)break;
 }
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 for(let r=0;r<d.rows;r++)for(let c=0;c<d.size;c++)if(!grid[r][c])grid[r][c]=alphabet[Math.floor(rng()*alphabet.length)];
 return {level,...d,grid,words:placed.map(x=>x.word),placements:placed};
}
export function selectionPath(puzzle,start,end){
 if(!start||!end)return [];
 const [r,c]=start,[er,ec]=end,rows=puzzle.rows??puzzle.size,cols=puzzle.cols??puzzle.size;
 if(![r,c,er,ec].every(Number.isInteger)||r<0||er<0||r>=rows||er>=rows||c<0||ec<0||c>=cols||ec>=cols)return [];
 const dy=er-r,dx=ec-c;
 if(dy!==0&&dx!==0&&Math.abs(dy)!==Math.abs(dx))return [];
 const len=Math.max(Math.abs(dy),Math.abs(dx))+1;
 if(len<2)return [];
 return Array.from({length:len},(_,i)=>[r+Math.sign(dy)*i,c+Math.sign(dx)*i]);
}
export function wordFromSelection(puzzle,start,end){const path=selectionPath(puzzle,start,end);if(!path.length)return null;const word=path.map(([r,c])=>puzzle.grid[r][c]).join(''),reverse=word.split('').reverse().join('');return puzzle.words.includes(word)?word:puzzle.words.includes(reverse)?reverse:null;}
export function awardWordSearch(p,puzzle){const state=wordSearchState(p);if(state.level!==puzzle.level||!puzzle.words.every(w=>state.found.includes(w)))return null;const currency={'5-7':1,'7-10':2,'10-17':3,'17-20':5}[state.strength]||1;p.bank+=currency;state.level++;state.targetCount=Math.min(WORD_SEARCH_STRENGTHS.find(x=>x.id===state.strength).max,state.targetCount+1);state.found=[];delete state.plan;return {currency,nextLevel:state.level};}
