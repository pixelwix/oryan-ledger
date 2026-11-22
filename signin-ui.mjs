// Sign-in screens (Stage 4), ported from the owner-approved design (agy, ~/Downloads/Oryan-V2/signin-design).
// The card sits in an overlay ABOVE the app (not instead of it), so a session that ends mid-form keeps the form's
// values in the page underneath; after signing in again the pending request is retried. Alternative A footer
// ("Signed in as ... Sign out") is added below the main content only while signed in. Text from sessions is set with
// textContent. The Google button is Google's own (renderButton), as required for ID tokens.

const CARD = {
  'signed-out': { title: 'O’Ryan Event Center', sub: 'Sign in to open the ledger', button: 'Sign in with Google' },
  checking: { title: 'O’Ryan Event Center' },
  expired: { title: 'Your session ended', sub: 'Sign in again to continue working in the ledger.', button: 'Sign in to continue', badge: 'warning' },
  'not-allowed': { title: 'Account Not Allowed', sub: 'This Google account is not on the ledger’s approved access list.', button: 'Sign in with a different account', badge: 'danger',
    hint: 'Need access to this ledger? Contact the venue owner to have your email address added to the approved roster.' },
  rejected: { title: 'Account verification required', sub: 'We couldn’t verify this account credentials with Google.', button: 'Sign in with another account',
    hint: 'If you continue to experience issues, contact the ledger administrator to verify that your email is authorized.' },
  trouble: { title: 'Trouble signing in', sub: 'We couldn’t reach the authentication service to verify your identity.' }
};
const LOCK = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const SIGN_OUT = '<svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;margin-right:4px;stroke:currentColor;" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountSignIn({ auth, assetBase = './', onRetry = () => {}, toast = () => {} }) {
  let overlay = null, lastFocus = null, cssLoaded = false;
  const logo = assetBase + 'assets/oryan-logo.png';

  function ensureCss() {
    if (cssLoaded) return; cssLoaded = true;
    const link = el('link', { rel: 'stylesheet', href: assetBase + 'signin.css?v=2.7.1', id: 'signinStyles' });
    document.head.append(link);
  }

  function header(spec) {
    const head = el('div', { class: 'signin-header', style: 'margin-bottom: var(--space-4);' });
    const brand = el('span', { class: 'signin-brand-link' });
    const img = el('img', { src: logo, alt: 'O’Ryan Event Center', class: 'signin-logo' });
    brand.append(img);
    const title = el('h1', { class: 'signin-title', id: 'signinTitle', tabindex: '-1' }, spec.title);
    head.append(brand, title);
    if (spec.sub) head.append(el('p', { class: 'signin-subtitle' }, spec.sub));
    return head;
  }
  const note = () => { const d = el('div', { class: 'signin-note' }); d.insertAdjacentHTML('beforeend', LOCK); d.append(el('span', {}, 'Only approved accounts can open this ledger')); return d; };

  function buttonBlock(label) {
    const wrap = el('div', { class: 'signin-actions-stack' });
    const holder = el('div', { class: 'signin-button-wrapper', id: 'gsiButton', 'aria-label': label });
    wrap.append(holder);
    return { wrap, holder };
  }

  function render(state, info = {}) {
    if (state === 'signed-in') { hide(); return; }
    ensureCss();
    const spec = CARD[state] || CARD['signed-out'];
    if (!overlay) {
      lastFocus = document.activeElement;
      overlay = el('div', { class: 'signin-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'signinTitle' });
      document.documentElement.append(overlay);
    }
    const layout = el('main', { class: 'signin-layout' }), container = el('div', { class: 'signin-container' }), card = el('div', { class: 'signin-card', 'aria-live': 'polite' });
    layout.append(container); container.append(card);
    card.append(header(spec));

    if (state === 'checking') {
      const box = el('div', { class: 'checking-container', 'aria-busy': 'true' });
      box.append(el('div', { class: 'checking-spinner', role: 'status', 'aria-label': 'Checking account credentials' }), el('p', { class: 'checking-text' }, 'Checking your account…'));
      card.append(box);
    } else if (state === 'trouble') {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const alert = el('div', { class: 'alert ' + (offline ? 'alert-warning' : 'alert-danger'), style: 'display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-4);margin-bottom:var(--space-5);' });
      alert.append(el('strong', {}, offline ? 'Offline Mode' : 'Authentication service temporarily unreachable'),
        el('p', { style: 'font-size:13px;margin:4px 0 0 0;line-height:1.45;' }, offline ? 'Your device is disconnected from the network. Signing in needs a connection.' : 'Google key verification service could not be reached. Please check your connection and retry.'));
      const row = el('div', { style: 'display:flex;justify-content:flex-end;' }), retry = el('button', { type: 'button', class: 'btn btn-quiet btn-sm', id: 'btnRetryCheck' }, 'Try again');
      retry.addEventListener('click', () => onRetry());
      row.append(retry); alert.append(row); card.append(alert);
    } else {
      if (state === 'expired') {
        const notice = el('div', { class: 'unsaved-form-notice', role: 'status' });
        const text = el('div', {}); text.append(el('strong', {}, 'Unsaved inputs preserved: '), document.createTextNode('Anything you were typing stays on your screen. Sign in again to retry your submission without retyping.'));
        notice.append(text); card.append(notice);
      }
      if (info.email && spec.badge) {
        const center = el('div', { style: 'text-align:center;' }), badge = el('div', { class: 'account-badge-box' });
        badge.append(el('span', { class: 'account-dot' + (spec.badge === 'warning' ? ' dot-warning' : ''), 'aria-hidden': 'true' }), el('span', {}, info.email));
        center.append(badge); card.append(center);
      }
      if (state === 'rejected') {
        const alert = el('div', { class: 'alert alert-warning', style: 'padding:var(--space-4);margin-bottom:var(--space-5);' });
        alert.append(el('strong', {}, 'Unverified account or invalid credential'), el('p', { style: 'font-size:13px;margin:4px 0 0 0;line-height:1.45;' }, 'Google accounts used with this ledger must have a verified primary email address. Please verify your address with Google or select another account.'));
        card.append(alert);
      }
      const { wrap, holder } = buttonBlock(spec.button);
      card.append(wrap);
      if (spec.hint) card.append(el('p', { class: 'signin-hint-text' }, spec.hint));
      queueMicrotask(() => drawButton(holder));
    }
    if (state !== 'trouble') card.append(note());
    overlay.replaceChildren(layout);
    syncInert();
    card.querySelector('#signinTitle')?.focus({ preventScroll: true });
  }

  async function drawButton(holder) {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia?.('(prefers-color-scheme: dark)').matches);
    try { await auth.renderButton(holder, { theme: dark ? 'filled_black' : 'outline', width: Math.min(320, Math.max(200, holder.clientWidth || 320)) }); }
    catch { auth.trouble('gis_unavailable'); }
  }

  function hide() {
    if (!overlay) return;
    overlay.remove(); overlay = null;
    document.body.inert = false;
    try { lastFocus?.focus?.({ preventScroll: true }); } catch {}
    lastFocus = null;
  }
  function syncInert() { if (document.body) document.body.inert = Boolean(overlay); }

  /** Alternative A: a quiet account line below the page content (below the fold; nothing above it moves). */
  function footer({ email, isOwner, version, notes }) {
    document.getElementById('accountControlFooter')?.remove();
    ensureCss();
    const bar = el('footer', { class: 'account-footer-bar', id: 'accountControlFooter' }), inner = el('div', { class: 'account-footer-inner' });
    const info = el('div', { class: 'account-footer-info' }), who = el('span', {});
    who.append(document.createTextNode('Signed in as '), el('strong', { class: 'account-footer-user' }, email));
    info.append(who);
    if (isOwner) info.append(el('span', { class: 'badge badge-settled', style: 'font-size:11px;padding:2px 6px;' }, 'Owner'));
    const actions = el('div', { class: 'account-footer-actions' }), out = el('button', { type: 'button', class: 'btn-signout-link', id: 'btnSignOut' });
    out.insertAdjacentHTML('beforeend', SIGN_OUT); out.append(document.createTextNode('Sign out'));
    out.addEventListener('click', async () => { out.disabled=true;try{await auth.signOut();location.reload();}catch{out.disabled=false;toast('Sign-out could not be confirmed. Reconnect and try again.');} });
    if(isOwner){const end=el('button',{type:'button',class:'btn-signout-link',id:'btnEndAllSessions'},'End all sessions');end.onclick=async()=>{if(!await confirmEndSessions(end))return;end.disabled=true;try{await auth.revokeAll();await auth.signOut();location.reload();}catch{end.disabled=false;toast('Unable to end sessions. Try again.');}};actions.append(end);}
    if (version && Array.isArray(notes) && notes.length) { const news = el('button', { type: 'button', class: 'btn-signout-link', id: 'btnWhatsNew' }, 'v' + version + ' \u00b7 What\u2019s new'); news.onclick = () => whatsNew(news, version, notes); actions.append(news); }
    actions.append(out); inner.append(info, actions); bar.append(inner);
    const main = document.querySelector('main'); (main?.parentNode || document.body).insertBefore(bar, main ? main.nextSibling : null);
  }

  return { render, hide, footer, syncInert, get visible() { return Boolean(overlay); } };
}

