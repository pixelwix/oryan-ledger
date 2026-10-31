/* Shared beta rules. Append-only commands; no network, clock, storage or Google dependencies. */
const BetaLedger = (() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const round = n => Math.round(n * 100) / 100;
  const amount = v => Ledger.cents(v) / 100;
  const statuses = ['Not prepared','Prepared','Signed','Received'];
  const reason = v => { const s=Ledger.text(v,500);if(!s)throw Error('Enter a reason for this change.');return s; };
  const allowed = (v,keys) => { if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Unexpected fields. Reopen the form and try again.'); };
  function derive(input) {
    const r=clone(input);r.beta=true;r.revision=r.revision||0;
    r.payments=r.payments||[];r.refunds=r.refunds||[];r.voids=r.voids||[];r.depositTransactions=r.depositTransactions||[];r.activity=r.activity||[];
    r.paymentContacts=r.paymentContacts||[];r.nextFollowUp=r.nextFollowUp||'';r.cancellationDue=r.cancellationDue||'';
    r.contractStatus=r.contractStatus||'Not prepared';r.cancelled=!!r.cancelled;
    r.cancellationFee=r.cancellationFee==null?null:Number(r.cancellationFee);
    r.original=r.original||{total:r.total,openingPaid:r.openingPaid||0,sheetBalance:r.sheetBalance,importedDifference:r.importedDifference||0};
    const voided=id=>r.voids.some(v=>v.targetId===id);
    r.paid=round((voided('opening:'+r.id)?0:Number(r.openingPaid||0))+r.payments.filter(p=>!voided(p.id)).reduce((n,p)=>n+p.amount,0)-r.refunds.filter(p=>!voided(p.id)).reduce((n,p)=>n+p.amount,0));
    if(r.paid<0)throw Error('This correction would refund more than the valid event payments.');
    let held=0;
    r.depositTransactions.filter(t=>!voided(t.id)).forEach(t=>{held+=Math.round(t.amount*100)*(t.kind==='receive'?1:-1);if(held<0)throw Error('Deposit refunds and deductions cannot exceed the amount held.');});
    r.depositHeld=held/100;r.depositReceived=round(r.depositTransactions.filter(t=>t.kind==='receive'&&!voided(t.id)).reduce((n,t)=>n+t.amount,0));
    r.depositDeducted=round(r.depositTransactions.filter(t=>t.kind==='deduct'&&!voided(t.id)).reduce((n,t)=>n+t.amount,0));
    r.depositRefunded=round(r.depositTransactions.filter(t=>t.kind==='refund'&&!voided(t.id)).reduce((n,t)=>n+t.amount,0));
    r.financialTotal=r.type==='Blackout'?0:r.cancelled?r.cancellationFee:r.total;
    r.credit=r.financialTotal==null?null:round(Math.max(0,r.paid-r.financialTotal));
    return r;
  }
  function initial(records) { return {records:records.map(derive),requests:[]}; }
  function checkDate(records,r,date) { if(records.some(b=>b.id!==r.id&&!b.cancelled&&b.date===date))throw Error('This date is already booked or blocked. Choose another date.'); }
  function transaction(v,meta) {
    const n=amount(v.amount);if(n<=0)throw Error('Enter an amount greater than $0.');
    if(!Ledger.methods.includes(v.method))throw Error('Choose a payment method.');
    return {id:meta.id,amount:n,date:Ledger.date(v.date),method:v.method,note:Ledger.text(v.note,500),createdAt:meta.at,createdBy:meta.actor};
  }
  function apply(state,cmd,meta) {
    allowed(cmd,['type','bookingId','expectedRevision','values']);
    if(!meta||!meta.id||!meta.actor||!meta.at)throw Error('Change identity is required.');
    const next=clone(state),v=cmd.values||{};
    const previous=state.records.find(b=>b.id===cmd.bookingId);
    let r=next.records.find(b=>b.id===cmd.bookingId);if(r)r=derive(r);
    if(cmd.type==='create') {
      allowed(v,['client','phone','contract','type','date','total','paid','paymentDate','method','due','deposit','covers','projector','audio','sound','bar','security','notes']);
      const clean=Ledger.booking(v);if(clean.type==='Blackout'&&clean.total!==0)throw Error('Blocked dates do not have a price.');checkDate(next.records,{id:meta.id},clean.date);
      if(clean.contract&&next.records.some(b=>b.contract.toLowerCase()===clean.contract.toLowerCase()))throw Error('That contract number is already in the ledger.');
      r=derive({...clean,id:meta.id,contract:clean.contract||'O-'+meta.id.slice(0,8).toUpperCase(),openingPaid:clean.paid,openingDate:clean.paymentDate,openingMethod:clean.method,imported:false,sheetBalance:null,importedDifference:0,createdAt:meta.at,payments:[],revision:0});
      next.records.push(r);
    } else {
      if(!r)throw Error('That booking is no longer available. Refresh the beta.');
      if(cmd.expectedRevision!==r.revision)throw Error('This booking changed since you opened it. Refresh and review before saving.');
      if(r.type==='Blackout'&&!['edit','cancel','release','restore'].includes(cmd.type))throw Error('Money and contracts are not available for blocked dates.');
      switch(cmd.type) {
        case 'edit': {
          allowed(v,['client','phone','contract','type','date','total','due','covers','projector','audio','bar','security','notes','reason']);reason(v.reason);
          if(r.cancelled)throw Error('Restore the booking before editing it.');
          if(r.type==='Blackout'&&v.type!=='Blackout'||r.type!=='Blackout'&&v.type==='Blackout')throw Error('Release or create a blocked date separately.');
          const clean=Ledger.booking({...v,total:v.total===''?0:v.total,paid:0});if(clean.type==='Blackout'&&clean.total!==0)throw Error('Blocked dates do not have a price.');if(clean.date!==r.date)checkDate(next.records,r,clean.date);
          if(!clean.contract||next.records.some(b=>b.id!==r.id&&b.contract.toLowerCase()===clean.contract.toLowerCase()))throw Error('Enter a unique contract number.');
          ['client','phone','contract','type','date','due','covers','projector','audio','sound','bar','security','notes'].forEach(k=>r[k]=clean[k]);
          r.total=v.total===''?null:clean.total;
          // Explicit beta extras may be cleared even when an imported note mentions them.
          r.covers=v.covers===true;r.projector=v.projector===true;
          break;
        }
        case 'payment': {
          allowed(v,['amount','date','method','note']);
          const due=r.financialTotal==null?null:round(Math.max(0,r.financialTotal-r.paid));
          if(due==null)throw Error(r.cancelled?'Set the cancellation charge before recording a payment.':'Enter the agreed price before recording a payment.');
          const t=transaction(v,meta);if(t.amount>due)throw Error('This payment exceeds the remaining event balance.');r.payments.push(t);break;
        }
        case 'void': {
          allowed(v,['targetId','reason']);reason(v.reason);
          if(r.voids.some(t=>t.targetId===v.targetId))throw Error('This entry is already voided.');
          if(!(v.targetId==='opening:'+r.id&&r.openingPaid>0)&&!r.payments.some(t=>t.id===v.targetId)&&!r.depositTransactions.some(t=>t.id===v.targetId)&&!r.refunds.some(t=>t.id===v.targetId))throw Error('Choose a valid payment or deposit entry.');
          r.voids.push({targetId:v.targetId,reason:v.reason,createdAt:meta.at,createdBy:meta.actor});break;
        }
        case 'refund': {
          allowed(v,['amount','date','method','note','reason']);reason(v.reason);const t=transaction(v,meta);
          if(t.amount>r.paid)throw Error('Refund cannot exceed valid event payments.');r.refunds.push(t);break;
        }
        case 'deposit': {
          allowed(v,['kind','amount','date','method','note','reason']);reason(v.reason);
          if(!['receive','refund','deduct'].includes(v.kind))throw Error('Choose a deposit transaction.');
          const t={...transaction(v,meta),kind:v.kind};if(v.kind==='deduct')t.method='Retained from deposit';
          if(v.kind!=='receive'&&t.amount>r.depositHeld)throw Error('This amount exceeds the security deposit held.');r.depositTransactions.push(t);break;
        }
        case 'cancel': case 'release': {
          allowed(v,['reason']);reason(v.reason);
          if(r.cancelled)throw Error('This booking or blocked date is already cancelled.');
          if(cmd.type==='release'&&r.type!=='Blackout')throw Error('Choose a blocked date to release.');
          r.cancellationDue='';r.nextFollowUp='';r.cancelled=true;r.cancelledAt=meta.at;r.cancelledBy=meta.actor;r.cancellationFee=null;break;
        }
        case 'restore': {
          allowed(v,['reason']);reason(v.reason);if(!r.cancelled)throw Error('This booking is already active.');checkDate(next.records,r,r.date);
          r.nextFollowUp='';r.cancelled=false;r.lastCancellationFee=r.cancellationFee;r.cancellationFee=null;break;
        }
        case 'settle': {
          allowed(v,['amount','reason']);reason(v.reason);
          if(!r.cancelled||r.type==='Blackout')throw Error('Choose a cancelled event booking.');r.cancellationFee=amount(v.amount);break;
        }
        case 'reconcile': {
          allowed(v,['total','openingPaid','reason']);reason(v.reason);
          if(!r.imported)throw Error('This booking has no imported balance to reconcile.');
          r.total=amount(v.total);r.openingPaid=amount(v.openingPaid);
          r.reconciliation={resolved:true,reason:v.reason,createdAt:meta.at,createdBy:meta.actor};break;
        }
        case 'reminder': {
          allowed(v,['kind','due','nextFollowUp','date','method','note','reason']);reason(v.reason);
          if(!['plan','contact'].includes(v.kind))throw Error('Choose a reminder action.');
          if(r.financialTotal==null||r.financialTotal-r.paid<=0)throw Error('A confirmed outstanding event balance is required.');
          const due=Ledger.date(v.due,true),nextDate=Ledger.date(v.nextFollowUp,true);
          if(!r.cancelled&&due&&due>r.date)throw Error('The balance due date must be on or before the event.');
          if(r.cancelled)r.cancellationDue=due;else r.due=due;
          r.nextFollowUp=nextDate;
          if(v.kind==='contact'){
            if(!['Phone','Text message','Email','In person','Other'].includes(v.method))throw Error('Choose how the guest was contacted.');
            r.paymentContacts.push({id:meta.id,date:Ledger.date(v.date),method:v.method,note:Ledger.text(v.note,500),amountDue:round(r.financialTotal-r.paid),due,nextFollowUp:nextDate,createdAt:meta.at,createdBy:meta.actor});
          }
          break;
        }
        case 'contractStatus': {
          allowed(v,['status','date','reason']);reason(v.reason);
          if(r.cancelled||r.type==='Blackout')throw Error('Choose an active event booking.');
          if(!statuses.includes(v.status))throw Error('Choose a contract status.');
          r.contractStatus=v.status;r.contractStatusDate=Ledger.date(v.date);break;
        }
        default: throw Error('Unknown beta action.');
      }
    }
    if(previous&&(['cancel','restore'].includes(cmd.type)||(['edit','reconcile'].includes(cmd.type)&&['client','phone','contract','type','date','total','covers','projector','audio','bar','security'].some(k=>previous[k]!==r[k])))){r.contractStatus='Not prepared';r.contractStatusDate='';}
    r.revision++;r.activity.push({type:cmd.type,at:meta.at,actor:meta.actor,reason:Ledger.text(v.reason||v.note,500),changes:[...Object.keys(v).filter(k=>k!=='reason').map(k=>({field:k,before:previous?.[k]??'',after:k in r?r[k]:v[k]})),...(previous&&previous.contractStatus!==r.contractStatus?[{field:'contractStatus',before:previous.contractStatus,after:r.contractStatus}]:[])]});
    next.records[next.records.findIndex(b=>b.id===r.id)]=derive(r);
    return next;
  }
  function execute(state,cmd,key,meta) {
    if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw Error('Invalid save request. Reopen the form.');
    const fingerprint=JSON.stringify(cmd);if(fingerprint.length>20000)throw Error('This change is too large. Shorten the notes.');
    const old=state.requests.find(r=>r.key===key);
    if(old){if(old.fingerprint!==fingerprint||old.actor!==meta.actor)throw Error('This request was already used with different details.');return {state:clone(state),record:clone(state.records.find(r=>r.id===old.bookingId)),duplicate:true};}
    const next=apply(state,cmd,meta),id=cmd.type==='create'?meta.id:cmd.bookingId;
    next.requests.push({key,fingerprint,actor:meta.actor,bookingId:id});
    return {state:next,record:clone(next.records.find(r=>r.id===id)),duplicate:false};
  }
  function summary(records) {
    const sum=fn=>round(records.reduce((n,r)=>n+fn(r),0));
    return {activeBookings:records.filter(r=>!r.cancelled&&r.type!=='Blackout').length,charges:sum(r=>r.financialTotal||0),payments:sum(r=>r.paid),unpricedPayments:sum(r=>r.financialTotal==null?r.paid:0),balance:sum(r=>r.financialTotal==null?0:Math.max(0,r.financialTotal-r.paid)),credits:sum(r=>r.credit||0),depositHeld:sum(r=>r.depositHeld),depositReceived:sum(r=>r.depositReceived),depositRefunded:sum(r=>r.depositRefunded),depositDeducted:sum(r=>r.depositDeducted),unpriced:records.filter(r=>r.type!=='Blackout'&&r.financialTotal==null).length,unsettled:records.filter(r=>r.type!=='Blackout'&&r.cancelled&&r.cancellationFee==null).length};
  }
  function report(records) {
    return [['Contract','Guest','Event date','Status','Agreed charges','Net event payments','Balance to collect','Credit / refund to review','Deposit held','Contract status','Deposit received','Deposit refunded','Deposit deducted','Payment due','Next follow-up','Last contact','Contact count'],...records.map(r=>[r.contract,r.client,r.date,r.cancelled?'Cancelled':r.type==='Blackout'?'Blocked':'Active',r.financialTotal??'',r.paid,r.financialTotal==null?'':round(Math.max(0,r.financialTotal-r.paid)),r.credit??'',r.depositHeld,r.contractStatus,r.depositReceived,r.depositRefunded,r.depositDeducted,dueDate(r),r.nextFollowUp||'',(r.paymentContacts||[]).map(c=>c.date).sort().pop()||'',(r.paymentContacts||[]).length])];
  }
  function receipt(record,id) {
    let t=record.payments.find(t=>t.id===id),kind='Event payment';
    if(id==='opening:'+record.id){if(record.imported||!record.openingDate)throw Error('Historical totals have no individual receipt date.');t={id,amount:record.openingPaid,date:record.openingDate,method:record.openingMethod};}
    if(!t){t=record.refunds.find(t=>t.id===id);kind='Event refund';}
    if(!t){t=record.depositTransactions.find(t=>t.id===id);kind=t?'Security deposit '+({receive:'received',refund:'refund',deduct:'deduction'}[t.kind]):'';}
    if(!t)throw Error('Receipt entry not found.');
    return {...clone(t),kind,voided:record.voids.some(v=>v.targetId===id),client:record.client,contract:record.contract,eventDate:record.date};
  }
  const dueDate = r => r.cancelled?(r.cancellationDue||''):(r.due||'');
  function reminders(records,today) {
    Ledger.date(today);const end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+7);const soon=end.toISOString().slice(0,10);
    return records.filter(r=>r.type!=='Blackout'&&r.financialTotal!=null&&r.financialTotal-r.paid>0).map(r=>{
      const due=dueDate(r),contacts=(r.paymentContacts||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
      return {id:r.id,client:r.client,contract:r.contract,amount:round(r.financialTotal-r.paid),due,nextFollowUp:r.nextFollowUp||'',lastContact:contacts[0]||null,overdue:!!due&&due<today,dueSoon:!!due&&due>=today&&due<=soon,followUpDue:!!r.nextFollowUp&&r.nextFollowUp<=today,missingDue:!due};
    }).sort((a,b)=>Number(b.followUpDue)-Number(a.followUpDue)||Number(b.overdue)-Number(a.overdue)||(a.nextFollowUp||a.due||'9999').localeCompare(b.nextFollowUp||b.due||'9999')||a.contract.localeCompare(b.contract));
  }
  function reminderText(r,due=dueDate(r)) {
    if(r.type==='Blackout'||r.financialTotal==null||r.financialTotal-r.paid<=0)throw Error('A confirmed outstanding event balance is required.');
    Ledger.date(due,true);const value=round(r.financialTotal-r.paid).toFixed(2);
    return `Hi ${r.client}, this is a reminder from O’Ryan Event Center that $${value} remains ${r.cancelled?'on the agreed cancellation charge':'for your event on '+r.date}${due?'. Payment is due '+due:'. Please contact us to confirm the payment due date'}. Contract #${r.contract}. Thank you.`;
  }
  return {initial,derive,apply,execute,summary,report,receipt,statuses,dueDate,reminders,reminderText};
})();
