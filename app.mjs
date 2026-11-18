import {startDocumentsWarm,DOCUMENTS_WARM_MINUTES} from './documents-lifecycle.mjs';
import {positionRowMenu,rowMenuKeyboard} from './row-menu.mjs';
import {createHttpLedgerApi} from './http-adapter.mjs';
import {readStates} from './read-states.mjs';
import {createLedgerApi,money,balance} from './adapter.mjs';
import {parseRoute} from './routes.mjs';
import {CHANGELOG,VERSION} from './changelog.mjs';
import {savedTheme,applyTheme,effectiveTheme,syncTheme} from './theme.mjs';
import {mountFlows} from './flows.mjs';
const presentation=await fetch('./presentation.json').then(r=>r.json());
// A hosted Worker address and Google client ID come ONLY from the app's own app-config.json (public values written at deploy time).
// The URL can only select a loopback Worker for local development; it can never point the app (and its token) at another server.
const appConfig=await fetch('./app-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
const params=new URLSearchParams(location.search);
const trustedOrigin=Boolean(appConfig?.workerOrigin&&appConfig?.googleClientId);
const workerOrigin=trustedOrigin?appConfig.workerOrigin:params.get('worker');
const clientId=trustedOrigin?appConfig.googleClientId:(workerOrigin?params.get('client'):'');
let auth=null,signin=null,me=null,retryWaiter=null,documentsWarm=null;
if(clientId){
 const [{createAuth},{mountSignIn}]=await Promise.all([import('./auth.mjs'),import('./signin-ui.mjs')]);
 auth=createAuth({clientId,origin:workerOrigin,onState:(state,info)=>{signin?.render(state,info);documentsWarm?.sync();}});
 signin=mountSignIn({auth,toast,onRetry:()=>{if(retryWaiter){const resolve=retryWaiter;retryWaiter=null;resolve();}else auth.start().catch(()=>{});}});
}
export const ledgerApi=workerOrigin?createHttpLedgerApi(presentation,{origin:workerOrigin,auth,trustedOrigin,today:appConfig?.today}):createLedgerApi(presentation);
const states=readStates(presentation,()=>render());
if(workerOrigin){window.addEventListener('offline',()=>states.show('offline'));window.addEventListener('online',()=>{states.clear('offline');render();});}
const initial=new URLSearchParams(location.search).get('theme')||savedTheme();applyTheme(initial);
let activeRoute,returnFocus,returnHash,focusId,renderSequence=0;
export function toast(text){let el=document.querySelector('.app-toast');if(!el){el=document.createElement('div');el.className='app-toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=text;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.remove(),4000);}
export function go(hash){if(location.hash===hash)render();else location.hash=hash;}
export function closeSheet(){go(returnHash||'#/booking/'+(activeRoute.id||'sophia'));focusId=returnFocus;}
export async function render(){
 const ticket=++renderSequence;
 document.documentElement.removeAttribute('data-ready');
 const route=parseRoute(location.hash);
 const loading=workerOrigin?setTimeout(()=>{if(ticket===renderSequence)states.show('loading');},120):null;
 try{
  ledgerApi.beginRead?.();
  if(workerOrigin){
   if(route.screen==='overview')await Promise.all([ledgerApi.summary(),ledgerApi.attention()]);
   if(route.screen==='calendar')await ledgerApi.calendar();
   if(route.screen==='insights')await ledgerApi.insights();
   if(route.screen==='payments')await ledgerApi.payments();
   if(['bookings','new-booking'].includes(route.screen))await ledgerApi.list();
   if(['booking','record-payment','edit-booking'].includes(route.screen))await ledgerApi.detail(route.id);
  }
  const module=await import('./screens/'+route.screen+'.mjs');
  if(ticket!==renderSequence)return;
  const style=document.getElementById('routeStyles')||document.head.appendChild(Object.assign(document.createElement('style'),{id:'routeStyles'}));style.textContent=module.styles;
  const body=document.createElement('body');body.innerHTML=module.default(await ledgerApi.presentation(route.screen));document.body.replaceWith(body);
  activeRoute=route;document.body.style.overflow='';syncTheme();
  await mountFlows({api:ledgerApi,route,go,toast,closeSheet});
  if(focusId){document.querySelector(focusId)?.focus({preventScroll:true});focusId=null;}
  ledgerApi.endRead?.();
  clearTimeout(loading);states.clear('loading');states.clear('error');
  if(workerOrigin&&navigator.onLine===false)states.show('offline');
  if(auth&&me)signin.footer({email:me.actor,isOwner:me.isOwner,version:VERSION,notes:CHANGELOG});
  signin?.syncInert();
  document.documentElement.dataset.ready=route.screen;
 }catch(error){ledgerApi.endRead?.();clearTimeout(loading);states.clear('loading');if(error?.auth){gate().then(()=>render());return;}if(workerOrigin){states.show('error');document.documentElement.dataset.readError='true';}else toast(error.message);}
}
document.addEventListener('click',e=>{
 // Preserve the locked href used by the polish breadcrumb hit-area selector.
 if(e.target.closest('.main-content > div > a[href="bookings.html"]')){e.preventDefault();go('#/bookings');return;}
 const theme=e.target.closest('.theme-toggle-btn');if(theme){applyTheme(effectiveTheme()==='dark'?'light':'dark',true);return;}
 const a=e.target.closest('a[href^="#/"]');if(a){
  const next=parseRoute(a.hash);
  if(['edit-booking','record-payment'].includes(next.screen)&&!['edit-booking','record-payment'].includes(activeRoute?.screen)){
   returnHash=location.hash||'#/overview';returnFocus=a.id?'#'+a.id:a.getAttribute('href')?'a[href="'+a.getAttribute('href')+'"]':null;
  }
  if(a.classList.contains('modal-close-btn')||a.closest('.modal-backdrop')&&a.textContent.trim()==='Cancel'){e.preventDefault();closeSheet();return;}
 }
 const trigger=e.target.closest('[data-toggle-menu]');if(trigger){const menu=document.getElementById(trigger.dataset.toggleMenu);if(menu){document.querySelectorAll('.dropdown-menu[open],.more-dropdown-menu[open]').forEach(other=>{if(other!==menu){other.removeAttribute('open');document.querySelectorAll('[data-toggle-menu]').forEach(button=>{if(button.dataset.toggleMenu===other.id)button.setAttribute('aria-expanded','false');});}});menu.toggleAttribute('open');trigger.setAttribute('aria-expanded',String(menu.hasAttribute('open')));if(menu.hasAttribute('open')&&menu.classList.contains('dropdown-menu'))positionRowMenu(menu,trigger);}return;}
 if(!e.target.closest('.dropdown-menu,.more-dropdown-menu')){document.querySelectorAll('.dropdown-menu[open],.more-dropdown-menu[open]').forEach(m=>m.removeAttribute('open'));document.querySelectorAll('[data-toggle-menu][aria-expanded="true"]').forEach(button=>button.setAttribute('aria-expanded','false'));}
 const opener=e.target.closest('[data-open-modal]');if(opener){const modal=document.getElementById(opener.dataset.openModal);if(modal){modal.hidden=false;modal.style.display='flex';modal.querySelector('button,input,a')?.focus();}}
 const closer=e.target.closest('[data-close-modal]');if(closer){const modal=closer.closest('.modal-backdrop');if(modal){modal.hidden=true;modal.style.display='none';}}
 if(e.target.classList.contains('modal-backdrop'))closeSheet();
});
document.addEventListener('keydown',e=>{
 rowMenuKeyboard(e);
 if(e.key==='Escape'){
  if(['edit-booking','record-payment'].includes(activeRoute?.screen)){e.preventDefault();closeSheet();}
  document.querySelectorAll('.dropdown-menu[open],.more-dropdown-menu[open]').forEach(m=>m.removeAttribute('open'));
  document.querySelectorAll('[aria-expanded="true"]').forEach(m=>m.setAttribute('aria-expanded','false'));
 }
 if(e.key==='Tab'){
  const dialog=document.querySelector('.modal-backdrop:not([hidden]) .modal-dialog');if(!dialog)return;
  const focusable=[...dialog.querySelectorAll('a[href],button,input,select,textarea')].filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);
  if(!dialog.contains(document.activeElement)){e.preventDefault();first?.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }
});
async function refreshMe(){me=await ledgerApi.me();}
// Sign-in gate: nothing is requested or shown until a valid token exists and the Worker confirms the account is allowed.
// A 401/403 puts the sign-in screen above the app; the gate then waits for the user and checks again.
async function gate(){
 for(;;){
  try{await auth.ensureToken();await refreshMe();auth.retrying();return;}
  catch(error){if(error?.auth&&!['jwks_unavailable','unknown_key'].includes(error.code))continue;if(!error?.auth)auth.trouble('network');await new Promise(resolve=>{retryWaiter=resolve;});auth.retrying();}
 }
}
async function bootAuth(){await auth.start();await gate();}
if(auth)await bootAuth();
ledgerApi.documentsEnabled=appConfig?.documentsEnabled!==false;
documentsWarm=startDocumentsWarm(ledgerApi,{enabled:appConfig?.documentsEnabled!==false,minutes:appConfig?.documentsWarmMinutes??DOCUMENTS_WARM_MINUTES,allowed:()=>!auth||auth.state==='signed-in'});
window.addEventListener('hashchange',render);await render();

// Refresh only on a changed business day; preserve entered sheet values.
let displayedBusinessDay=ledgerApi.today;
function refreshBusinessDay(){if(document.hidden)return;const day=ledgerApi.today;if(day!==displayedBusinessDay){displayedBusinessDay=day;if(!document.querySelector('[role="dialog"]'))render();}}
window.addEventListener('focus',refreshBusinessDay);
document.addEventListener('visibilitychange',refreshBusinessDay);
