const assert=require('node:assert/strict');const B=require('./engine');
const p=[{id:1,name:'我'},{id:2,name:'乙'},{id:3,name:'丙'}];
const item=(amount,owners,qty='1')=>({name:'餐點',qty,amount:String(amount),owners});
assert.deepEqual(B.equal(1000,3,false),{total:1000,receiptTotal:1000,fee:0,cardFee:0,each:333,payer:334,remainder:1});
let r=B.calculate(p,[item(1000,[1,2,3])],1,false,0);assert.deepEqual(r.shares.map(s=>s.amount),[334,333,333]);
r=B.calculate(p,[item(180,[1]),item(120,[2]),item(100,[1,2,3])],1,true,0);assert.equal(r.total,440);assert.deepEqual(r.shares.map(s=>s.amount),[236,168,36]);
r=B.calculate(p,[item(1,[1,2,3]),item(1,[1,2,3]),item(1,[1,2,3])],1,false,0);assert.deepEqual(r.shares.map(s=>s.amount),[1,1,1]);
r=B.calculate(p,[item(300,[1,2,3])],1,true,30);assert.equal(r.total,297);assert.deepEqual(r.shares.map(s=>s.amount),[99,99,99]);
for(let a=0;a<150;a++)for(const service of [false,true])for(const payer of [1,2,3]){const r=B.calculate(p,[item(a,[1,2]),item(17,[2,3]),item(25,[3])],payer,service,0);assert.equal(r.shares.reduce((s,p)=>s+p.amount,0),r.total);assert(r.shares.every(p=>Number.isInteger(p.amount)&&p.amount>=0));}
for(const i of [item(-1,[1]),item(1.5,[1]),item(20,[]),item(20,[9]),item(10,[1],'0')])assert.throws(()=>B.calculate(p,[i],1,false,0));
assert.throws(()=>B.calculate(p,[item(10,[1])],1,false,11));
const parsed=B.parseReceipt('牛肉麵 180\n水餃 2 120\n合計 300\n服務費 30\n電話 0912345678');assert.equal(parsed.items.length,2);assert.equal(parsed.items[1].qty,'2');assert.equal(parsed.items[1].amount,'120');assert.equal(parsed.skipped,3);
console.log('PASS: equal split, shared dishes, proportional fee/discount, exact rational accumulation, 900 sum checks, invalid input, receipt parser.');
assert.equal(B.parseReceipt('牛 肉 麵 180\n合 計 180\n服 務 費 18').items.length,1);

assert.equal(B.toMinor("10.29",2),1029);assert.equal(B.toMinor("1000.00",0),1000);assert.throws(()=>B.toMinor("10.01",0));assert.throws(()=>B.toMinor("10.001",2));
const card=B.equal(10000,3,true,150);assert.equal(card.fee,1000);assert.equal(card.cardFee,165);assert.equal(card.total,11165);assert.equal(card.payer+2*card.each,11165);
const cr=B.calculate(p,[item(10000,[1,2,3])],1,true,0,150);assert.equal(cr.total,11165);assert.deepEqual(cr.shares.map(p=>p.amount),[3723,3721,3721]);assert.equal(B.parseReceipt("Noodles 12.50").items[0].amount,"12.5");
console.log("PASS: foreign currency decimal precision, card fee after service fee, exact sum including card fee.");

const fx=B.calculate(p,[item(300,[1]),item(600,[2]),item(100,[3])],1,false,0,0,223);assert.equal(fx.receiptTotal,1000);assert.deepEqual(fx.shares.map(p=>p.amount),[68,133,22]);assert.equal(fx.total,223);const fxEqual=B.equal(1000,3,false,0,223);assert.equal(fxEqual.payer,75);assert.equal(fxEqual.each,74);console.log("PASS: exact allocation of actual TWD settlement independent of foreign currency receipt.");
