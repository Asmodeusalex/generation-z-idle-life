// Static game: package the existing web files without compiling or testing gameplay.
import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('www/',root);
await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true});
await cp(new URL('dist/',root),target,{recursive:true});
for(const name of ['android.js','android.css'])await cp(new URL('android/web/'+name,root),new URL(name,target));
const index=new URL('index.html',target);
await writeFile(index,(await readFile(index,'utf8')).replace('</head>','<link rel="stylesheet" href="./android.css"><script src="./android.js"></script></head>'));
console.log('Existing web project packaged in www/. No game tests run.');
