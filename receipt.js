(function(root){
'use strict';
const clean=s=>String(s).normalize('NFKC').trim().replace(/([\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu,'$1');
const excluded=/總(?:計|額|數|金)|总(?:计|额|数|金)|合計|合计|小計|小计|服務|服务|折扣|優惠|找零|現金|现金|付款|收款|信用|應付|實付|統編|電話|电话|地址|收據|發票|日期|時間|时间|桌[號号]|單[號号]|序[號号]|人[數数]|數量|数量|名稱|名称|金[額额]|列印|印表|設備|訂購|訂單|購物|會員|下一步|加購|https?:|@|\d{7,}|\d{2,4}[/-]\d{1,2}[/-]\d{1,2}|\b(?:tax|total|cash|change|tel|visa|mastercard)\b/i;
const note=/^[·•。*\-]|微糖|無糖|半糖|少糖|去冰|微冰|少冰|甜度|冰量/;
const money=s=>/^(?:NT\$|[$¥￥])?\s*\d[\d,]*(?:\.\d{1,2})?$/.test(s.trim());
const numeric=s=>String(Number(s.replace(/NT\$|[$¥￥,\s]/g,'')));
const nameOK=s=>/[\p{L}]/u.test(s)&&!excluded.test(s)&&!note.test(s);
function item(name,qty,amount,warnings=[]){return{name:clean(name).slice(0,100),qty:String(qty),amount:String(amount),owners:[],warnings};}
function parse(text){
 const lines=String(text).split(/\r?\n/).map(clean).filter(Boolean),items=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  // Order cards: the detail line, not the customer's amount summary.
  const spec=line.match(/^(?:[SML]|XL|大|中|小)\s*\/.*?\$\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(\d+)\s*份$/i);
  if(spec&&i&&nameOK(lines[i-1])){items.push(item(lines[i-1],spec[2],numeric(spec[1]),['請確認這是本列小計，而非單價']));continue;}
  if(excluded.test(line)||note.test(line)||/\/.*份/.test(line))continue;
  const m=line.match(/^(.*?)\s+(?:[x×*]\s*)?(?:(\d{1,3})\s+)?(?:NT\$|[$¥￥])?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:元)?$/i);
  if(m&&nameOK(m[1]))items.push(item(m[1],m[2]||'1',numeric(m[3]),m[2]?[]:['數量未列出，暫填 1']));
 }
 return{items,skipped:Math.max(0,lines.length-items.length)};
}
function fromBoxes(result){
 const boxes=result.texts.map(t=>{const xs=t.box.map(p=>p[0]),ys=t.box.map(p=>p[1]);return{...t,text:clean(t.text),left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),y:ys.reduce((a,b)=>a+b,0)/4,h:Math.max(...ys)-Math.min(...ys)}}).filter(t=>t.text&&t.bottom-t.top<(t.right-t.left)*3.5).sort((a,b)=>a.y-b.y);
 // A screenshot may contain contact cards. Read only explicitly formatted product cards.
 const cards=[];
 for(let i=0;i<boxes.length;i++){
  const b=boxes[i],m=b.text.match(/^(?:[SML]|XL|大|中|小)\s*\/.*?\$\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(\d+)\s*份$/i);
  if(!m)continue;
  const before=boxes.slice(0,i).reverse().find(t=>t.bottom<=b.top+5&&b.top-t.bottom<4*b.h&&Math.abs(t.left-b.left)<2*b.h&&nameOK(t.text)&&!/[/$]/.test(t.text));
  if(before)cards.push(item(before.text,m[2],numeric(m[1]),Number(m[2])>1?['請核對此金額是單價還是小計']:[]));
 }
 if(cards.length)return{items:cards,skipped:boxes.length-cards.length};
 const header=boxes.find(b=>/^(名稱|名称|品名|餐點)$/.test(b.text));
 const first=header||boxes.find(b=>/^\[(主餐|飲品|饮品|餐點|套餐)\]/.test(b.text));
 const footer=boxes.find(b=>(!first||b.y>first.y)&&/^(總數量|总数量|商品數量|商品数量|小計|小计|合計|合计|總計|总计)/.test(b.text));
 const left=first?first.left-30:0,top=header?header.bottom:first?first.top-5:0,bottom=footer?footer.top:Infinity;
 const amountHeader=header&&boxes.find(b=>/^(金額|金额|小計|小计)$/.test(b.text)&&Math.abs(b.y-header.y)<header.h);
 const right=amountHeader?amountHeader.right+30:first?Math.max(first.right+60,first.left+Math.max(420,(result.resizedImageWidth||1000)*.38)):Infinity;
 const candidates=boxes.filter(b=>b.y>top&&b.y<bottom&&b.left>=left&&b.right<=right&&!excluded.test(b.text));
 const groups=[];
 for(const b of candidates){let g=groups.find(g=>Math.abs(g.y-b.y)<Math.min(g.h,b.h)*.48);if(!g){g={y:b.y,h:b.h,parts:[]};groups.push(g)}g.parts.push(b);}
 const items=[];
 for(const g of groups){
  const parts=g.parts.sort((a,b)=>a.left-b.left);let names=parts.filter(b=>nameOK(b.text)&&!/^x\s*\d/i.test(b.text)&&!/^x$/i.test(b.text));
  if(!names.length)continue;
  // Leftmost text in the detected receipt column is the dish; surrounding menu text stays out.
  if(first)names=names.filter(b=>b.left<first.left+180);
  if(!names.length)continue;
  let name=names.map(b=>b.text).join(''),qty='1',amount='',warnings=[];
  const suffix=name.match(/^(.*?)[x×*]\s*(\d*)$/i);if(suffix){name=suffix[1];qty=suffix[2]||'1';}
  const after=parts.filter(b=>b.left>=names[0].right-5&&!names.includes(b)),nums=after.filter(b=>money(b.text));
  const x=after.find(b=>/^[x×*]\s*\d/i.test(b.text));
  if(x){const tail=x.text.replace(/^[x×*]\s*/i,'');const separate=tail.match(/^(\d+)\s+(\d[\d,]*(?:\.\d{1,2})?)$/);if(separate){qty=separate[1];amount=numeric(separate[2]);}else if(nums.length){qty=tail.replace(/\s/g,'');const price=nums.at(-1);if(qty.length>1&&x.right>price.left&&price.text.startsWith(qty.at(-1))){qty=qty.slice(0,-1);warnings.push('數量與價格區域重疊，請確認');}}else if(/^\d{2,}$/.test(tail)){qty=tail[0];amount=numeric(tail.slice(1));warnings.push('數量與價格黏在一起，請對照照片');}else{qty=tail;}}
  if(nums.length){amount=numeric(nums.at(-1).text);if(nums.length>1&&!x)qty=numeric(nums.at(-2).text);else if(!x&&!suffix)warnings.push('數量未辨識，暫填 1');}
  if(!amount&&suffix&&qty.length>1){amount=numeric(qty.slice(1));qty=qty[0];warnings.push('數量與價格黏在一起，請對照照片');}
  if(amount!==''||x||suffix){if(!amount)warnings.push('金額未辨識，請補填');items.push(item(name,qty,amount,warnings));}
  else if(items.length&&nameOK(name)&&name.length<=8&&/\[/.test(items.at(-1).name)&&g.y-groups[Math.max(0,groups.indexOf(g)-1)].y<g.h*1.5){items.at(-1).name+=name;}
 }
 return{items,skipped:Math.max(0,boxes.length-items.length)};
}
root.Receipt={parse,fromBoxes};if(typeof module!=='undefined')module.exports=root.Receipt;
})(globalThis);
