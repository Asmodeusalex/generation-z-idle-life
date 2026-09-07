import {freshState,advance,collect,work,buyItem,buyHousing,train,takeJob,claimQuest,claimAchievement,claimGift,income,jobRequirements} from '../dist/core/game.js';
import {JOBS,ITEMS,SKILLS,DAILY_QUESTS,ACHIEVEMENTS} from '../dist/data/config.js';
import {starterEligible} from '../dist/systems/monetization.js';
const base=1800000000000,s=freshState(base),checkpoints=[];
for(let sec=1;sec<=7200;sec++){const now=base+sec*1000;advance(s,now);if(sec%15===0||sec===5)collect(s);if(sec%3===0)work(s,now);if(sec===60)claimGift(s);for(const q of DAILY_QUESTS)claimQuest(s,q.id);for(const a of ACHIEVEMENTS)claimAchievement(s,a.id);
for(const j of JOBS){if(j.incomePerSecond>(JOBS.find(x=>x.id===s.job).incomePerSecond)&&!jobRequirements(s,j).length&&s.money>=j.unlockCost*1.5)takeJob(s,j.id);}
if(sec%10===0)for(const i of ITEMS){if(!s.items.includes(i.id)&&s.level>=i.levelRequirement&&s.money>=i.price*1.5)buyItem(s,i.id);}
if(!s.training&&s.level>=3&&sec%20===0){const skill=SKILLS.slice().sort((a,b)=>s.skills[a]-s.skills[b])[0];train(s,skill,now);}
if(s.housing===0&&s.money>=20000)buyHousing(s,1);if(s.housing===1&&s.money>=200000)buyHousing(s,2);
if([60,120,180,300,600,900,1200,1800,3600,7200].includes(sec))checkpoints.push({minutes:sec/60,level:s.level,money:s.money,job:s.job,income:income(s),items:s.items.length,skills:{...s.skills},housing:s.housing,achievements:s.achievements.length,starterEligible:starterEligible(s),paidTransactions:s.commerce.receipts.length});}
console.log(JSON.stringify(checkpoints,null,2));
