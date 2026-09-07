import {STARTER_PACK,REWARDED} from '../data/offers.js';
import {advance,addMoney,addXP,collect,refreshDaily} from '../core/game.js';
import {CONFIG} from '../data/config.js';
export function starterEligible(s){return s.playtime>=STARTER_PACK.minPlaytime&&s.level>=STARTER_PACK.minLevel&&s.achievements.length>=STARTER_PACK.minAchievements&&s.tutorial>=3&&s.stats.work>=10&&!s.commerce.starterOwned;}
export function rewardContext(s,placement){if(placement==='offline')return s.offlineReward?.id||null;if(placement==='training')return s.training?`${s.training.skill}:${s.training.startsAt}`:null;return String(s.daily.day);}
export function rewardEligible(s,placement,context=rewardContext(s,placement)){
 if(!context||context!==rewardContext(s,placement))return false;
 if(placement==='offline')return !!s.offlineReward&&s.offlineReward.amount>0;
 if(placement==='training')return !!s.training;
 if(placement==='daily')return s.daily.gift&&!s.daily.adGift;
 if(placement==='income')return s.level>=3&&s.daily.incomeAds<REWARDED.income.dailyLimit&&!s.boosts.some(b=>b.source==='ad'&&b.endsAt>s.lastTick);
 return false;
}
export function grantStarter(s,receipt,now=Date.now()){
 if(!receipt?.verified||receipt.productId!==STARTER_PACK.id||typeof receipt.transactionId!=='string'||!receipt.transactionId||s.commerce.receipts.includes(receipt.transactionId))return {ok:false,reason:'receipt'};
 if(!starterEligible(s))return {ok:false,reason:'requirements'};
 advance(s,now);s.commerce.starterOwned=true;s.commerce.receipts.push(receipt.transactionId);s.gems+=STARTER_PACK.gems;s.commerce.cosmetics.push(STARTER_PACK.cosmetic);s.commerce.decorations.push(STARTER_PACK.decoration);
 s.boosts.push({source:'starter',factor:STARTER_PACK.boostFactor,startsAt:now,endsAt:now+STARTER_PACK.boostSeconds*1000});return {ok:true};
}
export function grantReward(s,placement,context,result,now=Date.now()){
 if(!result?.completed||typeof result.rewardId!=='string'||!result.rewardId||s.commerce.rewardReceipts.includes(result.rewardId))return {ok:false,reason:'adIncomplete'};
 advance(s,now);refreshDaily(s,now);
 if(!rewardEligible(s,placement,context))return {ok:false,reason:'rewardExpired'};
 let amount=0;
 if(placement==='offline'){const bonus=s.offlineReward.amount;const base=collect(s);amount=base.amount||0;amount+=addMoney(s,bonus);s.offlineReward=null;s.offline=null;}
 if(placement==='income'){s.daily.incomeAds++;s.boosts.push({source:'ad',factor:2,startsAt:now,endsAt:now+REWARDED.income.seconds*1000});}
 if(placement==='daily'){s.daily.adGift=true;amount=addMoney(s,REWARDED.daily.money);s.gems+=REWARDED.daily.gems;}
 if(placement==='training'){const tr=s.training;s.skills[tr.skill]=Math.min(CONFIG.maxSkill,s.skills[tr.skill]+1);s.training=null;s.stats.training++;s.daily.training++;addXP(s,CONFIG.trainingXP);}
 s.commerce.rewardReceipts.push(result.rewardId);return {ok:true,amount};
}
/** Provider outcome is consumed once; no reward for dismissal, failure, unsupported service or unverified purchase. */
export class MonetizationController{
 constructor({ads,purchases,getState,persist,clock=Date.now}){Object.assign(this,{ads,purchases,getState,persist,clock});this.busy=false;}
 async rewarded(placement){if(this.busy)return {ok:false,reason:'busy'};const s=this.getState();const context=rewardContext(s,placement);if(!rewardEligible(s,placement,context))return {ok:false,reason:'requirements'};if(!this.ads.available)return {ok:false,reason:'unavailable'};this.busy=true;try{const result=await this.ads.showRewarded(placement);if(this.getState()!==s)return {ok:false,reason:'rewardExpired'};const applied=grantReward(s,placement,context,result,this.clock());if(applied.ok)this.persist();return applied;}catch{return {ok:false,reason:'serviceFailed'};}finally{this.busy=false;}}
 async starter(){if(this.busy)return {ok:false,reason:'busy'};const s=this.getState();if(!starterEligible(s))return {ok:false,reason:'requirements'};if(!this.purchases.available)return {ok:false,reason:'unavailable'};this.busy=true;try{const result=await this.purchases.purchase(STARTER_PACK.id);if(this.getState()!==s)return {ok:false,reason:'rewardExpired'};if(result.cancelled)return {ok:false,reason:'cancelled'};const applied=grantStarter(s,result,this.clock());if(applied.ok)this.persist();return applied;}catch{return {ok:false,reason:'serviceFailed'};}finally{this.busy=false;}}
}
