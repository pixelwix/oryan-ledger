import {bookingTransactions,transactionActions} from './transaction-actions.mjs';
import {transactionSheet} from './transaction-sheet.mjs';
import {warmDocuments} from './documents-lifecycle.mjs';
import {contractAllowed,refreshContractCard} from './document-state.mjs';
import {bookingRowBuilder,dueDate,rowVariant} from './booking-row.mjs';
import {mountDocuments,contractSheet,downloadDocument,receiptRow,issueReceiptWithProgress} from './documents-ui.mjs';
const rentalText=w=>!w?'—':typeof w==='string'?w:[w.start,w.end].map(t=>t==='00:00'?'Midnight':`${Number(t.slice(0,2))%12||12}:${t.slice(3)} ${Number(t.slice(0,2))<12?'AM':'PM'}`).join(' – ');
import {commandSheet} from './command-sheet.mjs';
import {readStates} from './read-states.mjs';
import {mountLockedBehavior} from './locked-behaviors.mjs';
import {money,balance} from './adapter.mjs';
import {availableDay} from './calendar-parts.mjs';
const $=id=>document.getElementById(id);
const val=id=>$(id).value;
const number=id=>Number(val(id));
const standard=['Covers','Projector','Audio','Bar','Security'];
function replaceMoney(root,pairs){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
  node.textContent=node.textContent.replace(/\$[\d,]+(?:\.\d{2})?/g,match=>{
   const number=Number(match.replace(/[$,]/g,''));const found=pairs.find(([before])=>before!=null&&before===number);if(!found)return match;
   return match.includes('.')?money(found[1]):'$'+Number(found[1]||0).toLocaleString('en-US');
  });
 }
}
async function hydrateDetail(api,route){
 const r=await api.detail(route.id),old=api.original('sophia');
 const pairs=[[old.total,r.total],[old.paid,r.paid],[balance(old),r.balance],[old.depositHeld,r.depositHeld]];
 if(route.screen==='booking'||route.screen==='record-payment'||route.screen==='edit-booking')replaceMoney(document.body,pairs);
 if(r.id!=='sophia'||r.client!==old.client||r.phone!==old.phone||r.contract!==old.contract||r.type!==old.type){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode()))node.textContent=(node.textContent.includes('Sophia Martinez & Carlos Ray')?node.textContent.replaceAll('Sophia Martinez & Carlos Ray',r.client):node.textContent.replaceAll('Sophia Martinez',r.client)).replaceAll(old.contract,r.contract).replaceAll(old.phone,r.phone||'—').replaceAll('Wedding',r.type);
  document.querySelectorAll('a[href*="/booking/sophia"]').forEach(a=>a.href=a.getAttribute('href').replace('/booking/sophia','/booking/'+encodeURIComponent(r.id)));
 }
 if(route.screen==='booking'){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){node.textContent=node.textContent.replace('martinez.ray@example.invalid',r.email||'—').replace('10:00 AM – Midnight',rentalText(r.rentalWindow)).replace('160 Guests',r.guestCount!=null?String(r.guestCount)+' Guests':'—');}
 }
 if(route.screen==='record-payment'){$('paymentDate').value=api.today;$('paymentAmount').value=r.balance?.toFixed(2)||'0.00';if(r.balance==null){$('paymentAmount').setCustomValidity('Set the agreed price before recording a payment.');}}
 if(route.screen==='edit-booking'){
  const lines=r.lines||{hall:r.total||0,extras:[],discount:0};
  if(r.total==null)$('displayWasTotal').textContent='Not agreed';
  $('lineDiscountNote').value=lines.discountNote||'';
  $('lineHall').value=lines.hall.toFixed(2);$('lineDiscount').value=lines.discount.toFixed(2);
  standard.forEach(name=>{const line=lines.extras.find(e=>e.key===name.toLowerCase());$('check'+name).checked=!!line;$('price'+name).value=(line?.amount||0).toFixed(2);$('price'+name).disabled=!line;});
  const custom=lines.extras.filter(e=>!e.key);const container=$('customExtrasContainer');const sample=container.firstElementChild.cloneNode(true);container.replaceChildren();
  for(const line of custom){const row=sample.cloneNode(true);row.querySelector('.custom-label').value=line.label;row.querySelector('.custom-amount').value=line.amount.toFixed(2);container.append(row);}
 }
 if(route.screen==='booking'&&(r.id!=='sophia'||r.revision!==old.revision||JSON.stringify(r.lines)!==JSON.stringify(old.lines)||r.paid!==old.paid)){
  const table=document.querySelector('.breakdown-table tbody');const row=table.firstElementChild.cloneNode(true);table.replaceChildren();
  const lines=r.lines||{hall:r.total||0,extras:[],discount:0};
  const parts=[['Hall Rental Base',lines.hall],...lines.extras.map(e=>[e.label,e.amount]),['Discount',-lines.discount],['Total Agreed Event Charge',r.financialTotal],['Total Payments Recorded So Far',-r.paid],['Remaining Balance Due',r.balance]];
  parts.forEach(([label,value],i)=>{const tr=row.cloneNode(true);tr.children[0].textContent=label;tr.children[1].textContent=value==null?'Not agreed':(value<0?'-':'')+money(Math.abs(value));if(i===parts.length-1)tr.className='breakdown-balance-row';if(i===parts.length-3)tr.className='breakdown-total-row';table.append(tr);});
  const timeline=document.querySelector('.timeline'),sample=timeline.firstElementChild.cloneNode(true);timeline.replaceChildren();
  bookingTransactions(r).slice().reverse().forEach(t=>{const item=sample.cloneNode(true);const spans=item.querySelectorAll('h5 span');const negative=t.category==='refund'||t.category==='deposit'&&t.kind!=='receive';spans[0].textContent=(t.category==='refund'?'Event refund · ':t.category==='deposit'?'Deposit '+t.kind+' · ':t.opening?'Opening payment · ':'')+(negative?'-':'')+money(t.amount)+' · '+(t.method||'Method not recorded');spans[1].textContent=t.date||'Date not recorded';item.querySelector('button')?.setAttribute('data-transaction-id',t.id);item.querySelector('p').textContent=t.note||'Recorded in the fictional local ledger';timeline.append(item);});
  const history=document.querySelector('.history-entry').parentElement,sampleHistory=history.firstElementChild.cloneNode(true);history.replaceChildren();
  r.activity.slice().reverse().forEach(entry=>{const item=sampleHistory.cloneNode(true);item.querySelector('strong').textContent=entry.at;item.querySelector('.history-meta span').textContent=entry.actor;const paras=item.querySelectorAll('p');paras[0].textContent=entry.type;paras[1].textContent='Reason: '+(entry.reason||'—');history.append(item);});
  document.querySelector('details summary span').textContent='Change History & Audit Log ('+r.activity.length+' revisions)';
  if(r.balance===0){document.querySelector('.booking-header-card .badge').textContent='Paid in full';document.querySelector('.booking-header-card .badge-overdue')?.remove();document.querySelector('.breakdown-table').parentElement.querySelector('.alert-warning')?.remove();}
  if(r.id!=='sophia'){
   document.querySelector('.booking-header-card h1 + p').textContent=r.type+' · '+r.date+' · Contract #'+r.contract;
   document.querySelectorAll('.booking-header-card strong').forEach(el=>{if(el.textContent.includes('@'))el.textContent=r.email||'—';});
   document.querySelectorAll('.saved-document,.document-card').forEach(el=>el.remove());
  }
 }

 if(route.screen==='booking'&&r.financialTotal==null){const header=document.querySelector('.booking-header-card');header.querySelector('.badge').textContent=r.cancelled?'Cancelled · charge not set':'Price not agreed';header.children[1].children[1].textContent='Not agreed';}
 if(route.screen==='booking'&&r.cancelled){
  const cancel=document.querySelector('[data-action="booking-7"]');if(cancel)cancel.textContent='Restore booking';
  const badge=document.querySelector('.booking-header-card .badge');if(badge)badge.textContent='Cancelled';
 }
 if(r.id!=='sophia'||r.revision!==old.revision){
  document.title=r.client+' · '+route.screen;
  if(route.screen==='record-payment'){document.querySelector('.page-description').textContent=r.client+' · '+(r.balance==null?'Price not agreed':money(r.balance)+' Balance Due');document.querySelector('.modal-header p').textContent=r.client+' · '+r.type+' (Contract #'+(r.contract||'—')+')';}
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  const shortDate=new Date(r.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'});
  while((node=walker.nextNode()))node.textContent=node.textContent.split('Nov 21, 2026').join(shortDate).split('Saturday, '+shortDate).join(new Date(r.date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'}));
  if(route.screen==='booking'){
   const header=document.querySelector('.booking-header-card'),badges=header.querySelectorAll('.badge');
   const variant=rowVariant(r,api.today);badges[0].textContent=r.cancelled?'Cancelled':r.settled?'Settled':r.total==null?'Needs agreed price':r.balance===0?'Paid in full':'Balance due: '+money(r.balance);
   const overdue=header.querySelector('.badge-overdue');if(overdue){if(variant==='overdue')overdue.textContent='Overdue '+dueDate(r);else overdue.remove();}
   header.querySelector('.badge-paid').textContent='Contract '+(r.contractStatus||'not prepared').toLowerCase();header.querySelector('.badge-blocked').textContent=r.depositWaiver?'Deposit waived':'Deposit held '+money(r.depositHeld);
   header.querySelector('h1 + p').textContent=[r.type,new Date(r.date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'2-digit',year:'numeric',timeZone:'UTC'}),rentalText(r.rentalWindow),r.guestCount==null?'—':r.guestCount+' Guests','Contract #'+(r.contract||'—')].join(' · ');
   header.children[1].children[1].textContent=r.financialTotal==null?'Not agreed':money(r.balance);
   header.children[1].lastElementChild.textContent='Agreed total '+(r.financialTotal==null?'Not agreed':money(r.financialTotal))+' · Paid '+money(r.paid);
   const box=document.querySelector('.deposit-box');box.querySelector('.badge').textContent=r.depositWaiver?'Waived':money(r.depositHeld)+' Held';box.querySelector('button').textContent='Refund '+money(r.depositHeld);
   const subtitle=document.querySelector('.breakdown-table').parentElement.querySelector('.card-subtitle');subtitle.textContent=r.total==null?'Agreed price has not been set':'Itemized line items composing the '+money(r.financialTotal)+' agreed total';
   const warning=document.querySelector('.breakdown-table').parentElement.querySelector('.alert-warning');if(warning){if(variant==='overdue')warning.querySelector('strong').textContent='Final Balance Overdue since '+dueDate(r)+'.';else warning.remove();}
  }
 }
 if(route.screen==='booking'){refreshContractCard(r);if(!contractAllowed(r)){document.querySelectorAll('[data-action="booking-0"]').forEach(a=>{const note=document.createElement('p');note.className='form-label-note';note.textContent=r.cancelled?'No contract PDF for a cancelled booking.':'No contract PDF for a blocked date.';a.replaceWith(note);});}}
 return r;
}
function linesFromForm(){return {hall:number('lineHall'),discount:number('lineDiscount'),discountNote:val('lineDiscountNote'),extras:[
 ...standard.filter(n=>$('check'+n).checked).map(n=>({key:n.toLowerCase(),label:n,amount:number('price'+n)})),
 ...[...document.querySelectorAll('.custom-extra-row')].map(row=>({label:row.querySelector('.custom-label').value,amount:Number(row.querySelector('.custom-amount').value)}))
]};}
export async function mountFlows({api,route,go,toast,closeSheet}){
 if(route.screen==='record-payment')warmDocuments(api);
 const mountBody=document.body;
 const screen=route.screen;let r,saving=false;
 if(['booking','edit-booking','record-payment'].includes(screen))r=await hydrateDetail(api,route);
 if(screen==='overview')await mountOverview(api);
 if(screen==='payments')await mountPayments(api,toast,go);
 mountLockedBehavior(screen,api,route,toast,r);
 if(screen==='booking'){await mountDocuments(api,route.id,toast);document.querySelectorAll('.timeline button').forEach((button,i)=>{button.dataset.transactionId||=r.payments.slice().reverse()[i]?.id||'';});}
 if(screen==='booking'){
  const transactions=(r.id==='sophia'&&r.revision===api.original('sophia').revision?r.payments.map(t=>({...t,category:'payment'})):bookingTransactions(r)).slice().reverse();
  document.querySelectorAll('.timeline-content').forEach((row,i)=>{const t=transactions[i];if(t){row.querySelector('button').dataset.transactionId=t.id;mountTransactionActions(row,api,r,t.id,toast,go,true);}});
 }
 // Delegate actions once per mounted screen. Removed DOM listeners are collected with the screen.
 document.body.addEventListener('submit',async e=>{
  e.preventDefault();if(e.target.dataset.commandForm)return;if(saving||!e.target.reportValidity())return;
  saving=true;const submit=e.target.querySelector('[type=submit]');if(submit)submit.disabled=true;
  document.getElementById('read-error')?.remove();
  try{
   if(screen==='record-payment'){const paid=await api.commands('payment',route.id,{amount:number('paymentAmount'),date:val('paymentDate'),method:val('paymentMethod'),note:val('paymentNote')});go('#/booking/'+route.id);api.documents(route.id).then(async rows=>{const row=await receiptRow(rows,paid.payments.slice(-1)[0]?.id);return row&&row.status!=='saved'?[await issueReceiptWithProgress(api,route.id,row.id,toast)]:[];}).then(rows=>{if(rows.some(row=>row.status!=='saved'))toast('Payment saved. Saving in the background. It will appear in Saved copies in about 10-30 seconds.');if(document.body===mountBody)return;if(location.hash==='#/booking/'+route.id)mountDocuments(api,route.id,toast).catch(()=>{});}).catch(()=>toast('Payment saved. Saving in the background. It will appear in Saved copies in about 10-30 seconds.'));}
   if(screen==='edit-booking'){await api.commands('edit',route.id,{lines:linesFromForm(),reason:val('changeReason')});go('#/booking/'+route.id);}
   if(screen==='new-booking'){
    const extras=standard.filter(n=>$('extra'+n).checked).map(n=>({key:n.toLowerCase(),label:n,amount:api.intakeRates[n.toLowerCase()]}));
    const total=api.priceLines({hall:number('newHallPrice'),extras,discount:0}).total;
    const created=await api.createBooking({client:val('guestName'),phone:val('guestPhone'),date:val('eventDate'),type:val('eventType'),total,paid:number('initialPaid'),paymentDate:api.today,method:val('initialMethod'),...Object.fromEntries(standard.map(n=>[n.toLowerCase(),$('extra'+n).checked]))},{lines:{hall:number('newHallPrice'),extras,discount:0},depositStatus:val('depositStatus'),email:val('guestEmail'),guestCount:number('guestCount')});
    go('#/booking/'+created.id);
   }
  }catch(error){toast(error.message);if(api.mode==='http'){const state=readStates({states:await api.presentation('states')},()=>e.target.requestSubmit());const banner=state.show('error');e.target.prepend(banner);banner.querySelector('p').textContent=error.message;banner.querySelector('strong')?.replaceChildren(document.createTextNode(error.status===409?'Booking changed. Review the refreshed data before retrying.':'Unable to save. Your form values are kept.'));if(error.status===409){const current=await api.detail(route.id);r=current;banner.querySelector('p').textContent=error.message+' Latest agreed: '+money(current.financialTotal)+'; paid: '+money(current.paid)+'; balance: '+money(current.balance)+'. Review before retrying.';}}}
  finally{saving=false;if(submit)submit.disabled=false;}
 });
 document.body.addEventListener('click',async e=>{
  const contract=e.target.closest('.dropdown-item');if(contract?.textContent.trim()==='Contract copy (PDF)'){e.preventDefault();try{await contractSheet(api,contract.closest('.ledger-row').dataset.id,toast);}catch(error){toast(error.message);}return;}
  const reconcile=e.target.closest('a[href^="#/booking/"]');if(reconcile?.textContent.trim()==='Reconcile'){e.preventDefault();e.stopPropagation();const id=decodeURIComponent(reconcile.hash.slice('#/booking/'.length).split(/[/?]/)[0]);await commandSheet({api,id,kind:'reconcile',toast,go});return;}
  const receipt=e.target.closest('button');if(receipt?.textContent.trim()==='View receipt PDF'){try{const rows=await api.documents(route.id),row=await receiptRow(rows,receipt.dataset.transactionId);if(!row)throw Error('No receipt PDF is available after the document cutoff.');if(row.status==='saved')await downloadDocument(api,row.id,toast);else{await issueReceiptWithProgress(api,route.id,row.id,toast);await mountDocuments(api,route.id,toast);}}catch(e){toast(e.message);}return;}
  const action=e.target.closest('[data-action]');
  if(action&&action.tagName!=='FORM'){
   try{
    const key=action.dataset.action;
    if(['booking-2','booking-3','booking-4','booking-5','booking-8','booking-9'].includes(key)){await commandSheet({api,id:route.id,kind:{'booking-2':'deposit','booking-3':'refund','booking-4':'reminder','booking-5':'contractStatus','booking-8':'depositRefund','booking-9':'deduct'}[key],toast,go});return;}
    if(key==='booking-0'){await contractSheet(api,route.id,toast);return;}
    if(key==='booking-1'){const rows=await api.documents(route.id),row=rows.find(r=>r.kind!=='contract');if(!row)throw Error('No receipt PDF is available after the document cutoff.');if(row.status==='saved')await downloadDocument(api,row.id,toast);else{await issueReceiptWithProgress(api,route.id,row.id,toast);await mountDocuments(api,route.id,toast);}return;}
    if(key==='booking-6'&&api.ics){const text=await api.ics(route.id),url=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='booking.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(key==='overview-0'){await api.commands('markSettled',action.dataset.bookingId,{reason:'Owner marked the fictional past event settled.'});action.textContent='Settled ✓';action.disabled=true;action.style.opacity='0.6';return;}
    if(key==='booking-7'){const current=await api.detail(route.id);await api.commands(current.cancelled?'restore':'cancel',route.id,{reason:'Owner changed the fictional reservation status.'});go('#/bookings');return;}
    toast('Local preview: '+action.textContent.trim()+'. No external action was taken.');
   }catch(error){toast(error.message);}
  }
  const release=e.target.closest('.row-actions-cell button');if(release?.textContent.trim()==='Release hold'){await api.commands('release',release.closest('.ledger-row').dataset.id,{reason:'Owner released the fictional date hold.'});go('#/bookings');}
  const restore=e.target.closest('.row-actions-cell button');if(['Restore','Restore booking'].includes(restore?.textContent.trim())){await api.commands('restore',restore.closest('.ledger-row').dataset.id,{reason:'Owner restored the fictional booking.'});go('#/bookings');return;}
  const cancel=e.target.closest('.dropdown-item');if(cancel?.tagName==='BUTTON'&&cancel.textContent.includes('Cancel')){
   const row=cancel.closest('.ledger-row');await api.commands('cancel',row.dataset.id,{reason:'Owner cancelled the fictional booking.'});go('#/bookings');
  }
 });
 if(screen==='bookings')await mountBookings(api);
 if(screen==='calendar')await mountCalendar(api,go);
 if(screen==='new-booking'){
  if(route.query.has('date'))$('eventDate').value=route.query.get('date');
  const check=async()=>{const taken=(await api.list()).some(r=>r.date===val('eventDate')&&!r.cancelled);$('dateCheckStatus').textContent=taken?'Date already booked or blocked':'Date available ✓';$('eventDate').setCustomValidity(taken?'This date is already booked or blocked.':'');return !taken;};
  $('eventDate').addEventListener('change',check);
  $('btnContinueStep2').addEventListener('click',async()=>{if(!await check()||!['guestName','guestPhone','guestEmail','eventDate'].every(id=>$(id).reportValidity())){$('step1Section').style.display='block';$('step2Section').style.display='none';}});
 }
 if(screen==='insights'){
  const initialData=await api.insights();
  const mixSamples=[...document.querySelectorAll('.bar-chart-container')].map(group=>group.querySelector('.bar-row').cloneNode(true));
  const applyInsights=async e=>{
   const data=await api.insights(e.target.value);if(document.body!==mountBody)return;const values=document.querySelectorAll('.stat-value');
   [data.charges,data.payments,data.balance].forEach((v,i)=>values[i].textContent=money(v));
   document.querySelector('.stat-note').textContent=data.count+' fictional annual reservations';
   document.querySelectorAll('.stat-note')[1].textContent=(data.charges?100*data.payments/data.charges:0).toFixed(1)+'% of total charges received';
   document.querySelector('.stat-label').textContent='Agreed venue value ('+e.target.value+')';
   document.querySelector('.v-chart').previousElementSibling.querySelector('h2').textContent='Bookings by Month ('+e.target.value+')';
   const peak=Math.max(...data.months);document.querySelector('.v-chart').previousElementSibling.querySelector('.badge').textContent=peak?'Peak month: '+new Date(2026,data.months.indexOf(peak),1).toLocaleDateString('en-US',{month:'long'})+' ('+money(peak)+')':'No reservations in this year';
   document.querySelectorAll('.v-bar-col').forEach((bar,i)=>{bar.querySelector('.v-bar-val').textContent='$'+(data.months[i]/1000).toFixed(1)+'k';bar.querySelector('.v-bar').style.height=(peak?100*data.months[i]/peak:0)+'%';});
   if(api.mode==='http'){
    const groups=document.querySelectorAll('.bar-chart-container');
    const renderMix=(group,entries)=>{const sample=mixSamples[[...groups].indexOf(group)];group.replaceChildren(...entries.map(([label,count])=>{const row=sample.cloneNode(true),share=data.count?Math.round(100*count/data.count):0;row.firstElementChild.textContent=label;row.querySelector('.bar-value').textContent=share+'% ('+count+')';row.querySelector('.bar-fill').style.width=share+'%';return row;}));};
    renderMix(groups[0],Object.entries(data.types));
    const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];renderMix(groups[1],Object.entries(data.weekdays).sort((a,b)=>b[1]-a[1]).map(([day,count])=>[days[day],count]));
    const takeaway=document.querySelector('.alert-info > div');if(takeaway)takeaway.textContent='Key Venue Takeaway: '+(data.count?'Most reservations: '+days[Object.entries(data.weekdays).sort((a,b)=>b[1]-a[1])[0]?.[0]]+'.':'No reservations in this year.');
    return;
   }
   const mix=[data.types.Wedding||0,data.types.Birthday||0,data.types.Business||0,data.types.Other||0,data.weekdays[6]||0,data.weekdays[5]||0,data.weekdays[0]||0];
   document.querySelectorAll('.bar-row').forEach((row,i)=>{const share=data.count?Math.round(100*mix[i]/data.count):0;row.querySelector('.bar-value').textContent=share+'% ('+mix[i]+')';row.querySelector('.bar-fill').style.width=share+'%';});
  };
  const select=document.querySelector('select');select.addEventListener('change',applyInsights);
  if(api.mode==='http'&&(document.querySelector('.stat-value').textContent.trim()!==money(initialData.charges)||Object.entries(initialData.types).some(([type,count])=>![...document.querySelectorAll('.bar-chart-container:first-of-type .bar-row,.bar-row')].some(row=>row.firstElementChild.textContent===type&&row.querySelector('.bar-value').textContent.includes('('+count+')')))))await applyInsights({target:select});
 }

}
async function mountBookings(api){
 const mountBody=document.body;let updateSequence=0;
 let edge;if(api.mode==='http')edge=readStates({states:await api.presentation('states')},()=>{$('bookingSearchInput').value='';document.querySelector('[data-filter="all"]').click();update();});
 const all=await api.list();const canonical=all.length===12&&all.every(r=>r.date===api.original(r.id)?.date);const body=$('bookingsTableBody');const makeRow=bookingRowBuilder(body,all,api.today,api.original);
 const originalRows=[],originalNodes=[...body.childNodes];
 const dividerSample=[...body.children].find(row=>!row.classList.contains('ledger-row'))?.cloneNode(true);
 const outerHeader=document.querySelector('.month-group-header');
 for(const node of [...body.querySelectorAll('.ledger-row')]){
  const record=all.find(r=>r.contract===node.dataset.contract);
  if(!record){originalNodes.splice(originalNodes.indexOf(node),1);node.remove();continue;}
  const row=makeRow(record);originalRows.push(row);originalNodes[originalNodes.indexOf(node)]=row;node.replaceWith(row);
 }
 for(const record of all.filter(r=>!originalRows.some(row=>row.dataset.id===r.id))){const row=makeRow(record);originalRows.push(row);originalNodes.push(row);body.append(row);}
 const counts=await api.counts();if(api.mode==='http')document.querySelector('.page-description').textContent=document.querySelector('.page-description').textContent.replace(/\d+ records displayed/,all.length+' records displayed');document.querySelectorAll('.filter-chip').forEach(chip=>chip.textContent=chip.textContent.replace(/\(\d+\)/,'('+counts[chip.dataset.filter]+')'));
 // The frozen default order/grouping is retained. Explicit sorts and searches use adapter data.
 async function update(){
  const ticket=++updateSequence;
  const sort=$('sortSelect').value,query=$('bookingSearchInput').value,filter=document.querySelector('.filter-chip.active')?.dataset.filter||'all';
  const rows=await api.list({q:query,filter,sort:sort.startsWith('guest')?'guest':sort.startsWith('balance')?'balance':'date'});if(ticket!==updateSequence||document.body!==mountBody)return;if(sort==='date-desc')rows.reverse();
  for(const r of rows){const index=originalRows.findIndex(row=>row.dataset.id===r.id),row=makeRow(r);if(index<0)originalRows.push(row);else{const old=originalRows[index],nodeIndex=originalNodes.indexOf(old);if(nodeIndex>=0)originalNodes[nodeIndex]=row;old.replaceWith(row);originalRows[index]=row;}}
  edge?.clear('error');edge?.clear('empty');if(!rows.length)edge?.show('empty');
  const ids=new Set(rows.map(r=>r.id));originalRows.forEach(row=>row.style.display=ids.has(row.dataset.id)?'':'none');
  if(sort!=='date-asc'||query||!canonical){
   body.replaceChildren();let lastMonth=null;outerHeader.style.display='none';
   rows.forEach(r=>{const row=originalRows.find(el=>el.dataset.id===r.id);if(!row)return;
    const month=r.date.slice(0,7);if(sort.startsWith('date')&&month!==lastMonth&&dividerSample){const divider=dividerSample.cloneNode(true);divider.firstElementChild.textContent=new Date(r.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});body.append(divider);lastMonth=month;}body.append(row);
   });
  }else{body.replaceChildren(...originalNodes);outerHeader.style.display='';}

 }
 mountBody.addEventListener('contract-saved',()=>{if(document.body===mountBody)update().catch(()=>edge?.show('error'));});
 $('sortSelect').addEventListener('change',update);$('bookingSearchInput').addEventListener('input',()=>update().catch(()=>edge?.show('error')));document.querySelectorAll('.filter-chip').forEach(chip=>chip.addEventListener('click',update));
 if(!canonical)await update();
}
async function mountCalendar(api,go){
 const mountBody=document.body;
 const initialRows=await api.calendar();const unchanged=initialRows.length===2&&initialRows.some(r=>r.id==='sophia'&&r.date==='2026-11-21')&&initialRows.some(r=>r.id==='amara'&&r.date==='2026-11-28');
 let year=Number(api.today.slice(0,4)),month=Number(api.today.slice(5,7));const grid=document.querySelector('.calendar-grid')||document.querySelector('.cal-day-cell').parentElement;
 const defaultGrid=grid.innerHTML;const defaultCard=$('dayScheduleContent').innerHTML;
 async function select(day){
  const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;let found=(await api.calendar(year,month)).find(r=>r.date===date);if(found&&api.mode==='http')found=await api.detail(found.id);if(document.body!==mountBody)return;
  $('selectedDateTitle').textContent=new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'2-digit',year:'numeric'});
  $('selectedDateSubtitle').textContent=found?(balance(found)===0?'1 reservation booked · Paid in full':'1 reservation booked · Entire facility reserved'):'Date open &middot; Ready for reservations';$('selectedDateBadge').textContent=found?'Booked':'Available';$('selectedDateBadge').className=found&&balance(found)>0?'badge badge-due':'badge badge-paid';
  if(found){
   $('dayScheduleContent').innerHTML=defaultCard;
   const original=api.original('sophia');replaceMoney($('dayScheduleContent'),[[original.total,found.total],[original.paid,found.paid],[balance(original),balance(found)]]);
   const heading=$('dayScheduleContent').querySelector('h4');if(heading)heading.textContent=found.client;
   const subtitle=heading?.nextElementSibling;if(subtitle)subtitle.textContent=(found.eventLabel||found.type)+' · Contract #'+found.contract;
   const badge=$('dayScheduleContent').querySelector('.badge');if(badge&&balance(found)===0){badge.textContent='Paid in Full';badge.className='badge badge-paid';}
   const metadata=heading?.parentElement.children[2];if(metadata){metadata.querySelector('strong').textContent=rentalText(found.rentalWindow);metadata.lastChild.textContent=found.guestCount!=null?' · '+found.guestCount+' Guests':' · —';}
   if(balance(found)===0){const summary=$('dayScheduleContent').querySelector('span[style*="warning-text"]');if(summary){summary.textContent='Balance: '+money(0);summary.style.color='var(--success-text)';}const action=$('dayScheduleContent').querySelector('a.btn-primary');if(action){action.className='btn btn-quiet btn-sm';action.href='#/booking/'+found.id;action.textContent='Contract PDF';}}

   if(found.id!=='sophia'||found.revision!==api.original('sophia').revision){
    const badge=$('dayScheduleContent').querySelector('.badge'),variant=rowVariant(found,api.today);
    badge.textContent=found.type==='Blackout'?'Blocked date':found.total==null?'Needs agreed price':found.balance===0?'Paid in Full':'Balance due';badge.className='badge '+(found.type==='Blackout'?'badge-blocked':found.total==null?'badge-unpriced':found.balance===0?'badge-paid':'badge-due');
    const summary=$('dayScheduleContent').querySelector('span[style*="warning-text"]');if(summary)summary.textContent='Balance: '+(found.total==null?'Not agreed':money(found.balance));const action=$('dayScheduleContent').querySelector('a.btn-primary');if(action&&found.total==null){action.textContent='Set price';action.href='#/booking/'+found.id+'/edit';}if(found.type==='Blackout'){const action=$('dayScheduleContent').querySelector('a.btn-quiet');if(action)action.textContent='Details';}
   }
   $('dayScheduleContent').querySelectorAll('a').forEach(a=>a.href=a.getAttribute('href').replace('/sophia','/'+found.id));
  }else{
   $('dayScheduleContent').innerHTML=availableDay('#/new?date='+date);
  }
 }
 async function renderMonth(){
  const date=new Date(year,month-1,1);$('calHeaderTitle').textContent=date.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  $('btnPrevMonth').textContent='← '+new Date(year,month-2,1).toLocaleDateString('en-US',{month:'long'});$('btnNextMonth').textContent=new Date(year,month,1).toLocaleDateString('en-US',{month:'long'})+' →';
  if(year===2026&&month===11&&unchanged){grid.innerHTML=defaultGrid;return;}
  const cells=[...grid.querySelectorAll('.cal-day-cell')];cells.forEach(c=>c.remove());const offset=date.getDay();
  for(let i=0;i<offset;i++){const cell=document.createElement('div');cell.className='cal-day-cell';cell.setAttribute('aria-hidden','true');grid.append(cell);}
  const bookings=await api.calendar(year,month);for(let day=1;day<=new Date(year,month,0).getDate();day++){
   const cell=document.createElement('div');cell.className='cal-day-cell';cell.dataset.day=day;const n=document.createElement('span');n.className='cal-day-num';n.textContent=day;cell.append(n);
   if(bookings.some(r=>Number(r.date.slice(-2))===day)){const dot=document.createElement('span');dot.className='cal-dot';cell.append(dot);}grid.append(cell);
  }
 }
 document.body.addEventListener('click',async e=>{const cell=e.target.closest('[data-day]');if(cell?.tagName==='BUTTON'){const next=(await api.list()).find(r=>r.date>=api.today&&r.type!=='Blackout'&&!r.cancelled);if(next){year=Number(next.date.slice(0,4));month=Number(next.date.slice(5,7));await renderMonth();await select(Number(next.date.slice(-2)));}}else if(cell)await select(Number(cell.dataset.day));});
 if(!unchanged){await renderMonth();await select(Number(api.today.slice(-2)));}else{const selected=initialRows.find(r=>r.id==='sophia'),original=api.original('sophia');if(['client','type','contract','total','paid','guestCount','rentalWindow'].some(key=>JSON.stringify(selected[key])!==JSON.stringify(original[key])))await select(21);}
 $('btnPrevMonth').addEventListener('click',async()=>{if(--month<1){month=12;year--;}await renderMonth();});$('btnNextMonth').addEventListener('click',async()=>{if(++month>12){month=1;year++;}await renderMonth();});$('btnTodayMonth').addEventListener('click',async()=>{year=Number(api.today.slice(0,4));month=Number(api.today.slice(5,7));await renderMonth();await select(Number(api.today.slice(-2)));});
}

