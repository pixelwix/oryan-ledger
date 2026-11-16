export const DOCUMENTS_WARM_MINUTES=4;
export const DOCUMENTS_POLL_MS=3000;
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
// Page-session operations only. Dormant server intents never enter this map.
const sessions=new WeakMap(),polls=new WeakMap();
export const STILL_SAVING='Still saving. Check Saved copies later.';
export function documentOperation(api,id,start=false){let map=sessions.get(api);if(!map){map=new Map();sessions.set(api,map);}if(start)map.set(id,{started:Date.now(),step:0});return map.get(id);}
export function finishDocumentOperation(api,id){sessions.get(api)?.delete(id);}
export function pollDocuments(api,id,refresh,initialDelay=DOCUMENTS_POLL_MS,routeHash='#/booking/'+encodeURIComponent(id),requestId=id,onTimeout=()=>{}){
 polls.get(api)?.stop();const operation=documentOperation(api,requestId);if(!operation||api.documentsEnabled===false)return;
 let timer,stopped=false,busy=false;
 const active=()=>!stopped&&api.documentsEnabled!==false&&location.hash.split('?')[0]===routeHash&&document.visibilityState==='visible'&&navigator.onLine!==false;
 const clear=()=>clearTimeout(timer);
 const schedule=()=>{clear();if(!active())return;const remaining=300000-(Date.now()-operation.started);if(remaining<=0){stop();onTimeout();return;}const delay=[3000,3000,5000,8000,15000,30000][Math.min(operation.step,5)];timer=setTimeout(tick,Math.min(delay,remaining));};
 async function tick(){if(!active()||busy)return;if(Date.now()-operation.started>=300000){stop();onTimeout();return;}busy=true;operation.step++;try{await refresh();}catch{schedule();}finally{busy=false;}}
 const change=()=>{clear();if(active())schedule();};
 const route=()=>{if(location.hash.split('?')[0]!==routeHash)stop();};
 const out=e=>{if(e.target.closest('#btnSignOut')){sessions.delete(api);stop();}};
 function stop(){stopped=true;clear();document.removeEventListener('visibilitychange',change);window.removeEventListener('online',change);window.removeEventListener('offline',change);window.removeEventListener('hashchange',route);window.removeEventListener('pagehide',stop);document.removeEventListener('click',out,true);}
 document.addEventListener('visibilitychange',change);window.addEventListener('online',change);window.addEventListener('offline',change);window.addEventListener('hashchange',route);window.addEventListener('pagehide',stop);document.addEventListener('click',out,true);
 polls.set(api,{stop});schedule();
}
export function stopDocumentsPoll(api){polls.get(api)?.stop();}
