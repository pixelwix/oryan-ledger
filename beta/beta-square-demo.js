/* Fictional browser-only Square adapter. No transport or service credentials. */
const BetaSquare = (()=>{
 const cents=r=>Math.max(0,Math.round((r.financialTotal-r.paid)*100));
 function booking(s,id){const r=s.records.find(r=>r.id===id);if(!r||r.cancelled||r.settled||r.type==='Blackout')throw Error('Choose an active, unsettled event booking.');if(r.financialTotal==null)throw Error('Confirm the agreed booking price first.');return r;}
 function recorded(s,id){const req=s.requests.find(q=>q.key==='square-'+id);return s.records.find(r=>r.id===req?.bookingId||r.payments.some(p=>p.note==='Square payment '+id));}
 function run(s,name,args,meta){
  const store=s.squareDemo||={links:[],payments:[],sequence:0};
  const next=()=> 'DEMO-'+String(++store.sequence).padStart(8,'0');
  const [id,amount,options]=args;
  if(name==='getSquareStatus')return {state:s,result:{configured:true}};
  if(name==='createSquareLink'){
   if(typeof options?.requestId!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(options.requestId))throw Error('Invalid link request. Reopen the booking.');
   if(!Number.isSafeInteger(amount)||amount<100)throw Error('Enter a payment of at least $1.00 in whole cents.');
   const old=store.links.find(l=>l.requestId===options.requestId);
   if(old){if(old.bookingId!==id||old.amountCents!==amount)throw Error('This link request was already used with different details.');return {state:s,result:old};}
   if(amount>cents(booking(s,id)))throw Error('The link amount exceeds the current booking balance.');
   const linkId=next(),link={linkId,bookingId:id,amountCents:amount,requestId:options.requestId,url:'https://square.example.invalid/pay/'+linkId};store.links.push(link);return {state:s,result:link};
  }
  if(name==='simulateSquarePayment'){
   const link=store.links.find(l=>l.linkId===id),r=s.records.find(r=>!r.cancelled&&!r.settled&&r.type!=='Blackout'&&r.financialTotal!=null&&cents(r)>=100);
   if(!link&&!['unmatched','refunded','over-balance'].includes(id))throw Error('Choose a fictional link.');
   if(!link&&!r)throw Error('Reset beta data to restore a booking with a balance.');
   const p={paymentId:next(),status:'COMPLETED',currency:'USD',createdAt:meta.at,bookingId:link?.bookingId||(id==='unmatched'?null:r.id),amountCents:link?.amountCents||(id==='over-balance'?cents(r)+100:100),refunded:id==='refunded'};store.payments.push(p);return {state:s,result:p};
  }
  if(name==='listSquarePayments')return {state:s,result:{payments:store.payments.map(p=>{const r=s.records.find(r=>r.id===p.bookingId);return {...p,bookingLabel:r?r.client+' · '+r.date:null,alreadyRecorded:!!recorded(s,p.paymentId),attention:p.refunded?'Refunded payments need manual review.':r&&p.amountCents>cents(r)?'This Square payment exceeds the remaining booking balance. Review it before recording.':null};}),truncated:false}};
  if(name==='confirmSquarePayment'){
   const p=store.payments.find(p=>p.paymentId===id);if(!p)throw Error('Choose a fictional payment.');
   const prior=recorded(s,id);if(prior){if(amount&&amount!==prior.id)throw Error('This Square payment is already recorded on another booking.');return {state:s,result:{record:prior,duplicate:true}};}
   if(p.refunded)throw Error('This Square payment has a refund. Review it manually; refunds are outside Phase 1.');
   if(p.bookingId&&p.bookingId!==amount)throw Error('This Square payment belongs to another booking.');
   if(!p.bookingId&&(!amount||options?.confirmUnmatched!==true))throw Error('Choose a booking explicitly for this unmatched Square payment.');
   const r=booking(s,amount);if(p.amountCents>cents(r))throw Error('This Square payment exceeds the remaining booking balance. Review it before recording.');
   const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p.createdAt));
   const result=BetaLedger.execute(s,{type:'payment',bookingId:r.id,expectedRevision:r.revision,values:{amount:p.amountCents/100,date,method:'Card',note:'Square payment '+id}},'square-'+id,meta);return {state:result.state,result};
  }
  throw Error('Unknown fictional Square action.');
 }
 return {run};
})();
// Installed only by the browser-local build. Ledger and fake store share one lock/write.
const betaLedgerRpc=BetaClient.rpc;
BetaClient.rpc=async function(name,...args){
 if(!['getSquareStatus','createSquareLink','listSquarePayments','confirmSquarePayment','simulateSquarePayment'].includes(name))return betaLedgerRpc(name,...args);
 if(window.ORYAN_BETA!==true||BetaClient.remote)throw Error('Fictional Square is browser-local only.');
 if(!navigator.locks)throw Error('This browser cannot safely save beta changes.');
 const key='oryan-workflow-beta-v1';
 return navigator.locks.request(key,()=>{
  const stored=localStorage.getItem(key),state=stored?JSON.parse(stored):BetaLedger.initial(BETA_SEED);state.records=state.records.map(BetaLedger.derive);
  const output=BetaSquare.run(state,name,args,{id:uuid(),actor:'Beta tester',at:new Date().toISOString()});
  try{localStorage.setItem(key,JSON.stringify(output.state));}catch{throw Error('This browser could not save beta data. Nothing was changed.');}
  return JSON.parse(JSON.stringify(output.result));
 });
};
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelector('#modeBanner').insertAdjacentHTML('afterend','<section class="card" id="squareDemoPanel"><h2>Demo: fictional Square (no real payments)</h2><details class="optional-details"><summary>What to try · Square</summary><p>Open Alex Sample → Request payment by link → Copy → Simulate customer payment. In Payments, review and Confirm. Fake links cannot accept payments. Reset beta data starts over.</p></details><div class="toolbar"><button class="quiet" data-square-demo="unmatched">Simulate an unmatched payment</button><button class="quiet" data-square-demo="refunded">Simulate a refunded payment</button><button class="quiet" data-square-demo="over-balance">Simulate an over-balance payment</button></div><p id="squareDemoMessage" role="status"></p></section>');
 document.querySelectorAll('[data-square-demo]').forEach(b=>b.onclick=async()=>{try{await BetaClient.rpc('simulateSquarePayment',b.dataset.squareDemo);setView('payments');document.querySelector('#squareDemoMessage').textContent='Fictional payment added. Review it below.';}catch(e){document.querySelector('#squareDemoMessage').textContent=e.message;}});
 new MutationObserver(()=>{for(const section of document.querySelectorAll('#squareLinkTools,#squareInbox')){if(!section.querySelector('[data-fictional-square]')){const label=document.createElement('p');label.className='form-note';label.dataset.fictionalSquare='';label.textContent='Demo: fictional Square (no real payments)';section.prepend(label);}}const box=document.querySelector('.square-result');if(!box||box.hidden||box.querySelector('[data-simulate-link]'))return;const b=document.createElement('button');b.type='button';b.className='quiet';b.dataset.simulateLink='';b.textContent='Simulate customer payment';box.append(b);b.onclick=async()=>{try{const linkId=box.querySelector('input').value.split('/').pop();await BetaClient.rpc('simulateSquarePayment',linkId);toast('Fictional payment added. Open Payments to review.');}catch(e){toast(e.message);}};}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
});
