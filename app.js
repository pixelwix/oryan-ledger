'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const LIVE = window.ORYAN_LIVE === true;
const BETA = window.ORYAN_BETA === true || window.ORYAN_WORKFLOW === true;
let betaCancelRequest='';
const eventCharge=r=>BETA?r.financialTotal:r.total;
const money = n => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits:2}).format(n);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate = s => new Date(s + 'T12:00:00');
let serverToday = '', records = [], ready = false, scope = 'all', view = 'overview', page = 0, paymentId = null, detailId = null, step = 1, busy = false, dirty = false;
let bookingRequest = '', paymentRequest = '', blackoutRequest = '';
const today = () => serverToday || new Intl.DateTimeFormat('en-CA', {timeZone:'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
const balance = Ledger.balance, review = Ledger.review;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const dateLabel = s => s ? localDate(s).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : 'Not recorded';
const ICONS = {
  bookings: '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>',
  calendar: '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  value: '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  alert: '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  chevronRight: '<svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>',
  chevronLeft: '<svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};
let calYear = null, calMonth = null, selectedDate = null, calViewMode = 'day';
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
// Standalone web build (ledger.oryaneventcenter.com): Google sign-in by redirect, then the Apps Script API runs the same server functions as the user.
const API = window.ORYAN_API || null;
const store = (area, key, value) => { try { value === undefined ? area.removeItem(key) : area.setItem(key, value); } catch {} };
const read = (area, key) => { try { return area.getItem(key); } catch { return null; } };
function signInError(message) { return Object.assign(Error(message), {signIn:true}); }
function storedToken(minMs = 60000) {
  try { const t = JSON.parse(read(sessionStorage, 'oryan-auth')); return t && t.expires - Date.now() > minMs ? t : null; } catch { return null; }
}
function signIn(prompt) {
  const state = uuid(), nonce = uuid(); store(sessionStorage, 'oryan-auth-state', state); store(sessionStorage, 'oryan-auth-nonce', nonce);
  const params = new URLSearchParams({client_id:API.clientId, redirect_uri:location.origin + location.pathname, response_type:'token id_token', scope:API.scopes.join(' '), include_granted_scopes:'true', state, nonce});
  const hint = read(localStorage, 'oryan-email'); if (hint) params.set('login_hint', hint);
  prompt = prompt || (read(localStorage, 'oryan-signed-out') ? 'select_account' : '');
  if (prompt) params.set('prompt', prompt);
  location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + params);
}
// Saved copies need this; the ledger doesn't. A missing or mismatched token only leaves copies pending, so it never blocks sign-in.
function verifiedIdToken(token, nonce) {
  try { const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return nonce && JSON.parse(atob(part)).nonce === nonce ? token : ''; } catch { return ''; }
}
function captureToken() {
  if (!API || !/access_token|error=/.test(location.hash)) return '';
  const h = new URLSearchParams(location.hash.slice(1)), state = read(sessionStorage, 'oryan-auth-state'), nonce = read(sessionStorage, 'oryan-auth-nonce');
  history.replaceState(null, '', location.pathname + location.search); store(sessionStorage, 'oryan-auth-state'); store(sessionStorage, 'oryan-auth-nonce');
  if (h.get('error')) return 'Google sign-in did not finish. Sign in to continue.';
  if (!state || h.get('state') !== state) return 'Sign-in could not be verified. Sign in again.';
  store(sessionStorage, 'oryan-auth', JSON.stringify({token:h.get('access_token'), idToken:verifiedIdToken(h.get('id_token') || '', nonce), expires:Date.now() + Number(h.get('expires_in') || 3600) * 1000}));
  store(localStorage, 'oryan-signed-out');
  return '';
}
// Re-sign in before a form opens, so a long-open session never loses a half-filled form to an expired token.
function needsSignIn() { if (!API || storedToken(10 * 60000)) return false; signIn(); return true; }
async function apiRun(name, args) {
  const t = storedToken(); if (!t) throw signInError('Sign in with your Google account to open the ledger.');
  let response;
  try { response = await fetch(`https://script.googleapis.com/v1/scripts/${API.scriptId}:run`, {method:'POST', headers:{Authorization:'Bearer ' + t.token, 'Content-Type':'application/json'}, body:JSON.stringify({function:name, parameters:args})}); }
  catch { throw Error('Could not reach Google Sheets. Check the connection and try again.'); }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) { store(sessionStorage, 'oryan-auth'); throw signInError('Your Google sign-in expired. Sign in again.'); }
  if (data.error) throw Error(data.error.details?.[0]?.errorMessage || data.error.message || 'Could not reach Google Sheets. Try again.');
  return data.response?.result;
}
function rpc(name, ...args) {
  if(BETA)return BetaClient.rpc(name,...args);
  if (API) return apiRun(name, args);
  return new Promise((resolve, reject) => google.script.run.withSuccessHandler(resolve).withFailureHandler(e => reject(Error(e.message || 'Could not reach Google Sheets. Try again.')))[name](...args));
}
let accountEmail = API ? read(localStorage, 'oryan-email') || '' : '';
function renderAccount() {
  $$('.account-initial').forEach(e=>e.textContent=accountEmail?accountEmail[0].toUpperCase():'O');
  $('#accountName').textContent=accountEmail||'O’Ryan team';$('#accountName').title=accountEmail;
}
function openAccount() {
  const signedIn=LIVE&&accountEmail&&(!API||storedToken(0));
  $('#accountTitle').textContent=window.ORYAN_BETA?'Beta mode':!LIVE?'Demo mode':signedIn?'Signed in':'Not signed in';
  $('#accountEmail').textContent=signedIn?accountEmail:'';$('#accountEmail').hidden=!signedIn;
  $('#accountNote').textContent=!LIVE?'This sample is not tied to an account.':!signedIn?'Sign in with Google to open the ledger.':API?'Sign out removes ledger access on this device. Your Google account stays signed in to this browser, so on a shared computer sign out of Google too.':'You are signed in through Google. To switch accounts, sign out of Google in this browser.';
  $('#accountVersion').textContent=$('.account small').textContent;
  $('#signOut').hidden=!(API&&signedIn);
  $('#accountDialog').showModal();
}
// Ends this device's ledger session. Google's own session and the app's consent are left alone, so the next sign-in only has to pick an account.
function signOut() {
  store(sessionStorage,'oryan-auth');store(localStorage,'oryan-email');store(localStorage,'oryan-signed-out','1');
  dirty=false;location.reload();
}
// The Sheet keeps the stored type 'Blackout' so existing rows still work; people see 'Blocked date'.
const typeLabel = t => t === 'Blackout' ? 'Blocked date' : t;
function normalize(r) {
  if(BETA)r=BetaLedger.derive(r);
  const openingPaid = r.openingPaid ?? Math.round((r.paid - (r.payments || []).reduce((n,p) => n+p.amount,0))*100)/100;
  const isAudio = r.audio === true || r.sound === true;
  const isCovers = BETA&&typeof r.covers==='boolean'?r.covers:r.covers === true || /covers\+/i.test(r.notes || '');
  const isProjector = BETA&&typeof r.projector==='boolean'?r.projector:r.projector === true || /projector/i.test(r.notes || '');
  return {...r, id:String(r.id), total:r.total ?? null, sheetBalance:r.sheetBalance ?? null, phone:r.phone || '', notes:r.notes || '', payments:r.payments || [], openingPaid,
    covers: isCovers, projector: isProjector, audio: isAudio, sound: isAudio, bar: r.bar === true, security: r.security === true,
    imported: r.imported ?? true, importedDifference:r.importedDifference ?? (r.sheetBalance == null || r.total == null ? 0 : Math.round((r.total-openingPaid-r.sheetBalance)*100)/100)};
}
function toast(message) {
  $('#toast').textContent=message; $('#toast').style.display='block'; clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>$('#toast').style.display='none',5000);
}
function formError(id, message) { $(id).textContent=message; $(id).hidden=!message; }
function setBusy(value, form) {
  busy=value; form.setAttribute('aria-busy',String(value));
  $$('dialog .close').forEach(b=>b.disabled=value);
  [...form.querySelectorAll('button')].forEach(b=>b.disabled=value);
  const submit=form.querySelector('[type=submit]');
  if(submit) submit.textContent=value?'Saving…':form.id==='bookingForm'?'Save booking':'Save payment';
}
function deviceSave(next) {
  try { localStorage.setItem('oryan-demo-v2',JSON.stringify(next)); }
  catch { throw Error('This device could not save the change. Enable browser storage, then try again. Nothing was saved.'); }
}
async function load() {
  ready=false; $('#loadError').hidden=true; $('#connectionStatus').textContent=LIVE?'Loading Google Sheets…':'Loading demo…';
  ['#newBooking','#mobileAdd','#quickPayment'].forEach(s=>$(s).disabled=true);
  try {
    if (BETA) {
      const response=await rpc('getLedger');records=response.records.map(normalize);serverToday=response.today;
      if(LIVE){if(API&&response.actor)store(localStorage,'oryan-email',response.actor);accountEmail=response.actor||'';renderAccount();$('#reset').hidden=true;$$('.save-destination').forEach(e=>e.textContent='Saved to Google Sheets');}
    } else if (LIVE) {
      const response=await rpc('getLedger'); records=response.records.map(normalize); serverToday=response.today; if(API&&response.actor)store(localStorage,'oryan-email',response.actor);accountEmail=response.actor||'';renderAccount();
      $('#modeBanner').innerHTML=`<span>${ICONS.check}</span><div><b>Connected to Google Sheets.</b> Bookings and payments save to the app tabs. The original ledger is preserved.</div>`;
      $('#reset').hidden=true; $$('.save-destination').forEach(e=>e.textContent='Saved to Google Sheets');
    } else {
      let saved; try { saved=localStorage.getItem('oryan-demo-v2'); } catch { saved=null; }
      records=(saved?JSON.parse(saved):structuredClone(SEED)).map(normalize);
    }
    ready=true; updateYears(); render();
    $('#connectionStatus').textContent=LIVE?'Google Sheets · connected':'Demo · saved on this device';
    if(BETA)BetaUI.loaded();
    $('#lastUpdated').textContent='Updated '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    ['#newBooking','#mobileAdd','#quickPayment'].forEach(s=>$(s).disabled=false);
  } catch(e) {
    $('#loadError').hidden=false; $('#loadError p').textContent=e.message;
    $('#retryLoad').textContent=e.signIn?'Sign in with Google':'Try again'; $('#retryLoad').onclick=e.signIn?()=>signIn():load;
    $('#connectionStatus').textContent=LIVE?'Google Sheets · could not load':'Demo · could not load';
  }
}
function updateYears() {
  const previous=$('#year').value, years=[...new Set([today().slice(0,4),...records.map(r=>r.date.slice(0,4))])].sort().reverse();
  $('#year').innerHTML=years.map(y=>`<option>${esc(y)}</option>`).join('');
  $('#year').value=years.includes(previous)?previous:today().slice(0,4);
}
const activeRecords = () => records.filter(r=>!r.cancelled);
function base() { return activeRecords().filter(r=>scope==='all'||r.date.startsWith($('#year').value)); }
function render() {
  const data=base(), owing=data.filter(r=>balance(r)>0), sum=k=>data.reduce((n,r)=>n+(Number.isFinite(r[k])?r[k]:0),0);
  $('#metrics').innerHTML=[['Bookings',data.length,'Events in this selection',ICONS.bookings],['Known event value',money(sum('total')),plural(data.filter(r=>r.total==null).length,'agreed price still missing','agreed prices still missing'),ICONS.value],['Payments recorded',money(sum('paid')),'Total paid for selected events',ICONS.check],['Balance to collect',money(owing.reduce((n,r)=>n+balance(r),0)),`${owing.length} bookings with a balance`,ICONS.clock]].map(([t,v,n,i])=>`<article class="metric"><div class="metric-top">${t}<span class="metric-icon">${i}</span></div><div class="metric-value">${v}</div><span class="metric-note">${n}</span></article>`).join('');
  if(BETA)BetaUI.metrics();
  renderUpcoming(); renderCharts(data); renderAttention(data); if(BETA)BetaUI.attention(); renderTable();
  if(view==='calendar') renderCalendar();
}
function renderUpcoming() {
  const upcoming=activeRecords().filter(r=>r.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
  $('#upcomingCards').innerHTML=upcoming.length?upcoming.map(r=>`<button class="upcoming-card" data-detail="${esc(r.id)}"><span class="date-tile"><small>${localDate(r.date).toLocaleDateString('en-US',{month:'short'})}</small><b>${localDate(r.date).getDate()}</b></span><span><b>${esc(r.client)}</b><small>${esc(typeLabel(r.type))} · ${localDate(r.date).toLocaleDateString('en-US',{weekday:'long'})}</small><em>${r.total==null?'Agreed price needs review':balance(r)?money(balance(r))+' to collect':'Paid in full'}</em></span><span>${ICONS.chevronRight}</span></button>`).join(''):'<p class="empty-copy">No upcoming events yet. Add a booking to start planning.</p>';
  bindDetails($('#upcomingCards'));
}
function renderCharts(data) {
  const months=Array(12).fill(0); data.forEach(r=>months[+r.date.slice(5,7)-1]++); const peak=Math.max(...months,1);
  $('#chartYear').textContent=scope==='all'?'All years combined':$('#year').value;
  $('#monthly').innerHTML=months.map((n,i)=>`<div class="month ${n===peak?'peak':''}" title="${['January','February','March','April','May','June','July','August','September','October','November','December'][i]}: ${n} events"><span class="amount">${n||''}</span><div class="bar" style="height:${n/peak*80}%"></div><small>${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</small></div>`).join('');
  const days=Array(7).fill(0); data.forEach(r=>days[(localDate(r.date).getDay()+6)%7]++); const max=Math.max(...days,1), best=days.indexOf(Math.max(...days));
  $('#weekdays').innerHTML=days.map((n,i)=>`<div class="day ${n===max?'best':''}"><span>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span><div class="track"><span style="width:${n/max*100}%"></span></div><span>${n}</span></div>`).join('');
  $('#bestDay').textContent=data.length?`${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][best]} leads with ${days[best]} events (${Math.round(days[best]/data.length*100)}%). Based on event dates, not when customers booked.`:'No events in this selection.';
  const types=new Map(); data.forEach(r=>types.set(typeLabel(r.type),(types.get(typeLabel(r.type))||0)+1)); const sorted=[...types].sort((a,b)=>b[1]-a[1]);
  $('#types').innerHTML=sorted.slice(0,5).map(([t,n])=>`<div class="type"><span>${esc(t)}</span><div class="track"><span style="width:${n/(sorted[0]?.[1]||1)*100}%"></span></div><span>${n}</span></div>`).join('')+'<small class="empty-copy">Top event types in this selection.</small>';
}
function renderAttention(data) {
  const missing=data.filter(r=>r.total==null).length;
  const duplicateDays=[...new Set(data.filter(r=>activeRecords().filter(other=>other.date===r.date).length>1).map(r=>r.date))].length;
  const late=data.filter(r=>balance(r)>0&&r.due&&r.due<today()).length, mismatch=data.filter(r=>r.total!=null&&review(r)).length, credit=data.filter(r=>r.total!=null&&r.paid>r.total).length;
  $('#attention').innerHTML=[[plural(duplicateDays,'date has multiple bookings','dates have multiple bookings'),'Imported history needs review. New bookings on an occupied date are blocked.','duplicate'],[plural(missing,'booking needs an agreed price','bookings need an agreed price'),'Payments are preserved; balance and credit stay unknown until the price is entered.','price'],[plural(late,'booking past its due date','bookings past their due date'),'Check the recorded due dates before following up.','overdue'],[plural(mismatch,'imported balance to review','imported balances to review'),'Original cost minus original payments differs from the listed balance.','balanceReview'],[plural(credit,'booking shows an overpayment','bookings show an overpayment'),'Check whether extra money was a refundable security deposit.','credit']].map(([t,n,f])=>`<div class="attention-item"><span>${f==='overdue'?ICONS.clock:ICONS.alert}</span><div><b>${t}</b><p>${n}</p></div><button aria-label="View ${esc(t)}" data-filter="${f}">${ICONS.chevronRight}</button></div>`).join('');
  $$('[data-filter]').forEach(b=>b.onclick=()=>{setView('bookings',false);$('#status').value=b.dataset.filter;$('#dateRange').value='all';page=0;renderTable();$('.ledger').scrollIntoView({behavior:'smooth'})});
}
function filtered() {
  const q=$('#search').value.trim().toLowerCase(), s=$('#status').value, range=$('#dateRange').value;
  const selection=s==='cancelled'?records.filter(r=>r.cancelled&&(scope==='all'||r.date.startsWith($('#year').value))):BETA&&['balance','paid','credit','review','price'].includes(s)?records.filter(r=>r.type!=='Blackout'&&(scope==='all'||r.date.startsWith($('#year').value))):base();
  const result=selection.filter(r=>[r.client,typeLabel(r.type),r.contract,r.phone].join(' ').toLowerCase().includes(q))
    .filter(r=>s==='cancelled'||s==='all'||s==='balance'&&balance(r)>0||s==='paid'&&eventCharge(r)!=null&&balance(r)===0||s==='duplicate'&&activeRecords().filter(other=>other.date===r.date).length>1||s==='review'&&review(r)||s==='balanceReview'&&eventCharge(r)!=null&&review(r)||s==='price'&&eventCharge(r)==null||s==='credit'&&eventCharge(r)!=null&&r.paid>eventCharge(r)||s==='overdue'&&balance(r)>0&&r.due&&r.due<today())
    .filter(r=>range==='all'||range==='upcoming'&&r.date>=today()||range==='past'&&r.date<today());
  return result.sort((a,b)=>$('#sort').value==='balance'?balance(b)-balance(a)||a.date.localeCompare(b.date):$('#sort').value==='soonest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
}
function badge(r) {
  if (r.cancelled) return '<span class="badge">Cancelled</span>';
  if (r.type === 'Blackout') return '<span class="badge blackout">Blocked</span>';
  return `<span class="badge ${review(r)?'review':balance(r)?'due':''}">${r.total==null?'Agreed price missing':review(r)?'Review imported balance':balance(r)?'Balance due':'Paid in full'}</span>`;
}
function renderTable() {
  const list=filtered(), size=7; page=Math.min(page,Math.max(0,Math.ceil(list.length/size)-1));
  $('#count').textContent=plural(list.length,'booking','bookings');
  $('#rows').innerHTML=list.slice(page*size,(page+1)*size).map(r=>`<tr><td class="guest-cell"><button class="guest guest-button" data-detail="${esc(r.id)}"><span class="avatar">${esc(r.client.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span><span><b>${esc(r.client)}</b><small>${esc(typeLabel(r.type))} · #${esc(r.contract)}</small></span></button></td><td class="event-cell" data-label="Event date">${dateLabel(r.date)}<small>${localDate(r.date).toLocaleDateString('en-US',{weekday:'long'})}</small></td><td data-label="Agreed price">${(BETA?r.financialTotal:r.total)==null?'Not entered':money(BETA?r.financialTotal:r.total)}</td><td data-label="Paid">${money(r.paid)}</td><td class="balance-cell" data-label="Balance due">${r.cancelled&&!BETA?'—':(BETA?r.financialTotal:r.total)==null?'Review price':money(balance(r))}${eventCharge(r)!=null&&r.paid>eventCharge(r)?`<small>Credit ${money(Math.round((r.paid-eventCharge(r))*100)/100)}</small>`:''}</td><td class="status-cell">${badge(r)}</td><td class="actions-cell"><button class="quiet" data-detail="${esc(r.id)}">Details & history</button>${!r.cancelled&&balance(r)>0?`<button class="quiet payment-action" data-payment="${esc(r.id)}">${ICONS.plus}Payment</button>`:''}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="7"><strong>No bookings match.</strong><p>Try a different date or payment filter.</p><button class="quiet" id="clearFilters">Clear filters</button></td></tr>';
  $('#pageInfo').textContent=list.length?`${page*size+1}–${Math.min((page+1)*size,list.length)} of ${list.length}`:'No bookings';
  $('#prev').disabled=page===0; $('#next').disabled=(page+1)*size>=list.length;
  bindDetails($('#rows')); $('#rows').querySelectorAll('[data-payment]').forEach(b=>b.onclick=()=>openPayment(b.dataset.payment));
  if($('#clearFilters')) $('#clearFilters').onclick=()=>{ $('#search').value='';$('#status').value='all';$('#dateRange').value='all';scope='all';syncScope();render(); };
}
function initCalDate() {
  if (calYear === null) {
    const t = today();
    calYear = parseInt(t.slice(0, 4), 10);
    calMonth = parseInt(t.slice(5, 7), 10) - 1;
    selectedDate = t;
  }
}
function prevMonth() {
  initCalDate();
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  selectedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
  renderCalendar();
}
function nextMonth() {
  initCalDate();
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  selectedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
  renderCalendar();
}
function jumpToday() {
  const t = today();
  calYear = parseInt(t.slice(0, 4), 10);
  calMonth = parseInt(t.slice(5, 7), 10) - 1;
  selectedDate = t;
  renderCalendar();
}
function jumpNextEvent() {
  const t = today(), next = activeRecords().filter(r => r.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (next) {
    calYear = parseInt(next.date.slice(0, 4), 10);
    calMonth = parseInt(next.date.slice(5, 7), 10) - 1;
    selectedDate = next.date;
  } else {
    calYear = parseInt(t.slice(0, 4), 10);
    calMonth = parseInt(t.slice(5, 7), 10) - 1;
    selectedDate = t;
  }
  renderCalendar();
}
function toggleCalendarAgenda() {
  calViewMode = calViewMode === 'day' ? 'agenda' : 'day';
  $('#calDaySchedule').hidden = calViewMode === 'agenda';
  $('#calendarAgendaList').hidden = calViewMode === 'day';
}
function renderCalendar() {
  initCalDate();
  const t = today();
  if (!selectedDate) selectedDate = t;
  $('#calMonthTitle').textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthEvents = activeRecords().filter(r => r.date.startsWith(monthPrefix));
  const monthBookedDays = new Set(monthEvents.map(r => r.date)).size;
  $('#calMonthSubtitle').textContent = monthEvents.length ? `${monthEvents.length} event${monthEvents.length === 1 ? '' : 's'} scheduled (${monthBookedDays} booked date${monthBookedDays === 1 ? '' : 's'})` : 'No events scheduled for this month';

  // Highlight today's column in weekdays header
  const isCurMonth = calYear === +t.slice(0, 4) && calMonth === +t.slice(5, 7) - 1;
  const todayCol = isCurMonth ? localDate(t).getDay() : -1;
  if ($('#calWeekdaysRow')) $$('#calWeekdaysRow span').forEach((s, idx) => s.classList.toggle('is-today-col', idx === todayCol));

  // Calendar month grid with event dots
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const trailingCells = (7 - ((firstDay + daysInMonth) % 7)) % 7;

  let html = '';
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-date-cell empty" aria-hidden="true"></div>';

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${monthPrefix}-${String(dayNum).padStart(2, '0')}`;
    const evs = activeRecords().filter(r => r.date === dateStr);
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === t;
    let dots = '';
    if (evs.length === 1) {
      const st = evs[0].type === 'Blackout' ? 'blackout' : evs[0].total == null ? 'review' : balance(evs[0]) > 0 ? 'due' : 'paid';
      dots = `<span class="cal-dot capsule ${st}"></span>`;
    } else if (evs.length > 1) {
      dots = evs.slice(0, 3).map(r => `<span class="cal-dot dot ${r.type === 'Blackout' ? 'blackout' : r.total == null ? 'review' : balance(r) > 0 ? 'due' : 'paid'}"></span>`).join('');
    }
    html += `<button type="button" class="cal-date-cell ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}" data-cal-date="${dateStr}" aria-label="${dateStr}">
      <span class="cal-date-num">${dayNum}</span>
      <div class="cal-date-dots">${dots}</div>
    </button>`;
  }

  for (let i = 0; i < trailingCells; i++) html += '<div class="cal-date-cell empty" aria-hidden="true"></div>';
  $('#calendarGrid').innerHTML = html;

  $('#calendarGrid').querySelectorAll('[data-cal-date]').forEach(b => {
    b.onclick = () => {
      selectedDate = b.dataset.calDate;
      renderCalendar();
    };
  });

  // Render Selected Day Schedule in site UI
  if ($('#calSelectedDayTitle')) {
    const selDateObj = localDate(selectedDate);
    const fullDateStr = selDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    $('#calSelectedDayTitle').textContent = fullDateStr;
    const dayEvents = activeRecords().filter(r => r.date === selectedDate);
    const hasBlackout = dayEvents.some(r => r.type === 'Blackout');
    $('#calSelectedDayBadge').className = `badge ${hasBlackout ? 'blackout' : dayEvents.length ? (dayEvents.some(r => review(r)) ? 'review' : dayEvents.some(r => balance(r) > 0) ? 'due' : '') : ''}`;
    $('#calSelectedDayBadge').textContent = hasBlackout ? 'Blocked date' : dayEvents.length ? `${dayEvents.length} booking${dayEvents.length === 1 ? '' : 's'}` : (selectedDate >= t ? 'Available' : 'Past date');

    if (dayEvents.length) {
      $('#calSelectedDayEvents').innerHTML = dayEvents.map(r => {
        if (r.type === 'Blackout') {
          return `<div class="day-event-card blackout-card" data-detail="${esc(r.id)}">
            <div class="day-event-bar blackout"></div>
            <div class="day-event-info">
              <div class="day-event-title">Blocked Date</div>
              <div class="day-event-sub">Blocked by <b>${esc(r.client)}</b> · ${dateLabel(r.date)}</div>
              ${r.notes ? `<div class="day-event-notes">${esc(r.notes)}</div>` : ''}
            </div>
            <div class="day-event-actions">
              <span class="badge blackout">Blocked</span>
            </div>
          </div>`;
        }
        const isDue = balance(r) > 0;
        const barClass = r.total == null ? 'review' : isDue ? 'due' : 'paid';
        return `<div class="day-event-card" data-detail="${esc(r.id)}">
          <div class="day-event-bar ${barClass}"></div>
          <div class="day-event-info">
            <div class="day-event-title">${esc(r.client)}</div>
            <div class="day-event-sub">${esc(typeLabel(r.type))} · #${esc(r.contract)} · ${dateLabel(r.date)}</div>
            ${r.notes ? `<div class="day-event-notes">${esc(r.notes)}</div>` : ''}
          </div>
          <div class="day-event-actions">
            ${badge(r)}
            <div class="day-event-buttons">
              ${balance(r) > 0 ? `<button class="quiet payment-action" data-payment="${esc(r.id)}">${ICONS.plus}Payment</button>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');
      bindDetails($('#calSelectedDayEvents'));
      $('#calSelectedDayEvents').querySelectorAll('[data-payment]').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          openPayment(b.dataset.payment);
        };
      });
    } else {
      if (selectedDate >= t) {
        $('#calSelectedDayEvents').innerHTML = `<div class="cal-empty-day">
          <p>No events scheduled for this date. Space is available to book or hold.</p>
          <div class="cal-empty-actions">
            <button type="button" class="primary" id="calBookSelectedBtn">${ICONS.plus}Book this date</button>
            <button type="button" class="quiet blackout-action" id="calBlackoutSelectedBtn"><svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="4" y1="4" x2="20" y2="20"/></svg>Block date</button>
          </div>
        </div>`;
        $('#calBookSelectedBtn').onclick = () => openBooking(selectedDate);
        $('#calBlackoutSelectedBtn').onclick = () => openBlackout(selectedDate);
      } else {
        $('#calSelectedDayEvents').innerHTML = `<div class="cal-empty-day">
          <p>No bookings were recorded on this past date.</p>
        </div>`;
      }
    }
  }

  renderCalendarAgenda();
}
function renderCalendarAgenda() {
  const t = today();
  const upcoming = activeRecords().filter(r => r.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  if (!upcoming.length) {
    $('#calendarAgendaList').innerHTML = '<p class="empty-copy">No upcoming events scheduled. Click any available date on the calendar to add a booking.</p>';
    return;
  }
  $('#calendarAgendaList').innerHTML = upcoming.slice(0, 10).map(r => {
    const d = localDate(r.date);
    const mStr = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    const dayWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    if (r.type === 'Blackout') {
      return `<button class="agenda-card blackout-card" data-detail="${esc(r.id)}">
        <span class="date-tile"><small>${mStr}</small><b>${dayNum}</b></span>
        <div class="agenda-card-details">
          <div class="agenda-card-client">Blocked Date</div>
          <div class="agenda-card-sub">Blocked by ${esc(r.client)} · ${dayWeek}</div>
          <div class="agenda-card-status"><span class="badge blackout">Blocked</span></div>
        </div>
        <span>${ICONS.chevronRight}</span>
      </button>`;
    }
    const isDue = balance(r) > 0;
    const statusClass = r.total == null ? 'review' : isDue ? 'due' : 'paid';
    const statusText = r.total == null ? 'Review price' : isDue ? `${money(balance(r))} due` : 'Paid in full';
    return `<button class="agenda-card" data-detail="${esc(r.id)}">
      <span class="date-tile"><small>${mStr}</small><b>${dayNum}</b></span>
      <div class="agenda-card-details">
        <div class="agenda-card-client">${esc(r.client)}</div>
        <div class="agenda-card-sub">${esc(typeLabel(r.type))} · ${dayWeek} · #${esc(r.contract)}</div>
        <div class="agenda-card-status ${statusClass}">${statusText}</div>
      </div>
      <span>${ICONS.chevronRight}</span>
    </button>`;
  }).join('');
  bindDetails($('#calendarAgendaList'));
}
function bindDetails(root) {root.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetails(b.dataset.detail));}
function setView(v, scroll=true) {
  view=v; $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#crumb').textContent=v[0].toUpperCase()+v.slice(1);
  $('#title').textContent=({overview:'Every event, in view.',bookings:'Your bookings, organized.',calendar:'Upcoming events at a glance.',payments:'A quick payment. A clear balance.',insights:'A clearer picture of your business.'})[v]||'Every event, in view.';
  $('#dashboard').hidden=v!=='overview'&&v!=='insights';
  $('.chart-grid').hidden=$('#typesCard').hidden=v!=='insights';
  $('.attention').hidden=v!=='overview';
  $('.ledger').hidden=v!=='bookings'&&v!=='payments';
  $('#nextEvents').hidden=v!=='overview';
  $('#calendarSection').hidden=v!=='calendar';
  $('#metrics').hidden=v==='bookings'||v==='payments'||v==='calendar';
  $('.quick-actions').hidden=v==='insights'||v==='calendar';
  $('.toolbar').hidden=v==='calendar';
  $('#tableTitle').textContent=v==='payments'?'Bookings with a balance':'The booking book';
  $('#tableSubtitle').textContent=v==='payments'?'Choose a guest to record money received.':'Tap a guest for details, notes, and payment history.';
  $('#status').value=v==='payments'?'balance':'all'; $('#dateRange').value='all'; $('#sort').value='newest'; $('#search').value=''; page=0;
  if(v==='calendar') renderCalendar();
  if(ready)render(); if(scroll)window.scrollTo({top:0,behavior:'smooth'});
}
function syncScope() {$('#all').classList.toggle('selected',scope==='all');$('#yearButton').classList.toggle('selected',scope==='year');}
function setScope(s) {scope=s;syncScope();page=0;render();}
function showUpcoming() {setView('bookings',false);setScope('all');$('#dateRange').value='upcoming';$('#sort').value='soonest';renderTable();$('.ledger').scrollIntoView({behavior:'smooth'});}
function openDetails(id) {
  const r=records.find(x=>x.id===id);if(!r)return;detailId=id;
  $('#cancelBookingAction').hidden=$('#detailCancelBooking').hidden=!!r.cancelled||r.type==='Blackout';
  if(r.type==='Blackout'){
    $('#detailTitle').textContent='Blocked Date';
    $('#detailContent').innerHTML=`<p class="modal-sub">Blocked by <b>${esc(r.client)}</b> · ${dateLabel(r.date)} · #${esc(r.contract)}</p><div class="blackout-notice"><b>Date Unavailable</b>This entire day is blocked on the schedule. No public or private events can be booked on this date.</div>${r.notes?`<h3>Reason & Notes</h3><p class="booking-notes">${esc(r.notes)}</p>`:''}`;
    $('#detailPayment').hidden=true;$('#detailContract').hidden=true;
    if(BETA)BetaUI.details(r);
    $('#detailDialog').showModal();
    return;
  }
  $('#detailTitle').textContent=r.client;
  const history=[...(r.openingPaid?[{amount:r.openingPaid,date:r.openingDate,method:r.imported?'Historical payments (combined)':r.openingMethod||'Initial payment',note:r.imported?'Imported as a total. Individual payment dates and methods were not available.':'Initial payment at booking'}]:[]),...r.payments];
  $('#detailContent').innerHTML=`<p class="modal-sub">${esc(typeLabel(r.type))} · ${dateLabel(r.date)} · #${esc(r.contract)}</p>${r.phone?`<p><a class="phone-link" href="tel:${esc(r.phone.replace(/[^+\d]/g,''))}">Call ${esc(r.phone)}</a></p>`:''}<div class="payment-summary"><span>Agreed price<b>${r.total==null?'Not entered':money(r.total)}</b></span><span>Paid<b>${money(r.paid)}</b></span><span>Still due<b${r.cancelled&&!BETA||eventCharge(r)==null?' class="summary-text"':''}>${r.cancelled&&!BETA?'Cancelled':eventCharge(r)==null?(BETA?'Review charge':'Review price'):money(balance(r))}</b></span></div>${r.total==null?`<p class="review-note">The agreed price was blank in the original ledger. Payments are preserved, but the balance and any credit are unknown. Confirm the contract, cancellation, and deposit status, then use Manage booking to reconcile the imported balance.</p>`:review(r)&&!(r.cancelled&&!r.imported)?`<p class="review-note">Imported balance needs review. ${r.sheetBalance == null ? 'The original listed balance was missing.' : 'The source listed '+money(r.sheetBalance)+'; the difference from the original cost minus paid is '+money(r.importedDifference)+'.'} New payments do not clear this flag.</p>`:''}${r.total!=null&&r.paid>r.total?`<p class="review-note">Overpayment: ${money(Math.round((r.paid-r.total)*100)/100)}. Check the refundable security deposit.</p>`:''}<dl class="booking-facts"><dt>Balance due</dt><dd>${r.due?dateLabel(r.due):'No due date set'}</dd><dt>Included extras</dt><dd>${(Ledger.extrasList?Ledger.extrasList(r):[r.covers?'Covers+':'',r.projector?'Projector':'',(r.audio||r.sound)?'Audio':'',r.bar?'Bar':'',r.security?'Security':''].filter(Boolean)).join(', ')||'None recorded'}</dd><dt>Security deposit status</dt><dd>${esc(r.deposit||'Unknown')}</dd></dl>${r.notes?`<h3>Notes</h3><p class="booking-notes">${esc(r.notes)}</p>`:''}<h3>Payment history</h3><div class="payment-history">${history.length?history.map(p=>`<div><span><b>${esc(p.method||'Not recorded')}</b><small>${p.date?dateLabel(p.date):'Date not available'}</small>${p.note?`<small>${esc(p.note)}</small>`:''}</span><strong>${money(p.amount)}</strong></div>`).join(''):'<p class="empty-copy">No payments recorded yet.</p>'}</div>`;
  if(r.cancelled)$('#detailContent').insertAdjacentHTML('afterbegin',`<p class="review-note"><b>Cancelled</b> · ${esc(r.cancelledAt?.slice(0,10)||'')}<br>This booking no longer reserves the date. Booking and payment history are preserved. Refunds and any cancellation charges must be reconciled separately.</p>`);
  $('#detailContract').hidden=!LIVE||!!r.cancelled;$('#detailPayment').hidden=!!r.cancelled||balance(r)===0;if(BETA)BetaUI.details(r);$('#detailDialog').showModal();if(BETA&&LIVE)showSavedDocuments(id);
}
function openCancelBooking() {
  const r=records.find(x=>x.id===detailId);if(busy||!r||r.cancelled||r.type==='Blackout'||needsSignIn())return;
  if(BETA){betaCancelRequest=uuid();$('#cancelBookingForm').reset();}
  $('#cancelBookingGuest').textContent=`${r.client} · ${dateLabel(r.date)} · #${r.contract}`;
  formError('#cancelBookingError','');$('#detailDialog').close();$('#cancelBookingDialog').showModal();
}
async function confirmCancelBooking(event) {
  event.preventDefault();if(busy)return;
  const form=event.target,r=records.find(x=>x.id===detailId);if(!r)return;
  busy=true;[...form.querySelectorAll('button')].forEach(b=>b.disabled=true);formError('#cancelBookingError','');
  try {
    const updated=(LIVE||BETA)?(await rpc('cancelBooking',r.id,...(BETA?[$('#cancelBookingForm').elements.reason.value,betaCancelRequest]:[]))).record:{...r,cancelled:true,cancelledAt:new Date().toISOString(),cancelledBy:'Demo user'};
    const next=records.map(x=>x.id===r.id?normalize(updated):x);
    if(!LIVE&&!BETA)deviceSave(next);records=next;dirty=false;$('#cancelBookingDialog').close();render();
    toast('Booking cancelled. The date is available unless another booking reserves it.');openDetails(r.id);
  }catch(error){formError('#cancelBookingError',error.message+' Retry if the connection was interrupted; the booking will only be cancelled once.');}
  finally{busy=false;[...form.querySelectorAll('button')].forEach(b=>b.disabled=false);}
}
function renderPicker() {
  const q=$('#paymentSearch').value.toLowerCase().trim(), choices=(BETA?records:activeRecords()).filter(r=>balance(r)>0&&[r.client,r.contract,r.phone].join(' ').toLowerCase().includes(q)).sort((a,b)=>a.date.localeCompare(b.date));
  $('#paymentChoices').innerHTML=choices.slice(0,30).map(r=>`<button class="payment-choice" data-choose="${esc(r.id)}"><span><b>${esc(r.client)}</b><small>${esc(typeLabel(r.type))} · ${dateLabel(r.date)} · #${esc(r.contract)}</small></span><span><strong>${r.total==null?'Review price':money(balance(r))}</strong><small>remaining ${ICONS.chevronRight}</small></span></button>`).join('')||'<p class="empty-copy">No matching bookings with a balance due.</p>';
  if(choices.length>30)$('#paymentChoices').innerHTML+='<p class="empty-copy">Showing 30 matches. Search for a name, phone, or contract to narrow the list.</p>';
  $$('[data-choose]').forEach(b=>b.onclick=()=>{$('#pickerDialog').close();openPayment(b.dataset.choose)});
}
let contractSaveRequest = null;
let contractId = null, contractPdf = null, contractUrl = null, contractInitialChanged = false;
function contractDeadline(date) { const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-14);return d.toISOString().slice(0,10); }
function clearContractPdf() {
  contractPdf=null;
  if(contractUrl){URL.revokeObjectURL(contractUrl);contractUrl=null;}
}
function contractSchedule() {
  const r=records.find(x=>x.id===contractId);if(!r)return;
  const f=$('#contractForm').elements, total=r.total==null?Number(f.missingPrice.value):r.total;
  if(!contractInitialChanged)f.initial.value=r.total==null&&!f.missingPrice.value?'':(Math.round(total*100/2)/100).toFixed(2);
  const remaining=Math.round((total-Number(f.initial.value))*100)/100;
  $('#contractSchedule').textContent=`Remaining scheduled amount: ${Number.isFinite(remaining)&&remaining>=0?money(remaining):'Review amounts'}. Due ${dateLabel(contractDeadline(r.date))}. This is the contract schedule, not the unpaid ledger balance.`;
}
function openContract() {
  const r=records.find(x=>x.id===detailId);if(!LIVE||!r||r.cancelled||r.type==='Blackout'||needsSignIn())return;
  contractSaveRequest='contract-'+crypto.randomUUID();contractId=r.id;clearContractPdf();contractInitialChanged=false;dirty=false;
  const form=$('#contractForm');form.reset();form.elements.phone.value=r.phone.slice(0,40);
  $('#contractGuest').textContent=`${r.client} · ${dateLabel(r.date)} · #${r.contract}`;
  $('#contractSummary').innerHTML=`<span>Agreed price<b>${r.total==null?'Not entered':money(r.total)}</b></span><span>Recorded payments<b>${money(r.paid)}</b></span><span>Selected extras<b>${esc(Ledger.extrasList(r).join(', ')||'None')}</b></span>`;
  $('#contractPriceLabel').hidden=r.total!=null;$('#contractPriceNote').hidden=r.total!=null;form.elements.missingPrice.required=r.total==null;
  $('#contractSecurityLabel').hidden=!r.security;form.elements.securityHours.required=r.security;
  $('#contractConfirmLabel').hidden=contractDeadline(r.date)>=today();
  $('#contractInputs').hidden=false;$('#contractFile').hidden=true;$('#contractShare').hidden=true;$('#contractCreate').hidden=false;$('#contractCreate').textContent='Create PDF';$('#contractCancel').textContent='Cancel';
  formError('#contractError','');contractSchedule();$('#detailDialog').close();$('#contractDialog').showModal();form.elements.start.focus();
}
function contractInput(event) {dirty=true;formError('#contractError','');if(event.target.name==='initial')contractInitialChanged=true;contractSchedule();}
async function createContractPdf(event) {
  event.preventDefault();if(busy)return;const form=event.target;formError('#contractError','');
  try {
    const r=records.find(x=>x.id===contractId);if(!r)throw Error('Choose a booking.');
    const f=form.elements, values=Object.fromEntries(new FormData(form));
    values.confirmSchedule=f.confirmSchedule.checked;
    if(!f.start.value||!f.end.value||f.start.value===f.end.value)throw Error('Enter different rental start and end times.');
    const total=r.total==null?Ledger.cents(f.missingPrice.value):Ledger.cents(r.total), initial=Ledger.cents(f.initial.value);
    if(initial>total)throw Error('The initial amount cannot exceed the agreed price.');
    if(r.security&&(!/^\d{1,2}(\.\d{1,2})?$/.test(f.securityHours.value)||Number(f.securityHours.value)<=0||Number(f.securityHours.value)>24))throw Error('Enter security hours between 0 and 24.');
    if(contractDeadline(r.date)<today()&&!values.confirmSchedule)throw Error('Confirm the payment schedule for this event.');
    setBusy(true,form);let busyNote=$('#contractBusyNote');if(!busyNote){busyNote=document.createElement('p');busyNote.id='contractBusyNote';busyNote.setAttribute('role','status');$('#contractCreate').closest('.modal-actions').before(busyNote);}busyNote.textContent='This may take 30 seconds.';busyNote.hidden=false;$('#contractCreate').textContent=(BETA&&LIVE)?'Creating and saving…':'Creating…';
    const inputs=[...form.querySelectorAll('input,select,textarea')];inputs.forEach(e=>e.disabled=true);
    let result;
    try {result=await rpc('createContract',contractId,values,...(BETA&&LIVE?[{requestId:contractSaveRequest,expectedRevision:r.revision}]:[]));} finally {inputs.forEach(e=>e.disabled=false);}
    if(!result||typeof result.base64!=='string'||result.base64.length>20000000||typeof result.filename!=='string')throw Error('The PDF could not be opened. Try again.');
    const bytes=Uint8Array.from(atob(result.base64),c=>c.charCodeAt(0));
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('The PDF could not be opened. Try again.');
    if(result.saveError)formError('#contractError',result.saveError);
    clearContractPdf();contractPdf=new File([bytes],result.filename,{type:'application/pdf'});
    $('#contractInputs').hidden=true;$('#contractFile').textContent=result.filename;$('#contractFile').hidden=false;$('#contractCreate').hidden=true;$('#contractShare').hidden=false;$('#contractCancel').textContent='Done';dirty=false;
  }catch(error){formError('#contractError',error.message);}
  finally{if($('#contractBusyNote'))$('#contractBusyNote').hidden=true;setBusy(false,form);$('#contractCreate').textContent='Create PDF';}
}
async function shareContractPdf() {
  if(!contractPdf||busy)return;formError('#contractError','');
  try {
    if(navigator.canShare?.({files:[contractPdf]})) {
      await navigator.share({files:[contractPdf]});
    } else {
      if(contractUrl)URL.revokeObjectURL(contractUrl);
      contractUrl=URL.createObjectURL(contractPdf);
      const a=document.createElement('a');a.href=contractUrl;a.download=contractPdf.name;document.body.append(a);a.click();a.remove();
      const url=contractUrl;setTimeout(()=>{URL.revokeObjectURL(url);if(contractUrl===url)contractUrl=null;},60000);
      if(window.top!==window.self)formError('#contractError','If the embedded page blocks the download, open ledger.oryaneventcenter.com to prepare and save the PDF.');
    }
  }catch(error){if(error.name!=='AbortError')formError('#contractError','Could not share or save the PDF. Try again, or open ledger.oryaneventcenter.com if this page is embedded.');}
}

