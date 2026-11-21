import {reminderEligible,reminderFields,reminderMessage_} from './reminder-message.mjs?v=2.5.0';
import {validDocumentEmail} from './document-email-address.mjs?v=2.5.0';
import {downloadBlob} from './ledger-export.mjs?v=2.5.0';
import paymentScreen from './screens/record-payment.mjs?v=2.5.0';

const opening = new WeakSet();
const reminderRequests = new WeakMap();
const explanations = {
 reminderEmail: "This message will be sent from the venue's email account.",
 export: 'Download a CSV file for the selected year.',
 cancel: 'Charged: what the customer has paid so far. Nothing is refunded and nothing more is owed. You can change the amount.',
 get settle() { return this.cancel; },
 reschedule: 'Price and payments stay exactly as they are.',
 archive: 'Archiving hides this cancelled booking from Bookings and Needs attention. Nothing is deleted or changed. You can bring it back from Archived.',
 unarchive: 'This cancelled booking will appear in Bookings again.',
 contact: 'Update the booking details. Changing the guest name or event type resets the contract status. Saved copies keep the original details.',
 block: 'A blocked date stays off the calendar for new bookings (for example maintenance or an owner hold). Nothing is charged. You can move or release it later.'
};
const savedCopiesNote = 'Saved contracts and receipts keep the old date. Prepare a new contract if the client needs one.';

export function bookingActionLabel(action, record) {
 if (action === 'reminderEmail') return 'Email reminder';
 if (action === 'export') return 'Export';
 if (action === 'bookAgain') return 'Book again';
 if (action === 'cancel') return 'Cancel booking';
 if (action === 'settle') return 'Set cancellation charge';
 if (action === 'block') return 'Block a date';
 if (action === 'contact') return 'Edit details';
 if (action === 'reschedule') return record.type === 'Blackout' ? 'Move blocked date' : 'Change date';
 return action === 'archive' ? 'Archive' : 'Unarchive';
}

export function dateConflict(date, currentDate, rows) {
 if (date === currentDate) return 'Choose a different date.';
 if (rows.some(row => row.date === date && !row.cancelled)) return 'Date already booked or blocked';
 return '';
}

