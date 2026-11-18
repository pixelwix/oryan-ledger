import paymentScreen from './screens/record-payment.mjs?v=2.1.1';

const opening = new WeakSet();
const explanations = {
 reschedule: 'Price and payments stay exactly as they are.',
 archive: 'Archiving hides this cancelled booking from Bookings and Needs attention. Nothing is deleted or changed. You can bring it back from Archived.',
 unarchive: 'This cancelled booking will appear in Bookings again.'
};
const savedCopiesNote = 'Saved contracts and receipts keep the old date. Prepare a new contract if the client needs one.';

export function bookingActionLabel(action, record) {
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

export function mountBookingActions(record, referenceDetail) {
 const bar = document.querySelector('.more-dropdown-container');
 const action = record.archived ? 'unarchive' : record.cancelled ? 'archive' : 'reschedule';
 const button = bookingActionButton(action, record, referenceDetail ? 'more-menu-item' : 'btn btn-quiet');
 button.style.minHeight = 'var(--touch-target-min)';
 if (referenceDetail) {
  bar.querySelector('.more-menu-divider').before(button);
 } else if (!record.archived) {
  bar.before(button);
 }
 if (record.archived) {
  const note = document.createElement('p');
  note.className = 'card-subtitle';
  note.textContent = 'Archived on '+archiveDate(record.archived.at)+' by '+record.archived.by+'.';
  note.append(' ', button);
  bar.parentElement.after(note);
 }
}

export async function openBookingAction({api,id,action,opener,go}) {
 if (opening.has(api) || document.getElementById('bookingActionModal')) return;
 const body = document.body, hash = location.hash;
 opening.add(api);
 try {
  const record = await api.detail(id);
  const allowed = record.archived ? 'unarchive' : record.cancelled ? 'archive' : 'reschedule';
  if (action !== allowed) throw Error('This action is no longer available. Refresh the booking and try again.');
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
  modal.querySelector('.modal-header p').textContent = record.client+(moving?' · Current date: '+record.date:'');
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
  function field(id, label, type) {
   const group = document.createElement('div');
   group.className = 'form-group';
   const caption = document.createElement('label');
   caption.className = 'form-label';
   caption.htmlFor = id;
   caption.textContent = label;
   const input = document.createElement('input');
   input.id = id;
   input.className = 'form-input';
   input.type = type;
   input.required = true;
   input.style.minHeight = 'var(--touch-target-min)';
   group.append(caption,input);
   form.append(group);
   return input;
  }
  note(explanations[action],'bookingActionExplanation');
  if (copies.some(copy => copy.kind === 'contract' && copy.status === 'saved')) note(savedCopiesNote,'bookingActionCopies');
  const date = moving ? field('bookingActionDate','New date','date') : null;
  const status = moving ? note('','bookingActionAvailability') : null;
  if (date) {
   date.setAttribute('aria-describedby',status.id);
   status.setAttribute('role','status');
  }
  const reason = field('bookingActionReason','Reason for this change','text');
  reason.maxLength = 500;
  const error = document.createElement('p');
  error.className = 'alert alert-danger';
  error.setAttribute('role','alert');
  error.style.display = 'none';
  form.append(error);
  const footer = document.createElement('div');
  footer.setAttribute('style',footerStyle);
  const cancel = document.createElement('button'), submit = document.createElement('button');
  cancel.type = 'button'; cancel.className = 'btn btn-quiet'; cancel.textContent = 'Cancel';
  submit.type = 'submit'; submit.className = 'btn btn-primary'; submit.textContent = 'Save';
  for (const button of [cancel,submit]) button.style.minHeight = 'var(--touch-target-min)';
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
    const items = [...modal.querySelectorAll('button,input,.modal-close-btn')].filter(item => !item.disabled);
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
   date.setCustomValidity(conflict);
   status.textContent = conflict || 'Date available ✓';
  }

  date?.addEventListener('input',checkDate);
  reason.addEventListener('input',() => reason.setCustomValidity(''));
  form.onsubmit = async event => {
   event.preventDefault();
   event.stopPropagation();
   if (pending || !form.reportValidity()) return;
   const trimmedReason = reason.value.trim();
   if (!trimmedReason) {
    reason.setCustomValidity('Enter a reason.');
    reason.reportValidity();
    return;
   }
   const values = moving ? {date:date.value,reason:trimmedReason} : {reason:trimmedReason};
   pending = true;
   for (const control of [submit,cancel,close,reason,date].filter(Boolean)) control.disabled = true;
   form.setAttribute('aria-busy','true');
   error.style.display = 'none';
   try {
    await api.commands(action,id,values);
    if (!modal.isConnected) return;
    cleanup();
    const message = moving ? (record.type === 'Blackout' ? 'Blocked date moved.' : 'Booking date changed.') : action === 'archive' ? 'Booking archived.' : 'Booking unarchived.';
    go('#/booking/'+encodeURIComponent(id),message);
   } catch (failure) {
    error.textContent = failure.message;
    error.style.removeProperty('display');
   } finally {
    pending = false;
    for (const control of [submit,cancel,close,reason,date].filter(Boolean)) control.disabled = false;
    form.removeAttribute('aria-busy');
   }
  };
  body.append(modal);
  (date || reason).focus();
 } finally {
  opening.delete(api);
 }
}
