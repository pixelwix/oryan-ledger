import paymentScreen from './screens/record-payment.mjs?v=2.4.0';
import {readStates} from './read-states.mjs?v=2.4.0';
import {transactionActions,transactionCommand} from './transaction-actions.mjs?v=2.4.0';
import {issueReceiptWithProgress,mountDocuments} from './documents-ui.mjs?v=2.4.0';
const opening=new WeakSet();
export async function transactionSheet({api,id,transactionId,action,toast,go,opener}){
 if(opening.has(api)||document.getElementById('transactionModal'))return;
 opening.add(api);
 try{
 const record=await api.detail(id),policy=transactionActions(record,transactionId);
 if(!policy||(action==='void'?!policy.canVoid:!policy.canReturn))throw Error('This transaction is no longer available for this action.');
 const sample=document.createElement('div');sample.innerHTML=paymentScreen(await api.presentation('record-payment'));
 const modal=sample.querySelector('.modal-backdrop'),form=modal.querySelector('form'),transaction=policy.transaction;
 modal.id='transactionModal';form.id='transactionForm';form.dataset.commandForm='true';
 const footerStyle=sample.querySelector('#btnSavePayment').parentElement.getAttribute('style');
 const title=action==='void'?'Void transaction':'Return payment (refund)';
 modal.querySelector('.modal-dialog').setAttribute('aria-modal','true');modal.querySelector('.modal-close-btn').setAttribute('aria-label','Close '+title.toLowerCase());modal.querySelector('.modal-close-btn').style.flexShrink='0';modal.querySelector('.modal-title').textContent=title;modal.querySelector('.badge').textContent=title;
 modal.querySelector('.modal-header p').textContent=record.client+' · '+api.money(transaction.amount)+' · '+(transaction.date||'Historical opening balance')+' · '+(transaction.method||'Method not recorded');
 modal.querySelector('.modal-header').nextElementSibling.remove();form.replaceChildren();
 const explanation=document.createElement('p');explanation.className='form-label-note';explanation.id='transaction-explanation';modal.querySelector('.modal-dialog').setAttribute('aria-describedby',explanation.id);explanation.textContent=action==='void'?'Use Void to cancel an entry made by mistake. To give money back to the customer, use Return.':'If this entry was a mistake, use Void instead.';form.append(explanation);
 const values={};
 function field(key,label,{type='text',options,value='',required=true}={}){
  const group=document.createElement('div');group.className='form-group';const caption=document.createElement('label');caption.className='form-label';caption.htmlFor='transaction-'+key;caption.textContent=label;
  const input=document.createElement(options?'select':'input');input.className=options?'form-select':'form-input';input.id=caption.htmlFor;input.required=required;
  if(options)for(const name of options){const option=document.createElement('option');option.value=name;option.textContent=name;input.append(option);}else input.type=type;
  if(type==='text')input.maxLength=500;
  if(type==='number'){input.min='0.01';input.max=String(policy.cap);input.step='0.01';}
  input.value=value;values[key]=input;group.append(caption,input);form.append(group);
 }
 if(action==='return'){
  const cap=document.createElement('p');cap.className='form-label-note';cap.textContent='Maximum return: '+api.money(policy.cap)+'. '+policy.capMessage;form.append(cap);
  field('amount','Amount',{type:'number',value:policy.cap.toFixed(2)});field('date','Effective date',{type:'date',value:api.today});
  const methods=['Cash','Zelle','Card','Check','Venmo','CashApp','Other'];field('method','Method',{options:methods,value:methods.includes(transaction.method)?transaction.method:'Other'});field('note','Transaction note',{required:false});
 }
 field('reason','Reason for this change');
 const footer=document.createElement('div');footer.setAttribute('style',footerStyle);const cancel=document.createElement('button');cancel.type='button';cancel.className='btn btn-quiet';cancel.textContent='Cancel';const submit=document.createElement('button');submit.type='submit';submit.className='btn btn-primary';submit.textContent=action==='void'?'Confirm void':'Confirm return';footer.append(cancel,submit);form.append(footer);
 let pending=false;
 const dismiss=()=>{if(pending)return;modal.remove();document.removeEventListener('keydown',escape,true);opener?.focus({preventScroll:true});};
 const escape=e=>{if(e.key==='Tab'){const items=[...modal.querySelectorAll('a[href],button,input,select')].filter(n=>!n.disabled);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}};
 cancel.onclick=dismiss;modal.querySelector('.modal-close-btn').onclick=e=>{e.preventDefault();e.stopPropagation();dismiss();};modal.onclick=e=>{if(e.target===modal){e.stopPropagation();dismiss();}};document.addEventListener('keydown',escape,true);
 form.onsubmit=async e=>{
  e.preventDefault();e.stopPropagation();if(pending||!form.reportValidity())return;
  pending=true;submit.disabled=true;cancel.disabled=true;form.setAttribute('aria-busy','true');form.querySelector('#read-error')?.remove();
  let saved=false;
  try{
   const command=transactionCommand(record,transactionId,action,Object.fromEntries(Object.entries(values).map(([k,input])=>[k,input.value])));
   const before=api.documentsEnabled===false?[]:await api.documents(id).catch(()=>[]);
   const updated=await api.commands(command.type,id,command.values);saved=true;
   pending=false;dismiss();go('#/booking/'+encodeURIComponent(id));
   if(api.documentsEnabled!==false){
    api.documents(id).then(rows=>Promise.all(rows.filter(row=>!before.some(old=>old.id===row.id)&&row.kind!=='contract'&&row.status!=='saved'&&(row.source_revision==null||row.source_revision===updated.revision)).map(row=>issueReceiptWithProgress(api,id,row.id,toast)))).then(()=>{if(location.hash==='#/booking/'+encodeURIComponent(id))return mountDocuments(api,id,toast);}).catch(()=>toast('Change saved. Check Saved copies to issue or retry the PDF.'));
   }
  }catch(error){
   toast(error.message);
   if(!saved){const banner=readStates({states:await api.presentation('states')},()=>form.requestSubmit()).show('error');banner.setAttribute('role','alert');banner.querySelector('strong').textContent='Unable to save. Your form values are kept.';banner.querySelector('p').textContent=error.message;form.prepend(banner);}
  }finally{pending=false;submit.disabled=false;cancel.disabled=false;form.setAttribute('aria-busy','false');}
 };
 document.body.append(modal);form.querySelector('input,select')?.focus();
 }finally{opening.delete(api);}
}
