'use strict';
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('zh-TW',{minimumFractionDigits:digits(),maximumFractionDigits:digits()}).format(n/10**digits()),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const digits=()=>['TWD','JPY','KRW'].includes($('currency').value)?0:2;
const minor=v=>Bill.toMinor(v,digits());
const payFmt=n=>n.toLocaleString('zh-TW');
const foreign=()=>$('currency').value!=='TWD';
function settlement(){if(!foreign())return null;const principal=Bill.toMinor($('twd-principal').value,0);const fee=Math.floor((principal*rate()+5000)/10000);return{principal,fee,total:principal+fee}}
const rate=()=>$('card-fee').checked?Bill.integer(Bill.toMinor($('card-rate').value,2),'刷卡費率',10000):0;
let nextId=3,people=[{id:1,name:'我'},{id:2,name:'同事'}],payer=1,items=[],paid=new Set(),photo=null,photoURL=null,worker=null,job=0,busy=false;
function tab(which){for(const mode of ['equal','items']){$(mode+'-panel').hidden=mode!==which;$(mode+'-tab').classList.toggle('active',mode===which);$(mode+'-tab').setAttribute('aria-pressed',String(mode===which));}}
$('equal-tab').onclick=()=>tab('equal');$('items-tab').onclick=()=>tab('items');
function equalRender(){try{const fx=settlement();const r=Bill.equal(minor($('amount').value),$('people').value,$('service').checked,fx?0:rate(),fx?fx.total:null);if(fx&&r.receiptTotal===0&&fx.total!==0)throw Error('餐費為 0，請核對外幣金額與台幣本金。');$('equal-result').innerHTML=`<h2>付錢的人</h2><div class="amount">${payFmt(r.payer)} <small>元 TWD</small></div><p>${r.remainder?`已包含零頭 ${payFmt(r.remainder)} 元`:'沒有零頭，剛好分配'}</p><p>${Number($('people').value)>1?`其他人各 <strong>${payFmt(r.each)} 元 TWD</strong>`:'由你支付全部金額'}</p><div class="row"><span>收據金額（含服務費）</span><span>${fmt(r.receiptTotal)} ${esc($('currency').value)}</span></div><div class="row"><span>餐廳服務費</span><span>${fmt(r.fee)} ${esc($('currency').value)}</span></div>${fx?`<div class="row"><span>台幣刷卡本金</span><span>${payFmt(fx.principal)} 元</span></div>`:''}<div class="row"><span>銀行刷卡手續費</span><span>${payFmt(fx?fx.fee:r.cardFee)} 元</span></div><div class="row"><strong>分帳合計</strong><strong>${payFmt(r.total)} 元 TWD ✓</strong></div>`}catch(e){$('equal-result').textContent=foreign()&&!$('twd-principal').value?'請先填寫未含手續費的台幣刷卡本金，再查看分帳結果。':e.message}}
for(const id of ['amount','people','service'])$(id).oninput=equalRender;
function changed(){paid.clear();$('confirmed').checked=false;renderSummary()}
function renderPeople(){
 $('participants').innerHTML=people.map(p=>`<div class="person"><span>${esc(p.name)} ${p.id===payer?'<span class="pill">付錢的人</span>':''}</span><button class="secondary" data-remove-person="${p.id}" aria-label="移除 ${esc(p.name)}">移除</button></div>`).join('');
 $('payer').innerHTML=people.map(p=>`<option value="${p.id}" ${p.id===payer?'selected':''}>${esc(p.name)}</option>`).join('');
}
$('add-person').onclick=()=>{const name=$('new-person').value.trim();if(!name)return;if(people.length>=50)return alert('最多 50 人。');if(people.some(p=>p.name===name))return alert('這個名稱已存在，請加上代號區分。');const id=nextId++;people.push({id,name});if(people.length===1)payer=id;$('new-person').value='';renderPeople();renderItems();changed()};
$('new-person').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('add-person').click()}};
$('participants').onclick=e=>{const b=e.target.closest('[data-remove-person]');if(!b)return;const id=Number(b.dataset.removePerson);if(!confirm('移除此人會重新分配共食金額，並清除已收款標記。確定移除？'))return;people=people.filter(p=>p.id!==id);items.forEach(i=>i.owners=i.owners.filter(o=>o!==id));if(payer===id)payer=people[0]?.id;renderPeople();renderItems();changed()};
$('payer').onchange=()=>{payer=Number($('payer').value);renderPeople();changed()};
function renderItems(){
 $('items').innerHTML=items.length?items.map(i=>`<article class="item" data-id="${i.id}"><div class="item-fields"><label>餐點名稱<input data-field="name" maxlength="100" value="${esc(i.name)}"></label><label>數量<input data-field="qty" type="number" min="1" step="1" value="${esc(i.qty)}"></label><label>小計（${esc($('currency').value)}）<input data-field="amount" type="number" min="0" step="${digits()?'0.01':'1'}" value="${esc(i.amount)}"></label></div><span class="hint">誰吃這道餐點？</span><div class="choices">${people.map(p=>`<label class="check"><input type="checkbox" data-owner="${p.id}" ${i.owners.includes(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div><div class="actions"><button class="secondary" data-action="all">全部人共食</button><button class="secondary" data-action="none">清除勾選</button><button class="secondary" data-action="remove">刪除餐點</button></div></article>`).join(''):'<p class="hint">尚無餐點。可辨識收據，或按「手動新增餐點」。</p>';
}
$('add-item').onclick=()=>{items.push({id:nextId++,name:'',qty:'1',amount:'',owners:[]});renderItems();changed();$('items').lastElementChild.querySelector('input').focus()};
$('items').oninput=e=>{const row=e.target.closest('[data-id]');if(!row)return;const i=items.find(i=>i.id===Number(row.dataset.id));if(e.target.dataset.field)i[e.target.dataset.field]=e.target.value;if(e.target.dataset.owner){const id=Number(e.target.dataset.owner);i.owners=e.target.checked?[...new Set([...i.owners,id])]:i.owners.filter(o=>o!==id)}changed()};
$('items').onclick=e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=Number(b.closest('[data-id]').dataset.id),i=items.find(i=>i.id===id);if(b.dataset.action==='all')i.owners=people.map(p=>p.id);if(b.dataset.action==='none')i.owners=[];if(b.dataset.action==='remove')items=items.filter(i=>i.id!==id);renderItems();changed()};
for(const id of ['item-service','discount','receipt-total'])$(id).oninput=changed;
$('confirmed').onchange=()=>{paid.clear();renderSummary()};
function renderSummary(){
 const unassigned=items.filter(i=>!i.owners.length);$('unassigned').textContent=unassigned.length?`尚未分配 ${unassigned.length} 道：${unassigned.map(i=>i.name||'未命名餐點').join('、')}`:items.length?'所有餐點皆已分配 ✓':'';$('unassigned').className=unassigned.length?'bad':'good';
 try{
 const fx=settlement();
 const r=Bill.calculate(people,items.map(i=>({...i,amount:minor(i.amount)})),payer,$('item-service').checked,minor($('discount').value),fx?0:rate(),fx?fx.total:null);
 let audit=`<div class="row"><span>餐點小計</span><span>${fmt(r.subtotal)} ${esc($('currency').value)}</span></div><div class="row"><span>折扣</span><span>−${fmt(r.discount)} ${esc($('currency').value)}</span></div><div class="row"><span>服務費</span><span>${fmt(r.fee)} ${esc($('currency').value)}</span></div><div class="row"><strong>收據核對金額</strong><strong>${fmt(r.receiptTotal)} ${esc($('currency').value)}</strong></div>`;
 let matched=false;try{const receipt=minor($('receipt-total').value);const diff=r.receiptTotal-receipt;matched=diff===0;audit+=`<p class="${matched?'good':'bad'}">${matched?'與收據總額一致 ✓':`與收據相差 ${fmt(Math.abs(diff))} ${esc($('currency').value)}（計算${diff>0?'較多':'較少'}），請修正餐點或費用。`}</p>`}catch{audit+='<p class="bad">請填寫收據最終總額，完成核對。</p>'}
 audit+=`${fx?`<div class="row"><span>台幣刷卡本金</span><span>${payFmt(fx.principal)} 元</span></div>`:''}<div class="row"><span>銀行刷卡手續費</span><span>${payFmt(fx?fx.fee:r.cardFee)} 元</span></div><div class="row"><strong>最終分帳總額</strong><strong>${payFmt(r.total)} 元 TWD</strong></div>`; $('audit').innerHTML=audit;
 if(!matched||!$('confirmed').checked){$('shares').innerHTML='<p class="hint">完成總額核對，並勾選「我已核對所有餐點、數量與小計」，才會顯示正式分帳與收款清單。</p>';return}
 const pending=r.shares.filter(p=>p.id!==payer&&p.amount>0&&!paid.has(p.id));
 $('shares').innerHTML=r.shares.map(p=>`<div class="share"><div class="row"><span>${esc(p.name)} ${p.id===payer?'<span class="pill">付錢的人</span>':''}</span><strong>${payFmt(p.amount)} 元 TWD</strong></div>${p.id===payer?`<p class="hint">自行負擔，含分配零頭 ${payFmt(r.remainder)} 元。</p>`:p.amount===0?'<p class="hint">無需付款</p>':`<label class="check"><input type="checkbox" data-paid="${p.id}" ${paid.has(p.id)?'checked':''}>${paid.has(p.id)?'已收款':'尚未付款（收到後勾選）'}</label>`}</div>`).join('')+`<p class="good">分帳合計 ${payFmt(r.shares.reduce((s,p)=>s+p.amount,0))} 元 ＝ 最終分帳總額 ${payFmt(r.total)} 元 TWD ✓</p><p>${pending.length?`待收 ${pending.length} 人，共 ${payFmt(pending.reduce((s,p)=>s+p.amount,0))} 元`:'已全部收齊 ✓'}</p><p class="hint">先合併各人餐費，按比例分攤折扣、服務費及刷卡手續費；外幣餐費作比例分配，最後按台幣總額分帳。各人金額取整數，其餘零頭由付款者負擔。</p>`;
 }catch(e){$('audit').textContent=e.message;$('shares').innerHTML='<p class="hint">請完成餐點輸入與分配，再核對金額。</p>'}
}
$('shares').onchange=e=>{if(e.target.dataset.paid){const id=Number(e.target.dataset.paid);if(e.target.checked)paid.add(id);else paid.delete(id);renderSummary()}};
function clearPhoto(){if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;photo=null;$('photo').value='';$('preview').removeAttribute('src');$('preview').hidden=true;$('recognize').disabled=true;$('clear-photo').hidden=true;$('ocr-text').value='';$('ocr-status').textContent=''}
$('photo').onchange=()=>{const f=$('photo').files[0];if(!f)return;clearPhoto();if(f.size>20*1024*1024){$('ocr-status').textContent='照片超過 20 MB，請縮小後再選擇。';return}photo=f;photoURL=URL.createObjectURL(f);$('preview').src=photoURL;$('preview').hidden=false;$('clear-photo').hidden=false;$('recognize').disabled=false;$('ocr-status').textContent='照片已選擇。按「辨識照片」開始。'};
$('preview').onerror=()=>{$('ocr-status').textContent='瀏覽器無法讀取這張照片。請改用 JPG、PNG 或 WebP（HEIC 可先轉成 JPG）。';$('recognize').disabled=true};
$('clear-photo').onclick=clearPhoto;
function loadOCR(){if(window.Tesseract)return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';const timer=setTimeout(()=>{s.remove();reject(Error('載入逾時'))},45000);s.onload=()=>{clearTimeout(timer);resolve()};s.onerror=()=>{clearTimeout(timer);s.remove();reject(Error('無法下載辨識工具'))};document.head.append(s)})}
function setBusy(value){busy=value;$('ocr-language').disabled=value;$('sample-photo').disabled=value;$('recognize').disabled=value||!photo;$('photo').disabled=value;$('clear-photo').disabled=value;$('cancel-ocr').hidden=!value}
async function cancelOCR(){job++;if(worker){await worker.terminate();worker=null}setBusy(false);$('ocr-status').textContent='已取消辨識，可重試或手動輸入。'}
$('cancel-ocr').onclick=cancelOCR;
$('recognize').onclick=async()=>{
 if(!photo||busy)return;const ticket=++job;setBusy(true);$('ocr-status').textContent='下載辨識工具中，照片不會上傳…';let localWorker;let timer;
 try{
 timer=setTimeout(()=>{if(ticket===job){cancelOCR();$('ocr-status').textContent='辨識時間過長，已停止。可縮小照片重試，或手動輸入。'}},180000);
 await loadOCR();if(ticket!==job)return;
 localWorker=await Tesseract.createWorker($('ocr-language').value.split('+'),1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0',cacheMethod:'none',logger:m=>{if(ticket===job)$('ocr-status').textContent=m.status==='recognizing text'?`正在辨識文字 ${Math.round((m.progress||0)*100)}%`:'正在準備辨識語言資源…'}});
 if(ticket!==job){await localWorker.terminate();return}worker=localWorker;
 const {data}=await worker.recognize(photo);if(ticket!==job)return;
 $('ocr-text').value=data.text;$('ocr-text').closest('details').open=true;$('ocr-status').textContent=data.text.trim()?'辨識完成。請檢查文字，再按「將文字加入待確認餐點」。':'沒有辨識到文字。請換張清楚的照片，或手動輸入。';
 }catch(e){if(ticket===job)$('ocr-status').textContent='辨識失敗，請確認網路與照片格式後重試；也可直接手動新增餐點。'}finally{clearTimeout(timer);if(localWorker)try{await localWorker.terminate()}catch{}if(ticket===job){worker=null;setBusy(false)}}
};
$('import-text').onclick=()=>{const parsed=Bill.parseReceipt($('ocr-text').value);if(!parsed.items.length){$('ocr-status').textContent='找不到可匯入的餐點。請以「餐點名稱 金額」逐行輸入，或手動新增。';return}if(!confirm(`加入 ${parsed.items.length} 道待確認餐點？最後一個數字會視為該列小計，請對照照片確認。`))return;items.push(...parsed.items.map(i=>({...i,id:nextId++})));renderItems();changed();$('ocr-status').textContent=`已加入 ${parsed.items.length} 道餐點，略過 ${parsed.skipped} 行。請檢查是否漏項、重複，以及數量和小計是否正確。`};
$('reset').onclick=async()=>{if(!confirm('清除本次照片、餐點、人員與收款紀錄？此操作無法復原。'))return;if(busy)await cancelOCR();clearPhoto();people=[{id:1,name:'我'},{id:2,name:'同事'}];payer=1;items=[];paid.clear();$('discount').value='0';$('receipt-total').value='';$('item-service').checked=false;$('new-person').value='';renderPeople();renderItems();changed()};
window.addEventListener('beforeunload',e=>{if(items.length||photo){e.preventDefault();e.returnValue=''}});
equalRender();renderPeople();renderItems();renderSummary();

$('sample-photo').onclick=()=>{
 clearPhoto();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1000,600);ctx.fillStyle='#000000';ctx.font='42px sans-serif';['範例收據 SAMPLE','牛肉麵 180','水餃 120','紅茶 60','合計 360'].forEach((line,i)=>ctx.fillText(line,60,90+i*95));canvas.toBlob(blob=>{photo=blob;photoURL=URL.createObjectURL(blob);$('preview').src=photoURL;$('preview').hidden=false;$('clear-photo').hidden=false;$('recognize').disabled=false;$('ocr-status').textContent='這是虛構範例，合計 360。請使用繁體中文辨識，按「辨識照片」試試看。'},'image/png');
};
function currencyUI(){ $('currency-hint').textContent=foreign()?'以 '+$('currency').value+' 記錄收據（'+(digits()?'可填兩位小數':'整數')+'），依台幣本金與銀行費率結算。切換幣別不會自動換算輸入值。':'以新臺幣記錄及分帳，維持整數。';$('fx-fields').hidden=!foreign();for(const id of ['amount','discount','receipt-total'])$(id).step=digits()?'0.01':'1';$('rate-label').hidden=!$('card-fee').checked;}
$('currency').onchange=()=>{if(foreign())$('card-fee').checked=true;currencyUI();renderItems();changed();equalRender()};
$('card-fee').onchange=()=>{currencyUI();changed();equalRender()};
for(const id of ['card-rate','twd-principal'])$(id).oninput=()=>{changed();equalRender()};
currencyUI();
