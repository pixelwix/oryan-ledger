import {paymentMethods,togglePaymentMethod} from './payment-method.mjs';
import {pollDocuments,stopDocumentsPoll,warmDocuments,BACKGROUND_MESSAGE,documentOperation,finishDocumentOperation,STILL_SAVING} from './documents-lifecycle.mjs';
import {contractAllowed,schedulePassed,outdatedContract,refreshContractCard} from './document-state.mjs';
import {createDocumentProgress} from './document-progress.mjs';
const records=new WeakMap(),recordBoxes=new WeakMap();
function remember(api,id,record){let map=records.get(api);if(!map){map=new Map();records.set(api,map);}map.set(id,record);return record;}
const rowTemplates=new WeakMap(),rowProgress=new WeakMap(),rowStates=new WeakMap();
import paymentScreen from './screens/record-payment.mjs';
export async function downloadDocument(api,id,toast){warmDocuments(api);const {blob,filename,preview}=await api.downloadDocument(id),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);if(preview)toast('Synthetic PDF preview.');}
export async function mountDocuments(api,id,toast){
 if(api.documentsEnabled===false)return;
 if(location.hash.split('?')[0]!=='#/booking/'+encodeURIComponent(id))return;
 const section=[...document.querySelectorAll('section.card')].find(el=>el.querySelector('h2')?.textContent==='Contract & Documents');if(!section)return;
 const box=section.lastElementChild;stopDocumentsPoll(api);for(const progress of rowProgress.get(box)||[])progress.stop();rowProgress.set(box,[]);let samples=rowTemplates.get(box);if(!samples){samples=[...box.children].map(el=>el.cloneNode(true));rowTemplates.set(box,samples);}const sample=samples[0];
 let rows,record;try{rows=await api.documents(id);record=(recordBoxes.get(box)?records.get(api)?.get(id):null)||api.cachedDetail?.(id)||await api.detail(id);remember(api,id,record);recordBoxes.set(box,true);}catch{box.replaceChildren();const retry=document.createElement('button');retry.className='btn btn-quiet btn-sm';retry.textContent='Retry';retry.onclick=()=>mountDocuments(api,id,toast);box.append(retry);watchPending(rows||rowStates.get(box)||[]);return;}
 if(!box.isConnected||location.hash.split('?')[0]!=='#/booking/'+encodeURIComponent(id))return;
 for(const op of operationMap(api).values())if(op.bookingId===id&&op.uncertain&&!rows.some(r=>r.id===op.requestId))rows.push({id:op.requestId,status:'pending',localRetry:op.retry});
 if(id!=='sophia'){const badge=section.querySelector('.card-header .badge');if(badge)badge.textContent=rows.some(row=>row.status==='saved')?'Saved':rows.some(row=>row.status==='pending'&&documentOperation(api,row.id))?'Saving pending':'No saved copies';}
 for(const [key,op] of operationMap(api))if(op.bookingId===id&&rows.some(r=>r.id===op.requestId&&r.status==='saved'))operationMap(api).delete(key);
 const previous=rowStates.get(box)||[];rowStates.set(box,rows.map(r=>({id:r.id,status:r.status})));
 const completed=rows.filter(r=>r.status!=='pending'&&documentOperation(api,r.id));
 if(completed.some(r=>r.status==='saved'&&r.kind==='contract')){record=await api.detail(id);remember(api,id,record);}
 for(const row of completed)finishDocumentOperation(api,row.id);
 refreshContractCard(record);
 if(rows.some(r=>r.status==='saved'&&previous.some(p=>p.id===r.id&&p.status!=='saved'))){toast('PDF saved.');document.body.dispatchEvent(new CustomEvent('contract-saved'));}
 box.replaceChildren();for(const [index,row] of rows.entries()){const el=(samples[index]||sample).cloneNode(true);el.dataset.documentId=row.id;el.querySelector('strong').textContent=row.status==='saved'?row.filename:row.status==='pending'?(documentOperation(api,row.id)?'Saving...':'PDF pending'):'PDF save not confirmed';el.querySelector('span').textContent=row.status!=='saved'?(row.status==='failed'?(row.retry_message||'Save not confirmed · Retry'):documentOperation(api,row.id)?'Saving...':'Use Retry to check or save this PDF'):row.display||(row.preview?el.querySelector('span').textContent:null)||(row.page_count+' pages · Generated '+new Date(row.generated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'America/Chicago'}));const changed=outdatedContract(row,record);if(changed){const note=document.createElement('p');note.className='form-label-note';note.textContent='Out of date - booking changed on '+changed;el.querySelector('strong').parentElement.append(note);}const button=el.querySelector('button');if(row.status!=='saved')button.className='btn btn-quiet';button.textContent=row.status==='saved'?'Download':'Retry';button.onclick=async()=>{button.disabled=true;try{if(row.status==='saved')await downloadDocument(api,row.id,toast);else{toast('Saving PDF…');if(row.localRetry)await row.localRetry();else {const progress=createDocumentProgress(el.firstElementChild,row.kind==='contract'?'contract':'receipt');try{documentOperation(api,row.id,true);const result=await api.retryDocument(row.id);await progress.finish(result?.status==='saved');}catch(error){progress.error(error.message);throw error;}}await mountDocuments(api,id,toast);}}catch(e){toast(e.message);}finally{button.disabled=false;}};if(row.status==='pending'&&documentOperation(api,row.id)&&Date.now()-documentOperation(api,row.id).started<300000){const progress=createDocumentProgress(el.firstElementChild,row.kind==='contract'?'contract':'receipt',Date.parse(row.generated_at)||Date.now());rowProgress.get(box).push(progress);}box.append(el);}
 watchPending(rows);
 function watchPending(rows){const row=rows.find(r=>r.status==='pending'&&documentOperation(api,r.id));if(!row)return;pollDocuments(api,id,()=>mountDocuments(api,id,toast),3000,'#/booking/'+encodeURIComponent(id),row.id,()=>{for(const progress of rowProgress.get(box)||[])progress.stop();const note=document.createElement('p');note.textContent=STILL_SAVING;const refresh=document.createElement('button');refresh.className='btn btn-quiet';refresh.textContent='Refresh Saved copies';refresh.onclick=()=>mountDocuments(api,id,toast);box.append(note,refresh);});}
}

