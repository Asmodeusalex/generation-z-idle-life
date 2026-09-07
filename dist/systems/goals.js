import {JOBS,ITEMS,HOUSING,CONFIG,xpNeeded} from '../data/config.js';
import {jobRequirements} from '../core/game.js';
export function nextUnlock(s){if(s.level>=20&&s.housing===2)return {kind:'done',level:20};const next=JOBS.find(j=>j.levelRequirement>s.level);if(s.level<2)return {kind:'shop',level:2};if(s.level<3)return {kind:'skills',level:3};if(s.level<10&&(!next||next.levelRequirement>=10))return {kind:'housing',id:1,level:10};if(next)return {kind:'job',id:next.id,level:next.levelRequirement};return {kind:'housing',id:2,level:20};}
export function nextGoal(s){
 if(!s.tutorial)return {key:'firstGoal',screen:'life',progress:s.bank,max:25};
 if(!s.stats.work)return {key:'workGoal',screen:'work',progress:0,max:1};
 if(s.level<2)return {key:'levelGoal',screen:'work',progress:s.xp,max:xpNeeded(s.level)};
 if(!s.items.includes('budgetPhone')&&!s.items.includes('smartphone'))return {key:'buyGoal',screen:'shop',progress:s.money,max:150};
 if(s.level<3)return {key:'skillGoal',screen:'work',progress:s.xp,max:xpNeeded(s.level)};
 if(!s.stats.training)return {key:'trainGoal',screen:'skills',progress:0,max:1};
 const candidate=JOBS.find(j=>!s.jobs.includes(j.id)&&j.levelRequirement<=s.level&&j.incomePerSecond>JOBS.find(j=>j.id===s.job).incomePerSecond);
 if(candidate){const missing=jobRequirements(s,candidate);if(missing.length){const r=missing[0];return {kind:r.kind,id:r.id,value:r.value,screen:r.kind==='skill'?'skills':r.kind==='item'?'shop':'work',progress:r.kind==='skill'?s.skills[r.id]:0,max:r.value||1};}return {kind:'career',id:candidate.id,screen:'work',progress:s.money,max:candidate.unlockCost};}
 const item=ITEMS.find(i=>i.price>0&&!s.items.includes(i.id)&&i.levelRequirement<=s.level);if(item&&s.jobs.length>=3)return {kind:'item',id:item.id,screen:'shop',progress:s.money,max:item.price};
 if(s.housing<2){const h=HOUSING[s.housing+1];return {key:s.housing?'studioGoal':'homeGoal',screen:'housing',progress:s.level<h.levelRequirement?s.level:s.money,max:s.level<h.levelRequirement?h.levelRequirement:h.price};}
 return {key:'finishedGoal',screen:'shop',progress:s.items.length,max:ITEMS.length};
}
