import paymentScreen from './screens/record-payment.mjs?v=2.6.0';
import {validDocumentEmail} from './document-email-address.mjs?v=2.6.0';

const drafts = new WeakMap();
const opening = new WeakSet();

export function isReferenceDetail(api, record) {
 if (record.id !== 'sophia') return false;
 const original = api.original(record.id);
 return record.revision === original?.revision && record.date === original?.date && record.client === original?.client;
}

function element(tag, className, text) {
 const node = document.createElement(tag);
 if (className) node.className = className;
 if (text) node.textContent = text;
 return node;
}

export function addDocumentEmail(api,row,record,copy,toast,refresh) {
 const meta = copy.querySelector('strong').parentElement;
 const latest = row.emails?.[0];
 if (latest) {
  const date = new Date(latest.sent_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'America/Chicago'});
  const history = element('p','form-label-note','Emailed to '+latest.to_email+' · '+date);
  history.style.overflowWrap = 'anywhere';
  history.title = 'Emailed to '+latest.to_email+' on '+date+' by '+latest.sent_by;
  meta.append(history);
 }
 if (api.documentsEnabled === false) return;
 const action = element('div');
 action.hidden = !navigator.onLine;
 const button = element('button','btn btn-quiet btn-sm','Email to customer');
 button.type = 'button';
 button.onclick = () => emailSheet(api,row,record,button,toast,refresh).catch(() => toast('Unable to open the email form.'));
 action.dataset.documentEmailAction = '';
 action.append(button);
 meta.append(action);
}

function updateConnection() {
 for (const action of document.querySelectorAll('[data-document-email-action]')) action.hidden = !navigator.onLine;
}
if (typeof window !== 'undefined') {
 window.addEventListener('online',updateConnection);
 window.addEventListener('offline',updateConnection);
}

async function emailSheet(api,row,record,opener,toast,refresh) {
 const body = document.body, hash = location.hash;
 if (!navigator.onLine || api.documentsEnabled === false || opening.has(body) || body.querySelector('#documentEmailModal')) return;
 opening.add(body);
 try {
  const host = element('div');
  host.innerHTML = paymentScreen(await api.presentation('record-payment'));
  if (document.body !== body || location.hash !== hash || !opener.isConnected) return;
  const modal = host.querySelector('.modal-backdrop'), dialog = modal.querySelector('.modal-dialog');
  const form = modal.querySelector('form'), close = modal.querySelector('.modal-close-btn');
  const footerStyle = form.querySelector('#btnSavePayment').parentElement.getAttribute('style');
  modal.id = 'documentEmailModal';
  form.id = 'documentEmailForm';
  form.dataset.commandForm = 'true';
  modal.querySelector('.modal-title').textContent = 'Email to customer';
  modal.querySelector('.modal-header .badge').remove();
  const filename = modal.querySelector('.modal-header p');
  filename.textContent = row.filename;
  filename.style.overflowWrap = 'anywhere';
  modal.querySelector('.modal-header').nextElementSibling.remove();
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-describedby','documentEmailExplanation');
  close.removeAttribute('href');
  close.tabIndex = 0;
  close.setAttribute('role','button');
  close.setAttribute('aria-label','Close email form');
  close.style.flexShrink = '0';
  form.replaceChildren();

  let map = drafts.get(api);
  if (!map) { map = new Map(); drafts.set(api,map); }
  let draft = map.get(row.id);
  if (!draft) {
   draft={to:record.email || '',requests:new Map()};
   map.set(row.id,draft);
  }
  const group = element('div','form-group');
  const label = element('label','form-label','Customer email');
  const input = element('input','form-input');
  input.type = 'email';
  input.id = label.htmlFor = 'documentEmailTo';
  input.autocomplete = 'email';
  input.required = true;
  input.maxLength = 254;
  input.value = draft.to;
  input.style.minHeight = 'var(--touch-target-min)';
  input.oninput = () => { draft.to = input.value; input.setCustomValidity(''); };
  group.append(label,input);
  if (!record.email) {
   const note = element('p','form-label-note','No email on file — enter one to send');
   note.id = 'documentEmailMissing';
   input.setAttribute('aria-describedby',note.id);
   group.append(note);
  }
  const explanation = element('p','card-subtitle',"We'll attach the PDF and send it from the venue's email account");
  explanation.id = 'documentEmailExplanation';
  const error = element('p','alert alert-danger');
  error.setAttribute('role','alert');
  error.style.display = 'none';
  const footer = element('div');
  footer.setAttribute('style',footerStyle);
  const cancel = element('button','btn btn-quiet','Cancel');
  const send = element('button','btn btn-primary','Send');
  cancel.type = 'button';
  send.type = 'submit';
  for (const button of [cancel,send]) button.style.minHeight = 'var(--touch-target-min)';
  footer.append(cancel,send);
  form.append(group,explanation,error,footer);

  let busy = false;
  function cleanup() {
   window.removeEventListener('hashchange',cleanup);
   document.removeEventListener('keydown',key,true);
   modal.remove();
  }
  function dismiss() {
   if (busy) return;
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
    const first = close, last = busy ? close : send;
    if (event.shiftKey && document.activeElement === first) {
     event.preventDefault();
     last.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
     event.preventDefault();
     first.focus();
    }
   }
  }
  close.onclick = dismiss;
  close.onkeydown = event => { if (['Enter',' '].includes(event.key)) { event.preventDefault(); dismiss(); } };
  cancel.onclick = dismiss;
  modal.onclick = event => { if (event.target === modal) dismiss(); };
  form.onsubmit = async event => {
   event.preventDefault();
   event.stopPropagation();
   if (busy) return;
   const to = input.value.trim();
   if (!validDocumentEmail(to)) {
    input.setCustomValidity('Enter one valid email address.');
    input.reportValidity();
    return;
   }
   error.style.display = 'none';
   if (!navigator.onLine || api.documentsEnabled === false) {
    error.textContent = 'Email is unavailable. Check your connection and try again.';
    error.style.display = '';
    return;
   }
   const requestId = draft.requests.get(to) || 'email-'+crypto.randomUUID();
   draft.to = to;
   draft.requests.set(to,requestId);
   busy = send.disabled = cancel.disabled = input.disabled = true;
   form.setAttribute('aria-busy','true');
   close.focus({preventScroll:true});
   send.textContent = 'Sending…';
   try {
    await api.emailDocument(row.id,to,requestId);
   } catch (failure) {
    error.textContent = failure.status ? failure.message : 'Email could not be confirmed. Try again with the same address.';
    error.style.display = '';
    return;
   } finally {
    busy = send.disabled = cancel.disabled = input.disabled = false;
    send.textContent = 'Send';
    form.removeAttribute('aria-busy');
    if (!error.style.display && modal.isConnected) input.focus({preventScroll:true});
   }
   map.delete(row.id);
   const visible = modal.isConnected;
   dismiss();
   if (visible) {
    toast('Sent to '+to);
    document.querySelector('.app-toast')?.style.setProperty('overflow-wrap','anywhere');
    try { await refresh(); } catch { return; }
    document.querySelector('[data-document-id="'+CSS.escape(row.id)+'"] [data-document-email-action] button')?.focus({preventScroll:true});
   }
  };
  document.addEventListener('keydown',key,true);
  window.addEventListener('hashchange',cleanup);
  body.append(modal);
  input.focus();
 } finally { opening.delete(body); }
}
