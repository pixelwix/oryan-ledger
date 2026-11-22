import {archiveDate,bookingActionButton} from './booking-actions.mjs?v=2.8.0';
const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const compact=n=>'$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
export function dueDate(r){
 if(r.due)return r.due;
 const date=new Date(r.date+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-20);
 return Number.isFinite(+date)?date.toISOString().slice(0,10):'';
}
export function rowVariant(r,today){
 if(r.cancelled)return 'cancelled';
 if(r.type==='Blackout')return 'blocked';
 if(r.settled)return 'settled';
 if(r.total==null)return 'unpriced';
 if(r.importedDifference)return 'mismatch';
 if(r.balance===0)return 'paid';
 return dueDate(r)<today?'overdue':'due';
}
// Locked rows are style prototypes, never records. Every record, including the
// reference cohort, passes through this builder. Profiles preserve locked links
// and button styles; every normal variant receives the normalized menu below.
export function bookingRowBuilder(source,records,today,originalRecord=()=>null){
 const prototypes=new Map(),profiles=new Map();
 for(const node of source.querySelectorAll('.ledger-row')){
  const record=records.find(r=>r.contract===node.dataset.contract);
  const badge=node.querySelector('.badge'),variant=badge.classList.contains('badge-overdue')?'overdue':badge.classList.contains('badge-unpriced')?'unpriced':badge.classList.contains('badge-blocked')?'blocked':badge.classList.contains('badge-cancelled')?'cancelled':badge.classList.contains('badge-settled')?'settled':badge.textContent.includes('Review diff')?'mismatch':badge.classList.contains('badge-paid')?'paid':'due';if(!prototypes.has(variant))prototypes.set(variant,node.cloneNode(true));
  if(record)profiles.set(record.id,{variant,node:node.cloneNode(true)});
 }
 const dateLabel=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'2-digit',timeZone:'UTC'});
 return (r,{preserveHold=false}={})=>{
  const variant=rowVariant(r,today),profile=profiles.get(r.id);
  // Reuse locked status/action prototypes. The owner-approved common menu is
  // applied below regardless of a reference row's original action density.
  const sample=variant==='overdue'||variant==='due'?prototypes.get('overdue'):prototypes.get(variant);
  const row=(profile?.variant===variant?profile.node:sample||prototypes.get('paid')).cloneNode(true);
  row.dataset.id=r.id;row.dataset.contract=r.contract||'';row.dataset.guest=r.client;
  row.dataset.status=r.cancelled?'cancelled':(r.date<today?'past':'upcoming')+(r.balance>0?' due':'')+(['unpriced','mismatch','overdue'].includes(variant)?' attention':'')+(r.settled?' settled':'');
  row.querySelector('.date-block-month').textContent=dateLabel(r.date).split(' ')[0];row.querySelector('.date-block-day').textContent=r.date.slice(-2);
  const heading=row.querySelector('h4');(heading.querySelector('a')||heading).textContent=r.client;
  const diff=(r.importedDifference>0?'+':'-')+compact(Math.abs(r.importedDifference||0));
  row.querySelector('.guest-info p').textContent=variant==='blocked'?'Facility Blocked Date · '+(r.holdReason||r.notes||'Hold')+' · Hold #'+(r.contract||'—'):variant==='cancelled'?r.type+' · Cancelled booking · Cancellation fee '+(r.cancellationFee==null?'not agreed':compact(r.cancellationFee))+' · '+(r.contract||'—'):r.type+' · '+(variant==='mismatch'?'Imported diff '+diff+' · ':'')+(r.contract||'—')+' · '+(r.phone||'—');
  if(r.contractStatus==='Prepared'&&r.revision>(originalRecord(r.id)?.revision||0)){const status=document.createElement('span');status.className='badge badge-paid';status.textContent='Contract prepared';row.querySelector('.guest-info').append(status);}
  const cells=row.querySelectorAll('.financial-cell');
  cells[0].textContent=variant==='blocked'?'—':r.total==null?'Not agreed':money(r.total);
  cells[1].textContent=variant==='blocked'?'—':money(r.paid);
  const badge=cells[2].querySelector('.badge'),amount=cells[2].querySelector('.financial-balance');
  if(amount)amount.textContent=r.total==null?'—':money(r.balance);
  badge.textContent=({paid:'Paid in full',unpriced:'Needs agreed price',blocked:'Blocked date',cancelled:r.balance===0?'Cancelled · Fee settled':'Cancelled',settled:'Settled',mismatch:'Review diff '+diff})[variant]||((variant==='overdue'?'Overdue ':'Due ')+dateLabel(dueDate(r)));
  if(['due','overdue'].includes(variant))badge.className='badge badge-'+variant;
  const id=encodeURIComponent(r.id),detail='#/booking/'+id;
  row.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href');a.href=href.includes('/edit')?detail+'/edit':href.includes('/pay')?detail+'/pay':detail;});
  const action=row.querySelector('.row-actions-cell > a');
  if(action){action.textContent=({paid:'Details',unpriced:'Set price',settled:'Details',mismatch:'Reconcile',cancelled:'Review'})[variant]||'Pay '+compact(r.balance);action.href=variant==='unpriced'?detail+'/edit':['due','overdue'].includes(variant)?detail+'/pay':detail;}
  if(variant==='blocked'&&!(preserveHold&&profile?.variant==='blocked')){
   const dropdown=prototypes.get('overdue').querySelector('.row-dropdown').cloneNode(true);
   dropdown.querySelector('button').style.minHeight='var(--touch-target-min)';
   const view=document.createElement('a');view.className='dropdown-item';view.href=detail;view.textContent='View details';
   dropdown.querySelector('.dropdown-menu').replaceChildren(view,bookingActionButton('reschedule',r,'dropdown-item'));
   row.querySelector('.row-actions-cell').append(dropdown);
  }
  const menu=row.querySelector('.dropdown-menu');if(menu&&['due','overdue'].includes(variant))menu.replaceChildren(...[...prototypes.get('overdue').querySelector('.dropdown-menu').children].map(n=>n.cloneNode(true)));row.querySelectorAll('.dropdown-menu a').forEach(a=>{const href=a.getAttribute('href');a.href=href.includes('/edit')?detail+'/edit':href.includes('/pay')?detail+'/pay':detail;});
  if(variant!=='blocked'&&menu){
   const base=prototypes.get('overdue').querySelector('.dropdown-menu');menu.replaceChildren(...[...base.children].map(n=>n.cloneNode(true)));
   menu.querySelectorAll('a').forEach(a=>{a.href=a.textContent.includes('Edit')?detail+'/edit':detail;});
   if(r.cancelled)menu.querySelectorAll('a').forEach(a=>{if(a.textContent.includes('Contract copy'))a.remove();});
   menu.querySelector('button').textContent=r.cancelled?'Restore booking':'Cancel booking';
   if(r.hasReceipts){const a=document.createElement('a');a.className='dropdown-item';a.href=detail;a.textContent='Receipts (PDF)';menu.children[0].after(a);}
  }
  if(r.archivedAt&&menu){
   badge.textContent='Cancelled';
   const archived=document.createElement('p');archived.textContent='Archived '+archiveDate(r.archivedAt);row.querySelector('.guest-info').append(archived);
   row.querySelector('.row-actions-cell > button')?.remove();
   const view=menu.querySelector('a');view.textContent='View';
   menu.replaceChildren(bookingActionButton('unarchive',r,'dropdown-item'),view);
  }else if(menu&&variant!=='blocked'){
   const action=bookingActionButton(r.cancelled?'archive':'reschedule',r,'dropdown-item');
   menu.querySelector('.dropdown-divider').before(action);
  }
  const trigger=row.querySelector('[data-toggle-menu]');if(menu){menu.id='menu-'+id;trigger.dataset.toggleMenu=menu.id;trigger.setAttribute('aria-expanded','false');menu.removeAttribute('open');}
  return row;
 };
}