// A row-menu submission can complete while Bookings is still open. Watch only
// that accepted copy and refresh the existing list through its normal event.
function watchListDocument(api,id,requestId,toast){
 const hash=location.hash.split('?')[0];if(!['','#/','#/bookings'].includes(hash))return;
 pollDocuments(api,id,async()=>{
  const row=(await api.documents(id)).find(r=>r.id===requestId);
  if(row?.status==='saved'){finishDocumentOperation(api,requestId);stopDocumentsPoll(api);if(operationMap(api).get(id)?.requestId===requestId)operationMap(api).delete(id);toast('PDF saved.');document.body.dispatchEvent(new CustomEvent('contract-saved'));}
  else if(row?.status==='failed'){finishDocumentOperation(api,requestId);stopDocumentsPoll(api);toast('Save not confirmed. Retry from Saved copies.');}
  else watchListDocument(api,id,requestId,toast);
 },3000,hash,requestId,()=>{
  toast(STILL_SAVING);const notice=document.createElement('div');notice.className='alert alert-info';const text=document.createElement('p');text.textContent=STILL_SAVING;const refresh=document.createElement('button');refresh.className='btn btn-quiet';refresh.textContent='Refresh Saved copies';refresh.onclick=async()=>{try{const row=(await api.documents(id)).find(r=>r.id===requestId);if(row?.status==='saved'||row?.status==='failed'){finishDocumentOperation(api,requestId);notice.remove();toast(row.status==='saved'?'PDF saved.':'Save not confirmed. Retry from Saved copies.');document.body.dispatchEvent(new CustomEvent('contract-saved'));}}catch(error){toast(error.message);}};notice.append(text,refresh);document.querySelector('main')?.prepend(notice);
 });
}
// Keep a dismissed, uncertain request in memory. Reopening or retrying resumes
// this operation, never a newly generated contract. Nothing is stored on disk.
const operations=new WeakMap(),drafts=new WeakMap();
function operationMap(api){let map=operations.get(api);if(!map){map=new Map();operations.set(api,map);}return map;}
async function lookup(api,id,requestId){return (await api.documents(id)).find(row=>row.id===requestId||row.request_id===requestId);}
export async function contractSheet(api,id,toast){
 warmDocuments(api);
 if(document.getElementById('documentModal'))return;
 const opener=document.activeElement,record=await api.detail(id);
 if(document.getElementById('documentModal'))return;
 if(!contractAllowed(record)){toast(record.cancelled?'No contract PDF for a cancelled booking.':'No contract PDF for a blocked date.');return;}
 const host=document.createElement('div');host.innerHTML=paymentScreen(await api.presentation('record-payment'));
 if(document.getElementById('documentModal'))return;
 const modal=host.querySelector('.modal-backdrop'),form=modal.querySelector('form');
 form.dataset.commandForm='true';form.removeAttribute('data-action');form.id='documentForm';modal.id='documentModal';
 modal.querySelector('.badge').textContent='Contract PDF';modal.querySelector('.modal-title').textContent='Contract PDF';
 modal.querySelector('.modal-header p').textContent=record.client+' · Contract #'+(record.contract||'—');
 modal.querySelector('.modal-header').nextElementSibling.remove();form.replaceChildren();
 const map=operationMap(api);let operation=map.get(id);
 const draft=drafts.get(api)?.get(id);
 const values={};
 const groups=[['Rental window',[['start','Rental start',record.rentalWindow?.start||'10:00','time'],['end','Rental end',record.rentalWindow?.end||'00:00','time']]],
 ['Payment terms',[['initial','Initial payment','0','number','0.00','Amount shown on this PDF only; no payment is recorded.']]],
 ['Contact',[['address','Address','','text','Street, city, state and ZIP','Customer contact address printed on the contract.'],['phone','Phone',record.phone||'','tel','Customer phone']]],
 ['Staff & title',[['staff','Staff','','text','Staff member name','Staff member named on the contract.'],['title','Title','','text','e.g. Event coordinator','Role of the staff member named above.']]],
 ...(record.security?[['Security',[['securityHours','Security hours','4','number','4']]]]:[]),
 ...(record.total==null?[['Agreed price',[['missingPrice','Missing agreed price','','number','0.00','Price for this PDF only; the ledger is unchanged.']]]]:[])];
 for(const [heading,fields] of groups){
  const section=document.createElement('div');section.className='form-group';const title=document.createElement('h3');title.className='form-label';title.textContent=heading;section.append(title);
  for(const [key,label,value,type,placeholder,hint] of fields){
   const group=document.createElement('div');group.className='form-group';const caption=document.createElement('label');caption.className='form-label';caption.htmlFor='document-'+key;caption.textContent=label;
   const input=document.createElement('input');input.className='form-input';input.id=caption.htmlFor;input.name=key;input.type=type;input.value=operation?.values?.[key]??value;if(placeholder)input.placeholder=placeholder;
   if(type==='number'){input.inputMode='decimal';input.min='0';input.step='0.01';}values[key]=input;group.append(caption,input);
   if(hint){const note=document.createElement('p');note.className='form-label-note';note.id=input.id+'-hint';note.textContent=hint;input.setAttribute('aria-describedby',note.id);group.append(note);}section.append(group);
  }
  if(heading==='Payment terms'){
   const group=document.createElement('div');group.className='form-group';group.setAttribute('role','group');group.setAttribute('aria-labelledby','document-method-label');
   const caption=document.createElement('div');caption.id='document-method-label';caption.className='form-label';caption.textContent='Payment via';
   const hint=document.createElement('p');hint.id='document-method-hint';hint.className='form-label-note';hint.textContent='Optional. Marks one box on the printed contract.';group.setAttribute('aria-describedby',hint.id);
   const choices=document.createElement('div');choices.style.cssText='display:flex;flex-wrap:wrap;gap:var(--space-3);';
   values.method={value:operation?.values?.method??draft?.method??''};const boxes=[];
   for(const method of paymentMethods){const label=document.createElement('label');label.className='form-checkbox-label';label.style.minHeight='44px';label.htmlFor='document-method-'+method;const box=document.createElement('input');box.type='checkbox';box.className='form-checkbox';box.id=label.htmlFor;box.name='method';box.value=method;box.checked=values.method.value===method;boxes.push(box);box.onchange=()=>{values.method.value=togglePaymentMethod(values.method.value,method);for(const other of boxes)other.checked=other.value===values.method.value;};label.append(box,document.createTextNode(method));choices.append(label);}
   group.append(caption,hint,choices);section.append(group);
  }form.append(section);
 }
 const confirm=document.createElement('div');confirm.className='form-group';const label=document.createElement('label');label.className='form-checkbox-label';label.htmlFor='document-confirm';
 const check=document.createElement('input');check.type='checkbox';check.className='form-checkbox';check.id=label.htmlFor;check.checked=operation?.values?.confirmSchedule||false;label.append(check,document.createTextNode('Confirm payment schedule'));confirm.append(label);if(schedulePassed(record,api.today)){const warning=document.createElement('div');warning.className='alert alert-warning';const content=document.createElement('div');const hint=document.createElement('p');hint.className='form-label-note';hint.textContent='The payment deadline for this event has passed. Tick to confirm the schedule on the PDF.';content.append(label,hint);warning.append(content);confirm.replaceChildren(warning);}form.append(confirm);
 const status=document.createElement('div');status.className='alert alert-info';status.hidden=true;status.style.display='none';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);
 // Verbatim footer layout from the locked payment sheet.
 const footer=document.createElement('div');
 footer.style.cssText='display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5); border-top: 1px solid var(--line-subtle); padding-top: var(--space-4);';
 const cancel=document.createElement('button');cancel.id='document-cancel';cancel.type='button';cancel.className='btn btn-quiet';cancel.textContent='Cancel';
 const submit=document.createElement('button');submit.id='document-save';submit.type='submit';submit.className='btn btn-primary';submit.textContent='Save Contract PDF';footer.append(cancel,submit);form.append(footer);
 let progress;
 let dismissed=false;
 const dismiss=()=>{if(dismissed)return;dismissed=true;let savedDrafts=drafts.get(api);if(!savedDrafts){savedDrafts=new Map();drafts.set(api,savedDrafts);}savedDrafts.set(id,{method:values.method.value});progress?.stop();modal.remove();document.removeEventListener('keydown',escape,true);if(opener?.isConnected){const target=opener.getClientRects().length?opener:opener.closest('.ledger-row')?.querySelector('[data-toggle-menu]');target?.focus({preventScroll:true});}};
 const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}};
 const close=modal.querySelector('.modal-close-btn');close.id='document-close';close.style.flexShrink='0';close.removeAttribute('href');close.setAttribute('role','button');close.tabIndex=0;close.setAttribute('aria-label','Close contract form');
 close.onclick=e=>{e.preventDefault();e.stopPropagation();dismiss();};close.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();dismiss();}};
 cancel.onclick=()=>{if(operation?.promise)toast('Saving, check Saved copies.');dismiss();};modal.onclick=e=>{if(e.target===modal){e.stopPropagation();dismiss();}};
 document.addEventListener('keydown',escape,true);
 const show=(text,error=false)=>{status.hidden=false;status.style.display='';status.className='alert '+(error?'alert-danger':'alert-info');status.setAttribute('role',error?'alert':'status');status.textContent=text;};
 const busy=()=>{submit.disabled=true;submit.textContent='Saving PDF...';status.style.display='none';progress?.stop();progress?.box.remove();operation.started??=Date.now();progress=createDocumentProgress(form,'contract',operation.started);footer.before(progress.box);};
 const finish=async row=>{
  operation.result=row;await progress?.finish(row.status==='saved');dismiss();if(row.status==='saved')map.delete(id);
  toast(row.status==='saved'?'PDF saved.':BACKGROUND_MESSAGE);
  try{if(row.status==='saved'){finishDocumentOperation(api,operation.requestId);refreshContractCard(remember(api,id,row.record||await api.detail(id)));document.body.dispatchEvent(new CustomEvent('contract-saved'));}await mountDocuments(api,id,toast);if(row.status==='pending'&&['','#/','#/bookings'].includes(location.hash.split('?')[0]))watchListDocument(api,id,operation.requestId,toast);}catch{toast('PDF status received. Reopen Saved copies to refresh.');}
 };
 async function run(){
  if(operation?.promise)return operation.promise;
  if(!operation){operation={bookingId:id,requestId:'contract-'+crypto.randomUUID(),values:{...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.value])),confirmSchedule:check.checked}};map.set(id,operation);}
  documentOperation(api,operation.requestId,true);
  operation.retry=run;operation.error=null;operation.result=null;operation.started=Date.now();
  busy();
  operation.promise=(async()=>{
   try{
    // Once submitted, preserve the original payload. A retry looks up the stable
    // id first and uses the existing retry endpoint if the intent is present.
    let existing=operation.attempted?await lookup(api,id,operation.requestId):null;operation.attempted=true;
    const row=existing?.status==='saved'?existing:existing?await api.retryDocument(existing.id):await api.createContract(id,operation.values,operation.requestId);
    if(!row||!['saved','pending','failed'].includes(row.status))throw new TypeError('Document confirmation was not received.');
    await finish(row);
   }catch(error){
    operation.error=error;
    if(error.status===401||error.status===403||error.auth){progress?.error(error.message);return;}
    let row;try{row=await lookup(api,id,operation.requestId);}catch{/* The result remains uncertain; retain its request id. */}
    if(row?.status==='saved'){await finish(row);return;}
    if(!error.status&&!error.auth){
     operation.uncertain=true;await finish(row||{status:'pending'});return;
    }
    // Validation/auth/server errors are actionable in this form, never toast-only.
    progress?.error(error.message||'Unable to save the PDF. Your form values are kept.');
    if(!row){operation.values=null;operation.attempted=false;}
   }finally{operation.promise=null;submit.disabled=false;submit.textContent='Save Contract PDF';}
  })();return operation.promise;
 }
 form.onsubmit=e=>{e.preventDefault();e.stopPropagation();if(operation?.promise)return;if(operation&&!operation.values)operation.values={...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.value])),confirmSchedule:check.checked};void run();};
 document.body.append(modal);close.focus();
 if(operation?.promise){busy();operation.promise.then(()=>{if(!modal.isConnected)return;if(operation.result)void finish(operation.result);else if(operation.error)progress?.error(operation.error.message);else show('Saving, check Saved copies.');});}
}

