import {performance} from 'node:perf_hooks';
import {freshState,advance} from '../dist/core/game.js';
import {SaveManager} from '../dist/core/save.js';
import {life,workScreen,shopScreen} from '../dist/ui/screens.js';
import {JOBS,ITEMS,SKILLS} from '../dist/data/config.js';
const base=1800000000000,state=freshState(base);Object.assign(state,{level:20,tutorial:3,money:1e8,jobs:JOBS.map(j=>j.id),items:ITEMS.map(i=>i.id),housing:2});for(const k of SKILLS)state.skills[k]=50;
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},saves=new SaveManager(storage);
const cases={tick:()=>advance(state,state.lastTick+1000),threeScreens:()=>{life(state);workScreen(state,'career','all');shopScreen(state,'items','all');},saveWithBackup:()=>saves.save(state)};
const report={environment:'Node; excludes DOM layout, paint, audio and device GPU',iterations:2000,results:{}};
for(const [name,fn] of Object.entries(cases)){for(let i=0;i<100;i++)fn();const times=[];for(let i=0;i<report.iterations;i++){const start=performance.now();fn();times.push(performance.now()-start);}times.sort((a,b)=>a-b);report.results[name]={meanMs:+(times.reduce((a,b)=>a+b,0)/times.length).toFixed(4),p95Ms:+times[Math.floor(times.length*.95)].toFixed(4)};}
console.log(JSON.stringify(report,null,2));
