/* Shared validation and money rules, also shipped to Google Apps Script. */
const Ledger = (() => {
  const types = ['Wedding', 'Birthday', 'Baby Shower', 'Bridal Shower', 'Graduation', 'Engagement', 'Business', 'Quinceañera', 'Baptism', 'Blackout', 'Other'];
  const methods = ['Cash', 'Card', 'Zelle', 'CashApp', 'Venmo', 'Check', 'Other'];
  const deposits = ['Unknown', 'Owed', 'Not Refunded', 'Refunded'];
  function text(value, limit = 500) { return String(value == null ? '' : value).trim().slice(0, limit); }
  function cents(value, maximum = 1000000) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value.trim()))) throw Error('Enter a valid amount with no more than two decimal places.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > maximum || Math.abs(n * 100 - Math.round(n * 100)) > 0.00001) throw Error('Enter an amount between $0 and $1,000,000 with no more than two decimals.');
    return Math.round(n * 100);
  }
  function date(value, optional = false) {
    if (optional && !value) return '';
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Choose a valid date.');
    const d = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== value || +value.slice(0, 4) < 1900 || +value.slice(0, 4) > 2100) throw Error('Choose a valid date between 1900 and 2100.');
    return value;
  }
  function booking(input) {
    if (!input || typeof input !== 'object') throw Error('Booking details are required.');
    const client = text(input.client, 150), total = cents(input.total), paid = cents(input.paid);
    if (!client) throw Error('Enter the guest’s name.');
    if (!types.includes(input.type)) throw Error('Choose an event type.');
    if (paid > total) throw Error('The initial event payment cannot exceed the agreed price. Track security deposits separately.');
    if (paid && !methods.includes(input.method)) throw Error('Choose a payment method.');
    const eventDate = date(input.date), due = date(input.due, true);
    if (due && due > eventDate) throw Error('The balance due date must be on or before the event.');
    const isAudio = input.audio === true || input.sound === true;
    const isCovers = input.covers === true || /covers\+/i.test(input.notes || '');
    const isProjector = input.projector === true || /projector/i.test(input.notes || '');
    let notes = text(input.notes, 2000);
    const extraTags = [];
    if (input.covers === true && !/covers\+/i.test(notes)) extraTags.push('Covers+');
    if (input.projector === true && !/projector/i.test(notes)) extraTags.push('Projector');
    if (extraTags.length) {
      notes = notes ? `${notes}\nExtras: ${extraTags.join(', ')}` : `Extras: ${extraTags.join(', ')}`;
    }
    return { client, phone: text(input.phone, 40), contract: text(input.contract, 60), type: input.type, date: eventDate, total: total / 100, paid: paid / 100,
      paymentDate: paid ? date(input.paymentDate) : '', method: paid ? input.method : '', due, deposit: deposits.includes(input.deposit) ? input.deposit : 'Unknown',
      covers: isCovers, projector: isProjector, audio: isAudio, bar: input.bar === true, sound: isAudio, security: input.security === true, notes };
  }
  function payment(input, record) {
    if (!input || !record) throw Error('Choose a booking.');
    if (record.cancelled && !record.beta) throw Error('This booking is cancelled. New payments cannot be recorded.');
    const charge=record.beta?record.financialTotal:record.total;
    if (charge == null) throw Error('Enter the agreed price in Oryan Bookings before recording another payment.');
    const amount = cents(input.amount), remaining = Math.max(0, Math.round((charge - record.paid) * 100));
    if (amount <= 0) throw Error('Enter a payment greater than $0.');
    if (amount > remaining) throw Error('This payment exceeds the remaining event balance. Refresh the booking or track a security deposit separately.');
    if (!methods.includes(input.method)) throw Error('Choose a payment method.');
    return { amount: amount / 100, date: date(input.date), method: input.method, note: text(input.note, 500) };
  }
  const balance = r => {const charge=r.beta?r.financialTotal:r.total;return charge==null?0:Math.max(0,Math.round((charge-r.paid)*100)/100);};
  const review = r => (r.beta?r.financialTotal:r.total) == null || (!(r.beta&&r.reconciliation?.resolved) && ( (r.imported && r.sheetBalance == null) || Math.abs(r.importedDifference || 0) > .005));
  const extrasList = r => [r.covers ? 'Covers+' : '', r.projector ? 'Projector' : '', (r.audio || r.sound) ? 'Audio' : '', r.bar ? 'Bar' : '', r.security ? 'Security' : ''].filter(Boolean).concat((r.lines?.extras||[]).filter(e=>!e.key).map(e=>e.label));
  const extraRates = {covers:200,projector:100,audio:100,bar:0,security:30};
  const extraLabels = {covers:'Covers+',projector:'Projector',audio:'Audio',bar:'Bar',security:'Security'};
  function priceLines(value) {
    const object=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Unexpected price breakdown fields.');};
    object(value,['hall','extras','discount','discountNote']);
    if(!Array.isArray(value.extras)||value.extras.length>10)throw Error('Choose at most 10 extras.');
    const seen=new Set();let subtotal=cents(value.hall);
    const extras=value.extras.map(e=>{
      object(e,['key','label','amount']);
      if(e.key!==undefined&&(!Object.hasOwn(extraRates,e.key)||seen.has(e.key)))throw Error('Choose each standard extra only once.');
      if(typeof e.label!=='string'||!e.label.trim()||e.label.trim().length>60||/[\x00-\x1f\x7f-\x9f]/.test(e.label))throw Error('Extra names must be 1–60 characters without control characters.');
      if(e.key!==undefined)seen.add(e.key);
      const n=cents(e.amount);subtotal+=n;
      return {...(e.key!==undefined?{key:e.key}:{}),label:e.key!==undefined?extraLabels[e.key]:e.label.trim(),amount:n/100};
    });
    const discount=cents(value.discount);
    if(discount>subtotal)throw Error('Discount cannot exceed the price before discount.');
    if(value.discountNote!==undefined&&(typeof value.discountNote!=='string'||value.discountNote.length>500||/[\x00-\x1f\x7f-\x9f]/.test(value.discountNote)))throw Error('Enter a discount note of at most 500 characters without control characters.');
    const total=(subtotal-discount)/100;
    return {lines:{hall:cents(value.hall)/100,extras,discount:discount/100,...(value.discountNote?.trim()?{discountNote:value.discountNote.trim()}:{})},total};
  }
  function editLines(r) {
    if(r.lines)return JSON.parse(JSON.stringify(r.lines));
    const extras=Object.keys(extraRates).filter(k=>r[k]||(k==='audio'&&r.sound)).map(key=>({key,label:extraLabels[key],amount:extraRates[key]}));
    const sum=extras.reduce((n,e)=>n+cents(e.amount),0),saved=r.total==null?0:cents(r.total);
    return {hall:Math.max(0,saved-sum)/100,extras,discount:Math.max(0,sum-saved)/100,...(sum>saved?{discountNote:'Adjustment'}:{})};
  }
  function lineChanges(before,after) {
    const flatten=l=>Object.fromEntries([['Hall',l.hall],...l.extras.map((e,i)=>['Extra '+(e.key||('custom '+l.extras.slice(0,i).filter(p=>!p.key&&p.label===e.label).length))+': '+e.label,e.amount]),['Discount',l.discount],['Discount note',l.discountNote||'']]);
    const a=flatten(before),b=flatten(after);
    return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>a[k]!==b[k]).map(field=>({field,before:a[field]??'Not included',after:b[field]??'Removed'}));
  }
  // Pure cents-based suggestion. Stored agreed prices are never recalculated here.
  function pricing(value, extras = {}) {
    if (extras.type === 'Blackout' || !value) return null;
    const d = new Date(value + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+d) || d.toISOString().slice(0, 10) !== value) throw Error('Choose a valid date.');
    const year = d.getUTCFullYear(), weekday = d.getUTCDay();
    const utc = (month, day) => { const result = new Date(0); result.setUTCFullYear(year, month - 1, day); return result; };
    const nth = (month, day, n) => utc(month, 1 + (day - utc(month, 1).getUTCDay() + 7) % 7 + 7 * (n - 1)).toISOString().slice(5, 10);
    const memorial = utc(6, 0);
    memorial.setUTCDate(memorial.getUTCDate() - (memorial.getUTCDay() + 6) % 7);
    // Actual dates only; there are no observed-weekday substitutions.
    const holidays = {
      '01-01': "New Year's Day", [nth(1, 1, 3)]: 'Martin Luther King Jr. Day',
      [nth(2, 1, 3)]: "Presidents' Day", [memorial.toISOString().slice(5, 10)]: 'Memorial Day',
      '06-19': 'Juneteenth', '07-04': 'Independence Day', [nth(9, 1, 1)]: 'Labor Day',
      [nth(10, 1, 2)]: 'Columbus Day', '11-11': 'Veterans Day', [nth(11, 4, 4)]: 'Thanksgiving', '12-25': 'Christmas Day'
    };
    const rates = {weekend:140000, sunday:120000, weekday:100000, holiday:180000, covers:20000, audio:10000, projector:10000, security:3000};
    const holiday = holidays[value.slice(5)] || '';
    const hallCents = holiday ? rates.holiday : weekday === 5 || weekday === 6 ? rates.weekend : weekday === 0 ? rates.sunday : rates.weekday;
    const parts = [{label: holiday || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday] + ' rate', cents: hallCents}];
    for (const [key, label] of [['covers', 'Table Covers'], ['audio', 'Sound'], ['projector', 'Projector']]) {
      if (extras[key] || (key === 'audio' && extras.sound)) parts.push({label, cents: rates[key]});
    }
    return {rates, holiday, hallCents, totalCents: parts.reduce((sum, part) => sum + part.cents, 0), parts, securityHourlyCents: rates.security};
  }
  return { priceLines, editLines, lineChanges, extraRates, extraLabels, pricing, types, methods, deposits, text, cents, date, booking, payment, balance, review, extrasList };
})();

