// Fixed 24-hour opaque Worker sessions. Google credentials are exchanged once and never persisted.
export class AuthRequired extends Error {
  constructor(code = 'signed_out') { super('Sign-in required'); this.name = 'AuthRequired'; this.code = code; }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
export const SESSION_KEY = 'oryan.session.v1';

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

/** Injectable clock/storage/transport/GIS make session behavior testable without Google.
 * Only opaque Worker sessions persist; all authorization remains server-side. */
export function createAuth({clientId, origin, fetcher=fetch, storage=safeStorage(), events=globalThis,
 loadGis=()=>loadGoogleIdentity(), now=()=>Date.now()/1000, onState=()=>{},
 setTimer=setTimeout, clearTimer=clearTimeout, cryptoApi=globalThis.crypto}={}) {
 if(!clientId)throw Error('A Google client ID is required.');
 let gis,token=null,exp=0,email='',state='signed-out',timer,exchange=null,generation=0;
 const nonces=new Map(),waiters=new Set();
 const valid=()=>!!token&&now()<exp;
 const emit=(next,info={})=>{state=next;onState(next,{email,...info});};
 const clearStorage=()=>{try{storage?.removeItem(SESSION_KEY);}catch{}};
 function forget(){token=null;exp=0;clearTimer(timer);timer=null;nonces.clear();generation++;}
 function ended(){forget();clearStorage();emit('expired');}
 function install(row){
  if(!row||!/^os1\.[A-Za-z0-9_-]{43}$/.test(row.token)||typeof row.email!=='string'||!Number.isFinite(Date.parse(row.expiresAt)))return false;
  token=row.token;exp=Date.parse(row.expiresAt)/1000;email=row.email;
  if(!valid()){ended();return false;}
  clearTimer(timer);timer=setTimer(ended,Math.max(0,(exp-now())*1000));emit('signed-in');
  for(const resolve of waiters)resolve(token);waiters.clear();return true;
 }
 function restore(){try{const raw=storage?.getItem(SESSION_KEY);return raw?install(JSON.parse(raw)):false;}catch{return false;}}
 async function request(path,method,credential,body){
  const response=await fetcher(new URL(path,origin),{method,credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const value=await response.json();if(!response.ok){const error=new AuthRequired(value.error);error.status=response.status;throw error;}return value;
 }
 async function ready(){if(!gis)gis=await loadGis();return gis;}
 async function handleCredential(response){
  if(exchange)return exchange;
  const credential=response?.credential,payload=credential?decodeJwtPayload(credential):null;
  for(const [n,at] of nonces)if(now()-at>=300)nonces.delete(n);
  if(!payload||payload.aud!==clientId||!nonces.has(payload.nonce)||!(payload.exp>now())||typeof payload.email!=='string'){emit('rejected',{code:'bad_credential'});return;}
  nonces.delete(payload.nonce);email=payload.email.trim().toLowerCase();
  const attempt=generation;
  exchange=(async()=>{try{const row=await request('/session','POST',credential);if(attempt!==generation)return;
   if(!install(row))throw new AuthRequired('bad_session');
   try{storage?.setItem(SESSION_KEY,JSON.stringify({token:row.token,expiresAt:row.expiresAt,email:row.email}));}catch{}
  }catch(error){if(attempt!==generation)return;forget();emit(error.status===403?'not-allowed':['jwks_unavailable','unknown_key'].includes(error.code)?'trouble':error instanceof AuthRequired?'rejected':'trouble',{code:error.code||'network'});}finally{exchange=null;}})();
  return exchange;
 }
 events.addEventListener?.('storage',event=>{if(event.key!==SESSION_KEY&&event.key!==null)return;if(!event.newValue){ended();return;}forget();if(!restore())ended();});
 return {
  get state(){return state;},get email(){return email;},get token(){return valid()?token:null;},get signedIn(){return valid();},
  async start(){if(valid()){emit('signed-in');return state;}if(restore())return state;if(state!=='expired')emit('signed-out');return state;},
  async renderButton(element,options={}){
   await ready();for(const [n,at] of nonces)if(now()-at>=300)nonces.delete(n);
   const nonce=randomNonce(cryptoApi);nonces.set(nonce,now());while(nonces.size>8)nonces.delete(nonces.keys().next().value);
   gis.initialize({client_id:clientId,callback:handleCredential,nonce,auto_select:false,cancel_on_tap_outside:false});
   gis.cancel?.();
   gis.renderButton(element,{type:'standard',theme:options.theme||'outline',size:'large',text:'signin_with',shape:'rectangular',logo_alignment:'left',width:options.width||320});
  },
  async reauth(element,{signal,theme='outline',width=250}={}){
   if(!valid())throw new AuthRequired('session_expired');
   await ready();
   signal?.throwIfAborted();
   const nonce=randomNonce(cryptoApi), attempt=generation, started=now();
   return new Promise((resolve,reject)=>{
    const abort=()=>{gis.cancel?.();reject(signal.reason);};
    signal?.addEventListener('abort',abort,{once:true});
    gis.cancel?.();
    try{
     gis.initialize({client_id:clientId,nonce,auto_select:false,cancel_on_tap_outside:false,callback:response=>{
      if(signal?.aborted)return;
      signal?.removeEventListener('abort',abort);
      const credential=response?.credential,payload=decodeJwtPayload(credential);
      if(attempt!==generation||!valid()||payload?.aud!==clientId||payload.nonce!==nonce||
         !(payload.exp>now())||!(payload.iat>=started-60&&payload.iat<=now()+60)||
         String(payload.email).trim().toLowerCase()!==email){
       reject(new AuthRequired('bad_credential'));return;
      }
      resolve(credential);
     }});
     gis.renderButton(element,{type:'standard',theme,size:'large',text:'continue_with',shape:'rectangular',logo_alignment:'left',width});
    }catch(error){signal?.removeEventListener('abort',abort);reject(error);}
   });
  },
  async ensureToken(){if(valid())return token;if(token)ended();else if(!['expired','not-allowed','rejected','trouble'].includes(state))emit('signed-out');return new Promise(resolve=>waiters.add(resolve));},
  reject(status,code){if(code==='jwks_unavailable'||code==='unknown_key'){emit('trouble',{code});return;}forget();clearStorage();emit(status===403?'not-allowed':['expired','missing_token','session_expired','session_revoked'].includes(code)?'expired':'rejected',{code});},
  trouble(code='network'){emit('trouble',{code});},retrying(){if(valid())emit('signed-in');},
  async signOut(){const current=token;if(current){try{await request('/session','DELETE',current);}catch(error){if(!['session_revoked','session_expired'].includes(error.code))throw error;}}forget();clearStorage();email='';emit('signed-out');try{gis?.disableAutoSelect?.();}catch{}},
  async revokeAll(){if(!valid())throw new AuthRequired('session_expired');return request('/sessions/revoke-all','POST',token,{});},
  async refresh(){if(valid())return token;ended();throw new AuthRequired('session_expired');}
 };
}
function safeStorage(){try{return globalThis.localStorage||null;}catch{return null;}}
