(function(root){
'use strict';
// Keep the exact unit-price ratio; the displayed decimal is never used to
// recalculate a subtotal unless the user explicitly edits that decimal.
function decimal(v){const s=String(v).trim();if(!/^\d+(?:\.\d{1,6})?$/.test(s))throw Error('單價請填非負數字，最多 6 位小數。');const [a,b='']=s.split('.');const n=BigInt(a+b),d=10n**BigInt(b.length);if(n>1000000000n*d)throw Error('金額超過上限。');return{n:String(n),d:String(d)};}
function quantity(v){if(!/^\d+$/.test(String(v))||Number(v)<1||Number(v)>10000)throw Error('數量請填 1～10,000 的整數。');return BigInt(v);}
const round=(n,d)=>(2n*n+d)/(2n*d);
function display(n,places){const p=10n**BigInt(places);return places?(String(n/p)+'.'+String(n%p).padStart(places,'0')).replace(/\.?0+$/,''):String(n);}
function unit(b){return display(round(BigInt(b.n)*1000000n,BigInt(b.d)),6);}
function fromAmount(i){const b=decimal(i.amount);b.d=String(BigInt(b.d)*quantity(i.qty));i.priceBasis=b;i.unitPrice=unit(b);}
function prepare(i){if(!i.priceBasis&&i.amount!==''&&i.amount!==undefined){try{fromAmount(i)}catch{}}if(i.unitPrice===undefined)i.unitPrice='';return i;}
function edit(i,field,value,digits=0){
 prepare(i);i[field]=value;i.priceError='';
 try{
  if(field==='amount'){i.priceBasis=null;i.unitPrice='';const b=decimal(value);const scale=10n**BigInt(digits);if(BigInt(b.n)*scale%BigInt(b.d))throw Error('小計最多可填 '+digits+' 位小數。');fromAmount(i);}
  else if(field==='unitPrice'){i.priceBasis=null;i.amount='';i.priceBasis=decimal(value);quantity(i.qty);}
  else if(field==='qty'){quantity(value);if(!i.priceBasis&&i.amount!=='')fromAmount(i);}
  if(field==='unitPrice'||field==='qty'){
   if(!i.priceBasis){i.amount='';return i;}
   const b=i.priceBasis,scale=10n**BigInt(digits),n=round(BigInt(b.n)*quantity(i.qty)*scale,BigInt(b.d));
   if(n>1000000000n)throw Error('餐點小計超過上限。');i.amount=display(n,digits);
  }
 }catch(e){i.priceError=e.message;if(field!=='amount')i.amount='';}
 return i;
}
root.Pricing={prepare,edit};if(typeof module!=='undefined')module.exports=root.Pricing;
})(globalThis);
