import {mountSquare} from './square-ui.mjs?v=2.9.1';
import {calendarIcs} from './calendar-export.mjs?v=2.9.1';
import {downloadBlob} from './ledger-export.mjs?v=2.9.1';
import {mountBookingActions,openBookingAction} from './booking-actions.mjs?v=2.9.1';
import {bookingTransactions,transactionActions} from './transaction-actions.mjs?v=2.9.1';
import {transactionSheet} from './transaction-sheet.mjs?v=2.9.1';
import {warmDocuments} from './documents-lifecycle.mjs?v=2.9.1';
import {refreshContractCard} from './document-state.mjs?v=2.9.1';
import {bookingRowBuilder,dueDate,rowVariant} from './booking-row.mjs?v=2.9.1';
import {mountDocuments,contractSheet,downloadDocument,receiptRow,issueReceiptWithProgress} from './documents-ui.mjs?v=2.9.1';
const rentalText=w=>!w?'—':typeof w==='string'?w:[w.start,w.end].map(t=>t==='00:00'?'Midnight':`${Number(t.slice(0,2))%12||12}:${t.slice(3)} ${Number(t.slice(0,2))<12?'AM':'PM'}`).join(' – ');
import {commandSheet} from './command-sheet.mjs?v=2.9.1';
import {readStates} from './read-states.mjs?v=2.9.1';
import {mountLockedBehavior} from './locked-behaviors.mjs?v=2.9.1';
import {money,balance} from './adapter.mjs?v=2.9.1';
import {availableDay} from './calendar-parts.mjs?v=2.9.1';
import {dayPrice,securityCost,SECURITY_HOURLY} from './day-price.mjs?v=2.9.1';
import {DEPOSIT_AMOUNT} from './attention-rules.mjs?v=2.9.1';
const $=id=>document.getElementById(id);
const val=id=>$(id).value;
const number=id=>Number(val(id));
const rebookDrafts=new WeakMap();
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
 const body=document.body;
 const r=await api.detail(route.id),old=api.original('sophia');
 if(route.screen==='booking'&&document.body!==body)return r;
 const pairs=[[old.total,r.total],[old.paid,r.paid],[balance(old),r.balance],[old.depositHeld,r.depositHeld]];
 if(route.screen==='booking'||route.screen==='record-payment'||route.screen==='edit-booking')replaceMoney(document.body,pairs);
 if(r.id!=='sophia'||r.client!==old.client||r.phone!==old.phone||r.contract!==old.contract||r.type!==old.type){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode()))node.textContent=(node.textContent.includes('Sophia Martinez & Carlos Ray')?node.textContent.replaceAll('Sophia Martinez & Carlos Ray',r.client):node.textContent.replaceAll('Sophia Martinez',r.client)).replaceAll(old.contract,r.contract).replaceAll(old.phone,r.phone||'—').replaceAll('Wedding',r.type);
  document.querySelectorAll('a[href*="/booking/sophia"]').forEach(a=>a.href=a.getAttribute('href').replace('/booking/sophia','/booking/'+encodeURIComponent(r.id)));
 }
 if(route.screen==='booking'){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){node.textContent=node.textContent.replace('[email address]',r.email||'—').replace('10:00 AM – Midnight',rentalText(r.rentalWindow)).replace('160 Guests',r.guestCount!=null?String(r.guestCount)+' Guests':'—');}
 }
 if(route.screen==='record-payment'){$('paymentDate').value=api.today;$('paymentAmount').value=r.balance?.toFixed(2)||'0.00';if(r.balance==null){$('paymentAmount').setCustomValidity('Set the agreed price before recording a payment.');}}
 if(route.screen==='edit-booking'){
  const lines=r.lines||{hall:r.total||0,extras:[],discount:0};
  if(r.total==null)$('displayWasTotal').textContent='Not agreed';
  $('lineDiscountNote').value=lines.discountNote||'';
  $('lineHall').value=lines.hall.toFixed(2);$('lineDiscount').value=lines.discount.toFixed(2);
  standard.forEach(name=>{const line=lines.extras.find(e=>e.key===name.toLowerCase());$('check'+name).checked=!!line;$('price'+name).value=(line?.amount||0).toFixed(2);$('price'+name).disabled=!line;});
  {
   // Security guard hours: hours x $30/hr sets the amount, and an existing amount shows its hours. The amount can still be typed by hand.
   // The hours sit on their own row under Security, laid out like the other extras rows, so the existing row is untouched.
   const check=$('checkSecurity'),amount=$('priceSecurity'),row=check.closest('.standard-extra-row');
   const hoursRow=row.cloneNode(false);
   const caption=document.createElement('label');caption.className='form-checkbox-label';caption.htmlFor='priceSecurityHours';caption.style.paddingLeft='28px';
   const captionText=document.createElement('span');captionText.textContent='Hours of security';caption.append(captionText);
   const hours=document.createElement('input');hours.type='number';hours.id='priceSecurityHours';hours.className='form-input';hours.min='0.5';hours.max='24';hours.step='0.5';
   hours.placeholder='Hours';hours.style.cssText='width: 100px; min-height: 36px; padding: 4px 8px;';
   hoursRow.append(caption,hours);row.after(hoursRow);
   const hoursFromAmount=()=>{const h=Number(amount.value)/SECURITY_HOURLY;return Number.isFinite(h)&&h>0&&Math.abs(h*2-Math.round(h*2))<1e-9?String(h):'';};
   hours.value=check.checked?hoursFromAmount():'';hours.disabled=!check.checked;
   hours.addEventListener('input',()=>{const cost=securityCost(hours.value);if(cost>0){amount.value=cost.toFixed(2);amount.dispatchEvent(new Event('input',{bubbles:true}));}});
   amount.addEventListener('input',e=>{if(e.isTrusted)hours.value=hoursFromAmount();});
   check.addEventListener('change',()=>{hours.disabled=!check.checked;if(check.checked&&!hours.value)hours.value=hoursFromAmount();});
  }
  const custom=lines.extras.filter(e=>!e.key);const container=$('customExtrasContainer');const sample=container.firstElementChild.cloneNode(true);container.replaceChildren();
  for(const line of custom){const row=sample.cloneNode(true);row.querySelector('.custom-label').value=line.label;row.querySelector('.custom-amount').value=line.amount.toFixed(2);container.append(row);}
 }
 if(route.screen==='booking'&&(r.id!=='sophia'||r.revision!==old.revision||JSON.stringify(r.lines)!==JSON.stringify(old.lines)||r.paid!==old.paid)){
  const table=document.querySelector('.breakdown-table tbody');const row=table.firstElementChild.cloneNode(true);table.replaceChildren();
  const lines=r.lines||{hall:r.total||0,extras:[],discount:0};
  const parts=[['Hall Rental Base',lines.hall],...lines.extras.map(e=>[e.label,e.amount]),['Discount',-lines.discount],[r.cancelled&&r.type!=='Blackout'?'Cancellation charge':'Total Agreed Event Charge',r.financialTotal],['Total Payments Recorded So Far',-r.paid],[r.cancelled&&r.credit>0?'Credit to refund':'Remaining Balance Due',r.cancelled&&r.credit>0?r.credit:r.balance]];
  parts.forEach(([label,value],i)=>{const tr=row.cloneNode(true);tr.children[0].textContent=label;tr.children[1].textContent=value==null?'Not agreed':(value<0?'-':'')+money(Math.abs(value));if(i===parts.length-1)tr.className='breakdown-balance-row';if(i===parts.length-3)tr.className='breakdown-total-row';table.append(tr);});
  const timeline=document.querySelector('.timeline'),sample=timeline.firstElementChild.cloneNode(true);timeline.replaceChildren();
  bookingTransactions(r).slice().reverse().forEach(t=>{const item=sample.cloneNode(true);const spans=item.querySelectorAll('h5 span');const negative=t.category==='refund'||t.category==='deposit'&&t.kind!=='receive';spans[0].textContent=(t.category==='refund'?'Event refund · ':t.category==='deposit'?'Deposit '+t.kind+' · ':t.opening?'Opening payment · ':'')+(negative?'-':'')+money(t.amount)+' · '+(t.method||'Method not recorded');spans[1].textContent=t.date||'Date not recorded';item.querySelector('button')?.setAttribute('data-transaction-id',t.id);item.querySelector('p').textContent=t.note||'Recorded in the ledger';timeline.append(item);});
  const history=document.querySelector('.history-entry').parentElement,sampleHistory=history.firstElementChild.cloneNode(true);history.replaceChildren();
  r.activity.slice().reverse().forEach(entry=>{const item=sampleHistory.cloneNode(true);item.querySelector('strong').textContent=entry.at;item.querySelector('.history-meta span').textContent=entry.actor;const paras=item.querySelectorAll('p');paras[0].textContent=entry.type==='bookingEmail'?'Email sent':entry.type;paras[1].textContent=entry.type==='bookingEmail'?entry.reason:entry.type==='reminder'&&entry.changes?.some(c=>c.field==='sentEmail')?(entry.changes.find(c=>c.field==='note')?.after||entry.reason):'Reason: '+(entry.reason||'—');history.append(item);});
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
   header.children[1].children[1].textContent=r.financialTotal==null?'Not agreed':r.cancelled&&r.credit>0?money(r.credit)+' credit':money(r.balance);
   header.children[1].lastElementChild.textContent=(r.cancelled&&r.type!=='Blackout'?'Cancellation charge ':'Agreed total ')+(r.financialTotal==null?'Not agreed':money(r.financialTotal))+' · Paid '+money(r.paid);
   const box=document.querySelector('.deposit-box');box.querySelector('.badge').textContent=r.depositWaiver?'Waived':money(r.depositHeld)+' Held';box.querySelector('button').textContent='Refund '+money(r.depositHeld);
   const subtitle=document.querySelector('.breakdown-table').parentElement.querySelector('.card-subtitle');subtitle.textContent=r.total==null?'Agreed price has not been set':'Itemized line items composing the '+money(r.financialTotal)+' agreed total';
   const warning=document.querySelector('.breakdown-table').parentElement.querySelector('.alert-warning');if(warning){if(variant==='overdue')warning.querySelector('strong').textContent='Final Balance Overdue since '+dueDate(r)+'.';else warning.remove();}
  }
 }
 if(route.screen==='booking')refreshContractCard(r);
 return r;
}
function linesFromForm(){return {hall:number('lineHall'),discount:number('lineDiscount'),discountNote:val('lineDiscountNote'),extras:[
 ...standard.filter(n=>$('check'+n).checked).map(n=>({key:n.toLowerCase(),label:n,amount:number('price'+n)})),
 ...[...document.querySelectorAll('.custom-extra-row')].map(row=>({label:row.querySelector('.custom-label').value,amount:Number(row.querySelector('.custom-amount').value)}))
]};}
function installPaymentPicker(api,go){
 const generic='.page-actions a[href="#/booking/sophia/pay"],.header-actions a[href="#/booking/sophia/pay"],a.quick-action-card[href="#/booking/sophia/pay"]';
 document.querySelectorAll(generic).forEach(a=>a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPaymentPicker(api,go,a);},true));
}
function openPaymentPicker(api,go,opener){
 const mk=(tag,attrs={},text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!=null)n.textContent=text;return n;};
 const backdrop=mk('div',{class:'modal-backdrop',id:'paymentPicker'}),dialog=mk('div',{class:'modal-dialog',role:'dialog','aria-modal':'true','aria-labelledby':'paymentPickerTitle'});
 const header=mk('div',{class:'modal-header'}),body=mk('div',{class:'modal-body'}),actions=mk('div',{class:'modal-actions'});
 header.append(mk('h2',{class:'modal-title',id:'paymentPickerTitle'},'Record payment for which booking?'));
 const search=mk('input',{type:'search',class:'form-input',placeholder:'Search guest, phone or contract…','aria-label':'Search bookings'}),list=mk('div',{style:'margin-top:12px;max-height:320px;overflow:auto'}),cancel=mk('button',{type:'button',class:'btn btn-quiet'},'Cancel');
 const finish=()=>{document.removeEventListener('keydown',key,true);backdrop.remove();opener.focus();};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish();}};
 let seq=0;
 const load=async()=>{const mine=++seq,q=search.value.trim();let rows=await api.list(q?{q}:{});if(mine!==seq)return;rows=rows.filter(x=>!x.cancelled&&x.total!=null&&!(x.type==='Blackout')&&(q||x.balance>0)).slice(0,12);list.replaceChildren(...(rows.length?rows.map(x=>{const b=mk('button',{type:'button',class:'btn btn-quiet',style:'display:flex;width:100%;justify-content:space-between;margin-bottom:6px;text-align:left'});b.append(mk('span',{},(x.client||'')+' \u00b7 '+(x.date||'')),mk('span',{},'Balance '+money(x.balance)));b.onclick=()=>{finish();go('#/booking/'+encodeURIComponent(x.id)+'/pay');};return b;}):[mk('p',{},q?'No matching bookings.':'No bookings with a balance due.')]));};
 let timer;search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(load,200);});
 cancel.onclick=finish;backdrop.onclick=e=>{if(e.target===backdrop)finish();};
 actions.append(cancel);body.append(search,list,actions);dialog.append(header,body);backdrop.append(dialog);document.body.append(backdrop);document.addEventListener('keydown',key,true);search.focus();load();
}
const mountedFlowBodies = new WeakSet();