export async function receiptRow(rows,transactionId){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(transactionId||''))),id='receipt-'+[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');return rows.find(r=>r.id===id)||rows.find(r=>r.kind!=='contract'&&r.preview);}

// Receipt helpers run after money has already been committed. Never resubmit money.
const receiptWaits=new WeakMap();
export function issueReceiptWithProgress(api,bookingId,requestId,toast){
 warmDocuments(api);
 documentOperation(api,requestId,true);
 let waits=receiptWaits.get(api);if(!waits){waits=new Map();receiptWaits.set(api,waits);}if(waits.has(requestId))return waits.get(requestId);
 const host=document.createElement('div');host.dataset.receiptProgress='';host.className='card';document.body.querySelector('main')?.prepend(host);if(!host.isConnected)document.body.append(host);
 const observer=new MutationObserver(()=>{if(!host.isConnected)(document.querySelector('main')||document.body).prepend(host);});observer.observe(document.documentElement,{childList:true,subtree:true});
 const progress=createDocumentProgress(host,'receipt');const close=document.createElement('button');close.type='button';close.className='btn btn-quiet';close.textContent='Close';close.onclick=()=>{observer.disconnect();progress.stop();host.remove();};host.append(close);
 const promise=(async()=>{try{let row;try{row=await api.issueReceipt(bookingId,requestId);}catch(error){if(error.status||error.auth)throw error;row=await lookup(api,bookingId,requestId);}
 await progress.finish(row?.status==='saved');observer.disconnect();host.remove();if(row?.status!=='saved')toast(BACKGROUND_MESSAGE);return row||{status:'pending'};
 }catch(error){observer.disconnect();progress.error(error.message);throw error;}finally{waits.delete(requestId);}})();waits.set(requestId,promise);return promise;
}
