/* Loaded by the isolated beta builder only. Existing production UI is untouched. */
const BetaFeatures = (() => {
 if(window.ORYAN_BETA_REMOTE)return {edit(){},details(){}};
 let manual=false,contractRequest='',pending=null;
 function quote(form){const v=Object.fromEntries(new FormData(form));return Ledger.pricing(v.date,v);}
 function summary(q){return q?q.parts.map(p=>p.label+' '+money(p.cents/100)).join(' + '):'Choose an event date for a calculated price.';}
 function priceNote(form,id,apply){
  let q;try{q=quote(form);}catch{return;}
  if(!$(id))return;
  if(q&&apply)form.elements.total.value=(q.totalCents/100).toFixed(2);
  $(id).textContent=(apply?'Calculated: ':'Suggested: ')+summary(q)+(manual&&id==='#betaPriceNote'?' · Your typed price is kept.':'')+' Bar is free. Security is $30/hour, separate.';
 }
 function edit(form,r){
  if(r.type==='Blackout')return;
  form.elements.total.closest('label').insertAdjacentHTML('afterend','<p class="form-note wide" id="betaEditPriceNote" aria-live="polite"></p><button class="quiet wide" type="button" id="betaEditPriceUse">Use calculated price</button>');
  const update=()=>priceNote(form,'#betaEditPriceNote',false);if(form.betaPriceListener)form.removeEventListener('input',form.betaPriceListener);form.betaPriceListener=update;form.addEventListener('input',update);update();
  $('#betaEditPriceUse').onclick=()=>{priceNote(form,'#betaEditPriceNote',true);dirty=true;};
 }
 async function details(r){
  if(r.type==='Blackout')return;
  $('#detailContract').hidden=!!r.cancelled;
  $('#detailContent').insertAdjacentHTML('beforeend','<h3>Contracts</h3><p class="form-note">Fictional sample PDFs. Every saved copy is kept unchanged, including after cancellation.</p><div id="betaContractCopies" class="payment-history"></div>');
  try{
   const copies=await rpc('listContracts',r.id);if(detailId!==r.id||!$('#betaContractCopies'))return;
   $('#betaContractCopies').innerHTML=copies.map(c=>`<div><span><b>${money(c.totalCents/100)} · ${esc(c.templateVersion)}</b><small>${esc(c.createdAt)} · ${esc(c.createdBy)}</small></span><span><button type="button" class="quiet" data-contract-open="${esc(c.id)}">Open</button><button type="button" class="quiet" data-contract-download="${esc(c.id)}">Download</button></span></div>`).join('')||'<p class="empty-copy">No saved copies yet.</p>';
   $$('[data-contract-open],[data-contract-download]').forEach(b=>b.onclick=async()=>{
    try{const c=await rpc('getContract',r.id,b.dataset.contractOpen||b.dataset.contractDownload);if(!c)throw Error('This saved copy is unavailable.');
     const url=URL.createObjectURL(new Blob([Uint8Array.from(atob(c.base64),s=>s.charCodeAt(0))],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;if(b.dataset.contractDownload)a.download=c.filename;else{a.target='_blank';a.rel='noopener';}a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(error){toast(error.message);}
   });
  }catch(error){if($('#betaContractCopies'))$('#betaContractCopies').textContent='Could not load copies: '+error.message;}
 }
 function open(){
  const r=records.find(x=>x.id===detailId);if(!r||r.cancelled||r.type==='Blackout'||busy)return;
  contractId=r.id;contractRequest=uuid();pending=null;clearContractPdf();contractInitialChanged=false;dirty=false;
  const form=$('#contractForm');form.reset();form.elements.phone.value=(r.phone||'').slice(0,40);
  $('#contractGuest').textContent=r.client+' · '+dateLabel(r.date)+' · #'+r.contract;
  $('#contractSummary').innerHTML=`<span>Agreed price<b>${r.total==null?'Not entered':money(r.total)}</b></span><span>Recorded payments<b>${money(r.paid)}</b></span><span>Selected extras<b>${esc(Ledger.extrasList(r).join(', ')||'None')}</b></span>`;
  $('#contractPriceLabel').hidden=r.total!=null;$('#contractPriceNote').hidden=r.total!=null;form.elements.missingPrice.required=r.total==null;
  $('#contractSecurityLabel').hidden=!r.security;form.elements.securityHours.required=r.security;$('#contractConfirmLabel').hidden=contractDeadline(r.date)>=today();
  $('#contractInputs').hidden=false;$('#contractFile').hidden=true;$('#contractShare').hidden=true;$('#contractCreate').hidden=false;$('#contractCancel').textContent='Cancel';$('#betaContractRetry').hidden=true;
  formError('#contractError','');contractSchedule();$('#detailDialog').close();$('#contractDialog').showModal();form.elements.start.focus();
 }
 async function create(e){
  // The established form validates times, agreed price, hours and schedule before calling the beta transport.
  const original=BetaClient.rpc;
  BetaClient.rpc=async(name,...args)=>{
   if(name!=='createContract')return original(name,...args);
   const result=await original(name,...args,contractRequest);pending=result;return result;
  };
  try{await createContractPdf(e);}finally{BetaClient.rpc=original;}
  if(pending?.saveError&&contractPdf){formError('#contractError','PDF ready to download. Its copy was not saved: '+pending.saveError);$('#betaContractRetry').hidden=false;}
 }
 async function retry(){
  if(!pending||busy)return;busy=true;$('#betaContractRetry').disabled=true;
  try{await rpc('saveContractCopy',pending);$('#betaContractRetry').hidden=true;formError('#contractError','');toast('Contract copy saved.');}
  catch(error){formError('#contractError','PDF is still available to download. Copy was not saved: '+error.message);}
  finally{busy=false;$('#betaContractRetry').disabled=false;}
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');style.textContent='#betaContractCopies>div{flex-wrap:wrap;gap:12px}#betaContractCopies>div>span:first-child{min-width:0;overflow-wrap:anywhere;flex:1 1 220px}#betaContractCopies>div>span:last-child{flex-wrap:wrap}#contractForm .modal-actions{flex-wrap:wrap}';document.head.append(style);
  const form=$('#bookingForm');
  form.elements.total.closest('label').insertAdjacentHTML('afterend','<p class="form-note wide" id="betaPriceNote" aria-live="polite"></p><button class="quiet wide" type="button" id="betaPriceUse">Use calculated price</button>');
  form.addEventListener('reset',()=>{manual=false;queueMicrotask(()=>priceNote(form,'#betaPriceNote',false));});
  form.addEventListener('input',e=>{if(e.target.name==='total')manual=true;priceNote(form,'#betaPriceNote',!manual);bookingInput();});
  $('#betaPriceUse').onclick=()=>{manual=false;priceNote(form,'#betaPriceNote',true);bookingInput();};
  const originalOpen=openBooking;openBooking=function(...args){originalOpen(...args);priceNote(form,'#betaPriceNote',true);bookingInput();dirty=false;};$('#newBooking').onclick=openBooking;$('#mobileAdd').onclick=openBooking;
  form.querySelector('fieldset legend').textContent='Extras added to calculated price';
  const names={covers:'Table Covers +$200',audio:'Sound System +$100',projector:'Projector +$100',bar:'Bar · included free',security:'Security · $30/hour separately'};
  for(const [name,title] of Object.entries(names))form.elements[name].parentElement.lastChild.textContent=' '+title;
  $('#liveBalance').closest('.balance-preview').nextElementSibling.textContent='Calculated prices include selected paid extras. A typed price is kept until you choose Use calculated price. Security service and refundable deposits stay separate.';
  $('#contractSchedule + .form-note').textContent='The booking’s agreed total is used unchanged. Bar is free. Security service ($30/hour) and refundable deposits stay separate.';
  $('#contractForm > .form-note').textContent='Beta fictional summary only, without private contract terms. A copy saves in this browser automatically; no signatures or messages.';
  $('#contractShare').insertAdjacentHTML('beforebegin','<button class="quiet" type="button" id="betaContractRetry" hidden>Retry saving copy</button>');
  $('#detailContract').onclick=open;$('#contractForm').onsubmit=create;$('#betaContractRetry').onclick=retry;
  $('#contractDialog').addEventListener('close',()=>{pending=null;if(detailId)openDetails(detailId);});
 });
 return {edit,details};
})();
