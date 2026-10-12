(function(root){
'use strict';
const integer=(v,label,max=1000000000)=>{if(String(v).trim()===''||!Number.isSafeInteger(Number(v))||Number(v)<0||Number(v)>max)throw Error(label+'請輸入 0～'+max.toLocaleString('zh-TW')+' 的整數。');return Number(v)};
function equal(amount,people,service){amount=integer(amount,'金額');people=integer(people,'人數',10000);if(!people)throw Error('至少需要 1 人。');const fee=service?Math.floor((amount+5)/10):0,total=amount+fee,each=Math.floor(total/people);return{total,fee,each,payer:each+total%people,remainder:total%people}}
const gcd=(a,b)=>b?gcd(b,a%b):a;
function add(a,b){const n=a.n*b.d+b.n*a.d,d=a.d*b.d,g=gcd(n,d);return {n:n/g,d:d/g}}
function calculate(people,items,payer,service,discount){
 if(!people.length||people.length>50)throw Error('請新增 1～50 位用餐者。');
 if(!people.some(p=>p.id===payer))throw Error('請選擇付錢的人。');
 if(!items.length)throw Error('請新增餐點。');
 const bases=new Map(people.map(p=>[p.id,{n:0n,d:1n}]));let subtotal=0;
 for(const item of items){if(!item.name.trim())throw Error('請填寫每道餐點名稱。'); const cost=integer(item.amount,'餐點小計');const qty=integer(item.qty,'餐點數量',10000);if(!qty)throw Error('餐點數量至少為 1。');const ids=[...new Set(item.owners)];if(!ids.length)throw Error('還有尚未分配的餐點。');if(ids.some(id=>!bases.has(id)))throw Error('餐點包含不存在的成員。');subtotal+=cost;if(subtotal>1000000000)throw Error('餐費總額超過上限。');for(const id of ids)bases.set(id,add(bases.get(id),{n:BigInt(cost),d:BigInt(ids.length)}));}
 discount=integer(discount,'折扣');if(discount>subtotal)throw Error('折扣不能超過餐費總額。');
 const net=subtotal-discount,fee=service?Math.floor((net+5)/10):0,total=net+fee;
 const shares=people.map(p=>{const b=bases.get(p.id);return {...p,amount:subtotal?Number(b.n*BigInt(total)/(b.d*BigInt(subtotal))):0}});
 const remainder=total-shares.reduce((s,p)=>s+p.amount,0);shares.find(p=>p.id===payer).amount+=remainder;
 return{subtotal,discount,fee,total,remainder,shares};
}
function parseReceipt(text){
 const items=[];let skipped=0;
 for(const raw of text.normalize('NFKC').split(/\r?\n/)){
 const line=raw.trim().replace(/([\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu,'$1');if(!line)continue;
 if(/合計|總計|小計|服務|折扣|優惠|找零|現金|信用|應付|實付|統編|電話|地址|收據|發票|日期|時間|桌號|單號|tax|total|cash|change|tel|visa|mastercard/i.test(line)||/\d{2,4}[\/-]\d{1,2}[\/-]\d{1,2}|https?:|@/.test(line)){skipped++;continue;}
 const m=line.match(/^(.*?)\s*(?:NT\$|\$|￥|¥)?\s*(-?\d[\d,]*(?:\.\d{1,2})?)\s*(?:元)?$/i);
 if(!m||!/[\p{L}]/u.test(m[1])){skipped++;continue;}
 const amount=Number(m[2].replaceAll(',',''));if(!Number.isSafeInteger(amount)||amount<0||amount>1000000000){skipped++;continue;}
 // The last amount is treated as the line total. Quantity is advisory only.
 let name=m[1].trim(),qty='1';const q=name.match(/^(.*?)\s+[x×*]?\s*(\d{1,3})\s*$/i);if(q&&Number(q[2])>0){name=q[1].trim();qty=q[2];}
 if(!name){skipped++;continue;}items.push({name:name.slice(0,100),qty,amount:String(amount),owners:[]});
 }
 return{items,skipped};
}
root.Bill={integer,equal,calculate,parseReceipt};if(typeof module!=='undefined')module.exports=root.Bill;
})(globalThis);
