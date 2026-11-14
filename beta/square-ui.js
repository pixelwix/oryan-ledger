/* Production-only Square controls. No Square SDK, credentials or card fields. */
const SquareUI=(()=>{
 let configured=false,checking=false,loading=false;
 const eligible=r=>r&&!r.cancelled&&!r.settled&&r.type!=='Blackout'&&r.financialTotal!=null&&balance(r)>=1;
 async function loaded(){
  if(window.ORYAN_BETA!==true||window.ORYAN_BETA_REMOTE===true||checking)return;checking=true;
  try{configured=(await rpc('getSquareStatus')).configured===true;}catch(_){configured=false;}finally{checking=false;}
  showView();if($('#detailDialog').open)details(records.find(r=>r.id===detailId));
 }
 function showView(){
  let card=$('#squareInbox');
  if(!configured){if(card)card.hidden=true;return;}
  if(!card){$('.ledger').insertAdjacentHTML('beforebegin','<section class="card" id="squareInbox" hidden><div class="card-heading"><h2>Square payments to review</h2><button type="button" class="quiet" id="squareRefresh">Refresh</button></div><p class="form-note">Last 14 days. Review and confirm each payment to record it in the ledger.</p><div id="squareRows" class="payment-choices"></div><p id="squareError" class="form-error" role="alert" hidden></p></section>');card=$('#squareInbox');$('#squareRefresh').onclick=refresh;}
  card.hidden=view!=='payments';if(!card.hidden)refresh();
 }
 async function refresh(){
  if(loading)return;loading=true;$('#squareRefresh').disabled=true;formError('#squareError','');
  try{
   const result=await rpc('listSquarePayments',{}),items=result.payments.filter(p=>!p.alreadyRecorded);
   $('#squareRows').innerHTML=items.map((p,i)=>`<div class="square-row"><p><b>${esc(p.bookingLabel||'Unmatched payment')}</b><br>${esc(p.createdAt)} · ${esc(p.currency)} ${esc(Number.isSafeInteger(p.amountCents)?(p.amountCents/100).toFixed(2):'Needs review')}<br><small>${esc(p.paymentId)}</small></p>${p.attention?`<p class="review-note">${esc(p.attention)}</p>`:p.bookingId?`<button type="button" class="quiet" data-square-confirm="${i}">Confirm</button>`:`<label>Choose booking<select data-square-booking="${i}"><option value="">Choose a booking…</option>${records.filter(eligible).map(r=>`<option value="${esc(r.id)}">${esc(r.client+' · '+r.date)}</option>`).join('')}</select></label><button type="button" class="quiet" data-square-confirm="${i}">Confirm chosen booking</button>`}</div>`).join('')||'<p class="empty-copy">No Square payments to review.</p>';
   if(result.truncated)$('#squareRows').insertAdjacentHTML('beforeend','<p class="review-note">Only the first 500 payments were checked. Ask the owner to review the remaining payments in Square.</p>');
   $$('[data-square-confirm]').forEach(button=>button.onclick=async()=>{
    const i=Number(button.dataset.squareConfirm),p=items[i],chosen=p.bookingId||$(`[data-square-booking="${i}"]`).value;
    if(!chosen){formError('#squareError','Choose a booking for this payment first.');return;}
    button.disabled=true;formError('#squareError','');
    try{const result=await rpc('confirmSquarePayment',p.paymentId,chosen,{requestId:'square-'+p.paymentId,confirmUnmatched:!p.bookingId});records=records.map(r=>r.id===result.record.id?normalize(result.record):r);render();toast(result.duplicate?'Payment already recorded.':'Square payment recorded.');await refresh();}
    catch(e){formError('#squareError',e.message);}finally{button.disabled=false;}
   });
  }catch(e){formError('#squareError',e.message+' Your other ledger actions are still available.');}
  finally{loading=false;$('#squareRefresh').disabled=false;}
 }
 function details(r){
  $('#squareLinkTools')?.remove();if(!configured||!eligible(r))return;
  $('#detailContent').insertAdjacentHTML('beforeend',`<form id="squareLinkTools"><h3>Request payment by link</h3><label>Amount ($)<input name="amount" type="number" min="1" max="${balance(r).toFixed(2)}" step="0.01" inputmode="decimal" required value="${balance(r).toFixed(2)}"></label><button type="submit" class="quiet">Request payment by link</button><p class="form-error" role="alert" hidden></p><div class="square-result" hidden><p></p><label>Payment link<input readonly aria-label="Square payment link"></label><button type="button" class="quiet">Copy</button></div></form>`);
  const form=$('#squareLinkTools');let requestId=uuid(),lastAmount=null;
  form.onsubmit=async event=>{
   event.preventDefault();const amount=Math.round(Number(form.elements.amount.value)*100),error=form.querySelector('[role=alert]'),button=form.querySelector('[type=submit]');
   if(lastAmount!==null&&lastAmount!==amount)requestId=uuid();lastAmount=amount;button.disabled=true;error.hidden=true;
   try{const result=await rpc('createSquareLink',r.id,amount,{requestId}),box=form.querySelector('.square-result');box.hidden=false;box.querySelector('p').textContent=money(result.amountCents/100)+' payment link';box.querySelector('input').value=result.url;box.querySelector('button').onclick=async()=>{try{await navigator.clipboard.writeText(result.url);toast('Payment link copied.');}catch(_){box.querySelector('input').select();error.textContent='Select and copy the payment link above.';error.hidden=false;}};}
   catch(e){error.textContent=e.message;error.hidden=false;}finally{button.disabled=false;}
  };
 }
 return {loaded,showView,details};
})();
