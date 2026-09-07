import test from 'node:test';import assert from 'node:assert/strict';
import {freshState,income} from '../dist/core/game.js';
import {decode,SaveManager} from '../dist/core/save.js';
import {FRAMES,TITLES} from '../dist/data/profile.js';
import {buyCosmetic,selectCosmetic,catalog,isOwned,activeFrame,normalizeNickname} from '../dist/systems/profile.js';
import {profileScreen,cosmeticPreview} from '../dist/ui/profile.js';
import {setLanguage} from '../dist/locales/index.js';
const now=1800000000000;
test('8 frames / 10 titles; every paid cosmetic charges the requested price once',()=>{
 assert.equal(FRAMES.length,8);assert.equal(TITLES.length,10);
 const prices={neon:50,cyber:100,gold:150,diamond:250,hologram:400,zoomer:30,mainCharacter:50,boss:75,ceo:100,legend:200};
 for(const [kind,list] of [['frame',FRAMES],['title',TITLES]])for(const item of list.filter(x=>x.price)){
  assert.equal(item.price,prices[item.id]);const s=freshState(now);s.gems=1000;const before=structuredClone(s),rate=income(s);
  assert.equal(buyCosmetic(s,kind,item.id).ok,true);assert.equal(s.gems,1000-prices[item.id]);assert.equal(s.profile[kind],item.id);
  assert.equal(buyCosmetic(s,kind,item.id).ok,false);assert.equal(s.gems,1000-prices[item.id]);assert.equal(income(s),rate);
  assert.deepEqual({...s,profile:before.profile,gems:before.gems},before);
 }
});
test('insufficient and invalid purchases cannot mutate state; exact balance works',()=>{
 for(const gems of [0,49,NaN,Infinity]){const s=freshState(now);s.gems=gems;const before=structuredClone(s);assert.equal(buyCosmetic(s,'frame','neon').reason,'profileGems');assert.deepEqual(s,before);}
 const s=freshState(now);s.gems=50;assert.equal(buyCosmetic(s,'frame','neon').ok,true);assert.equal(s.gems,0);
 for(const [kind,id] of [['frame','standard'],['frame','missing'],['__proto__','neon']])assert.equal(buyCosmetic(s,kind,id).ok,false);
});
test('one active frame and title; locked selections refused; progress conditions enforced',()=>{
 const s=freshState(now);assert.equal(activeFrame(s),'standard');assert.equal(selectCosmetic(s,'frame','gold').ok,false);
 for(const [kind,id,unlock] of [['frame','career',s=>s.achievements.push('firstJob')],['frame','home',s=>s.housing=1],['title','worker',s=>s.stats.work=10],['title','careerist',s=>s.jobs=['a','b','c','d','e']],['title','collector',s=>s.stats.bought=10],['title','millionaire',s=>s.stats.earned=1000000]]){
  assert.equal(selectCosmetic(s,kind,id).ok,false);unlock(s);assert.equal(selectCosmetic(s,kind,id).ok,true);assert.equal(s.profile[kind],id);
 }
 s.gems=500;buyCosmetic(s,'frame','gold');buyCosmetic(s,'title','legend');selectCosmetic(s,'frame','standard');assert.equal(activeFrame(s),'standard');assert.equal(s.profile.title,'legend');
});
test('save and restart retain nickname, ownership, selection, gems and Starter cosmetics',()=>{
 const m=new Map(),storage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)},manager=new SaveManager(storage),s=freshState(now);s.gems=1000;s.profile.nickname='Z Player';
 buyCosmetic(s,'frame','hologram');buyCosmetic(s,'title','legend');assert.equal(manager.save(s),true);
 const loaded=new SaveManager(storage).load(now);assert.deepEqual(loaded.profile,s.profile);assert.equal(loaded.gems,400);assert.equal(buyCosmetic(loaded,'frame','hologram').ok,false);
});
test('v1, v2 and v3 migrate without changing existing economy data; Mint preserved',()=>{
 for(const version of [1,2,3]){const old=freshState(now);old.saveVersion=version;delete old.profile;old.money=333;old.gems=44;old.xp=28;old.bank=70;
 if(version===3){old.commerce={starterOwned:true,receipts:['paid:1'],rewardReceipts:['ad:1'],cosmetics:['mintFrame'],decorations:['starSculpture']};old.boosts=[{source:'starter',factor:1.5,startsAt:now-1000,endsAt:now+1000}];old.offlineReward={id:'offline:1',amount:70,seconds:100};}
 const loaded=decode(old,now);assert.equal(loaded.saveVersion,4);assert.deepEqual({...loaded,saveVersion:version,profile:undefined},{...old,profile:undefined});assert.equal(activeFrame(loaded),version===3?'mint':'standard');
 if(version===3){assert.equal(catalog(loaded,'frame').length,9);assert.equal(selectCosmetic(loaded,'frame','standard').ok,true);assert.equal(selectCosmetic(loaded,'frame','mint').ok,true);assert.equal(activeFrame(decode(loaded,now)),'mint');}
 }
});
test('malformed profile data sanitizes safely; render escapes nickname in three languages',()=>{
 const s=freshState(now);s.profile={nickname:' <img src=x> ',ownedFrames:['gold','gold','bad'],ownedTitles:['legend','bad'],frame:'bad',title:'bad'};
 const clean=decode(s,now);assert.deepEqual(clean.profile.ownedFrames,['standard','gold']);assert.equal(activeFrame(clean),'standard');assert.equal(clean.profile.title,'newbie');
 assert.equal([...normalizeNickname('😀'.repeat(30))].length,20);assert.equal(normalizeNickname('  a\u202eb\n  '),'ab');
 for(const lang of ['ru','uk','en']){setLanguage(lang);for(const html of [profileScreen(clean),profileScreen(clean,'titles'),cosmeticPreview(clean,'frame','gold')]){assert.ok(!html.includes('<img src=x>'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('profile.rule.'));assert.ok(html.includes('&lt;img src=x&gt;'));}}
});