function openPicker() {if(!ready||needsSignIn())return;$('#paymentSearch').value='';renderPicker();$('#pickerDialog').showModal();$('#paymentSearch').focus();}
// In-app replacement for the browser's confirm(). Keeping what's there is the default; Esc counts as no.
function askConfirm({title,message,yes,no}) {
  const d=$('#confirmDialog');if(d.open)return Promise.resolve(false);
  $('#confirmTitle').textContent=title;$('#confirmMessage').textContent=message;$('#confirmYes').textContent=yes;$('#confirmNo').textContent=no;
  d.returnValue='no';
  return new Promise(resolve=>{d.addEventListener('close',()=>resolve(d.returnValue==='yes'),{once:true});d.showModal();$('#confirmNo').focus();});
}
const askDiscard=()=>askConfirm({title:'Discard your changes?',message:'What you entered in this form won’t be saved.',yes:'Discard changes',no:'Keep editing'});
async function closeDialog(dialog) {if(busy)return;if(dirty&&['bookingDialog','paymentDialog','blackoutDialog','contractDialog'].includes(dialog.id)&&!await askDiscard())return;dialog.close();dirty=false;}
function showStep(n) {
  step=n; $$('[data-step]').forEach(e=>e.hidden=+e.dataset.step!==n);$('#stepOne').classList.toggle('current',n===1);$('#stepTwo').classList.toggle('current',n===2);
  $('#bookingNext').hidden=n!==1;$('#bookingSave').hidden=n!==2;$('#bookingBack').innerHTML=n===1?'Cancel':`${ICONS.chevronLeft} Back`;formError('#bookingError','');
  if(n===2){const f=new FormData($('#bookingForm'));$('#bookingReview').textContent=`${f.get('client')} · ${f.get('type')} · ${dateLabel(f.get('date'))}`;$('#bookingForm').elements.total.focus();}
  $('#bookingDialog').scrollTop=0;
}
let priceManual=false;
function priceText(form,apply,kept) {
  let q;try{q=Ledger.pricing(form.elements.date.value,Object.fromEntries(new FormData(form)));}catch{return '';}
  if(q&&apply)form.elements.total.value=(q.totalCents/100).toFixed(2);
  return (q?(apply?'Calculated: ':'Suggested: ')+q.parts.map(p=>p.label+' '+money(p.cents/100)).join(' + '):'Choose an event date for a calculated price.')+(kept?' · Your typed price is kept.':'')+' Bar is free. Security is $30/hour, separate.';
}
function bookingPrice() {const form=$('#bookingForm'),text=priceText(form,!priceManual,priceManual);if(text)$('#priceNote').textContent=text;}
// Edits only suggest a price: an existing booking's agreed total changes only if someone asks.
function editPrice(form) {
  form.elements.total.closest('label').insertAdjacentHTML('afterend','<p class="form-note wide" id="editPriceNote" aria-live="polite"></p><button class="quiet wide" type="button" id="editPriceUse">Use calculated price</button>');
  const update=apply=>{const text=priceText(form,apply,false);if(text)$('#editPriceNote').textContent=text;};
  form.addEventListener('input',()=>{if($('#editPriceNote'))update(false);});update(false);
  $('#editPriceUse').onclick=()=>{update(true);dirty=true;};
}
function openBooking(presetDate) {
  if(!ready||needsSignIn())return;$('#bookingForm').reset();priceManual=false;$('#bookingNext').disabled=false;$('#bookingSave').disabled=false;bookingRequest=uuid();dirty=false;formError('#bookingError','');$('#conflict').textContent='';$('#liveBalance').textContent='$0';
  if(typeof presetDate==='string'&&presetDate){$('#bookingForm').elements.date.value=presetDate;bookingInput();}
  bookingPrice();$('#bookingForm').elements.paymentDate.value=today();$$('[data-initial-payment]').forEach(e=>e.hidden=true);$('#bookingDialog').showModal();showStep(1);
}
function bookingInput(event) {
  if(event?.target?.name==='total')priceManual=true;bookingPrice();
  dirty=true;const f=new FormData($('#bookingForm')),net=Number(f.get('total'))-Number(f.get('paid'));$('#liveBalance').textContent=money(net);
  $$('[data-initial-payment]').forEach(e=>e.hidden=Number(f.get('paid'))<=0);
  const collisions=activeRecords().filter(r=>r.date===f.get('date')).length;
  const isBlackout=activeRecords().some(r=>r.date===f.get('date')&&r.type==='Blackout');
  $('#conflict').textContent=collisions?isBlackout?'Date unavailable: this day has been blocked. Choose another date.':`Already booked: ${collisions} booking(s) on this date. Choose another date; each booking reserves the whole date.`:'';
  $('#bookingNext').disabled=collisions>0||busy;$('#bookingSave').disabled=collisions>0||busy;
}
function advanceBooking() {
  if(activeRecords().some(r=>r.date===$('#bookingForm').elements.date.value)){formError('#bookingError','This date is already booked. Choose another date.');return;}
  for(const el of $('#bookingForm').querySelector('[data-step="1"]').querySelectorAll('input,select'))if(!el.reportValidity())return;
  if(!$('#bookingForm').elements.client.value.trim()){formError('#bookingError','Enter the guest’s name.');return;}
  showStep(2);
}
function bookingPayload() {
  const f=new FormData($('#bookingForm'));
  return Object.fromEntries([...f.entries()].map(([k,v])=>[k,['covers','projector','audio','bar','sound','security'].includes(k)?true:v]));
}
async function saveBooking(e) {
  e.preventDefault();if(busy)return;if(step===1){advanceBooking();return;}
  const form=e.target;formError('#bookingError','');
  try {
    const clean=Ledger.booking(bookingPayload());setBusy(true,form);
    let record;
    if(LIVE||BETA){record=(await rpc('createBooking',clean,bookingRequest)).record;}
    else {
      if(activeRecords().some(r=>r.date===clean.date))throw Error('This date is already booked. Choose another date.');
      if(clean.contract&&records.some(r=>r.contract.toLowerCase()===clean.contract.toLowerCase()))throw Error('That contract number is already in the ledger.');
      record={...clean,id:uuid(),contract:clean.contract||'O-'+bookingRequest.slice(0,8).toUpperCase(),openingPaid:clean.paid,openingDate:clean.paymentDate,openingMethod:clean.method,sheetBalance:null,importedDifference:0,imported:false,createdAt:new Date().toISOString(),payments:[]};
      deviceSave([...records,record]);
    }
    records.push(normalize(record));dirty=false;$('#bookingDialog').close();updateYears();scope='all';syncScope();setView('bookings',false);$('#search').value=record.contract;renderTable();$('.ledger').scrollIntoView({behavior:'smooth'});
    toast(LIVE?'Booking saved to Google Sheets.':'Booking saved in this demo.');
  } catch(error){formError('#bookingError',error.message+(LIVE?' If a save was interrupted, retry with the same details to avoid duplicates.':''));}
  finally{setBusy(false,form);}
}
function openPayment(id) {
  const r=records.find(x=>x.id===id);if(!r||(!BETA&&r.cancelled)||balance(r)<=0||needsSignIn())return;paymentId=id;paymentRequest=uuid();dirty=false;
  $('#paymentForm').reset();$('#paymentForm').elements.date.value=today();formError('#paymentError','');
  $('#paymentGuest').textContent=`${r.client} · ${typeLabel(r.type)} · ${dateLabel(r.date)} · #${r.contract}`;
  $('#paymentSummary').innerHTML=`<span>Agreed price<b>${(BETA?r.financialTotal:r.total)==null?'Not entered':money((BETA?r.financialTotal:r.total))}</b></span><span>Already paid<b>${money(r.paid)}</b></span><span>Still due<b>${(BETA?r.financialTotal:r.total)==null?'Review price':money(balance(r))}</b></span>`;
  $('#afterPayment').textContent=money(balance(r));$('#paymentDialog').showModal();$('#paymentForm').elements.amount.focus();
}
async function savePayment(e) {
  e.preventDefault();if(busy)return;const form=e.target;formError('#paymentError','');
  try{
    const r=records.find(x=>x.id===paymentId),clean=Ledger.payment(Object.fromEntries(new FormData(form)),r);setBusy(true,form);
    let updated;
    if(LIVE||BETA){updated=(await rpc('recordPayment',{...clean,bookingId:r.id},paymentRequest)).record;}
    else{updated={...r,paid:Math.round((r.paid+clean.amount)*100)/100,payments:[...r.payments,{...clean,id:uuid(),createdAt:new Date().toISOString()}]};deviceSave(records.map(x=>x.id===r.id?updated:x));}
    records=records.map(x=>x.id===paymentId?normalize(updated):x);dirty=false;$('#paymentDialog').close();render();toast(`${money(clean.amount)} payment saved${LIVE?' to Google Sheets':''}.`);
    openDetails(updated.id);
  }catch(error){formError('#paymentError',error.message+(LIVE?' Retry an interrupted save with the same details; it will not be added twice.':''));}
  finally{setBusy(false,form);}
}
function openBlackout(presetDate) {
  if(!ready||needsSignIn())return;
  $('#blackoutForm').reset();
  blackoutRequest = uuid();
  dirty = false;
  formError('#blackoutError', '');
  $('#blackoutConflict').textContent = '';
  $('#blackoutSave').disabled = false;
  if (typeof presetDate === 'string' && presetDate) {
    $('#blackoutForm').elements.date.value = presetDate;
  } else if (selectedDate) {
    $('#blackoutForm').elements.date.value = selectedDate;
  } else {
    $('#blackoutForm').elements.date.value = today();
  }
  blackoutInput();
  $('#blackoutDialog').showModal();
  $('#blackoutForm').elements.blockedBy.focus();
}
function blackoutInput() {
  dirty = true;
  const f = new FormData($('#blackoutForm')), dateVal = f.get('date');
  const existing = dateVal ? records.find(r => r.date === dateVal) : null;
  if (existing) {
    $('#blackoutConflict').textContent = existing.type === 'Blackout' ? `Already blocked by ${existing.client} on this date.` : `Already booked by ${existing.client} on this date. Choose an unbooked date.`;
    $('#blackoutSave').disabled = true;
  } else {
    $('#blackoutConflict').textContent = '';
    $('#blackoutSave').disabled = false;
  }
}
async function saveBlackout(e) {
  e.preventDefault();
  if (busy) return;
  const form = e.target;
  formError('#blackoutError', '');
  const f = new FormData(form);
  const blockedBy = f.get('blockedBy') ? f.get('blockedBy').trim() : '';
  const dateVal = f.get('date');
  const reason = f.get('reason');
  const notes = f.get('notes') ? f.get('notes').trim() : '';
  if (!blockedBy) { formError('#blackoutError', 'Enter the name of the person blocking this date.'); return; }
  if (!dateVal) { formError('#blackoutError', 'Select a date to block.'); return; }
  if (activeRecords().some(r => r.date === dateVal)) { formError('#blackoutError', 'This date is already booked or blocked. Choose another date.'); return; }
  const combinedNotes = [reason ? `Reason: ${reason}` : '', notes].filter(Boolean).join('\n');
  const payload = {
    client: blockedBy, date: dateVal, type: 'Blackout', total: 0, paid: 0,
    contract: 'BLK-' + (blackoutRequest ? blackoutRequest.slice(0, 8).toUpperCase() : uuid().slice(0, 8).toUpperCase()),
    notes: combinedNotes, phone: '', deposit: 'Unknown', due: '', covers: false, projector: false, audio: false, bar: false, sound: false, security: false
  };
  try {
    const clean = Ledger.booking(payload);
    setBusy(true, form);
    let record;
    if (LIVE||BETA) {
      record = (await rpc('createBooking', clean, blackoutRequest)).record;
    } else {
      if (activeRecords().some(r => r.date === clean.date)) throw Error('This date is already booked or blocked. Choose another date.');
      record = {
        ...clean, id: uuid(), openingPaid: 0, openingDate: '', openingMethod: '',
        sheetBalance: null, importedDifference: 0, imported: false, createdAt: new Date().toISOString(), payments: []
      };
      deviceSave([...records, record]);
    }
    records.push(normalize(record));
    dirty = false;
    $('#blackoutDialog').close();
    updateYears();
    selectedDate = clean.date;
    calYear = parseInt(clean.date.slice(0, 4), 10);
    calMonth = parseInt(clean.date.slice(5, 7), 10) - 1;
    if (view === 'calendar') {
      renderCalendar();
    } else {
      setView('calendar', false);
    }
    toast(`Date ${dateLabel(clean.date)} blocked by ${clean.client}.`);
  } catch (error) {
    formError('#blackoutError', error.message + (LIVE ? ' If a save was interrupted, retry with the same details to avoid duplicates.' : ''));
  } finally {
    setBusy(false, form);
  }
}
function exportCsv() {
  const header=['Contract','Client','Event type','Event date','Total','Paid','Calculated balance','Original listed balance','Deposit status','Due date','Booking status'];
  const safe=v=>'"'+String(v??'').replace(/^[\s]*[=+@\-]/,"'$&").replace(/"/g,'""')+'"';
  const csv=[header,...filtered().map(r=>[r.contract,r.client,typeLabel(r.type),r.date,r.total,r.paid,r.cancelled||r.total==null?'':balance(r),r.sheetBalance,r.deposit,r.due,r.cancelled?'Cancelled':'Active'])].map(row=>row.map(safe).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='oryan-ledger.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#all').onclick=()=>setScope('all');$('#yearButton').onclick=()=>setScope('year');$('#year').onchange=()=>setScope('year');
['#search','#status','#dateRange','#sort'].forEach(s=>$(s).addEventListener(s==='#search'?'input':'change',()=>{page=0;renderTable()}));
$('#prev').onclick=()=>{page--;renderTable()};$('#next').onclick=()=>{page++;renderTable()};$('#newBooking').onclick=openBooking;$('#mobileAdd').onclick=openBooking;
$('#quickPayment').onclick=openPicker;$('#quickUpcoming').onclick=showUpcoming;$('#refresh').onclick=load;$('#retryLoad').onclick=load;
$('#calPrevMonth').onclick=prevMonth;$('#calNextMonth').onclick=nextMonth;$('#calToday').onclick=jumpToday;$('#calNextEvent').onclick=jumpNextEvent;if($('#calNextEventBottom'))$('#calNextEventBottom').onclick=jumpNextEvent;if($('#calToggleAgenda'))$('#calToggleAgenda').onclick=toggleCalendarAgenda;
$('#bookingForm').noValidate=true;$('#bookingForm').oninput=bookingInput;$('#priceUse').onclick=()=>{priceManual=false;bookingInput();};$('#bookingNext').onclick=advanceBooking;$('#bookingBack').onclick=()=>step===1?closeDialog($('#bookingDialog')):showStep(1);$('#bookingForm').onsubmit=saveBooking;
if($('#blackoutForm')){$('#blackoutForm').noValidate=true;$('#blackoutForm').oninput=blackoutInput;$('#blackoutForm').onsubmit=saveBlackout;}
if($('#blackoutCancel'))$('#blackoutCancel').onclick=()=>closeDialog($('#blackoutDialog'));
$('#paymentForm').onsubmit=savePayment;$('#paymentSearch').oninput=renderPicker;
$('#paymentForm').oninput=()=>{dirty=true;const r=records.find(x=>x.id===paymentId),amount=Number($('#paymentForm').elements.amount.value);$('#afterPayment').textContent=money(Math.round((balance(r)-amount)*100)/100);};
$('#payRemaining').onclick=()=>{const r=records.find(x=>x.id===paymentId);$('#paymentForm').elements.amount.value=balance(r).toFixed(2);$('#paymentForm').dispatchEvent(new Event('input'));};
$('#detailCancelBooking').onclick=openCancelBooking;$('#cancelBookingForm').onsubmit=confirmCancelBooking;$('#cancelBookingBack').onclick=()=>{$('#cancelBookingDialog').close();openDetails(detailId);};
$('#detailContract').onclick=openContract;$('#contractForm').oninput=contractInput;$('#contractForm').onsubmit=createContractPdf;$('#contractCancel').onclick=()=>closeDialog($('#contractDialog'));$('#contractShare').onclick=shareContractPdf;$('#contractDialog').addEventListener('close',()=>{clearContractPdf();$('#contractForm').reset();contractId=null;});
$('#detailClose').onclick=()=>$('#detailDialog').close();$('#detailPayment').onclick=()=>{$('#detailDialog').close();openPayment(detailId)};
$$('.close').forEach(b=>b.onclick=()=>closeDialog(b.closest('dialog')));
$$('dialog:not(#confirmDialog)').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();closeDialog(d)}));
$('#accountButton').onclick=openAccount;$('#accountChip').onclick=openAccount;$('#accountDone').onclick=()=>$('#accountDialog').close();$('#signOut').onclick=signOut;renderAccount();
$('#export').onclick=exportCsv;$('#reset').onclick=async()=>{if(!await askConfirm({title:'Reset this demo?',message:'Changes made in this demo will be removed. Your Google Sheet is unchanged.',yes:'Reset demo',no:'Keep changes'}))return;try{deviceSave(structuredClone(SEED).map(normalize));load();toast('Anonymous demo restored.');}catch(e){toast(e.message)}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
setView('overview',false);
const signInProblem=captureToken();
if(signInProblem){$('#loadError').hidden=false;$('#loadError p').textContent=signInProblem;$('#retryLoad').textContent='Sign in with Google';$('#retryLoad').onclick=()=>signIn();}else load();

async function showSavedDocuments(id){
  const section=document.createElement('section');section.innerHTML='<h3>Saved copies</h3><p role="status">Loading saved copies…</p>';$('#detailContent').append(section);
  try{
    const rows=await rpc('listSavedDocuments',id);if(detailId!==id||!section.isConnected)return;if(rows.unavailable){section.innerHTML="<h3>Saved copies</h3><p>Saved copies aren't available yet.</p>";return;}
    section.innerHTML='<h3>Saved copies</h3><p class="form-note">Receipts save after money is recorded. Pending copies can be retried by the original saver.</p>';
    if(!rows.length)section.insertAdjacentHTML('beforeend','<p>No saved copies yet.</p>');
    for(const row of rows){const line=document.createElement('p'),button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=row.pending?'Retry save':'Open PDF';line.textContent=row.documentType+' · '+row.createdAt.slice(0,10)+(row.attention?' · Receipt needs attention ':row.pending?' · Saving pending ':' · Saved ');line.append(button);section.append(line);
      button.onclick=async()=>{button.disabled=true;button.textContent=row.pending?'Saving… This may take 30 seconds.':'Opening…';try{const pdf=await rpc(row.pending?'retrySavedDocument':'getSavedDocument',id,row.requestId);if(pdf.unavailable||pdf.complete){button.textContent=pdf.complete?'Saved — reopen booking':"Saved copies aren't available yet.";return;}const bytes=Uint8Array.from(atob(pdf.base64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=pdf.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);section.remove();showSavedDocuments(id);}catch(_){button.textContent='Save unavailable — retry';button.disabled=false;}};
    }
  }catch(_){section.innerHTML='<h3>Saved copies</h3><p>Saved copies unavailable. Reopen this booking to retry. Payments remain recorded.</p>';}
}
