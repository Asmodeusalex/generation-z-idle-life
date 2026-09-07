import {CONFIG,SKILLS,JOBS,ITEMS} from '../data/config.js';
import {freshState,clamp,round,advance,registerOffline} from './game.js';
import {sanitizeProfile} from '../systems/profile.js';
const KEY='generation-z.save.v2', BACKUP=KEY+'.backup';
const ids=(values,catalog)=>Array.isArray(values)?[...new Set(values.filter(v=>catalog.some(x=>x.id===v)))]:[];
export function decode(raw,now=Date.now()) {const p=typeof raw==='string'?JSON.parse(raw):raw;if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid save');if(![1,2,3,4].includes(p.saveVersion))throw Error('Unsupported save');const s=freshState(now);for(const k of ['money','bank','bankXP','xp','gems','playtime','followers'])s[k]=round(clamp(p[k]));s.level=Math.floor(clamp(p.level,1,CONFIG.maxLevel));s.xp=s.level===CONFIG.maxLevel?0:Math.min(s.xp,1e7);s.gems=Math.floor(Math.min(s.gems,1e9));s.bankXP=Math.min(s.bankXP,CONFIG.offlineMaxXP);s.jobs=[...new Set(['helper',...ids(p.jobs,JOBS)])];s.job=s.jobs.includes(p.job)?p.job:'helper';s.items=[...new Set(['oldPhone','basicClothes',...ids(p.items,ITEMS)])];s.equipped={phone:'oldPhone',clothes:'basicClothes'};for(const id of Object.values(p.equipped||{})){const item=ITEMS.find(i=>i.id===id);if(item&&s.items.includes(id))s.equipped[item.slot]=id;}
for(const skill of SKILLS)s.skills[skill]=Math.floor(clamp(p.skills?.[skill],0,100));s.housing=Math.floor(clamp(p.housing,0,2));for(const k of Object.keys(s.stats))s.stats[k]=clamp(p.stats?.[k]);s.tutorial=Math.floor(clamp(p.tutorial,0,3));s.lastTick=Number.isFinite(p.lastTick)?Math.max(0,Math.min(p.lastTick,now)):now;s.lastWork=clamp(p.lastWork,0,now);s.lastEvent=clamp(p.lastEvent,0,s.playtime);s.achievements=Array.isArray(p.achievements)?p.achievements.filter(x=>typeof x==='string').slice(0,200):[];s.eventSeen=Array.isArray(p.eventSeen)?p.eventSeen.filter(Number.isInteger).slice(0,30):[];
if(p.daily&&Number.isInteger(p.daily.day)){s.daily.day=Math.min(p.daily.day,Math.floor(now/86400000)+1);for(const k of ['work','collect','training'])s.daily[k]=Math.floor(clamp(p.daily[k],0,1e7));s.daily.claimed=Array.isArray(p.daily.claimed)?p.daily.claimed.filter(x=>['work','collect','training'].includes(x)):[];s.daily.gift=p.daily.gift===true;s.daily.adGift=p.daily.adGift===true;s.daily.incomeAds=Math.floor(clamp(p.daily.incomeAds,0,3));}
for(const k of ['sound','music','vibration','notifications','motion','effects'])if(typeof p.settings?.[k]==='boolean')s.settings[k]=p.settings[k];if(['ru','uk','en'].includes(p.settings?.language))s.settings.language=p.settings.language;
if(p.training&&SKILLS.includes(p.training.skill)&&Number.isFinite(p.training.endsAt)&&Number.isFinite(p.training.startsAt)&&p.training.endsAt>=p.training.startsAt&&p.training.endsAt-p.training.startsAt<=86400000)s.training={skill:p.training.skill,startsAt:Math.min(now,p.training.startsAt),endsAt:Math.min(now+86400000,p.training.endsAt)};
if(Number.isInteger(p.event)&&p.event>=0&&p.event<30)s.event=p.event;
if(p.saveVersion>=3){
 s.boosts=Array.isArray(p.boosts)?p.boosts.filter(b=>['ad','starter'].includes(b.source)&&[1.5,2].includes(b.factor)&&Number.isFinite(b.startsAt)&&Number.isFinite(b.endsAt)&&b.endsAt>b.startsAt&&b.endsAt-b.startsAt<=1800000&&b.startsAt<=now).slice(0,2):[];
 const c=p.commerce||{};s.commerce.starterOwned=c.starterOwned===true;
 for(const key of ['receipts','rewardReceipts'])s.commerce[key]=Array.isArray(c[key])?[...new Set(c[key].filter(x=>typeof x==='string'&&x.length<200))].slice(-1000):[];
 s.commerce.cosmetics=s.commerce.starterOwned?['mintFrame']:[];s.commerce.decorations=s.commerce.starterOwned?['starSculpture']:[];
 const o=p.offlineReward;if(o&&typeof o.id==='string'&&o.id.length<100&&Number.isFinite(o.amount)&&o.amount>0)s.offlineReward={id:o.id,amount:round(clamp(o.amount,0,s.bank)),seconds:clamp(o.seconds,0,28800)};
 }
s.profile=sanitizeProfile(p.saveVersion>=4?p.profile:null,s);
return s;}
export class SaveManager {constructor(storage){this.storage=storage;this.available=true;this.warning=null;}
load(now=Date.now()){let raw;try{raw=this.storage.getItem(KEY);if(!raw){const legacy=this.storage.getItem('generation-z.save.v1');if(legacy)raw=legacy;}if(raw){let state;try{state=decode(raw,now);}catch{this.warning='recovered';state=decode(this.storage.getItem(BACKUP),now);}const result=advance(state,now,true);registerOffline(state,result);if(state.offlineReward)state.offline={seconds:state.offlineReward.seconds,money:state.offlineReward.amount};return state;}}catch{this.warning=raw?'corrupt':'storage';}return freshState(now);}
save(s){try{const raw=JSON.stringify({...s,offline:null});const old=this.storage.getItem(KEY);if(old){try{decode(old,s.lastTick);this.storage.setItem(BACKUP,old);}catch{}}this.storage.setItem(KEY,raw);this.available=true;return true;}catch{this.available=false;this.warning='storage';return false;}}
export(s){return JSON.stringify({...s,offline:null},null,2);}
import(raw,now=Date.now()){return decode(raw,now);}
}
