import {reminderEligible,reminderFields} from './reminder-message.mjs?v=2.7.1';
import {bookingEmailFields,bookingEmailKinds,bookingEmailLabels} from './booking-email.mjs?v=2.7.1';
import {validDocumentEmail} from './document-email-address.mjs?v=2.7.1';
import {exportName,exportYears,ledgerCsv} from './ledger-export.mjs?v=2.7.1';
import {balanceDueDate} from './due-date.mjs?v=2.7.1';
import {balanceAlert,depositAlert,depositOwed} from './attention-rules.mjs?v=2.7.1';
// The frozen sample ledger keeps its original look: reminders only apply to bookings that are not an unchanged sample row.
const isFrozenSample=(originalRows,r)=>{const o=originalRows.find(x=>x.id===r.id);return !!o&&r.revision===o.revision;};
import {fixtureDocuments} from './document-preview.mjs?v=2.7.1';
// In-memory synthetic adapter; optional contact and rental fields live in engine records.
import seed from './fixtures.mjs?v=2.7.1';
import {displayMetadata} from './display-fixtures.mjs?v=2.7.1';
import {engine,Ledger} from './engine.mjs?v=2.7.1';
const clone=v=>JSON.parse(JSON.stringify(v));
export const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const balance=r=>r.financialTotal==null?null:Math.max(0,Math.round((r.financialTotal-r.paid)*100)/100);
export function createLedgerApi(presentation,initial=seed){
 const normalized=clone(initial.bookings).map(r=>({...r,id:r.id.split('#')[0]}));
 const reminderSends=new Map();
 let state=engine.initial(normalized),sequence=0;
 const original=engine.initial(normalized).records;
 const needsPrice=r=>r.type!=='Blackout'&&(r.cancelled?r.financialTotal:r.total)==null;
 const intakeRates={...Ledger.extraRates,security:180};
 const detail=id=>{const r=state.records.find(r=>r.id===id);if(!r)throw Error('Booking not found.');return clone({...r,...displayMetadata[id],balance:balance(r)});};
 function list({q='',filter='all',sort='date',from='',to='',archived=''}={}){
  const query=q.trim().toLowerCase();
  if(archived==='1'&&(query||from||to))throw Error('The Archived view cannot be combined with search or a date range.');
  let rows=state.records.filter(r=>Boolean(r.archived)===(archived==='1')&&(!query||[r.client,r.phone,r.contract,r.email].some(value=>String(value||'').toLowerCase().includes(query))));
  if(from)rows=rows.filter(r=>r.date>=from);if(to)rows=rows.filter(r=>r.date<=to);
  rows=rows.filter(r=>filter==='all'||filter==='due'&&balance(r)>0&&!r.cancelled||filter==='attention'&&(needsPrice(r)||r.importedDifference||r.due&&r.due<initial.TODAY&&balance(r)>0||(balanceAlert({...r,balance:balance(r)},initial.TODAY)||depositAlert({...r,depositOwed:depositOwed(r)},initial.TODAY))&&!isFrozenSample(original,r)||r.date<initial.TODAY&&r.type!=='Blackout'||r.depositHeld>0)&&!r.settled||filter==='upcoming'&&r.date>=initial.TODAY&&!r.cancelled||filter==='past'&&r.date<initial.TODAY||filter==='cancelled'&&r.cancelled||filter==='settled'&&r.settled);
  if(sort==='date')rows.sort((a,b)=>a.date.localeCompare(b.date));
  if(sort==='guest')rows.sort((a,b)=>a.client.localeCompare(b.client));
  if(sort==='balance')rows.sort((a,b)=>(balance(b)||0)-(balance(a)||0));
  return clone(rows.map(r=>({...r,balance:balance(r),...(r.archived?{archivedAt:r.archived.at}:{}),hasReceipts:documentApi.hasReceipts(r.id)})));
 }
 function payments({q='',kind='all',method='all'}={}){
  return state.records.flatMap(r=>[
   ...(!r.imported&&r.openingPaid>0&&r.openingDate?[{id:'opening:'+r.id,amount:r.openingPaid,date:r.openingDate,method:r.openingMethod,note:'',kind:'payment'}]:[]),
   ...r.payments.map(t=>({...t,kind:'payment'})),...r.refunds.map(t=>({...t,kind:'refund',amount:-t.amount})),...r.depositTransactions.filter(t=>t.date).map(t=>({...t,kind:'deposit',amount:t.kind==='receive'?t.amount:-t.amount}))
  ].map(t=>({...t,voided:r.voids.some(v=>v.targetId===t.id),bookingId:r.id,client:r.client,contract:r.contract,eventType:r.type,displayClient:displayMetadata[r.id]?.registerGuest,reference:displayMetadata[r.id]?.registerReferences?.[t.id]}))).filter(t=>(kind==='all'||kind===t.kind)&&(method==='all'||t.method===method)&&(!q||[t.client,t.contract,t.note,t.method].join(' ').toLowerCase().includes(q.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date));
 }
 function summary(){return {...engine.summary(state.records),novemberPayments:payments().filter(t=>t.kind==='payment'&&t.date.startsWith('2026-11')).reduce((n,t)=>n+t.amount,0),novemberEvents:state.records.filter(r=>r.type!=='Blackout'&&!r.cancelled&&r.date.startsWith('2026-11')).length};}
 function attention(){return clone(state.records.flatMap(r=>r.settled||r.archived?[]:[...(needsPrice(r)?[{id:r.id,kind:'price'}]:[]),...(!isFrozenSample(original,r)&&balanceAlert({...r,balance:balance(r)},initial.TODAY)?[{id:r.id,kind:balanceAlert({...r,balance:balance(r)},initial.TODAY)}]:r.due&&r.due<initial.TODAY&&balance(r)>0?[{id:r.id,kind:'overdue'}]:[]),...(!isFrozenSample(original,r)&&depositAlert({...r,depositOwed:depositOwed(r)},initial.TODAY)?[{id:r.id,kind:'depositDue'}]:[]),...(r.date<initial.TODAY&&r.type!=='Blackout'?[{id:r.id,kind:'past'}]:[]),...(r.depositHeld?[{id:r.id,kind:'deposit'}]:[]),...(r.importedDifference?[{id:r.id,kind:'reconcile'}]:[])]));}
 function insights(year='2026'){
  const rows=engine.initial(initial.annualBookings.filter(r=>year==='all'||r.date.startsWith(String(year)))).records;
  const totals=engine.summary(rows);return {...totals,count:rows.length,months:Array.from({length:12},(_,m)=>rows.filter(r=>Number(r.date.slice(5,7))===m+1).reduce((n,r)=>n+r.total,0)),types:rows.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{}),weekdays:rows.reduce((a,r)=>{const d=new Date(r.date+'T12:00:00Z').getUTCDay();a[d]=(a[d]||0)+1;return a;},{}),byMonth:Array.from({length:12},(_,m)=>{const inMonth=rows.filter(r=>Number(r.date.slice(5,7))===m+1),sum=engine.summary(inMonth);return {count:inMonth.length,charges:sum.charges,payments:sum.payments,balance:sum.balance,types:inMonth.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{}),weekdays:inMonth.reduce((a,r)=>{const d=new Date(r.date+'T12:00:00Z').getUTCDay();a[d]=(a[d]||0)+1;return a;},{})};})};
 }
 function calendar(year=2026,month=11){const prefix=`${year}-${String(month).padStart(2,'0')}`;return list().filter(r=>r.date.startsWith(prefix)&&!r.cancelled).map(r=>({...r,...displayMetadata[r.id]}));}
 function commands(type,id,values={}){
  const r=id?detail(id):null;
  const meta={id:'local-'+(++sequence),actor:'Owner',at:new Date().toISOString()};
  let command={type,bookingId:id,expectedRevision:r?.revision,values:type==='markSettled'?{cutoff:initial.TODAY,...values}:values};
  if(type==='edit'){
   const keys=['client','phone','contract','type','date','due','covers','projector','audio','bar','security','notes'];
   command.values={...Object.fromEntries(keys.map(k=>[k,r[k]])),total:r.total,...values};
  }
  // Multi-command intake is one in-memory transaction: commit state only after all validations.
  let next=engine.apply(state,command,meta);
  if(type==='create'&&values.type!=='Blackout'){
   const made=next.records.at(-1);
   const extras=intakeExtras(values);
   const fields=['client','phone','contract','type','date','due','covers','projector','audio','bar','security','notes'];
   next=engine.apply(next,{type:'edit',bookingId:made.id,expectedRevision:made.revision,values:{...Object.fromEntries(fields.map(k=>[k,made[k]])),lines:{hall:Math.round((values.total-extras.reduce((n,e)=>n+e.amount,0))*100)/100,extras,discount:0},reason:'Initial fictional price breakdown'}},{...meta,id:meta.id+'-lines'});
  }
  state=next;return detail(type==='create'?meta.id:id);
 }
 function commandBatch(batch){
  let next=state, nextSequence=sequence;
  for(const command of batch){
   if(command.type==='create'&&command.values.type==='Blackout'&&next.records.some(r=>!r.cancelled&&r.date===command.values.date))throw Error('Date already booked or blocked: '+command.values.date+'.');
   next=engine.apply(next,command,{id:(++nextSequence).toString(36).padStart(6,'0')+'-local-block',actor:'Owner',at:new Date().toISOString()});
  }
  state=next;sequence=nextSequence;
 }
 function intakeExtras(v){return Object.entries(intakeRates).filter(([k])=>v[k]).map(([key,rate])=>({key,label:Ledger.extraLabels?.[key]||key,amount:rate}));}
 function presentationFor(screen){return clone(presentation[screen]);}
 const documentApi=fixtureDocuments(detail,initial.TODAY,commands);
 return {...documentApi,list,search:q=>list({q}),detail,summary,attention,payments,insights,calendar,commands,commandBatch,presentation:presentationFor,original:id=>{const r=original.find(r=>r.id===id);return r?clone(r):null;},today:initial.TODAY,edge:clone(initial.edgeScenarios),rates:clone(Ledger.extraRates),priceLines:Ledger.priceLines,
  emailBooking(id,body,requestId,revision){
   const booking=detail(id),key=JSON.stringify([id,body]);
   const prior=reminderSends.get(requestId);
   if(prior){
    if(prior.key!==key)throw Error('This send was started with different details.');
    return {alreadySent:true};
   }
   if(!validDocumentEmail(booking.email)||booking.email!==body.to||booking.revision!==revision||
      !bookingEmailKinds(booking,initial.TODAY).includes(body.kind)||!bookingEmailFields(booking,body.kind,body.refundId)){
    throw Error('The booking changed. Review it and reopen Send email.');
   }
   const refundKey=body.refundId?'refund:'+id+':'+body.refundId:null;
   if(refundKey&&reminderSends.has(refundKey))throw Error('A notice was already sent for this refund.');
   commands('bookingEmail',id,{reason:bookingEmailLabels[body.kind]+' emailed.'});
   reminderSends.set(requestId,{key});
   if(refundKey)reminderSends.set(refundKey,true);
   return {alreadySent:false};
  },
  emailReminder(id,to,requestId,revision){
   if(!validDocumentEmail(to))throw Error('Enter one valid email address.');
   const prior=reminderSends.get(requestId);
   if(prior){
    if(prior.id!==id||prior.to!==to)throw Error('This send was started with different details.');
    return {alreadySent:true};
   }
   const booking=detail(id);
   if(booking.revision!==revision||!reminderEligible(booking,initial.TODAY))throw Error('The booking changed. Review the balance and reopen the reminder.');
   const {amountDueCents,dueDate}=reminderFields(booking);
   commands('reminder',id,{kind:'contact',date:initial.TODAY,method:'Email',note:'Payment reminder emailed to '+to,reason:'Payment reminder emailed.',sentEmail:{amountDueCents,dueDate}});
   reminderSends.set(requestId,{id,to});
   return {alreadySent:false};
  },
  exportYears:kind=>exportYears(state.records,kind),
  exportCsv:(kind,year)=>({filename:exportName(kind,year),blob:new Blob([ledgerCsv(state.records,kind,year)],{type:'text/csv;charset=utf-8'})}),
  bookingTypes:Ledger.types,validateBookingDate:Ledger.date,
  intakeRates,newExtraAmount:100,
  createBooking(values,metadata){
   const previous=state;const previousSequence=sequence;
   if(!values.due&&/^\d{4}-\d{2}-\d{2}$/.test(values.date||'')&&Number.isFinite(+new Date(values.date+'T12:00:00Z')))values={...values,due:balanceDueDate(values.date,initial.TODAY)};
   try{
    const made=commands('create',null,{...values,...Object.fromEntries(['email','guestCount','rentalWindow'].filter(k=>metadata[k]!==undefined).map(k=>[k,metadata[k]]))});
    commands('edit',made.id,{lines:metadata.lines,reason:'Initial fictional itemized price'});
    if(metadata.depositStatus==='Held')commands('deposit',made.id,{kind:'receive',amount:600,date:initial.TODAY,method:values.method,reason:'Initial fictional refundable deposit'});
    if(metadata.depositStatus==='Waived')commands('waiveDeposit',made.id,{reason:metadata.waiverReason||''});return detail(made.id);
   }catch(error){state=previous;sequence=previousSequence;throw error;}
  },
  money,balance,
  counts(){return {archived:list({archived:'1'}).length,...Object.fromEntries(['all','due','attention','upcoming','past','cancelled','settled'].map(filter=>[filter,list({filter}).length]))};}
 };
}
