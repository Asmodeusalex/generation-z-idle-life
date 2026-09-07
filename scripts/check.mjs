import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const files=walk('dist');let n=0;
for(const file of files){if(file.endsWith('.js')){execFileSync(process.execPath,['--check',file]);const content=fs.readFileSync(file,'utf8');for(const match of content.matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)){if(!fs.existsSync(path.resolve(path.dirname(file),match[1])))throw Error(`Missing import ${match[1]} in ${file}`);}n++;}}
const html=fs.readFileSync('dist/index.html','utf8');for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))if(!fs.existsSync(path.join('dist',match[1])))throw Error('Missing asset '+match[1]);
for(let i=0;i<3;i++)if(!fs.existsSync(`dist/assets/room-${i}.webp`))throw Error('Missing room');
const {dictionaries}=await import('../dist/locales/index.js');for(const lang of ['ru','uk','en'])for(const [k,v] of Object.entries(dictionaries.ru))if(!dictionaries[lang][k])throw Error('Missing translation '+lang+':'+k);
const allJS=files.filter(f=>f.endsWith('.js')&&!f.endsWith('debug.js')).map(f=>fs.readFileSync(f,'utf8')).join('\n');for(const m of allJS.matchAll(/t\(['"]([a-z]+\.[a-zA-Z0-9]+)['"]\)/g))if(!dictionaries.ru[m[1]])throw Error('Unknown localization key '+m[1]);
for(const a of ['live-room-0','live-room-1','live-room-2','character-mint','character-blue','room-props'])if(!fs.existsSync(`dist/assets/${a}.webp`))throw Error('Missing layered asset '+a);
const sw=fs.readFileSync('dist/sw.js','utf8');for(const f of files.filter(f=>/\.(js|css|webp|svg|html)$/.test(f)&&!['sw.js','debug.js','test-commerce.js'].includes(path.basename(f))))if(!sw.includes('./'+f.slice(5)))throw Error('Uncached resource '+f);
console.log(`Validated ${n} JavaScript modules, imports, entrypoints, three room assets and ${Object.keys(dictionaries.ru).length} keys in each of 3 languages.`);
