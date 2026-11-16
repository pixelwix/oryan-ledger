const rowTemplates=new WeakMap();
import paymentScreen from './screens/record-payment.mjs';
export async function downloadDocument(api,id,toast){const {blob,filename,preview}=await api.downloadDocument(id),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);if(preview)toast('Synthetic PDF preview.');}
export async function mountDocuments(api,id,toast){
 if(location.hash.split('?')[0]!=='#/booking/'+encodeURIComponent(id))return;
 const section=[...document.querySelectorAll('section.card')].find(el=>el.querySelector('h2')?.textContent==='Contract & Documents');if(!section)return;
 const box=section.lastElementChild;let samples=rowTemplates.get(box);if(!samples){samples=[...box.children].map(el=>el.cloneNode(true));rowTemplates.set(box,samples);}const sample=samples[0];
 let rows;try{rows=await api.documents(id);}catch{box.replaceChildren();const retry=document.createElement('button');retry.className='btn btn-quiet btn-sm';retry.textContent='Retry';retry.onclick=()=>mountDocuments(api,id,toast);box.append(retry);return;}
 if(!box.isConnected||location.hash.split('?')[0]!=='#/booking/'+encodeURIComponent(id))return;
 for(const op of operationMap(api).values())if(op.bookingId===id&&op.uncertain&&!rows.some(r=>r.id===op.requestId))rows.push({id:op.requestId,status:'pending',localRetry:op.retry});
 if(id!=='sophia'){const badge=section.querySelector('.card-header .badge');if(badge)badge.textContent=rows.some(row=>row.status==='saved')?'Saved':rows.length?'Saving pending':'No saved copies';}
 box.replaceChildren();for(const [index,row] of rows.entries()){const el=(samples[index]||sample).cloneNode(true);el.querySelector('strong').textContent=row.filename||'PDF saving pending';el.querySelector('span').textContent=row.display||(row.preview?el.querySelector('span').textContent:null)||(row.status==='saved'?row.page_count+' pages · Generated '+new Date(row.generated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):row.status==='failed'?'Save not confirmed · Retry': 'Saving pending');const button=el.querySelector('button');button.textContent=row.status==='saved'?'Download':'Retry';button.onclick=async()=>{button.disabled=true;try{if(row.status==='saved')await downloadDocument(api,row.id,toast);else{toast('Saving PDF…');if(row.localRetry)await row.localRetry();else await api.retryDocument(row.id);await mountDocuments(api,id,toast);}}catch(e){toast(e.message);}finally{button.disabled=false;}};box.append(el);}
}
// Keep a dismissed, uncertain request in memory. Reopening or retrying resumes
// this operation, never a newly generated contract. Nothing is stored on disk.
const operations=new WeakMap();
function operationMap(api){let map=operations.get(api);if(!map){map=new Map();operations.set(api,map);}return map;}
async function lookup(api,id,requestId){return (await api.documents(id)).find(row=>row.id===requestId||row.request_id===requestId);}
export async function contractSheet(api,id,toast){
 if(document.getElementById('documentModal'))return;
 const opener=document.activeElement,record=await api.detail(id);
 if(document.getElementById('documentModal'))return;
 const host=document.createElement('div');host.innerHTML=paymentScreen(await api.presentation('record-payment'));
 if(document.getElementById('documentModal'))return;
 const modal=host.querySelector('.modal-backdrop'),form=modal.querySelector('form');
 form.dataset.commandForm='true';form.removeAttribute('data-action');form.id='documentForm';modal.id='documentModal';
 modal.querySelector('.badge').textContent='Contract PDF';modal.querySelector('.modal-title').textContent='Contract PDF';
 modal.querySelector('.modal-header p').textContent=record.client+' · Contract #'+(record.contract||'—');
 modal.querySelector('.modal-header').nextElementSibling.remove();form.replaceChildren();
 const map=operationMap(api);let operation=map.get(id);
 const values={};
 const groups=[['Rental window',[['start','Rental start',record.rentalWindow?.start||'10:00','time'],['end','Rental end',record.rentalWindow?.end||'00:00','time']]],
 ['Payment terms',[['initial','Initial payment','0','number','0.00','Amount shown on this PDF only; no payment is recorded.'],['method','Initial payment method','','text','Card, Cash, Check…','Optional: Cash, Card, Check, CashApp, Venmo or Zelle.']]],
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
  }form.append(section);
 }
 const confirm=document.createElement('div');confirm.className='form-group';const label=document.createElement('label');label.className='form-checkbox-label';label.htmlFor='document-confirm';
 const check=document.createElement('input');check.type='checkbox';check.className='form-checkbox';check.id=label.htmlFor;check.checked=operation?.values?.confirmSchedule||false;label.append(check,document.createTextNode('Confirm payment schedule'));confirm.append(label);form.append(confirm);
 const status=document.createElement('div');status.className='alert alert-info';status.hidden=true;status.style.display='none';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);
 // Verbatim footer layout from the locked payment sheet.
 const footer=document.createElement('div');
 footer.style.cssText='display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5); border-top: 1px solid var(--line-subtle); padding-top: var(--space-4);';
 const cancel=document.createElement('button');cancel.id='document-cancel';cancel.type='button';cancel.className='btn btn-quiet';cancel.textContent='Cancel';
 const submit=document.createElement('button');submit.id='document-save';submit.type='submit';submit.className='btn btn-primary';submit.textContent='Save Contract PDF';footer.append(cancel,submit);form.append(footer);
 let dismissed=false;
 const dismiss=()=>{if(dismissed)return;dismissed=true;modal.remove();document.removeEventListener('keydown',escape,true);if(opener?.isConnected){const target=opener.getClientRects().length?opener:opener.closest('.ledger-row')?.querySelector('[data-toggle-menu]');target?.focus({preventScroll:true});}};
 const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}};
 const close=modal.querySelector('.modal-close-btn');close.id='document-close';close.style.flexShrink='0';close.removeAttribute('href');close.setAttribute('role','button');close.tabIndex=0;close.setAttribute('aria-label','Close contract form');
 close.onclick=e=>{e.preventDefault();e.stopPropagation();dismiss();};close.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();dismiss();}};
 cancel.onclick=()=>{if(operation?.promise)toast('Saving, check Saved copies.');dismiss();};modal.onclick=e=>{if(e.target===modal){e.stopPropagation();dismiss();}};
 document.addEventListener('keydown',escape,true);
 const show=(text,error=false)=>{status.hidden=false;status.style.display='';status.className='alert '+(error?'alert-danger':'alert-info');status.setAttribute('role',error?'alert':'status');status.textContent=text;};
 const busy=()=>{submit.disabled=true;submit.textContent='Saving PDF...';show('Saving PDF... this can take up to a minute the first time');};
 const finish=async row=>{
  operation.result=row;dismiss();if(row.status==='saved')map.delete(id);
  toast(row.status==='saved'?'PDF saved.':'Saving, check Saved copies. Retry is available there.');
  try{await mountDocuments(api,id,toast);}catch{toast('PDF status received. Reopen Saved copies to refresh.');}
 };
 async function run(){
  if(operation?.promise)return operation.promise;
  if(!operation){operation={bookingId:id,requestId:'contract-'+crypto.randomUUID(),values:{...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.value])),confirmSchedule:check.checked}};map.set(id,operation);}
  operation.retry=run;operation.error=null;operation.result=null;
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
    if(error.status===401||error.status===403||error.auth){show(error.message,true);return;}
    let row;try{row=await lookup(api,id,operation.requestId);}catch{/* The result remains uncertain; retain its request id. */}
    if(row?.status==='saved'){await finish(row);return;}
    if(!error.status&&!error.auth){
     operation.uncertain=true;await finish(row||{status:'pending'});return;
    }
    // Validation/auth/server errors are actionable in this form, never toast-only.
    show(error.message||'Unable to save the PDF. Your form values are kept.',true);
    if(!row){operation.values=null;operation.attempted=false;}
   }finally{operation.promise=null;submit.disabled=false;submit.textContent='Save Contract PDF';}
  })();return operation.promise;
 }
 form.onsubmit=e=>{e.preventDefault();e.stopPropagation();if(operation?.promise)return;if(operation&&!operation.values)operation.values={...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.value])),confirmSchedule:check.checked};void run();};
 document.body.append(modal);close.focus();
 if(operation?.promise){busy();operation.promise.then(()=>{if(!modal.isConnected)return;if(operation.result)void finish(operation.result);else if(operation.error)show(operation.error.message,true);else show('Saving, check Saved copies.');});}
}

export async function receiptRow(rows,transactionId){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(transactionId||''))),id='receipt-'+[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');return rows.find(r=>r.id===id)||rows.find(r=>r.kind!=='contract'&&r.preview);}