// Reuses locked v2 modal primitives for the owner session confirmation.
function confirmEndSessions(opener){
 return new Promise(resolve=>{
  const backdrop=el('div',{class:'modal-backdrop',id:'endSessionsConfirm'}),dialog=el('div',{class:'modal-dialog',role:'dialog','aria-modal':'true','aria-labelledby':'endSessionsTitle'});
  const header=el('div',{class:'modal-header'}),body=el('div',{class:'modal-body'}),actions=el('div',{class:'modal-actions'});
  header.append(el('h2',{class:'modal-title',id:'endSessionsTitle'},'End all sessions?'));
  body.append(el('p',{},'Everyone will need to sign in again on every device, including this one.'));
  const cancel=el('button',{type:'button',class:'btn btn-quiet'},'Cancel'),yes=el('button',{type:'button',class:'btn btn-primary',id:'confirmEndSessions'},'End all sessions');
  const finish=value=>{document.removeEventListener('keydown',key,true);backdrop.remove();opener.focus();resolve(value);};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(false);}if(e.key==='Tab'){e.preventDefault();(document.activeElement===cancel?yes:cancel).focus();}};
  cancel.onclick=()=>finish(false);yes.onclick=()=>finish(true);backdrop.onclick=e=>{e.stopPropagation();if(e.target===backdrop)finish(false);};
  actions.append(cancel,yes);body.append(actions);dialog.append(header,body);backdrop.append(dialog);document.body.append(backdrop);document.addEventListener('keydown',key,true);cancel.focus();
 });
}

