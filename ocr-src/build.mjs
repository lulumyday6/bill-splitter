import {build} from 'esbuild';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const req=createRequire(import.meta.resolve('@gutenye/ocr-browser')),common=path.dirname(req.resolve('@gutenye/ocr-common'));
const patches={name:'receipt-horizontal-lines',setup(b){
 b.onLoad({filter:/Recognition\.js$/},a=>({contents:fs.readFileSync(a.path,'utf8').replace('mainLine = afAfRec(mainLine);','// Preserve each text box for receipt layout parsing.'),loader:'js'}));
 b.onLoad({filter:/splitIntoLineImages\.js$/},a=>({contents:fs.readFileSync(a.path,'utf8').replace('>= 1.5','>= 100').replace('data: mat.data','data: Uint8Array.from(mat.data)').replace('return cvImshow(dst_rot || dst);','const output = cvImshow(dst_rot || dst); (dst_rot || dst).delete(); M.delete(); return output;').replace('const { points, sside } = getMiniBoxes(cnt);','const { points, sside } = getMiniBoxes(cnt); cnt.delete();').replace('const resultObj = getMiniBoxes(boxMap);','const resultObj = getMiniBoxes(boxMap); boxMap.delete();'),loader:'js'}));
}};
const ort=path.dirname(req.resolve('onnxruntime-web/wasm'));
for(const file of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])fs.copyFileSync(path.join(ort,file),'ocr-assets/'+file);
await build({entryPoints:['ocr-src/worker.js'],outfile:'ocr-assets/worker.js',bundle:true,minify:true,external:['fs','path'],define:{'process.versions.node':'undefined'},platform:'browser',format:'esm',conditions:['onnxruntime-web-use-extern-wasm'],legalComments:'external',plugins:[patches],alias:{'@gutenye/ocr-common':req.resolve('@gutenye/ocr-common'),'@gutenye/ocr-common/splitIntoLineImages':req.resolve('@gutenye/ocr-common/splitIntoLineImages'),'receipt-detection':path.join(common,'models/Detection.js'),'receipt-recognition':path.join(common,'models/Recognition.js'),'onnxruntime-web/wasm':path.join(ort,'ort.wasm.min.mjs')}});
console.log('Built local receipt worker');
