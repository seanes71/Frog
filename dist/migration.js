import {freshProfile,loadProfile,STAGES,FIGHTERS,POWERS} from './engine.js?v=mobile-1';
export const MOBILE_KEY='frog-showdown-mobile-v2';
export function migrateLegacy(data={}){
 if(data.frogShowdownV2)return loadProfile(typeof data.frogShowdownV2==='string'?data.frogShowdownV2:JSON.stringify(data.frogShowdownV2));
 const p=freshProfile(),number=(v,fallback=0)=>Number.isFinite(Number(v))&&Number(v)>=0?Math.floor(Number(v)):fallback;
 const parse=(v,fallback)=>{try{return typeof v==='string'?JSON.parse(v):v??fallback;}catch{return fallback;}};
 p.bank=number(data.frogBank,20);p.wins=number(data.frogWins);const owned=parse(data.frogColors,['green']);p.owned=[...new Set(['green',...(Array.isArray(owned)?owned:[]).map(id=>id==='golden'?'gold':id).filter(id=>FIGHTERS.some(f=>f.id===id))])];const selected=data.frogSelected==='golden'?'gold':data.frogSelected;p.selected=p.owned.includes(selected)?selected:'green';const old=String(data.frogDifficulty||'easy'),names=['easy','medium','hard','extreme','master','legend','champion','ultimate'];const index=names.includes(old)?names.indexOf(old):/^\d$/.test(old)?Math.min(7,Number(old)):0;p.stage=STAGES[index];p.records.cards=p.wins?p.stage:0;const inv=parse(data.frogPowerInventory,{});for(const power of POWERS)p.inventory[power.id]=number(inv?.[power.id]);return p;
}
export function deviceProfile(storage){const existing=storage.getItem(MOBILE_KEY);if(existing)return loadProfile(existing);const data={};for(const k of ['frogBank','frogWins','frogColors','frogSelected','frogDifficulty','frogPowerInventory']){const value=storage.getItem(k);if(value!==null)data[k]=value;}return migrateLegacy(data);}