export function archiveDate(at) {
 return new Date(at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric',timeZone:'America/Chicago'});
}

export function bookingActionButton(action, record, className) {
 const button = document.createElement('button');
 button.type = 'button';
 button.className = className;
 button.dataset.bookingAction = action;
 button.dataset.bookingId = record.id;
 button.textContent = bookingActionLabel(action, record);
 return button;
}

export function mountBookingActions(record, referenceDetail, api) {
 const bar = document.querySelector('.more-dropdown-container');
 const action = record.archived ? 'unarchive' : record.cancelled ? 'archive' : 'reschedule';
 const button = bookingActionButton(action, record, referenceDetail ? 'more-menu-item' : 'btn btn-quiet');
 // No size overrides: the button must be exactly as large as the buttons beside it (locked UI, no drift).
 if (referenceDetail) {
  bar.querySelector('.more-menu-divider').before(button);
 } else {
  bar.before(button);          // archived bookings too: Unarchive sits in the action bar, the same size as its neighbours
 }
 if (record.type !== 'Blackout') {
  const contact = bookingActionButton('contact', record, referenceDetail ? 'more-menu-item' : 'btn btn-quiet');
  if (referenceDetail) bar.querySelector('.more-menu-divider').before(contact);
  else bar.before(contact);
  const rebook = bookingActionButton('bookAgain',record,referenceDetail ? 'more-menu-item' : 'btn btn-quiet');
  if (referenceDetail) bar.querySelector('.more-menu-divider').before(rebook);
  else bar.before(rebook);
 }
 if (record.cancelled && !record.archived && record.type !== 'Blackout' && record.cancellationFee == null) {
  bar.before(bookingActionButton('settle',record,'btn btn-quiet'));
 }
 if (reminderEligible(record,api.today) && (api.mode !== 'http' || record.reminderMailEnabled) && api.documentsEnabled !== false) {
  const reminder = bookingActionButton('reminderEmail',record,referenceDetail ? 'more-menu-item' : 'btn btn-quiet');
  if (referenceDetail) bar.querySelector('.more-menu-divider').before(reminder);
  else bar.before(reminder);
 }
 if (record.archived) {
  const note = document.createElement('p');
  note.className = 'card-subtitle';
  note.textContent = 'Archived on '+archiveDate(record.archived.at)+' by '+record.archived.by+'.';
  bar.parentElement.after(note);
 }
}

export async function openBookingAction({api,id,action,opener,go,exportKind}) {
 if (opening.has(api) || document.getElementById('bookingActionModal')) return;
 const body = document.body, hash = location.hash;
 opening.add(api);
 try {
  const blocking = action === 'block';                       // creates a new blocked date; there is no booking yet
  const reminding = action === 'reminderEmail';
  const exporting = action === 'export';
  const years = exporting ? await api.exportYears(exportKind) : [];
  const record = exporting ? {client:exportKind==='bookings'?'Bookings':'Payments'} : blocking ? {client:'',date:'',type:'Blackout'} : await api.detail(id);
  const allowed = record.archived ? 'unarchive' : record.cancelled ? 'archive' : 'reschedule';
  const contacting = action === 'contact';
  if (contacting && record.type === 'Blackout') throw Error('Blocked dates have no contact details.');
  const charging = ['cancel','settle'].includes(action);
  if (charging && (record.archived || record.type === 'Blackout' || (action === 'cancel' ? record.cancelled : !record.cancelled || record.cancellationFee != null))) throw Error('This cancellation action is no longer available.');
  if (reminding && (!reminderEligible(record,api.today) || api.mode === 'http' && !record.reminderMailEnabled || api.documentsEnabled === false)) throw Error('Email reminder is unavailable for this booking.');
  if (!reminding && !exporting && !blocking && !contacting && !charging && action !== allowed) throw Error('This action is no longer available. Refresh the booking and try again.');
  const moving = action === 'reschedule';
  const copies = moving && api.documentsEnabled !== false
   ? await api.documents(id).catch(error => { if (api.documentsEnabled !== false) throw error; return []; })
   : [];
  const sample = document.createElement('div');
  sample.innerHTML = paymentScreen(await api.presentation('record-payment'));
  if (document.body !== body || location.hash !== hash) return;
  const modal = sample.querySelector('.modal-backdrop'), dialog = modal.querySelector('.modal-dialog');
  const form = modal.querySelector('form'), close = modal.querySelector('.modal-close-btn');
  const footerStyle = form.querySelector('#btnSavePayment').parentElement.getAttribute('style');
  modal.id = 'bookingActionModal';
  form.id = 'bookingActionForm';
  form.dataset.commandForm = 'true';
  const title = bookingActionLabel(action, record);
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-header .badge').remove();
  modal.querySelector('.modal-header p').textContent = blocking ? 'Keep a date off the calendar for new bookings' : record.client+(moving?' · Current date: '+record.date:'');
  modal.querySelector('.modal-header').nextElementSibling.remove();
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-describedby','bookingActionExplanation');
  close.removeAttribute('href');
  close.setAttribute('role','button');
  close.tabIndex = 0;
  close.setAttribute('aria-label','Close '+title.toLowerCase());
  close.style.flexShrink = '0';
  form.replaceChildren();

  function note(text, id) {
   const element = document.createElement('p');
   element.className = 'card-subtitle';
   element.id = id;
   element.textContent = text;
   form.append(element);
   return element;
  }
  function field(id, label, type, required = true, value = '', options = []) {
   const group = document.createElement('div');
   group.className = 'form-group';
   const caption = document.createElement('label');
   caption.className = 'form-label';
   caption.htmlFor = id;
   caption.textContent = label;
   const input = document.createElement(type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input');
   input.id = id;
   input.className = type === 'select' ? 'form-select' : 'form-input';
   if (input.tagName === 'INPUT') input.type = type;
   for (const option of options) input.add(new Option(option,option));
   input.required = required;
   input.value = value;
   input.style.minHeight = 'var(--touch-target-min)';
   group.append(caption,input);
   form.append(group);
   return input;
  }
  note(explanations[action],'bookingActionExplanation');
  if (copies.some(copy => copy.kind === 'contract' && copy.status === 'saved')) note(savedCopiesNote,'bookingActionCopies');
  const date = moving || blocking ? field('bookingActionDate',blocking ? 'Date to block' : 'New date','date') : null;
  const lastDay = blocking ? field('bookingActionLastDay','Last day to block','date',false) : null;
  const status = moving || blocking ? note('','bookingActionAvailability') : null;
  if (date) {
   date.setAttribute('aria-describedby',status.id);
   status.setAttribute('role','status');
  }
  const name = contacting ? field('bookingActionName','Guest name','text',true,record.client) : null;
  if (name) name.maxLength = 150;
  const phone = contacting ? field('bookingActionPhone','Phone number','tel',false,record.phone || '') : null;
  const email = contacting ? field('bookingActionEmail','Email','email',false,record.email || '') : null;
  if (phone) { phone.maxLength = 40; phone.autocomplete = 'tel'; }
  if (email) { email.maxLength = 254; email.autocomplete = 'email'; email.setAttribute('inputmode','email'); }
  const eventType = contacting ? field('bookingActionType','Event type','select',true,record.type,api.bookingTypes.filter(type=>type!=='Blackout')) : null;
  const guests = contacting ? field('bookingActionGuests','Guest count','number',false,record.guestCount ?? '') : null;
  if (guests) { guests.min = '0'; guests.max = '300'; }
  const start = contacting ? field('bookingActionStart','Rental start','time',false,record.rentalWindow?.start) : null;
  const end = contacting ? field('bookingActionEnd','Rental end','time',false,record.rentalWindow?.end) : null;
  const notes = contacting ? field('bookingActionNotes','Notes','textarea',false,record.notes || '') : null;
  if (notes) notes.maxLength = 2000;
  const charge = charging ? field('bookingActionCharge','Cancellation charge','number',true,record.paid.toFixed(2)) : null;
  if (charge) { charge.min = '0'; charge.step = '0.01'; }
  const year = exporting ? field('bookingActionYear','Year','select',true,years[0]||'All',[...years,'All']) : null;
  const recipient = reminding ? field('bookingActionRecipient','Customer email','email',true,record.email || '') : null;
  if (recipient) {
   recipient.maxLength = 254;
   recipient.autocomplete = 'email';
   if (!record.email) {
    const missing = note('No email on file — enter one to send','bookingActionMissingEmail');
    missing.className = 'form-label-note';
    recipient.setAttribute('aria-describedby',missing.id);
   }
   const {subject,htmlBody} = reminderMessage_(reminderFields(record));
   note(subject,'bookingActionSubject');
   // The exact email the customer will get (same template the helper sends). Sandboxed: no scripts, no links followed.
   const preview = document.createElement('iframe');
   preview.id = 'bookingActionPreview';
   preview.title = 'Email preview';
   preview.setAttribute('sandbox','');
   preview.srcdoc = htmlBody;
   preview.style.cssText = 'width:100%;height:360px;border:1px solid var(--line-subtle);border-radius:var(--radius-md);background:#fff';
   form.append(preview);
   recipient.oninput = () => recipient.setCustomValidity('');
  }
  const reason = exporting || reminding ? null : field('bookingActionReason',blocking ? 'What is this for? (shown as the name of the blocked date)' : contacting ? 'Reason (optional)' : 'Reason for this change','text',!contacting);
  if (reason) reason.maxLength = blocking ? 150 : 500;
  const error = document.createElement('p');
  error.className = 'alert alert-danger';
  error.setAttribute('role','alert');
  error.style.display = 'none';
  form.append(error);
  const footer = document.createElement('div');
  footer.setAttribute('style',footerStyle);
  const cancel = document.createElement('button'), submit = document.createElement('button');
  cancel.type = 'button'; cancel.className = 'btn btn-quiet'; cancel.textContent = 'Cancel';
  submit.type = 'submit'; submit.className = 'btn btn-primary'; submit.textContent = exporting ? 'Download' : reminding ? 'Send' : 'Save';
  if (!reminding && !exporting && !charging && !contacting) for (const button of [cancel,submit]) button.style.minHeight = 'var(--touch-target-min)';
  footer.append(cancel,submit);
  form.append(footer);

  let pending = false, checkSequence = 0;
  function cleanup() {
   window.removeEventListener('hashchange',cleanup);
   document.removeEventListener('keydown',key,true);
   modal.remove();
  }
  function dismiss() {
   if (pending) return;
   cleanup();
   opener.focus({preventScroll:true});
  }
  function key(event) {
   if (!modal.isConnected) { cleanup(); return; }
   if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    dismiss();
   }
   if (event.key === 'Tab') {
    const items = [...modal.querySelectorAll('button,input,select,textarea,.modal-close-btn')].filter(item => !item.disabled);
    const first = items[0], last = items[items.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
   }
  }
  cancel.onclick = dismiss;
  close.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); dismiss(); } };
  close.onclick = event => { event.preventDefault(); event.stopPropagation(); dismiss(); };
  modal.onclick = event => { if (event.target === modal) { event.stopPropagation(); dismiss(); } };
  document.addEventListener('keydown',key,true);
  window.addEventListener('hashchange',cleanup);

  async function checkDate() {
   const ticket = ++checkSequence, value = date.value;
   date.setCustomValidity('');
   status.textContent = '';
   if (!value || !date.validity.valid) return;
   let conflict = dateConflict(value,record.date,[]);
   if (!conflict) {
    status.textContent = 'Checking availability…';
    try {
     const rows = await api.list(value < api.today ? {from:value,to:value} : {});
     conflict = dateConflict(value,record.date,rows);
    } catch {
     if (ticket === checkSequence) status.textContent = 'Availability could not be checked. The date will be checked when you save.';
     return;
    }
   }
   if (ticket !== checkSequence || !modal.isConnected) return;
   if (!blocking || !lastDay.value) date.setCustomValidity(conflict);
   status.textContent = conflict || 'Date available ✓';
  }

  date?.addEventListener('input',checkDate);
  lastDay?.addEventListener('input',checkDate);
  reason?.addEventListener('input',() => reason.setCustomValidity(''));
  form.onsubmit = async event => {
   event.preventDefault();
   event.stopPropagation();
   if (pending || !form.reportValidity()) return;
   const trimmedReason = reason?.value.trim();
   if (!exporting && !reminding && !trimmedReason && !contacting) {
    reason.setCustomValidity('Enter a reason.');
    reason.reportValidity();
    return;
   }
   if (recipient && !validDocumentEmail(recipient.value.trim())) {
    recipient.setCustomValidity('Enter one valid email address.');
    recipient.reportValidity();
    return;
   }
   const values = moving ? {date:date.value,reason:trimmedReason} : {reason:trimmedReason};
   if (contacting) {
    const previousWindow = record.rentalWindow;
    const changedHours = start.value !== (previousWindow?.start || '') || end.value !== (previousWindow?.end || '');
    Object.assign(values,{client:name.value.trim(),phone:phone.value.trim(),email:email.value.trim(),type:eventType.value,
     guestCount:guests.value === '' ? null : Number(guests.value),notes:notes.value.trim()});
    if (changedHours) {
     const setupMinutes = previousWindow?.setupMinutes;
     values.rentalWindow = start.value || end.value ? {start:start.value,end:end.value,...(setupMinutes===undefined?{}:{setupMinutes})} : null;
    }
    for (const key of ['client','phone','email','type','guestCount','notes']) {
     if (JSON.stringify(values[key] === '' ? null : values[key]) === JSON.stringify((record[key] === '' ? null : record[key]) ?? null)) delete values[key];
    }
   }
   const blockValues = {client:trimmedReason,phone:'',type:'Blackout',date:blocking ? date.value : '',total:0,paid:0,notes:trimmedReason};
   pending = true;
   for (const control of [submit,cancel,close,reason,date,phone,email,charge,name,eventType,guests,start,end,notes,lastDay,year,recipient].filter(Boolean)) control.disabled = true;
   form.setAttribute('aria-busy','true');
   error.style.display = 'none';
   try {
    if (reminding) {
     let requests=reminderRequests.get(api);
     if (!requests) { requests=new Map(); reminderRequests.set(api,requests); }
     const to=recipient.value.trim(), key=JSON.stringify([id,to,record.revision]);
     const requestId=requests.get(key)||'email-'+crypto.randomUUID();
     requests.set(key,requestId);
     submit.textContent='Sending…';
     await api.emailReminder(id,to,requestId,record.revision);
     requests.delete(key);
     if (modal.isConnected) { cleanup(); go('#/booking/'+encodeURIComponent(id),'Payment reminder sent.'); }
     return;
    }
    if (exporting) {
     const {blob,filename}=await api.exportCsv(exportKind,year.value.toLowerCase());
     if (modal.isConnected) { downloadBlob(blob,filename); cleanup(); opener.focus(); }
     return;
    }
    if (charging) {
     const batch = [];
     if (action === 'cancel') batch.push({type:'cancel',bookingId:id,expectedRevision:record.revision,values});
     batch.push({type:'settle',bookingId:id,expectedRevision:record.revision+batch.length,values:{...values,amount:Number(charge.value)}});
     await api.commandBatch(batch);
    } else if (blocking) {
     const first = api.validateBookingDate(date.value), last = api.validateBookingDate(lastDay.value || first);
     const cursor = new Date(first+'T00:00:00Z'), limit = new Date(last+'T00:00:00Z');
     const days = (+limit - +cursor) / 86400000 + 1;
     if (days < 1 || days > 31) throw Error('Choose a range of 1–31 days.');
     if (days === 1) await api.commands('create',null,blockValues);
     else {
      const batch = [];
      for (; cursor <= limit; cursor.setUTCDate(cursor.getUTCDate()+1)) {
       batch.push({type:'create',values:{...blockValues,date:cursor.toISOString().slice(0,10)}});
      }
      await api.commandBatch(batch);
     }
    } else await api.commands(action,id,values);
    if (!modal.isConnected) return;
    cleanup();
    if (action === 'cancel') { go('#/bookings','Booking cancelled.'); return; }
    if (action === 'settle') { go('#/booking/'+encodeURIComponent(id),'Cancellation charge saved.'); return; }
    if (blocking) { go('#/calendar','Date blocked.'); return; }
    const message = contacting ? 'Booking details updated.' : moving ? (record.type === 'Blackout' ? 'Blocked date moved.' : 'Booking date changed.') : action === 'archive' ? 'Booking archived.' : 'Booking unarchived.';
    go('#/booking/'+encodeURIComponent(id),message);
   } catch (failure) {
    error.textContent = failure.message;
    error.style.removeProperty('display');
   } finally {
    pending = false;
    if (reminding) submit.textContent='Send';
    for (const control of [submit,cancel,close,reason,date,phone,email,charge,name,eventType,guests,start,end,notes,lastDay,year,recipient].filter(Boolean)) control.disabled = false;
    form.removeAttribute('aria-busy');
   }
  };
  body.append(modal);
  (recipient || year || date || charge || name || reason).focus();
 } finally {
  opening.delete(api);
 }
}