async function mountOverview(api){return mountHttpOverview(api);}
async function mountPayments(api,toast,go){
 const register=await api.payments();
 {
  for(const t of register)if(!t.eventType){const r=await api.detail(t.bookingId);t.eventType=r.type;}
  const body=$('paymentsTableBody'),templates=[...body.children].map(n=>n.cloneNode(true));
  const rows=register.map(t=>{
   const sample=templates.find(n=>n.dataset.type===t.kind&&n.dataset.method===t.method&&Number(n.children[4].textContent.replace(/[^0-9.-]/g,''))===t.amount);
   const row=(sample||templates.find(n=>n.dataset.type===t.kind&&(Number(n.children[4].textContent.replace(/[^0-9.-]/g,''))<0)===(t.amount<0))||templates[0]).cloneNode(true),cells=row.children;row.dataset.type=t.kind;row.dataset.method=t.method;
   cells[0].querySelector('strong').textContent=new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'});
   const guest=cells[1].firstElementChild;guest.textContent=t.displayClient&&t.client===api.original(t.bookingId)?.client?t.displayClient:t.client;if(guest.tagName==='A')guest.href='#/booking/'+encodeURIComponent(t.bookingId);
   cells[1].querySelector('div').textContent=t.eventType+' · '+(t.contract||'—');
   if(!sample||!t.reference)cells[2].querySelector('span').textContent=t.kind==='deposit'?(t.amount<0?'Security Deposit Adjustment':'Security Deposit Received'):t.kind==='refund'?'Event Refund':'Event Payment';
   cells[3].firstElementChild.textContent=t.method+(t.note&&t.method==='Check'?' ('+t.note+')':'');
   if(!sample)cells[4].textContent=(t.amount<0?'-':'')+money(Math.abs(t.amount));
   cells[5].firstElementChild.textContent=t.reference||t.id;return row;
  });body.replaceChildren(...rows);
 }
 const body=$('paymentsTableBody');
 [...body.children].forEach((row,i)=>{const transaction=register[i],button=[...row.querySelectorAll('button')].find(b=>b.textContent.trim()==='PDF');if(!button||!transaction)return;button.onclick=async()=>{try{const rows=await api.documents(transaction.bookingId);let copy=await receiptRow(rows,transaction.id);if(!copy)throw Error('No receipt PDF is available after the document cutoff.');if(copy.status!=='saved')copy=await issueReceiptWithProgress(api,transaction.bookingId,copy.id,toast);if(copy.status==='saved')await downloadDocument(api,copy.id,toast);else toast('PDF saving pending. Retry from Saved copies.');}catch(error){toast(error.message);}};});
 for(const [i,row] of [...body.children].entries()){const t=register[i],record=await api.detail(t.bookingId);mountTransactionActions(row.lastElementChild,api,record,t.id,toast,go,false,row);}
 if(api.mode==='http'){const notes=document.querySelectorAll('.stat-note'),paidCount=register.filter(t=>t.kind==='payment').length,refundCount=register.filter(t=>t.kind==='refund').length,held=(await api.list()).filter(r=>r.flags?.depositHeld).length;notes[0].textContent=paidCount+' event receipts toward charges less '+refundCount+' '+(refundCount===1?'refund':'refunds');notes[1].textContent=held+' refundable damage '+(held===1?'deposit':'deposits')+'; prior sums held';notes[2].textContent=refundCount+' event '+(refundCount===1?'refund':'refunds')+'; deposit return excluded';}
 const values=document.querySelectorAll('.stat-value');values[0].textContent=money(register.filter(t=>!t.voided&&t.kind!=='deposit').reduce((n,t)=>n+t.amount,0));values[1].textContent=money((await api.summary()).depositHeld);values[2].textContent=money(-register.filter(t=>!t.voided&&t.kind==='refund').reduce((n,t)=>n+t.amount,0));
 document.querySelectorAll('.filter-chip').forEach(chip=>{const kind=chip.dataset.filter,count=kind==='all'?register.length:register.filter(t=>t.kind===kind).length;chip.textContent=chip.textContent.replace(/\(\d+\)/,'('+(kind==='all'?String(count).padStart(2,'0'):count)+')');});
}