export async function mountFlows({api,route,go,toast,closeSheet}){
 const mountBody=document.body;
 if(mountedFlowBodies.has(mountBody))return;
 mountedFlowBodies.add(mountBody);
 if(['booking','payments'].includes(route.screen))mountSquare({api,screen:route.screen,route,toast,go}).catch(()=>{});
 if(route.screen==='record-payment')warmDocuments(api);
 const screen=route.screen;let r,saving=false;
 if(api.mode==='http'&&['bookings','overview','payments','calendar'].includes(screen))installPaymentPicker(api,go);
 if(['booking','edit-booking','record-payment'].includes(screen))r=await hydrateDetail(api,route);
 if(screen==='booking'&&document.body!==mountBody)return;
 if(screen==='overview')await mountOverview(api);
 if(screen==='payments')await mountPayments(api,toast,go);
 mountLockedBehavior(screen,api,route,toast,r);
 if(screen==='booking'){
  const documents=await mountDocuments(api,route.id,toast);
  if(document.body!==mountBody)return;
  document.querySelectorAll('.timeline button').forEach((button,i)=>{button.dataset.transactionId||=r.payments.slice().reverse()[i]?.id||'';});
  mountBookingActions(r,api,documents);
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
    const securityHours=Number($('securityHours')?.value),securityOn=$('extraSecurity').checked;
    const extras=standard.filter(n=>$('extra'+n).checked).map(n=>({key:n.toLowerCase(),label:n,amount:n==='Security'?securityCost(securityHours):api.intakeRates[n.toLowerCase()]}));
    const total=api.priceLines({hall:number('newHallPrice'),extras,discount:0}).total;
    const created=await api.createBooking({client:val('guestName'),phone:val('guestPhone'),date:val('eventDate'),type:val('eventType'),total,paid:number('initialPaid'),paymentDate:api.today,method:val('initialMethod'),...($('depositStatus').value==='Owed'?{deposit:'Owed'}:{}),...(securityOn?{notes:'Security guard: '+securityHours+' hrs @ $'+SECURITY_HOURLY+'/hr ($'+securityCost(securityHours).toFixed(2)+').'}:{}),...Object.fromEntries(standard.map(n=>[n.toLowerCase(),$('extra'+n).checked]))},{lines:{hall:number('newHallPrice'),extras,discount:0},depositStatus:val('depositStatus'),email:val('guestEmail'),guestCount:number('guestCount')});
    go('#/booking/'+created.id);
   }
  }catch(error){toast(error.message);if(api.mode==='http'){const state=readStates({states:await api.presentation('states')},()=>e.target.requestSubmit());const banner=state.show('error');e.target.prepend(banner);banner.querySelector('p').textContent=error.message;banner.querySelector('strong')?.replaceChildren(document.createTextNode(error.status===409?'Booking changed. Review the refreshed data before retrying.':'Unable to save. Your form values are kept.'));if(error.status===409){const current=await api.detail(route.id);r=current;banner.querySelector('p').textContent=error.message+' Latest agreed: '+money(current.financialTotal)+'; paid: '+money(current.paid)+'; balance: '+money(current.balance)+'. Review before retrying.';}}}
  finally{saving=false;if(submit)submit.disabled=false;}
 });
 document.body.addEventListener('click',async e=>{
  const menuTrigger=e.target.closest('.more-dropdown-container')?.querySelector('[data-toggle-menu]');
  const blockButton=e.target.closest('[data-action="calendar-0"]');
  if(blockButton){try{await openBookingAction({api,id:null,action:'block',opener:blockButton,go});}catch(error){toast(error.message);}return;}
  const bookingAction=e.target.closest('[data-booking-action]');
  if(bookingAction){
   const {bookingId,bookingAction:action}=bookingAction.dataset;
   try{
    if(action==='bookAgain'){
     const source=await api.detail(bookingId);
     if(source.type==='Blackout'||document.body!==mountBody)return;
     const {client,phone,email,type,guestCount}=source;
     rebookDrafts.set(api,{client,phone,email,type,guestCount});
     go('#/new');
    }else await openBookingAction({api,id:bookingId,action,opener:menuTrigger || bookingAction,go});
   }catch(error){toast(error.message);}
   return;
  }
  const contract=e.target.closest('.dropdown-item');if(contract?.textContent.trim()==='Contract copy (PDF)'){e.preventDefault();try{await contractSheet(api,contract.closest('.ledger-row').dataset.id,toast);}catch(error){toast(error.message);}return;}
  const reconcile=e.target.closest('a[href^="#/booking/"]');if(reconcile?.textContent.trim()==='Reconcile'){e.preventDefault();e.stopPropagation();const id=decodeURIComponent(reconcile.hash.slice('#/booking/'.length).split(/[/?]/)[0]);await commandSheet({api,id,kind:'reconcile',toast,go});return;}
  const receipt=e.target.closest('button');if(receipt?.textContent.trim()==='View receipt PDF'){try{const rows=await api.documents(route.id),row=await receiptRow(rows,receipt.dataset.transactionId);if(!row)throw Error('No receipt PDF is available after the document cutoff.');if(row.status==='saved')await downloadDocument(api,row.id,toast);else{await issueReceiptWithProgress(api,route.id,row.id,toast);await mountDocuments(api,route.id,toast);}}catch(e){toast(e.message);}return;}
  const action=e.target.closest('[data-action]');
  if(action&&action.tagName!=='FORM'){
   try{
    const key=action.dataset.action;
    if(['booking-2','booking-3','booking-4','booking-5','booking-8','booking-9'].includes(key)){await commandSheet({api,id:route.id,kind:{'booking-2':'deposit','booking-3':'refund','booking-4':'reminder','booking-5':'contractStatus','booking-8':'depositRefund','booking-9':'deduct'}[key],toast,go,opener:menuTrigger});return;}
    if(key==='booking-0'){await contractSheet(api,route.id,toast,menuTrigger);return;}
    if(key==='booking-1'){const rows=await api.documents(route.id),row=rows.find(r=>r.kind!=='contract');if(!row)throw Error('No receipt PDF is available after the document cutoff.');if(row.status==='saved')await downloadDocument(api,row.id,toast);else{await issueReceiptWithProgress(api,route.id,row.id,toast);await mountDocuments(api,route.id,toast);}return;}
    if(key==='booking-6'&&api.ics){const text=await api.ics(route.id),url=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='booking.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(key==='overview-0'){await api.commands('markSettled',action.dataset.bookingId,{reason:'Owner marked the past event settled.'});action.textContent='Settled ✓';action.disabled=true;action.style.opacity='0.6';return;}
    if(key==='booking-7'){
     const current=await api.detail(route.id);
     if(!current.cancelled&&current.type!=='Blackout'){await openBookingAction({api,id:route.id,action:'cancel',opener:menuTrigger || action,go});return;}
     if(!current.cancelled&&!window.confirm('Release this blocked date?'))return;
     await api.commands(current.cancelled?'restore':'release',route.id,{reason:'Owner changed the reservation status.'});go('#/bookings');return;
    }
    toast('Local preview: '+action.textContent.trim()+'. No external action was taken.');
   }catch(error){toast(error.message);}
  }
  const release=e.target.closest('.row-actions-cell button');if(release?.textContent.trim()==='Release hold'){
   if(!window.confirm('Release this blocked date?'))return;
   try{await api.commands('release',release.closest('.ledger-row').dataset.id,{reason:'Owner released the date hold.'});go('#/bookings');}catch(error){toast(error.message);}
   return;
  }
  const restore=e.target.closest('.row-actions-cell button');if(['Restore','Restore booking'].includes(restore?.textContent.trim())){await api.commands('restore',restore.closest('.ledger-row').dataset.id,{reason:'Owner restored the booking.'});go('#/bookings');return;}
  const cancel=e.target.closest('.dropdown-item');if(cancel?.tagName==='BUTTON'&&cancel.textContent.includes('Cancel')){
   const row=cancel.closest('.ledger-row');
   try{await openBookingAction({api,id:row.dataset.id,action:'cancel',opener:cancel,go});}catch(error){toast(error.message);}
  }
 });
 // The More menu is ready once its record-specific actions and handlers are mounted.
 if(screen==='booking')$('moreActionsMenuTrigger').disabled=false;
 if(screen==='bookings')await mountBookings(api,toast,go);
 if(screen==='calendar')await mountCalendar(api,go,toast);
 if(screen==='new-booking'){
  const draft=rebookDrafts.get(api);
  rebookDrafts.delete(api);
  if(draft){
   $('guestName').value=draft.client;
   $('guestPhone').value=draft.phone||'';
   $('guestEmail').value=draft.email||'';
   $('eventType').value=draft.type;
   $('guestCount').value=draft.guestCount??'';
   $('eventDate').value='';
  }else if(route.query.has('date'))$('eventDate').value=route.query.get('date');
  const check=async()=>{const taken=(await api.list()).some(r=>r.date===val('eventDate')&&!r.cancelled);$('dateCheckStatus').textContent=taken?'Date already booked or blocked':'Date available ✓';$('eventDate').setCustomValidity(taken?'This date is already booked or blocked.':'');return !taken;};
  // The hall price follows the chosen day (Fri/Sat, Sunday, weekday, holiday). A price the user typed themselves is never overwritten.
  const hall=$('newHallPrice');let hallEdited=false;
  // Start clean. The locked mock-up carries demo numbers ($3,200 hall price, three ticked extras, a $1,000 down payment); a real booking starts empty
  // and the hall price comes from the day. The down payment stays empty unless staff enter an amount.
  $('depositStatus').value='Owed';                       // nothing is recorded as received unless staff choose Received & Held
  hall.value='';$('initialPaid').value='';for(const n of ['Covers','Projector','Audio','Security'])$('extra'+n).checked=false;
  hall.dispatchEvent(new Event('input',{bubbles:true}));
  // Security guard: when ticked, ask for the hours. The cost is hours x $30/hr and the total follows.
  const secCheck=$('extraSecurity'),secLabelEl=secCheck.closest('label'),secText=secLabelEl.querySelector('span');
  const secRow=document.createElement('div');secRow.id='securityHoursRow';secRow.style.cssText='display:none;align-items:center;gap:8px;flex-wrap:wrap;padding-left:28px;';
  const secCaption=document.createElement('label');secCaption.className='form-label';secCaption.htmlFor='securityHours';secCaption.style.margin='0';secCaption.textContent='Hours of security needed';
  const secHours=document.createElement('input');secHours.type='number';secHours.id='securityHours';secHours.className='form-input';secHours.min='1';secHours.max='24';secHours.step='0.5';secHours.value='6';secHours.style.cssText='width:96px;min-height:var(--touch-target-min);';
  const secTotal=document.createElement('span');secTotal.id='securityHoursTotal';secTotal.className='card-subtitle';
  secRow.append(secCaption,secHours,secTotal);secLabelEl.after(secRow);
  const usd=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const syncSecurity=()=>{
   const on=secCheck.checked,h=Number(secHours.value),cost=securityCost(h);
   secRow.style.display=on?'flex':'none';secHours.required=on;
   secTotal.textContent='× '+usd(SECURITY_HOURLY)+'/hr = '+usd(cost);
   secText.textContent='Security Guard ('+(h>0?h:'—')+' hrs @ $'+SECURITY_HOURLY+'/hr = +'+usd(cost)+')';
   hall.dispatchEvent(new Event('input',{bubbles:true}));
  };
  secCheck.addEventListener('change',syncSecurity);secHours.addEventListener('input',syncSecurity);syncSecurity();
  hall.addEventListener('input',e=>{if(e.isTrusted)hallEdited=true;});
  const applyDayPrice=()=>{
   const price=dayPrice(val('eventDate'));if(!price||hallEdited)return;
   const next=price.hall.toFixed(2);if(hall.value===next)return;
   hall.value=next;hall.dispatchEvent(new Event('input',{bubbles:true}));
   toast('Hall price set to the '+price.label+' rate ($'+price.hall.toLocaleString('en-US',{minimumFractionDigits:2})+'). You can change it.');
  };
  $('eventDate').addEventListener('change',async()=>{if(await check())applyDayPrice();});
  $('btnContinueStep2').addEventListener('click',async()=>{if(!await check()||!['guestName','guestPhone','guestEmail','eventDate'].every(id=>$(id).reportValidity())){$('step1Section').style.display='block';$('step2Section').style.display='none';return;}applyDayPrice();});
 }
 if(screen==='insights'){
  const initialData=await api.insights();
  if(api.mode==='http'&&Array.isArray(initialData.years)){const sel=document.querySelector('select'),have=new Set([...sel.options].map(o=>o.value));for(const y of initialData.years){if(have.has(y))continue;const o=document.createElement('option');o.value=y;o.textContent='Year '+y;const after=[...sel.options].filter(x=>/^\d{4}$/.test(x.value)&&x.value<y).pop();if(after)after.after(o);else sel.insertBefore(o,sel.options[0]);have.add(y);}}
  const mixSamples=[...document.querySelectorAll('.bar-chart-container')].map(group=>group.querySelector('.bar-row').cloneNode(true));
  const select=document.querySelector('select');
  const monthLong=i=>new Date(2026,i,1).toLocaleDateString('en-US',{month:'long'}),days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const cols=[...document.querySelectorAll('.v-bar-col')],chartCard=document.querySelector('.v-chart').closest('.card'),chartSub=chartCard.querySelector('.card-subtitle');
  const mixSubs=[...document.querySelectorAll('.insights-bottom-grid .card-subtitle')],baseSubs=[chartSub.textContent,...mixSubs.map(n=>n.textContent)];
  // Month selection: the same three cards and two mix charts, narrowed to one month. State is in memory only.
  const state={data:initialData,year:select.value,month:null,peak:Math.max(...initialData.months)?initialData.months.indexOf(Math.max(...initialData.months)):-1};
  const chartActions=document.createElement('div');chartActions.style.cssText='display:flex;align-items:center;gap:var(--space-3)';
  const badge=chartCard.querySelector('.card-header .badge'),resetBtn=document.createElement('button');
  resetBtn.type='button';resetBtn.className='btn btn-quiet btn-sm';resetBtn.textContent='Show whole year';resetBtn.hidden=true;resetBtn.dataset.insightsReset='true';
  badge.before(chartActions);chartActions.append(resetBtn,badge);
  const render=()=>{
   const data=state.data,m=state.month,view=m==null?data:{...data.byMonth[m],cohort:data.cohort},values=document.querySelectorAll('.stat-value');
   const yl=state.year==='all'?'all years':state.year,label=m==null?yl:monthLong(m)+(state.year==='all'?', all years':' '+state.year);
   [view.charges,view.payments,view.balance].forEach((v,i)=>values[i].textContent=money(v));
   {const real=data.cohort==='ledger';document.querySelector('.stat-note').textContent=view.count+(real?' reservations':' fictional annual reservations');const lead=document.querySelector('.page-description');if(real&&lead)lead.textContent='Monthly value, booking counts, and celebration mix.';}
   document.querySelectorAll('.stat-note')[1].textContent=(view.charges?100*view.payments/view.charges:0).toFixed(1)+'% of total charges received';
   document.querySelector('.stat-label').textContent='Agreed venue value ('+label+')';
   chartCard.querySelector('h2').textContent='Bookings by Month ('+yl+')';
   const peak=state.peak>=0?data.months[state.peak]:0;
   badge.textContent=peak?'Peak month: '+monthLong(state.peak)+' ('+money(peak)+')':'No reservations in this year';
   cols.forEach((col,i)=>{const bar=col.querySelector('.v-bar'),lab=col.querySelector('.v-bar-label'),gold=m==null?i===state.peak:i===m;
    col.querySelector('.v-bar-val').textContent='$'+(data.months[i]/1000).toFixed(1)+'k';bar.style.height=(peak?100*data.months[i]/peak:0)+'%';
    bar.classList.toggle('peak',gold);bar.classList.toggle('selected',m===i);col.setAttribute('aria-pressed',String(m===i));lab.style.color=gold?'var(--accent)':'';lab.style.fontWeight=gold?'700':'';});
   resetBtn.hidden=m==null;
   chartSub.textContent=m==null?baseSubs[0]:'Showing '+label+'. Select the month again, or use Show whole year, to go back.';
   mixSubs.forEach((n,i)=>{n.textContent=m==null?baseSubs[i+1]:'Share of '+label+' booking count';});
   if(api.mode==='http'){
    const groups=document.querySelectorAll('.bar-chart-container');
    const renderMix=(group,entries)=>{const sample=mixSamples[[...groups].indexOf(group)];const rows=entries.map(([name,count])=>{const row=sample.cloneNode(true),share=view.count?Math.round(100*count/view.count):0;row.firstElementChild.textContent=name;row.querySelector('.bar-value').textContent=share+'% ('+count+')';row.querySelector('.bar-fill').style.width=share+'%';return row;});if(!rows.length){const none=document.createElement('p');none.className='card-subtitle';none.textContent='No reservations.';rows.push(none);}group.replaceChildren(...rows);};
    renderMix(groups[0],Object.entries(view.types));
    renderMix(groups[1],Object.entries(view.weekdays).sort((a,b)=>b[1]-a[1]).map(([day,count])=>[days[day],count]));
    const takeaway=document.querySelector('.alert-info > div');if(takeaway)takeaway.textContent='Key Venue Takeaway: '+(view.count?'Most reservations: '+days[Object.entries(view.weekdays).sort((a,b)=>b[1]-a[1])[0]?.[0]]+'.':'No reservations in '+(m==null?'this year':label)+'.');
    return;
   }
   const mix=[view.types.Wedding||0,view.types.Birthday||0,view.types.Business||0,view.types.Other||0,view.weekdays[6]||0,view.weekdays[5]||0,view.weekdays[0]||0];
   document.querySelectorAll('.bar-row').forEach((row,i)=>{const share=view.count?Math.round(100*mix[i]/view.count):0;row.querySelector('.bar-value').textContent=share+'% ('+mix[i]+')';row.querySelector('.bar-fill').style.width=share+'%';});
  };
  const applyInsights=async e=>{
   const data=await api.insights(e.target.value);if(document.body!==mountBody)return;
   const top=Math.max(...data.months);Object.assign(state,{data,year:e.target.value,month:null,peak:top?data.months.indexOf(top):-1});render();
  };
  const choose=i=>{state.month=state.month===i?null:i;render();};
  document.querySelector('.v-chart').setAttribute('role','group');
  cols.forEach((col,i)=>{col.setAttribute('role','button');col.tabIndex=0;col.setAttribute('aria-pressed','false');col.setAttribute('aria-label',monthLong(i)+': show this month');
   col.addEventListener('click',()=>choose(i));col.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(i);}});});
  resetBtn.addEventListener('click',()=>{state.month=null;render();});
  select.addEventListener('change',applyInsights);
  if(api.mode==='http'&&(document.querySelector('.stat-value').textContent.trim()!==money(initialData.charges)||Object.entries(initialData.types).some(([type,count])=>![...document.querySelectorAll('.bar-chart-container:first-of-type .bar-row,.bar-row')].some(row=>row.firstElementChild.textContent===type&&row.querySelector('.bar-value').textContent.includes('('+count+')')))))await applyInsights({target:select});
 }

}
async function mountBookings(api,toast,go){
 const mountBody=document.body;let updateSequence=0;
 let edge;if(api.mode==='http')edge=readStates({states:await api.presentation('states')},()=>{$('bookingSearchInput').value='';document.querySelector('[data-filter="all"]').click();update();});
 const all=await api.list();const canonical=all.length===12&&all.every(r=>r.date===api.original(r.id)?.date);const body=$('bookingsTableBody');const makeRow=bookingRowBuilder(body,all,api.today,api.original);
 const originalRows=[],originalNodes=[...body.childNodes];
 const dividerSample=[...body.children].find(row=>!row.classList.contains('ledger-row'))?.cloneNode(true);
 const outerHeader=document.querySelector('.month-group-header');
 for(const node of [...body.querySelectorAll('.ledger-row')]){
  const record=all.find(r=>r.contract===node.dataset.contract);
  if(!record){originalNodes.splice(originalNodes.indexOf(node),1);node.remove();continue;}
  const row=makeRow(record,{preserveHold:canonical});originalRows.push(row);originalNodes[originalNodes.indexOf(node)]=row;node.replaceWith(row);
 }
 for(const record of all.filter(r=>!originalRows.some(row=>row.dataset.id===r.id))){const row=makeRow(record);originalRows.push(row);originalNodes.push(row);body.append(row);}
 const counts=await api.counts();
 const description=document.querySelector('.page-description');
 const defaultDescription=description.textContent.replace(/\d+ records displayed/,all.length+' records displayed');
 description.textContent=defaultDescription;
 document.querySelectorAll('.filter-chip').forEach(chip=>chip.textContent=chip.textContent.replace(/\(\d+\)/,'('+counts[chip.dataset.filter]+')'));
 if(counts.archived>0){
  const chip=document.createElement('button');chip.type='button';chip.className='filter-chip';chip.dataset.filter='archived';
  chip.textContent='Archived ('+counts.archived+')';chip.style.minHeight='var(--touch-target-min)';
  document.querySelector('.filter-chips').append(chip);
 }
 // The frozen default order/grouping is retained. Explicit sorts and searches use adapter data.
 async function update(){
  const ticket=++updateSequence;
  const sort=$('sortSelect').value,query=$('bookingSearchInput').value,filter=document.querySelector('.filter-chip.active')?.dataset.filter||'all';
  const archived=filter==='archived',search=$('bookingSearchInput');
  search.disabled=archived;
  const exportButton=document.querySelector('[data-export-csv]');
  if(exportButton)exportButton.style.display=archived?'none':'';
  if(archived)search.value='';
  const sortBy=sort.startsWith('guest')?'guest':sort.startsWith('balance')?'balance':'date';
  const rows=await api.list(archived?{archived:'1',sort:sortBy}:{q:query,filter,sort:sortBy});if(ticket!==updateSequence||document.body!==mountBody)return;if(sort==='date-desc')rows.reverse();
  description.textContent=archived?defaultDescription.replace(/\d+ records displayed/,rows.length+' archived displayed'):defaultDescription;
  for(const r of rows){const index=originalRows.findIndex(row=>row.dataset.id===r.id),row=makeRow(r,{preserveHold:canonical&&filter==='all'&&!query&&sort==='date-asc'});if(index<0)originalRows.push(row);else{const old=originalRows[index],nodeIndex=originalNodes.indexOf(old);if(nodeIndex>=0)originalNodes[nodeIndex]=row;old.replaceWith(row);originalRows[index]=row;}}
  edge?.clear('error');edge?.clear('empty');if(!rows.length)edge?.show('empty');
  const ids=new Set(rows.map(r=>r.id));originalRows.forEach(row=>row.style.display=ids.has(row.dataset.id)?'':'none');
  if(archived||sort!=='date-asc'||query||!canonical){
   body.replaceChildren();let lastMonth=null;outerHeader.style.display='none';
   rows.forEach(r=>{const row=originalRows.find(el=>el.dataset.id===r.id);if(!row)return;
    const month=r.date.slice(0,7);if(sort.startsWith('date')&&month!==lastMonth&&dividerSample){const divider=dividerSample.cloneNode(true);divider.firstElementChild.textContent=new Date(r.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});body.append(divider);lastMonth=month;}body.append(row);
   });
  }else{body.replaceChildren(...originalNodes);outerHeader.style.display='';}

 }
 mountBody.addEventListener('contract-saved',()=>{if(document.body===mountBody)update().catch(()=>edge?.show('error'));});
 $('sortSelect').addEventListener('change',update);$('bookingSearchInput').addEventListener('input',()=>update().catch(()=>edge?.show('error')));document.querySelectorAll('.filter-chip').forEach(chip=>chip.addEventListener('click',()=>{
  document.querySelectorAll('.filter-chip').forEach(candidate=>candidate.classList.toggle('active',candidate===chip));
  update().catch(()=>edge?.show('error'));
 }));
 if(!canonical) mountExport(api,'bookings',toast,go);
 if(!canonical){$('sortSelect').value='date-desc';await update();}
}
async function mountCalendar(api,go,toast){
 const mountBody=document.body;
 const initialRows=await api.calendar();const unchanged=initialRows.length===2&&initialRows.some(r=>r.id==='sophia'&&r.date==='2026-11-21')&&initialRows.some(r=>r.id==='amara'&&r.date==='2026-11-28');
 const listUpcoming=async()=> (await api.list({filter:'upcoming'})).filter(r=>r.type!=='Blackout'&&!r.cancelled);
 if(!unchanged||(await listUpcoming()).some(r=>r.revision!==api.original(r.id)?.revision)){
  const exportButton=document.createElement('button');
  exportButton.type='button';
  exportButton.className='btn btn-quiet';
  exportButton.textContent='Export calendar';
  exportButton.onclick=async()=>{
   exportButton.disabled=true;
   try{
    const events=await listUpcoming();
    if(document.body===mountBody)downloadBlob(new Blob([calendarIcs(events)],{type:'text/calendar;charset=utf-8'}),'upcoming-events.ics');
   }catch(error){toast(error.message);}
   finally{exportButton.disabled=false;}
  };
  document.querySelector('.page-actions').prepend(exportButton);
 }
 let year=Number(api.today.slice(0,4)),month=Number(api.today.slice(5,7));const grid=document.querySelector('.calendar-grid')||document.querySelector('.cal-day-cell').parentElement;
 const defaultGrid=grid.innerHTML;const defaultCard=$('dayScheduleContent').innerHTML;
 async function select(day){
  const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;let found=(await api.calendar(year,month)).find(r=>r.date===date);if(found&&api.mode==='http')found=await api.detail(found.id);if(document.body!==mountBody)return;
  $('selectedDateTitle').textContent=new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'2-digit',year:'numeric'});
  $('selectedDateSubtitle').textContent=found?(balance(found)===0?'1 reservation booked · Paid in full':'1 reservation booked · Entire facility reserved'):'Date open · Ready for reservations';$('selectedDateBadge').textContent=found?'Booked':'Available';$('selectedDateBadge').className=found&&balance(found)>0?'badge badge-due':'badge badge-paid';
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
   const cell=document.createElement('div');cell.className='cal-day-cell'+(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`===api.today?' is-today':'');cell.dataset.day=day;const n=document.createElement('span');n.className='cal-day-num';n.textContent=day;cell.append(n);
   const dayRows=bookings.filter(r=>Number(r.date.slice(-2))===day);if(dayRows.length){const pills=document.createElement('div');pills.className='cal-day-pills';for(const r of dayRows.slice(0,2)){const pill=document.createElement('span');const paid=r.type!=='Blackout'&&r.total!=null&&r.balance===0;pill.className='cal-event-micro-pill '+(r.type==='Blackout'?'blackout':paid?'paid':'due');pill.textContent=r.type==='Blackout'?'Blocked':String(r.client||r.guest||r.type||'Booked').split(' ')[0];pills.append(pill);}cell.append(pills);}grid.append(cell);
  }
 }
 document.body.addEventListener('click',async e=>{const cell=e.target.closest('[data-day]');if(cell?.tagName==='BUTTON'){const next=(await api.list()).find(r=>r.date>=api.today&&r.type!=='Blackout'&&!r.cancelled);if(next){year=Number(next.date.slice(0,4));month=Number(next.date.slice(5,7));await renderMonth();await select(Number(next.date.slice(-2)));}}else if(cell)await select(Number(cell.dataset.day));});
 if(!unchanged){const tb=$('btnTodayMonth');if(tb&&/^\d{4}-\d{2}-\d{2}$/.test(api.today))tb.textContent='Today ('+new Date(api.today+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+')';await renderMonth();await select(Number(api.today.slice(-2)));}else{const selected=initialRows.find(r=>r.id==='sophia'),original=api.original('sophia');if(['client','type','contract','total','paid','guestCount','rentalWindow'].some(key=>JSON.stringify(selected[key])!==JSON.stringify(original[key])))await select(21);}
 $('btnPrevMonth').addEventListener('click',async()=>{if(--month<1){month=12;year--;}await renderMonth();});$('btnNextMonth').addEventListener('click',async()=>{if(++month>12){month=1;year++;}await renderMonth();});$('btnTodayMonth').addEventListener('click',async()=>{year=Number(api.today.slice(0,4));month=Number(api.today.slice(5,7));await renderMonth();await select(Number(api.today.slice(-2)));});
}

async function mountOverview(api){return mountHttpOverview(api);}
function mountExport(api,kind,toast,go){
 const button=document.createElement('button');
 button.type='button';
 button.className='btn btn-quiet';
 button.textContent='Export';
 button.dataset.exportCsv=kind;
 button.onclick=()=>openBookingAction({api,action:'export',exportKind:kind,opener:button,go}).catch(error=>toast(error.message));
 document.querySelector('.page-actions').prepend(button);
}
async function mountPayments(api,toast,go){
 const register=await api.payments();
 if(register.length!==7||register.some(t=>!t.reference))mountExport(api,'payments',toast,go);
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
 const notes=document.querySelectorAll('.stat-note'),month=api.today.slice(0,7);notes[1].textContent=register.filter(t=>t.kind==='payment'&&!t.voided&&t.date.startsWith(month)).length+' recorded receipts this month';const monthRows=rows.filter(r=>(r.flags?.open??!r.settled)&&!r.cancelled&&r.type!=='Blackout'&&r.date.startsWith(month));notes[2].textContent=monthRows.filter(r=>r.date<api.today).length+' completed · '+monthRows.filter(r=>r.date>=api.today).length+' coming up';
 const values=document.querySelectorAll('.stat-value');values[0].textContent='$'+data.balance.toLocaleString('en-US');values[1].textContent='$'+data.novemberPayments.toLocaleString('en-US');values[2].textContent=data.novemberEvents+' events';
 const list=document.querySelector('.triage-list'),templates=[...list.children].map(n=>n.cloneNode(true));
 const order=['overdue','price','past','deposit','reconcile'],expected={overdue:'sophia',price:'devon',past:'elena',deposit:'sophia',reconcile:'elena'};
 // Team reminders reuse the existing rows (same look, different wording): balance alerts use the overdue row, the deposit alert uses the deposit row.
 const display=['deadline','overdue','due','depositDue','price','past','deposit','reconcile'],templateKind={deadline:'overdue',due:'overdue',depositDue:'deposit'},labels={deadline:'Final balance deadline',due:'Balance due today',depositDue:'Security deposit not received'};
 const nodes=[];for(const kind of display)for(const item of attention.filter(a=>a.kind===kind)){
  const tk=templateKind[kind]||kind;
  const row=templates[order.indexOf(tk)].cloneNode(true),r=item.record||await api.detail(item.id),old=api.original(expected[tk]);
  // The frozen sample booking (unchanged) keeps its locked "Overdue" row; every other booking gets the reminder wording.
  const legacyRef=(kind==='deadline'||kind==='due')&&!!old&&item.id===expected[tk]&&!['client','date','type','contract','total','paid','due','depositHeld','importedDifference'].some(key=>key==='importedDifference'?(r[key]||0)!==(old[key]||0):r[key]!==old[key]);
  if(!old||item.id!==expected[tk]||(labels[kind]&&!legacyRef)||['client','date','type','contract','total','paid','due','depositHeld','importedDifference'].some(key=>key==='importedDifference'?(r[key]||0)!==(old[key]||0):r[key]!==old[key])){const heading=row.querySelector('h5'),suffix=kind==='depositDue'?' ('+money(DEPOSIT_AMOUNT)+' due)':kind==='deposit'?' ('+money(r.depositHeld)+' refundable)':kind==='reconcile'?' ('+(r.importedDifference>0?'+':'-')+money(Math.abs(r.importedDifference))+' diff)':kind==='overdue'||kind==='due'||kind==='deadline'?' ('+money(r.balance)+' due)':'';heading.textContent=(labels[kind]||heading.textContent.split(' · ')[0])+' · '+r.client+suffix;row.querySelector('p').textContent=r.date+' · '+r.type+' · '+(r.contract||'—');}
  if(old)replaceMoney(row,[[old.total,r.total],[old.paid,r.paid],[balance(old),r.balance],[old.depositHeld,r.depositHeld]]);
  const target=row.querySelector('a');if(target)target.href=item.target||'#/booking/'+r.id;const settle=row.querySelector('[data-action="overview-0"]');if(settle)settle.dataset.bookingId=r.id;
  nodes.push(row);
 }
 list.replaceChildren(...nodes);document.querySelector('.triage-card .badge').textContent=attention.length+' actionable';document.querySelector('.triage-card .card-subtitle').textContent=document.querySelector('.triage-card .card-subtitle').textContent.replace(/\d+ items/,attention.length+' items');
 {const lead=document.querySelector('.page-description');if(lead&&/^\d{4}-\d{2}-\d{2}$/.test(api.today)){const rest=lead.textContent.split('·').slice(1).join('·');lead.textContent=new Date(api.today+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})+(rest?' ·'+rest:'');}const left=Number(data.settledBalance||0),skip=data.settledBalance!==undefined;document.querySelector('.stat-note').textContent='Across '+rows.filter(r=>r.balance>0&&!r.cancelled&&!(skip&&r.settled)).length+' priced open balances'+(left>0?' · $'+left.toLocaleString('en-US')+' on settled events not counted':'');}
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