// "What's new": the version history from v2/changelog.mjs in the same modal pieces as the session confirmation.
function whatsNew(opener,version,notes){
 const backdrop=el('div',{class:'modal-backdrop',id:'whatsNewDialog'}),dialog=el('div',{class:'modal-dialog',role:'dialog','aria-modal':'true','aria-labelledby':'whatsNewTitle'});
 const header=el('div',{class:'modal-header'}),body=el('div',{class:'modal-body whats-new-body'}),actions=el('div',{class:'modal-actions'});
 header.append(el('h2',{class:'modal-title',id:'whatsNewTitle'},'What\u2019s new \u00b7 v'+version));
 for(const entry of notes){const section=el('section',{class:'whats-new-entry'});section.append(el('h3',{},'v'+entry.version+' \u00b7 '+entry.title+' \u00b7 '+entry.date));const list=el('ul',{});for(const item of entry.items)list.append(el('li',{},item));section.append(list);body.append(section);}
 const close=el('button',{type:'button',class:'btn btn-primary',id:'whatsNewClose'},'Close');
 const finish=()=>{document.removeEventListener('keydown',key,true);backdrop.remove();opener.focus();};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish();}if(e.key==='Tab'){e.preventDefault();close.focus();}};
 close.onclick=finish;backdrop.onclick=e=>{e.stopPropagation();if(e.target===backdrop)finish();};
 actions.append(close);body.append(actions);dialog.append(header,body);backdrop.append(dialog);document.body.append(backdrop);document.addEventListener('keydown',key,true);close.focus();
}