async function mountHttpOverview(api){
 const [data,attention,rows,register]=await Promise.all([api.summary(),api.attention(),api.list(),api.payments()]);
 const notes=document.querySelectorAll('.stat-note'),month=api.today.slice(0,7);notes[1].textContent=register.filter(t=>t.kind==='payment'&&t.date.startsWith(month)).length+' recorded receipts this month';const monthRows=rows.filter(r=>(r.flags?.open??!r.settled)&&!r.cancelled&&r.type!=='Blackout'&&r.date.startsWith(month));notes[2].textContent=monthRows.filter(r=>r.date<api.today).length+' completed · '+monthRows.filter(r=>r.date>=api.today).length+' coming up';
 const values=document.querySelectorAll('.stat-value');values[0].textContent='$'+data.balance.toLocaleString('en-US');values[1].textContent='$'+data.novemberPayments.toLocaleString('en-US');values[2].textContent=data.novemberEvents+' events';
 const list=document.querySelector('.triage-list'),templates=[...list.children].map(n=>n.cloneNode(true));
 const order=['overdue','price','past','deposit','reconcile'],expected={overdue:'sophia',price:'devon',past:'elena',deposit:'sophia',reconcile:'elena'};
 const nodes=[];for(const kind of order)for(const item of attention.filter(a=>a.kind===kind)){
  const row=templates[order.indexOf(kind)].cloneNode(true),r=item.record||await api.detail(item.id),old=api.original(expected[kind]);
  if(!old||item.id!==expected[kind]||['client','date','type','contract','total','paid','due','depositHeld','importedDifference'].some(key=>key==='importedDifference'?(r[key]||0)!==(old[key]||0):r[key]!==old[key])){const heading=row.querySelector('h5'),suffix=kind==='deposit'?' ('+money(r.depositHeld)+' refundable)':kind==='reconcile'?' ('+(r.importedDifference>0?'+':'-')+money(Math.abs(r.importedDifference))+' diff)':kind==='overdue'?' ('+money(r.balance)+' due)':'';heading.textContent=heading.textContent.split(' · ')[0]+' · '+r.client+suffix;row.querySelector('p').textContent=r.date+' · '+r.type+' · '+(r.contract||'—');}
  if(old)replaceMoney(row,[[old.total,r.total],[old.paid,r.paid],[balance(old),r.balance],[old.depositHeld,r.depositHeld]]);
  const target=row.querySelector('a');if(target)target.href=item.target||'#/booking/'+r.id;const settle=row.querySelector('[data-action="overview-0"]');if(settle)settle.dataset.bookingId=r.id;
  nodes.push(row);
 }
 list.replaceChildren(...nodes);document.querySelector('.triage-card .badge').textContent=attention.length+' actionable';document.querySelector('.triage-card .card-subtitle').textContent=document.querySelector('.triage-card .card-subtitle').textContent.replace(/\d+ items/,attention.length+' items');
 document.querySelector('.stat-note').textContent='Across '+rows.filter(r=>r.balance>0&&!r.cancelled).length+' priced open balances';
 const group=document.querySelector('.events-trio'),samples=[...group.children].map(n=>n.cloneNode(true));
 const next=rows.filter(r=>r.date>=api.today&&!r.cancelled&&r.type!=='Blackout').slice(0,3);
 group.replaceChildren(...next.map((r,i)=>{const templateIndex=r.total!=null&&r.balance===0?1:i===1?0:Math.min(i,2);const node=samples[templateIndex].cloneNode(true),old=api.original(['sophia','amara','mateo'][templateIndex]);
  if(old)replaceMoney(node,[[old.total,r.total],[old.paid,r.paid],[balance(old),r.balance]]);
  if(r.id!==old?.id||r.client!==old.client||r.date!==old.date||r.type!==old.type||r.contract!==old.contract||r.guestCount!==old.guestCount){node.querySelector('.badge').textContent=r.balance>0?'Balance due':'Paid in full';node.querySelector('h3').textContent=r.client;const date=new Date(r.date+'T12:00:00Z'),pill=node.querySelector('.date-pill');pill.firstChild.textContent=date.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'})+' ';pill.querySelector('span').textContent=r.date.slice(-2);pill.lastChild.textContent=' · '+date.toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'});node.querySelector('h3 + p').textContent=r.type+' · '+(r.guestCount??'—')+' guests · Contract #'+(r.contract||'—');}
  if(r.id!==old?.id||r.total!==old.total||r.paid!==old.paid){const financial=node.children[1];financial.children[0].querySelector('strong').textContent=r.total==null?'Not agreed':money(r.total);financial.children[1].querySelector('strong').textContent=money(r.paid);financial.children[2].textContent='Balance: '+(r.total==null?'Not agreed':money(r.balance));const badge=node.querySelector('.badge');badge.textContent=r.total==null?'Needs agreed price':r.balance===0?'Paid in full':'Balance due';badge.className='badge '+(r.total==null?'badge-unpriced':r.balance===0?'badge-paid':'badge-due');const pay=node.querySelector('a[href$="/pay"]');if(pay){pay.textContent=r.total==null?'Set price':r.balance===0?'Details':'Pay '+money(r.balance);pay.href='#/booking/'+r.id+(r.total==null?'/edit':r.balance===0?'':'/pay');}}
  node.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href'),suffix=href.endsWith('/pay')?'/pay':href.endsWith('/edit')?'/edit':'';a.href='#/booking/'+encodeURIComponent(r.id)+suffix;});return node;}));
}

function mountTransactionActions(host,api,record,transactionId,toast,go,history,row=host){
 const policy=transactionActions(record,transactionId);if(!policy)return;
 row.dataset.transactionId=transactionId;
 if(policy.transaction.voided){
  const label=document.createElement('span');label.className='badge';label.textContent='VOID';host.append(label);
  const amount=history?row.querySelector('h5 span'):row.children[4];if(amount)amount.style.textDecoration='line-through';return;
 }
 const receipt=host.querySelector('button');
 for(const action of policy.canReturn?['void','return']:['void']){
  const button=document.createElement('button');button.type='button';button.className='btn btn-quiet btn-sm';
  if(history)button.setAttribute('style',receipt.getAttribute('style'));
  button.style.minWidth='var(--touch-target-min)';
  button.textContent=action==='void'?'Void':'Return';button.dataset.transactionAction=action;
  button.setAttribute('aria-label',button.textContent+' payment of '+money(policy.transaction.amount)+' on '+(policy.transaction.date||'date not recorded'));
  button.onclick=()=>transactionSheet({api,id:record.id,transactionId,action,toast,go,opener:button}).catch(e=>toast(e.message));host.append(document.createTextNode(' '),button);
 }
}
