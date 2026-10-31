/* Existing UI components only. No beta stylesheet or navigation redesign. */
const BetaUI = (() => {
 let action='',bookingId='',revision=0,requestId='',receiptHtml='';
 const actions=[['edit','Edit / reschedule'],['void','Correct a payment / deposit'],['deposit','Record a deposit transaction'],['refund','Record an event refund'],['settle','Set cancellation charge'],['restore','Restore booking / blocked date'],['release','Release blocked date'],['reconcile','Reconcile imported balance'],['contractStatus','Update contract status']];
 const label=(name,title,value='',type='text',required=true)=>`<label>${title}${required?' <span class="required">Required</span>':' <span class="optional">Optional</span>'}<input name="${name}" type="${type}" ${required?'required':''} value="${esc(value)}" ${type==='number'?'min="0" max="1000000" step="0.01"':'maxlength="150"'}></label>`;
 const select=(name,title,options,value)=>`<label>${title}<select name="${name}">${options.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`;}).join('')}</select></label>`;
 const note=()=>'<label class="wide">Reason for change <span class="required">Required</span><textarea name="reason" required rows="2" maxlength="500"></textarea></label>';
 function eligible(r,t){return t==='edit'?!r.cancelled:t==='restore'?r.cancelled:t==='release'?r.type==='Blackout'&&!r.cancelled:t==='settle'?r.cancelled&&r.type!=='Blackout':t==='reconcile'?r.imported:t==='contractStatus'?!r.cancelled&&r.type!=='Blackout':r.type!=='Blackout';}
 function metrics(){
  const list=records.filter(r=>scope==='all'||r.date.startsWith($('#year').value)),s=BetaLedger.summary(list);
  const values=[['Bookings',s.activeBookings,'Active events in this selection',ICONS.bookings],['Known agreed charges',money(s.charges),`${s.unpriced} prices / cancellation charges need review`,ICONS.value],['Net event payments',money(s.payments),`${money(s.credits)} credit / refund to review${s.unpricedPayments?' · '+money(s.unpricedPayments)+' paid with charge missing':''}`,ICONS.check],['Balance to collect',money(s.balance),`${money(s.depositHeld)} security deposits held separately`,ICONS.clock]];
  $('#metrics').innerHTML=values.map(([t,v,n,i])=>`<article class="metric"><div class="metric-top">${t}<span class="metric-icon">${i}</span></div><div class="metric-value">${v}</div><span class="metric-note">${n}</span></article>`).join('');
 }
 function attention(){
  const count=BetaLedger.summary(records).unsettled;if(!count)return;
  $('#attention').insertAdjacentHTML('beforeend',`<div class="attention-item"><span>${ICONS.alert}</span><div><b>${count} cancelled bookings need a settlement</b><p>Confirm the cancellation charge and review any refund or balance.</p></div><button type="button" id="betaSettlementReview" aria-label="Review cancellation settlements">${ICONS.chevronRight}</button></div>`);
  $('#betaSettlementReview').onclick=()=>{setView('bookings',false);scope='all';syncScope();$('#status').value='cancelled';$('#dateRange').value='all';page=0;renderTable();};
 }
 function tools(r){
  const opts=actions.filter(([t])=>eligible(r,t));
  const body=`<details class="optional-details" id="betaTools"><summary>Manage booking <span>Beta</span></summary><div class="form-grid">${select('betaAction','Action',opts,opts[0]?.[0])}<label>Open action<button type="button" class="quiet" id="betaContinue">Continue</button></label></div></details>`;
  $('#detailContent').insertAdjacentHTML('beforeend',body);
  $('#betaContinue').onclick=()=>open($('#detailContent [name=betaAction]').value,r.id);
  if(r.type==='Blackout'){
   if(r.cancelled){$('#detailTitle').textContent='Released blocked date';$('#detailContent .blackout-notice').textContent='This hold no longer reserves the date. Restore it only if the date is still available.';}
   $('#detailContent').insertAdjacentHTML('beforeend','<details class="optional-details"><summary>Change history</summary>'+r.activity.slice().reverse().map(a=>'<p class="booking-notes"><b>'+esc(a.type)+'</b> · '+esc(a.at)+'<br>'+esc(a.actor)+' · '+esc(a.reason)+'</p>').join('')+'</details>');
   return;
  }
  $('#detailContent').insertAdjacentHTML('beforeend',`<h3>Money & contract status</h3><dl class="booking-facts"><dt>Net event payments</dt><dd>${money(r.paid)}</dd><dt>${r.cancelled?'Cancellation charge':'Agreed event price'}</dt><dd>${r.financialTotal==null?'Needs review':money(r.financialTotal)}</dd><dt>Credit / refund to review</dt><dd>${r.credit==null?'Needs review':money(r.credit)}</dd><dt>Balance to collect</dt><dd>${money(balance(r))}</dd><dt>Security deposit received</dt><dd>${money(r.depositReceived)}</dd><dt>Deposit refunded / deducted</dt><dd>${money(r.depositRefunded)} / ${money(r.depositDeducted)}</dd><dt>Security deposit still held</dt><dd>${money(r.depositHeld)}</dd><dt>Contract status</dt><dd>${esc(r.contractStatus)}${r.contractStatusDate?' · '+dateLabel(r.contractStatusDate):''} (team record)</dd></dl><p class="form-note">Recorded transactions only; no money is sent or charged. Deposits never pay the event balance. Contract status does not collect or verify a signature.</p>`);
  const entries=[...(r.openingPaid?[{id:'opening:'+r.id,amount:r.openingPaid,date:r.openingDate,method:r.imported?'Historical total':r.openingMethod,kind:'Event payment'}]:[]),...r.payments.map(t=>({...t,kind:'Event payment'})),...r.refunds.map(t=>({...t,kind:'Event refund'})),...r.depositTransactions.map(t=>({...t,kind:'Security deposit '+({receive:'received',refund:'refund',deduct:'deduction'}[t.kind])}))];
  const renderEntries=items=>`${items.map(t=>{const voided=r.voids.some(v=>v.targetId===t.id);const printable=!(t.id.startsWith('opening:')&&(r.imported||!r.openingDate));return `<div><span><b>${esc(t.kind)}${voided?' · Voided':''}</b><small>${t.date?dateLabel(t.date):'Date unavailable'} · ${esc(t.method||'Not recorded')}</small>${t.note?`<small class="booking-notes">${esc(t.note)}</small>`:''}</span><span><strong>${money(t.amount)}</strong>${printable?`<button type="button" class="quiet" data-beta-receipt="${esc(t.id)}">Receipt</button>`:'<small>Historical total — no individual receipt</small>'}</span></div>`;}).join('')||'<p class="empty-copy">No transactions yet.</p>'}`;
  $('#detailContent .payment-history').innerHTML=renderEntries(entries.filter(t=>!t.kind.startsWith('Security deposit ')));
  $('#detailContent').insertAdjacentHTML('beforeend',`<details class="optional-details"><summary>Security deposit history</summary><div class="payment-history">${renderEntries(entries.filter(t=>t.kind.startsWith('Security deposit ')))}</div></details><details class="optional-details"><summary>Change history</summary>${r.activity.length?r.activity.slice().reverse().map(a=>`<p class="booking-notes"><b>${esc(actions.find(([t])=>t===a.type)?.[1]||a.type)}</b> · ${esc(a.at)}<br>${esc(a.actor)}${a.reason?' · '+esc(a.reason):''}${a.changes?.length?'<br><small>'+a.changes.map(c=>esc(c.field)+': '+esc(c.before)+' → '+esc(c.after)).join('<br>')+'</small>':''}</p>`).join(''):'<p class="empty-copy">No beta changes yet.</p>'}${r.imported?`<p class="form-note">Original imported price: ${r.original.total==null?'Missing':money(r.original.total)}; historical paid: ${money(r.original.openingPaid)}; listed balance: ${r.original.sheetBalance==null?'Missing':money(r.original.sheetBalance)}. Original values are preserved.</p>`:''}</details>`);
  $$('[data-beta-receipt]').forEach(b=>b.onclick=()=>receipt(r,b.dataset.betaReceipt));
 }
 function details(r){
  tools(r);
  $$('#detailContent .review-note').filter(n=>n.textContent.includes('Oryan Bookings column G')).forEach(n=>n.textContent='The agreed event price was missing in the import. Use Manage booking to reconcile it against the original documents. Historical payments are preserved.');
  if(!r.cancelled&&(r.total==null||Ledger.review(r))){const n=$('#detailContent .review-note');if(n)n.textContent='This booking needs reconciliation. Use Manage booking to confirm the agreed price and historical paid total against source documents. Original imported figures are preserved.';}
  if(r.cancelled&&r.type!=='Blackout'){
   $('#detailPayment').hidden=balance(r)<=0;
   $('#detailContent .review-note').textContent='Cancelled. Set the cancellation charge, review any refund due, or restore the booking under Manage booking. Existing receipts and downloaded contracts are preserved.';
  }
 }
 function open(t,id){
  if(busy)return;const r=records.find(r=>r.id===id);if(!r||!eligible(r,t))return;
  action=t;bookingId=id;revision=r.revision;requestId=uuid();const form=$('#betaForm');form.reset();formError('#betaError','');
  $('#betaTitle').textContent=actions.find(([k])=>k===t)[1];$('#betaGuest').textContent=`${r.client} · #${r.contract}`;
  let fields='';
  if(t==='edit')fields=label('client','Guest / hold name',r.client)+label('phone','Phone number',r.phone,'tel',false)+label('contract','Contract number',r.contract)+select('type','Event type',r.type==='Blackout'?[['Blackout','Blocked date']]:Ledger.types.filter(t=>t!=='Blackout'),r.type)+label('date','Event date',r.date,'date')+label('due','Balance due date',r.due,'date',false)+label('total','Agreed event price',r.total??'','number',false)+'<fieldset class="wide"><legend>Included extras</legend>'+['covers','projector','audio','bar','security'].map(k=>`<label><input type="checkbox" name="${k}" ${r[k]?'checked':''}> ${k==='covers'?'Covers+':k[0].toUpperCase()+k.slice(1)}</label>`).join('')+'</fieldset><label class="wide">Notes<textarea name="notes" rows="2" maxlength="2000">'+esc(r.notes)+'</textarea></label>';
  if(t==='void'){
   const entries=[...(r.openingPaid?[['opening:'+r.id,(r.imported?'Historical total':'Initial payment')+' · '+money(r.openingPaid)]]:[]),...r.payments.map(p=>[p.id,'Event payment · '+money(p.amount)+' · '+dateLabel(p.date)]),...r.refunds.map(p=>[p.id,'Event refund · '+money(p.amount)+' · '+dateLabel(p.date)]),...r.depositTransactions.map(p=>[p.id,'Deposit '+p.kind+' · '+money(p.amount)+' · '+dateLabel(p.date)])].filter(([id])=>!r.voids.some(v=>v.targetId===id));
   if(!entries.length){toast('There are no valid entries to correct.');return;}
   fields=select('targetId','Entry to void',entries,entries[0][0]);
  }
  if(t==='deposit')fields=select('kind','Transaction',[['receive','Deposit received'],['refund','Deposit refunded'],['deduct','Deposit deduction']], 'receive');
  if(['deposit','refund'].includes(t))fields+=label('amount','Amount','','number')+label('date','Transaction date',today(),'date')+select('method','Method',Ledger.methods,'Cash')+'<label class="wide">Receipt / notes <span class="optional">Optional</span><input name="note" maxlength="500"></label>';
  if(t==='settle')fields=label('amount','Total cancellation charge',r.cancellationFee??'','number');
  if(t==='reconcile')fields=label('total','Confirmed agreed event price',r.total??'','number')+label('openingPaid','Confirmed historical paid total',r.openingPaid,'number');
  if(t==='contractStatus')fields=select('status','Contract status',BetaLedger.statuses,r.contractStatus)+label('date','Status date',today(),'date');
  $('#betaFields').innerHTML=fields+note();
  if(t==='deposit'){const kind=form.elements.kind,method=form.elements.method;kind.onchange=()=>{method.closest('label').hidden=kind.value==='deduct';if(kind.value==='deduct')method.value='Other';};}
  $('#betaExplanation').textContent=t==='void'?'Void the mistaken entry without deleting its history. Record the correct payment separately. Voiding is a correction, not a refund.':t==='deposit'?'Record money actually received, refunded or retained from the security deposit. This never changes event payments.':t==='refund'?'Record an event refund already made. This does not send money.':t==='settle'?'Enter the agreed cancellation charge, including $0 if nothing is retained. The difference from net payments becomes a credit/refund to review or a balance to collect.':t==='reconcile'?'Confirm these figures against your source documents. Original imported values remain in change history. No individual historical receipt date will be invented.':t==='restore'?'The date must still be available. Payments, refunds, deposits and history remain unchanged. The event price becomes the charge again.':t==='release'?'Release this blocked date while keeping its history. You can restore it if the date remains available.':t==='contractStatus'?'Record the team’s status only. This does not create, send, sign or verify a contract.':'Changes save to this beta only. Existing payments and history are preserved; a new date must be available. Changing contract details resets its status to Not prepared.';
  dirty=false;$('#detailDialog').close();$('#betaDialog').showModal();form.querySelector('input,select,textarea')?.focus();
 }
 async function submit(e){
  e.preventDefault();if(busy)return;const form=e.target;if(!form.reportValidity())return;
  const values=Object.fromEntries(new FormData(form));if(action==='edit')for(const k of ['covers','projector','audio','bar','security'])values[k]=form.elements[k].checked;
  const cmd={type:action,bookingId,expectedRevision:revision,values};busy=true;form.setAttribute('aria-busy','true');[...form.querySelectorAll('button')].forEach(b=>b.disabled=true);formError('#betaError','');
  try{const result=await rpc('betaCommand',cmd,requestId);records=records.map(r=>r.id===bookingId?normalize(result.record):r);dirty=false;$('#betaDialog').close();updateYears();render();openDetails(bookingId);toast('Change saved to the beta.');}
  catch(error){formError('#betaError',error.message+' An interrupted save can be retried with the same details.');}
  finally{busy=false;form.setAttribute('aria-busy','false');[...form.querySelectorAll('button')].forEach(b=>b.disabled=false);}
 }
 function download(name,type,content){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function receipt(r,id){
  const t=BetaLedger.receipt(r,id);
  // Printable document styles do not affect the app's UI.
  receiptHtml=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>O’Ryan receipt</title></head><body><h1>O’Ryan Event Center</h1><h2>${esc(t.kind)} receipt${t.voided?' — VOID':''}</h2><p><b>BETA — FICTIONAL DATA</b></p><dl><dt>Receipt ID</dt><dd>${esc(t.id)}</dd><dt>Guest</dt><dd>${esc(t.client)}</dd><dt>Contract</dt><dd>${esc(t.contract)}</dd><dt>Event date</dt><dd>${esc(t.eventDate)}</dd><dt>Transaction date</dt><dd>${esc(t.date)}</dd><dt>Amount</dt><dd>${esc(money(t.amount))}</dd><dt>Method</dt><dd>${esc(t.method||'Not recorded')}</dd></dl>${t.note?'<p>'+esc(t.note)+'</p>':''}<p>This records a ledger transaction. It does not process a payment. Security deposits are separate from event charges.</p></body></html>`;
  $('#betaReceiptContent').innerHTML=`<p class="modal-sub">${esc(t.kind)}${t.voided?' · VOID':''} · #${esc(t.contract)}</p><div class="payment-summary"><span>Amount<b>${money(t.amount)}</b></span><span>Date<b>${dateLabel(t.date)}</b></span><span>Method<b>${esc(t.method||'Not recorded')}</b></span></div><p>${esc(t.client)}</p><p class="form-note">Fictional beta receipt. Download an HTML copy or print / save as PDF.</p>`;
  $('#detailDialog').close();$('#betaReceiptDialog').showModal();
 }
 function exportReport(){
  const selected=records.filter(r=>scope==='all'||r.date.startsWith($('#year').value)),s=BetaLedger.summary(selected);
  const rows=[['Oryan workflow beta — fictional data'],...Object.entries(s).map(([k,v])=>[k,v]),[],...BetaLedger.report(selected)];
  const quote=v=>'"'+String(v??'').replace(/^[\s]*[=+@\-]/,"'$&").replace(/"/g,'""')+'"';
  download('oryan-beta-report.csv','text/csv;charset=utf-8',rows.map(r=>r.map(quote).join(',')).join('\r\n'));
 }
 function loaded(){
  $('#connectionStatus').textContent=BetaClient.remote?'Beta Sheet · connected':'Beta · saved in this browser';
  $('#modeBanner').innerHTML=`<span>${ICONS.alert}</span><div><b>Workflow beta · fictional data.</b> ${BetaClient.remote?'Connected to the separate beta Sheet.':'Changes stay in this browser.'} Production is unchanged.</div>`;
  $('#reset').textContent='Reset beta data';$('#reset').hidden=BetaClient.remote;$('#reset').onclick=()=>{if(!busy&&confirm('Reset all fictional beta changes in this browser?')){BetaClient.reset();location.reload();}};
  $('#export').onclick=exportReport;$('#accountTitle').textContent='Beta mode';
 }
 document.addEventListener('DOMContentLoaded',()=>{
  if(window.ORYAN_BETA!==true)return;
  const closeIcon=$('#detailDialog .close').innerHTML;
  $('#cancelBookingError').insertAdjacentHTML('beforebegin','<label class="wide">Reason for cancellation <span class="required">Required</span><textarea name="reason" required rows="2" maxlength="500"></textarea></label>');
  document.body.insertAdjacentHTML('beforeend',`<dialog id="betaDialog" aria-labelledby="betaTitle"><form id="betaForm"><div class="modal-heading"><div><p class="eyebrow">WORKFLOW BETA</p><h2 id="betaTitle"></h2></div><button type="button" class="close" aria-label="Close">${closeIcon}</button></div><p class="modal-sub" id="betaGuest"></p><p class="form-note" id="betaExplanation"></p><div class="form-grid" id="betaFields"></div><p class="form-error" id="betaError" role="alert" hidden></p><div class="modal-actions"><button class="quiet" type="button" id="betaBack">Back</button><button class="primary" type="submit">Save change</button></div></form></dialog><dialog id="betaReceiptDialog" aria-labelledby="betaReceiptTitle"><div class="modal-heading"><div><p class="eyebrow">BETA RECEIPT</p><h2 id="betaReceiptTitle">Payment receipt</h2></div><button type="button" class="close" aria-label="Close">${closeIcon}</button></div><div id="betaReceiptContent"></div><div class="modal-actions"><button type="button" class="quiet" id="betaReceiptBack">Close</button><button type="button" class="quiet" id="betaReceiptDownload">Download</button><button type="button" class="primary" id="betaReceiptPrint">Print / save PDF</button></div></dialog>`);
  const back=()=>{if(!busy){if(dirty&&!confirm('Discard unsaved beta changes?'))return;dirty=false;$('#betaDialog').close();openDetails(bookingId);}};
  $('#betaForm').onsubmit=submit;$('#betaForm').oninput=()=>dirty=true;$('#betaBack').onclick=back;$('#betaDialog .close').onclick=back;$('#betaDialog').addEventListener('cancel',e=>{e.preventDefault();back();});
  const closeReceipt=()=>{$('#betaReceiptDialog').close();openDetails(detailId);};$('#betaReceiptBack').onclick=closeReceipt;$('#betaReceiptDialog .close').onclick=closeReceipt;
  $('#betaReceiptDownload').onclick=()=>download('Oryan-beta-receipt.html','text/html;charset=utf-8',receiptHtml);
  $('#betaReceiptPrint').onclick=()=>{const url=URL.createObjectURL(new Blob([receiptHtml],{type:'text/html'})),w=window.open(url,'_blank');if(!w){URL.revokeObjectURL(url);toast('Allow the receipt window, or use Download.');return;}w.addEventListener('load',()=>w.print(),{once:true});setTimeout(()=>URL.revokeObjectURL(url),60000);};
 });
 return {metrics,attention,details,loaded,open};
})();
