const assert=require('node:assert/strict'),R=require('./receipt');
const box=(text,x,y,w=100,h=30)=>({text,mean:.9,box:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});
let r=R.fromBoxes({texts:[box('名稱',100,10),box('數量',300,10),box('金額',400,10),box('湯麵',100,60),box('2',300,60,20),box('160',400,60,50),box('茶',100,110),box('0',400,110,50),box('總數量',100,160),box('3',300,160,20),box('小計',100,210),box('160',400,210,50)]});assert.equal(r.items.length,2);assert.equal(r.items[0].qty,'2');assert.equal(r.items[1].amount,'0');assert.equal(r.items.reduce((s,i)=>s+Number(i.amount),0),160);
r=R.parse('訂購資訊\n測試顧客 $150/2份\n綠茶\nM / 微冰 / $50 / 1份\n鮮奶茶\nL / 無糖 / $100 / 1份\n下一步');assert.deepEqual(r.items.map(i=>i.name),['綠茶','鮮奶茶']);assert.equal(r.items.reduce((s,i)=>s+Number(i.amount),0),150);
r=R.parse('湯麵 2 160\n紅茶 0\n電話 '+ '0'.repeat(10) +'\n總數量 2\n合 計 160\n銷售總額 160\n現金 160\n找零 0\n桌號 10');assert.equal(r.items.length,2);assert.equal(r.items[0].qty,'2');
r=R.fromBoxes({resizedImageWidth:1000,texts:[box('[主餐]烤雞×10',250,100,380,50),box('飯',250,155,60,45),box('背景菜單',10,100,150,40),box('炸物',250,230,150,45),box('x22',490,230,145,45),box('200',615,230,60,45),box('商品數量',250,350)]});assert.deepEqual(r.items.map(i=>[i.name,i.qty,i.amount]),[['[主餐]烤雞飯','1','0'],['炸物','2','200']]);assert(r.items[1].warnings.length);
console.log('PASS: structured receipts, zero-price dishes, wrapped names, overlapping numeric boxes, order cards, metadata exclusions.');

r=R.fromBoxes({texts:[box('範例收據 SAMPLE',20,20,360),box('湯麵180',20,100,280),box('餃子120',20,180,280),box('茶60',20,260,280),box('合計360',20,340,280)]});assert.equal(r.items.length,3);assert.equal(r.items.reduce((s,i)=>s+Number(i.amount),0),360);console.log('PASS: single-box dish and amount rows.');
r=R.parse('薯條 2 100 200\n紅茶×2 120\n湯麵NT$180\n特調300');assert.deepEqual(r.items.map(i=>[i.name,i.qty,i.amount]),[['薯條','2','200'],['紅茶','2','120'],['湯麵','1','180'],['特調300','1','']]);assert.equal(R.suggest('特調300').amount,'300');assert.equal(R.suggest('一般餐名'),null);
r=R.fromBoxes({texts:[box('薯條 2 100 200',10,10,400)]});assert.equal(r.items[0].qty,'2');assert.equal(r.items[0].amount,'200');
r=R.fromBoxes({texts:[box('薯條',10,10),box('2 200',250,10)]});assert.equal(r.items[0].qty,'2');assert.equal(r.items[0].amount,'200');
r=R.fromBoxes({texts:[box('薯條 200',10,10,180),box('200',250,10)]});assert.equal(r.items[0].name,'薯條');assert.equal(r.items[0].amount,'200');
r=R.fromBoxes({texts:[box('特調300',10,10,180),box('300',250,10)]});assert.equal(r.items[0].name,'特調300');assert.equal(r.items[0].amount,'300');
console.log('PASS: inline quantity/unit/total, currency prefix, combined numeric boxes, duplicate price removal, numeric dish names.');
r=R.fromBoxes({texts:[box('名稱',10,10),box('數量',200,10),box('單價',350,10),box('小計',500,12),box('薯條',10,90),box('2',200,90),box('100',350,90),box('NT$200',500,90),box('總計',10,180)]});assert.deepEqual(r.items.map(i=>[i.name,i.qty,i.amount]),[['薯條','2','200']]);console.log('PASS: four spatial columns, offset subtotal header, NT$ amount box.');
