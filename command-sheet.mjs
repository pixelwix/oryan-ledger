// Reuses the locked payment sheet and form controls for the mockup's action buttons.
import paymentScreen from './screens/record-payment.mjs?v=2.7.1';
import {readStates} from './read-states.mjs?v=2.7.1';
export async function commandSheet({api,id,kind,toast,go,opener}){
 const record=await api.detail(id),sample=document.createElement('div');sample.innerHTML=paymentScreen(await api.presentation('record-payment'));
 const modal=sample.querySelector('.modal-backdrop'),form=modal.querySelector('form');modal.id='commandModal';form.id='commandForm';form.dataset.commandForm='true';
 const title={deposit:'Record deposit transaction',refund:'Record event refund',depositRefund:'Refund security deposit',deduct:'Deduct from security deposit',contractStatus:'Update contract status',reminder:'Payment reminder follow-up',reconcile:'Reconcile imported balance'}[kind];
 modal.querySelector('.modal-title').textContent=title;modal.querySelector('.badge').textContent=title;modal.querySelector('.modal-header p').textContent=record.client;
 modal.querySelector('.modal-header').nextElementSibling.remove();form.replaceChildren();
 const values={};
 function field(key,label,{type='text',options,value='',required=true}={}){
  const group=document.createElement('div');group.className='form-group';const caption=document.createElement('label');caption.className='form-label';caption.htmlFor='command-'+key;caption.textContent=label;
  const input=document.createElement(options?'select':'input');input.className=options?'form-select':'form-input';input.id='command-'+key;input.required=required;
  if(options)for(const name of options){const option=document.createElement('option');option.value=name;option.textContent=name;input.append(option);}else input.type=type;
  if(type==='number'){input.min='0.01';input.step='0.01';input.max='1000000';}if(type==='text')input.maxLength=500;
  input.value=value;values[key]=input;group.append(caption,input);form.append(group);
 }
 const isDeposit=['deposit','depositRefund','deduct'].includes(kind),money=isDeposit||kind==='refund';
 if(kind==='deposit')field('kind','Deposit transaction',{options:['receive','refund','deduct'],value:'receive'});
 if(money){field('amount','Amount',{type:'number',value:isDeposit?record.depositHeld||300:''});field('date','Effective date',{type:'date',value:api.today});field('method','Method',{options:['Cash','Zelle','Card','Check','Venmo','CashApp','Other'],value:'Cash'});field('note','Transaction note',{required:false});}
 if(kind==='reconcile'){field('total','Agreed event price',{type:'number',value:record.total??0});field('openingPaid','Imported opening payments',{type:'number',value:record.openingPaid||0});values.total.min='0';values.openingPaid.min='0';}
 if(kind==='contractStatus'){field('status','Contract status',{options:['Not prepared','Prepared','Signed','Received'],value:record.contractStatus});field('date','Status date',{type:'date',value:api.today});}
 if(kind==='reminder'){field('kind','Follow-up action',{options:['plan','contact'],value:'plan'});field('due','Balance due date',{type:'date',value:record.due||'',required:false});field('nextFollowUp','Next follow-up',{type:'date',required:false});field('date','Contact date',{type:'date',value:api.today});field('method','Contact method',{options:['Phone','Text message','Email','In person','Other'],value:'Phone'});field('note','Contact note',{required:false});}
 field('reason','Reason for this change');
 const footer=document.createElement('div');footer.className='modal-actions';const close=document.createElement('button');close.type='button';close.className='btn btn-quiet';close.textContent='Cancel';const submit=document.createElement('button');submit.type='submit';submit.className='btn btn-primary';submit.textContent='Save';footer.append(close,submit);form.append(footer);
 const dismiss=()=>{modal.remove();document.removeEventListener('keydown',escape,true);opener?.focus({preventScroll:true});};const escape=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();dismiss();}};
 document.addEventListener('keydown',escape,true);const originalDismiss=dismiss;
 close.onclick=()=>{originalDismiss();document.removeEventListener('keydown',escape,true);};modal.querySelector('.modal-close-btn').onclick=e=>{e.preventDefault();e.stopPropagation();close.click();};modal.addEventListener('click',e=>{if(e.target===modal){e.stopPropagation();close.click();}});
 let pending=false;
 form.addEventListener('submit',async e=>{e.preventDefault();e.stopPropagation();if(pending||!form.reportValidity())return;pending=true;submit.disabled=true;modal.querySelector('#read-error')?.remove();
  const payload=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,k==='amount'?Number(v.value):v.value]));const command=isDeposit?'deposit':kind;
  if(kind==='depositRefund')payload.kind='refund';if(kind==='deduct')payload.kind='deduct';
  try{await api.commands(command,id,payload);close.click();go('#/booking/'+id);}
  catch(error){toast(error.message);const banner=readStates({states:await api.presentation('states')},()=>form.requestSubmit()).show('error');banner.querySelector('strong').textContent=error.status===409?'Booking changed. Review before retrying.':'Unable to save. Your form values are kept.';banner.querySelector('p').textContent=error.message;if(error.status===409){const latest=await api.detail(id);banner.querySelector('p').textContent+=' Latest event paid: '+api.money(latest.paid)+'; security held: '+api.money(latest.depositHeld)+'. Review before retrying.';}form.prepend(banner);}
  finally{pending=false;submit.disabled=false;}
 });
 document.body.append(modal);form.querySelector('input,select')?.focus();
}
