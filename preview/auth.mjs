// Browser sign-in state for the v2 ledger (Stage 4). Google Identity Services (GIS) supplies a short-lived
// ID token; this module keeps it IN MEMORY ONLY (never localStorage, never a URL, never logged), checks the
// nonce it asked for, renews it silently before expiry and forgets it on sign-out. The Worker is the only
// authority: it verifies the signature and the allowlist on every request. Nothing here grants access.
// Only the account email (not a credential) is kept in sessionStorage so a reload can try a silent sign-in.

export class AuthRequired extends Error {
  constructor(code = 'signed_out') { super('Sign-in required'); this.name = 'AuthRequired'; this.code = code; }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const MARKER = 'oryan.session.email';

// Decode (NOT verify) a JWT payload for display/expiry/nonce sanity only.
export function decodeJwtPayload(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const json = decodeURIComponent([...atob(b64)].map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    const value = JSON.parse(json);
    return value && typeof value === 'object' ? value : null;
  } catch { return null; }
}

export function loadGoogleIdentity({ doc = document, timeoutMs = 10000 } = {}) {
  if (globalThis.google?.accounts?.id) return Promise.resolve(globalThis.google.accounts.id);
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = GIS_SRC; script.async = true; script.defer = true;
    const timer = setTimeout(() => reject(new Error('gis_timeout')), timeoutMs);
    script.onload = () => { clearTimeout(timer); globalThis.google?.accounts?.id ? resolve(globalThis.google.accounts.id) : reject(new Error('gis_missing')); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('gis_blocked')); };
    doc.head.append(script);
  });
}

function randomNonce(cryptoApi = globalThis.crypto) {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {object} options
 * @param {string} options.clientId  Google OAuth client ID (public value).
 * @param {() => Promise<object>} [options.loadGis]  Returns google.accounts.id (injectable for tests).
 * @param {Storage|null} [options.session]  sessionStorage (only the email marker is stored).
 * @param {() => number} [options.now]  Seconds since epoch.
 * @param {number} [options.renewBeforeSec]  Silent renewal lead time.
 * @param {number} [options.silentTimeoutMs]
 * @param {(state:string, info:object)=>void} [options.onState]
 */
export function createAuth({
  clientId, loadGis = () => loadGoogleIdentity(), session = safeSession(), now = () => Date.now() / 1000,
  renewBeforeSec = 600, silentTimeoutMs = 8000, onState = () => {}, setTimer = setTimeout, clearTimer = clearTimeout, cryptoApi = globalThis.crypto
} = {}) {
  if (!clientId) throw new Error('A Google client ID is required.');
  let gis = null, token = null, exp = 0, email = '', nonce = '', state = 'signed-out', renewTimer = null, silent = null;
  const waiters = new Set();

  const marker = {
    read() { try { return session?.getItem(MARKER) || ''; } catch { return ''; } },
    write(value) { try { session?.setItem(MARKER, value); } catch {} },
    clear() { try { session?.removeItem(MARKER); } catch {} }
  };

  function setState(next, info = {}) { state = next; onState(next, { email, ...info }); }
  const valid = (margin = 30) => Boolean(token) && exp - margin > now();

  function prepare(autoSelect = false) {
    nonce = randomNonce(cryptoApi);
    gis.initialize({ client_id: clientId, callback: handleCredential, nonce, auto_select: autoSelect, cancel_on_tap_outside: false, use_fedcm_for_prompt: true, itp_support: true });
  }

  function handleCredential(response) {
    const credential = response?.credential;
    const payload = credential ? decodeJwtPayload(credential) : null;
    // Sanity checks only (the Worker verifies everything): shape, audience, nonce we issued, unexpired.
    if (!payload || payload.aud !== clientId || !nonce || payload.nonce !== nonce || !(payload.exp > now()) || typeof payload.email !== 'string') {
      silent?.reject(new AuthRequired('rejected')); silent = null;
      setState('rejected', { code: 'bad_credential' });
      return;
    }
    token = credential; exp = payload.exp; email = payload.email.trim().toLowerCase();
    marker.write(email);
    scheduleRenewal();
    setState('signed-in');
    silent?.resolve(token); silent = null;
    for (const resolve of [...waiters]) resolve(token);
    waiters.clear();
  }

  function scheduleRenewal() {
    clearTimer(renewTimer);
    const delayMs = Math.max(0, (exp - renewBeforeSec - now()) * 1000);
    renewTimer = setTimer(() => { refresh().catch(() => {}); }, Math.min(delayMs, 2 ** 31 - 1));
  }

  function forget() { token = null; exp = 0; clearTimer(renewTimer); renewTimer = null; }

  async function ready() { if (!gis) gis = await loadGis(); return gis; }

  /** Silent renewal/auto sign-in through GIS prompt(); resolves with a token or rejects with AuthRequired. */
  async function refresh() {
    await ready();
    if (silent) return silent.promise;
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    silent = { promise, resolve, reject };
    prepare(true);
    const timer = setTimer(() => { if (silent) { silent.reject(new AuthRequired('silent_failed')); silent = null; } }, silentTimeoutMs);
    gis.prompt(notification => {
      const skipped = notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.() || notification?.isDismissedMoment?.() && notification.getDismissedReason?.() !== 'credential_returned';
      if (skipped && silent) { silent.reject(new AuthRequired('silent_failed')); silent = null; }
    });
    return promise.finally(() => clearTimer(timer));
  }

  return {
    get state() { return state; },
    get email() { return email || marker.read(); },
    get token() { return valid() ? token : null; },
    get signedIn() { return valid(0); },
    /** Start: try a silent sign-in when this tab signed in before, otherwise show the signed-out screen. */
    async start() {
      try { await ready(); } catch { setState('trouble', { code: 'gis_unavailable' }); return state; }
      email = marker.read();
      if (!email) { setState('signed-out'); return state; }
      setState('checking');
      try { await refresh(); } catch { setState('expired'); }
      return state;
    },
    /** Draw Google's own button into an element (required for ID tokens). */
    async renderButton(element, options = {}) {
      await ready(); prepare(false);
      gis.renderButton(element, { type: 'standard', theme: options.theme || 'outline', size: 'large', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left', width: options.width || 320 });
    },
    /** A token the adapter can send now; waits for the user (overlay) when there is none. */
    async ensureToken() {
      if (valid()) return token;
      if (marker.read() || token) {
        try { return await refresh(); } catch { /* fall through to interactive sign-in */ }
      }
      forget();
      if (state !== 'not-allowed' && state !== 'rejected' && state !== 'trouble') setState(marker.read() ? 'expired' : 'signed-out');
      return new Promise(resolve => waiters.add(resolve));
    },
    /** The Worker rejected the token we sent. */
    reject(status, code) {
      if (status === 403) { forget(); setState('not-allowed', { code }); return; }
      if (code === 'jwks_unavailable' || code === 'unknown_key') { setState('trouble', { code }); return; }
      forget();
      if (code === 'expired' || code === 'missing_token') setState('expired', { code });
      else setState('rejected', { code });
    },
    trouble(code = 'network') { setState('trouble', { code }); },
    retrying() { setState(valid() ? 'signed-in' : state); },
    signOut() {
      forget(); marker.clear(); email = '';
      try { gis?.disableAutoSelect?.(); } catch {}
      silent?.reject(new AuthRequired('signed_out')); silent = null;
      waiters.clear();
      setState('signed-out');
    },
    refresh
  };
}

function safeSession() { try { return globalThis.sessionStorage || null; } catch { return null; } }
