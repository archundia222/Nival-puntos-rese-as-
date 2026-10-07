import {mkdirSync,copyFileSync,readdirSync} from 'node:fs';
mkdirSync('public/ocr/core',{recursive:true});mkdirSync('public/ocr/lang',{recursive:true});
copyFileSync('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
copyFileSync('node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt','public/ocr/worker.min.js.LICENSE.txt');
for(const file of readdirSync('node_modules/tesseract.js-core').filter(f=>f.endsWith('.wasm.js')))copyFileSync('node_modules/tesseract.js-core/'+file,'public/ocr/core/'+file);
for(const lang of ['spa','eng'])copyFileSync('node_modules/@tesseract.js-data/'+lang+'/4.0.0/'+lang+'.traineddata.gz','public/ocr/lang/'+lang+'.traineddata.gz');