/* Shared beta rules. Append-only commands; no network, clock, storage or Google dependencies. */
const BetaLedger = (() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const round = n => Math.round(n * 100) / 100;
  const amount = v => Ledger.cents(v) / 100;
  const statuses = ['Not prepared','Prepared','Signed','Received'];
  const reason = v => { const s=Ledger.text(v,500);if(!s)throw Error('Enter a reason for this change.');return s; };
  const allowed = (v,keys) => { if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Unexpected fields. Reopen the form and try again.'); };
  // Optional fields are emitted only when supplied, preserving legacy JSON bytes.
  function bookingExtras(v) {
    const out={};
    if(v.email!==undefined){if(typeof v.email!=='string'||v.email.length>254)throw Error('Invalid email.');const email=v.email.trim().toLowerCase();if(email.length>254||/[\x00-\x1f\x7f<>]/.test(email)||email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email.');out.email=email;}
    if(v.guestCount!==undefined){if(!Number.isInteger(v.guestCount)||v.guestCount<0||v.guestCount>300)throw Error('Invalid guestCount.');out.guestCount=v.guestCount;}
    if(v.rentalWindow!==undefined){const w=v.rentalWindow;allowed(w,['start','end','setupMinutes']);const time=t=>typeof t==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);if(!time(w.start)||!time(w.end)||w.start===w.end||w.setupMinutes!==undefined&&(!Number.isInteger(w.setupMinutes)||w.setupMinutes<0||w.setupMinutes>1440))throw Error('Invalid rentalWindow.');out.rentalWindow={start:w.start,end:w.end,...(w.setupMinutes!==undefined?{setupMinutes:w.setupMinutes}:{})};}
    return out;
  }
  function derive(input) {
    const r=clone(input);r.beta=true;r.revision=r.revision||0;
    r.payments=r.payments||[];r.refunds=r.refunds||[];r.voids=r.voids||[];r.depositTransactions=r.depositTransactions||[];r.activity=r.activity||[];
    r.paymentContacts=r.paymentContacts||[];r.nextFollowUp=r.nextFollowUp||'';r.cancellationDue=r.cancellationDue||'';
    r.contractStatus=r.contractStatus||'Not prepared';r.cancelled=!!r.cancelled;if(!(r.settled&&r.settled.resolved))delete r.settled;
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
    if(cmd.type==='settleMany'||cmd.type==='unsettleMany') {
      // One atomic journal row. Settled is an annotation only: it never changes payments, charges, balances, credits or deposits.
      const settle=cmd.type==='settleMany';
      allowed(v,settle?['ids','cutoff','reason']:['ids','reason']);reason(v.reason);
      if(!Array.isArray(v.ids)||!v.ids.length||v.ids.length>1500||v.ids.some(i=>typeof i!=='string'))throw Error('Choose at least one booking.');
      const cutoff=settle?Ledger.date(v.cutoff):null,ids=new Set(v.ids);let changed=0;
      next.records=next.records.map(b=>{
        if(!ids.has(b.id))return b;
        const rec=derive(b);
        if(settle){if(rec.type==='Blackout'||rec.settled||!(rec.date<cutoff))return b;rec.settled={resolved:true,reason:v.reason,createdAt:meta.at,createdBy:meta.actor,bulk:meta.id};}
        else{if(!rec.settled)return b;rec.settled=null;}
        rec.revision++;rec.activity.push({type:settle?'settled':'unsettled',at:meta.at,actor:meta.actor,reason:Ledger.text(v.reason,500),changes:[{field:'settled',before:!settle,after:settle}]});changed++;
        return derive(rec);
      });
      next.lastBulk={type:cmd.type,changed,at:meta.at};
      return next;
    }
    const previous=state.records.find(b=>b.id===cmd.bookingId);
    let r=next.records.find(b=>b.id===cmd.bookingId);if(r)r=derive(r);
    if(cmd.type==='create') {
      allowed(v,['client','phone','contract','type','date','total','paid','paymentDate','method','due','deposit','covers','projector','audio','sound','bar','security','notes','email','guestCount','rentalWindow']);
      const clean=Ledger.booking(v);if(clean.type==='Blackout'&&clean.total!==0)throw Error('Blocked dates do not have a price.');checkDate(next.records,{id:meta.id},clean.date);
      if(clean.contract&&next.records.some(b=>b.contract.toLowerCase()===clean.contract.toLowerCase()))throw Error('That contract number is already in the ledger.');
      r=derive({...clean,...bookingExtras(v),id:meta.id,contract:clean.contract||'O-'+meta.id.slice(0,8).toUpperCase(),openingPaid:clean.paid,openingDate:clean.paymentDate,openingMethod:clean.method,imported:false,sheetBalance:null,importedDifference:0,createdAt:meta.at,payments:[],revision:0});
      next.records.push(r);
    } else {
      if(!r)throw Error('That booking is no longer available. Refresh the beta.');
      if(cmd.expectedRevision!==r.revision)throw Error('This booking changed since you opened it. Refresh and review before saving.');
      if(r.type==='Blackout'&&!['edit','cancel','release','restore'].includes(cmd.type))throw Error('Money and contracts are not available for blocked dates.');
      switch(cmd.type) {
        case 'edit': {
          allowed(v,['client','phone','contract','type','date','total','due','covers','projector','audio','bar','security','notes','reason','lines','email','guestCount','rentalWindow']);reason(v.reason);
          if(r.cancelled)throw Error('Restore the booking before editing it.');
          if(r.type==='Blackout'&&v.type!=='Blackout'||r.type!=='Blackout'&&v.type==='Blackout')throw Error('Release or create a blocked date separately.');
          const priced=v.lines!==undefined?Ledger.priceLines(v.lines):null;
          if(priced&&r.type==='Blackout')throw Error('Blocked dates do not have price breakdowns.');
          const clean=Ledger.booking({...v,total:priced?0:v.total===''?0:v.total,paid:0});if(clean.type==='Blackout'&&clean.total!==0)throw Error('Blocked dates do not have a price.');if(clean.date!==r.date)checkDate(next.records,r,clean.date);
          if(!clean.contract||next.records.some(b=>b.id!==r.id&&b.contract.toLowerCase()===clean.contract.toLowerCase()))throw Error('Enter a unique contract number.');
          ['client','phone','contract','type','date','due','covers','projector','audio','sound','bar','security','notes'].forEach(k=>r[k]=clean[k]);
          Object.assign(r,bookingExtras(v));
          r.total=priced?priced.total:v.total===''?null:clean.total;
          if(priced)r.lines=priced.lines;else if(r.lines)delete r.lines;
          // Explicit beta extras may be cleared even when an imported note mentions them.
          r.covers=v.covers===true;r.projector=v.projector===true;
          if(priced){Object.keys(Ledger.extraRates).forEach(k=>r[k]=priced.lines.extras.some(e=>e.key===k));r.sound=r.audio;}
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
          if(r.lines)delete r.lines;
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
        case 'waiveDeposit': {
          allowed(v,['reason']);
          if(r.depositWaiver)throw Error('Deposit is already waived.');
          r.depositWaiver={createdBy:meta.actor,createdAt:meta.at,reason:Ledger.text(v.reason,500)};break;
        }
        case 'markSettled': {
          allowed(v,['reason','cutoff']);reason(v.reason);const cutoff=Ledger.date(v.cutoff);
          if(r.settled)throw Error('This booking is already marked settled.');
          if(!(r.date<cutoff))throw Error('Only events in the past can be marked settled.');
          r.settled={resolved:true,reason:v.reason,createdAt:meta.at,createdBy:meta.actor};break;
        }
        case 'unsettle': {
          allowed(v,['reason']);reason(v.reason);if(!r.settled)throw Error('This booking is not marked settled.');r.settled=null;break;
        }
        default: throw Error('Unknown beta action.');
      }
    }
    if(previous&&(['cancel','restore'].includes(cmd.type)||(['edit','reconcile'].includes(cmd.type)&&['client','phone','contract','type','date','total',...(v.lines!==undefined&&JSON.stringify(previous.lines)!==JSON.stringify(r.lines)?['lines']:[]),'covers','projector','audio','bar','security'].some(k=>previous[k]!==r[k])))){r.contractStatus='Not prepared';r.contractStatusDate='';}
    r.revision++;r.activity.push({type:cmd.type,at:meta.at,actor:meta.actor,reason:Ledger.text(v.reason||v.note,500),changes:[...(cmd.type==='waiveDeposit'?[{field:'depositWaiver',before:previous?.depositWaiver??'',after:r.depositWaiver}]:[]),...(cmd.type==='edit'&&v.lines!==undefined?Ledger.lineChanges(Ledger.editLines(previous),r.lines):[]),...Object.keys(v).filter(k=>k!=='reason'&&!(cmd.type==='edit'&&v.lines!==undefined&&k==='lines')).map(k=>({field:k,before:previous?.[k]??'',after:k in r?r[k]:v[k]})),...(previous&&previous.contractStatus!==r.contractStatus?[{field:'contractStatus',before:previous.contractStatus,after:r.contractStatus}]:[])]});
    next.records[next.records.findIndex(b=>b.id===r.id)]=derive(r);
    return next;
  }
  function execute(state,cmd,key,meta) {
    if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw Error('Invalid save request. Reopen the form.');
    const bulk=['settleMany','unsettleMany'].includes(cmd.type),fingerprint=JSON.stringify(cmd);if(fingerprint.length>(bulk?45000:20000))throw Error('This change is too large. Shorten the notes.');
    const old=state.requests.find(r=>r.key===key);
    if(old){if(old.fingerprint!==fingerprint||old.actor!==meta.actor)throw Error('This request was already used with different details.');return {state:clone(state),record:old.bookingId==='*'?null:clone(state.records.find(r=>r.id===old.bookingId)),changed:old.bookingId==='*'?old.changed:undefined,duplicate:true};}
    const next=apply(state,cmd,meta),id=bulk?'*':cmd.type==='create'?meta.id:cmd.bookingId;
    next.requests.push({key,fingerprint,actor:meta.actor,bookingId:id,changed:bulk?next.lastBulk.changed:undefined});
    return {state:next,record:bulk?null:clone(next.records.find(r=>r.id===id)),changed:bulk?next.lastBulk.changed:undefined,duplicate:false};
  }
  function summary(records) {
    const sum=fn=>round(records.reduce((n,r)=>n+fn(r),0));
    return {activeBookings:records.filter(r=>!r.cancelled&&r.type!=='Blackout').length,charges:sum(r=>r.financialTotal||0),payments:sum(r=>r.paid),unpricedPayments:sum(r=>r.financialTotal==null?r.paid:0),balance:sum(r=>r.financialTotal==null?0:Math.max(0,r.financialTotal-r.paid)),credits:sum(r=>r.credit||0),depositHeld:sum(r=>r.depositHeld),depositReceived:sum(r=>r.depositReceived),depositRefunded:sum(r=>r.depositRefunded),depositDeducted:sum(r=>r.depositDeducted),unpriced:records.filter(r=>r.type!=='Blackout'&&r.financialTotal==null).length,unsettled:records.filter(r=>r.type!=='Blackout'&&r.cancelled&&r.cancellationFee==null&&!r.settled).length,settledBookings:records.filter(r=>r.type!=='Blackout'&&r.settled).length};
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
    return records.filter(r=>r.type!=='Blackout'&&!r.settled&&r.financialTotal!=null&&r.financialTotal-r.paid>0).map(r=>{
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

export {Ledger, BetaLedger as engine};
