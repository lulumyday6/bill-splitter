import {registerBackend,ImageRawBase} from '@gutenye/ocr-common';
import {splitIntoLineImages} from '@gutenye/ocr-common/splitIntoLineImages';
import {Detection} from 'receipt-detection';
import {Recognition} from 'receipt-recognition';
import {InferenceSession,env} from 'onnxruntime-web/wasm';
class ImageRaw extends ImageRawBase {
 constructor({data,width,height}){super({data:new Uint8ClampedArray(data),width,height});}
 async resize({width,height}){const w=width||Math.max(1,Math.round(this.width/this.height*height)),h=height||Math.max(1,Math.round(this.height/this.width*width));const source=new OffscreenCanvas(this.width,this.height);source.getContext('2d').putImageData(new ImageData(this.data,this.width,this.height),0,0);const dest=new OffscreenCanvas(w,h);dest.getContext('2d').drawImage(source,0,0,w,h);return new ImageRaw(dest.getContext('2d').getImageData(0,0,w,h));}
}
registerBackend({ImageRaw,InferenceSession,splitIntoLineImages,FileUtils:{read:async url=>{const r=await fetch(url);if(!r.ok)throw Error('Resource unavailable');return r.text();}}});
env.wasm.numThreads=1;env.wasm.proxy=false;env.wasm.wasmPaths=new URL('./',self.location.href).href;
self.onmessage=async({data})=>{
 try{
  self.postMessage({status:'正在下載中文辨識模型，照片留在你的裝置…'});
  const models={detectionPath:new URL('detection.onnx',self.location.href).href,recognitionPath:new URL('recognition.onnx',self.location.href).href,dictionaryPath:new URL('dictionary.txt',self.location.href).href};
  const detection=await Detection.create({models,onnxOptions:{executionProviders:['wasm']}}),recognition=await Recognition.create({models,onnxOptions:{executionProviders:['wasm']}});
  self.postMessage({status:'正在定位收據上的餐點與價格…'});
  const found=await detection.run(data);const texts=[];
  for(let i=0;i<found.lineImages.length;i++){texts.push(...await recognition.run([found.lineImages[i]]));self.postMessage({status:`正在讀取餐點與價格 ${Math.round((i+1)/found.lineImages.length*100)}%`});}
  self.postMessage({result:{texts,resizedImageWidth:found.resizedImageWidth,resizedImageHeight:found.resizedImageHeight}});
 }catch(e){self.postMessage({error:'辨識工具無法完成，請重試或手動輸入。'});console.error(String(e.message||e));}
};
