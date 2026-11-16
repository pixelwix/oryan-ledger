export const DOCUMENTS_WARM_MINUTES=4;
export const DOCUMENTS_POLL_MS=2500;
export const BACKGROUND_MESSAGE='Saving in the background. It will appear in Saved copies in about 10-30 seconds.';
const controllers=new WeakMap();
export function startDocumentsWarm(api,{enabled=true,minutes=DOCUMENTS_WARM_MINUTES,allowed=()=>true}={}){
 controllers.get(api)?.stop();
 const interval=Number(minutes)*60000;let timer=null,stopped=false,inflight=false,signedOut=false;
 const eligible=()=>!stopped&&!signedOut&&enabled&&Number.isFinite(interval)&&interval>0&&document.visibilityState==='visible'&&navigator.onLine!==false&&allowed()&&typeof api.warmDocuments==='function';
 const clear=()=>{clearTimeout(timer);timer=null;};
 const schedule=()=>{clear();if(eligible())timer=setTimeout(()=>void warm(),interval);};
 async function warm(){if(!eligible()||inflight)return;inflight=true;try{const r=await api.warmDocuments();if(r?.status==='disabled')enabled=false;}catch(error){if(error.status===503)enabled=false;}finally{inflight=false;schedule();}}
 const change=()=>{clear();if(eligible())void warm();};
 const out=e=>{if(e.target.closest('#btnSignOut')){signedOut=true;clear();}};
 function stop(){stopped=true;clear();document.removeEventListener('visibilitychange',change);window.removeEventListener('online',change);window.removeEventListener('offline',change);window.removeEventListener('pagehide',stop);document.removeEventListener('click',out,true);}
 document.addEventListener('visibilitychange',change);window.addEventListener('online',change);window.addEventListener('offline',change);window.addEventListener('pagehide',stop);document.addEventListener('click',out,true);
 const controller={warm,stop,sync:()=>{if(allowed())signedOut=false;change();}};controllers.set(api,controller);void warm();return controller;
}
export function warmDocuments(api){void controllers.get(api)?.warm();}
// One pending poll per adapter. Changing route, hiding, going offline or signing
// out cancels timers; no overlapping list requests. Visible detail resumes once.
const polls=new WeakMap();
export function pollDocuments(api,id,refresh,initialDelay=DOCUMENTS_POLL_MS,routeHash='#/booking/'+encodeURIComponent(id)){
 polls.get(api)?.stop();let timer,stopped=false,busy=false,delay=initialDelay;
 const active=()=>!stopped&&location.hash.split('?')[0]===routeHash&&document.visibilityState==='visible'&&navigator.onLine!==false;
 const clear=()=>clearTimeout(timer);
 const schedule=()=>{clear();if(active())timer=setTimeout(tick,delay);};
 async function tick(){if(!active()||busy)return;busy=true;try{await refresh();}catch{delay=Math.min(15000,delay*2);schedule();}finally{busy=false;}}
 const change=()=>{clear();if(active())schedule();};
 const route=()=>{if(location.hash.split('?')[0]!==routeHash)stop();};
 const out=e=>{if(e.target.closest('#btnSignOut'))stop();};
 function stop(){stopped=true;clear();document.removeEventListener('visibilitychange',change);window.removeEventListener('online',change);window.removeEventListener('offline',change);window.removeEventListener('hashchange',route);window.removeEventListener('pagehide',stop);document.removeEventListener('click',out,true);}
 document.addEventListener('visibilitychange',change);window.addEventListener('online',change);window.addEventListener('offline',change);window.addEventListener('hashchange',route);window.addEventListener('pagehide',stop);document.addEventListener('click',out,true);
 polls.set(api,{stop});schedule();
}
export function stopDocumentsPoll(api){polls.get(api)?.stop();}
