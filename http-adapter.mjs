import {bookingIcs} from './calendar-export.mjs?v=2.11.0';
export {bookingIcs} from './calendar-export.mjs?v=2.11.0';
import {exportName} from './ledger-export.mjs?v=2.11.0';
import {balanceDueDate} from './due-date.mjs?v=2.11.0';
import {balanceAlert,depositAlert} from './attention-rules.mjs?v=2.11.0';
import {businessToday,localTodayOverride} from './business-date.mjs?v=2.11.0';
// HTTP is the sole data source in this adapter. Fixture adapter is presentation/price
// helpers only; no read fallback and no Stage 3 command transport.
import {createLedgerApi,balance} from './adapter.mjs?v=2.11.0';
export function localWorkerOrigin(value){const url=new URL(value);if(url.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Worker must be a loopback HTTP origin.');return url.origin;}
export function hostedOrigin(value){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Worker must be an exact https origin.');return url.origin;}
export function createHttpLedgerApi(presentation,{origin,timeout=4000,retries=1,fetcher=fetch,onState=()=>{},auth=null,trustedOrigin=false,today,pageOrigin=globalThis.location?.origin,clock=()=>new Date()}){
 let documentsEnabled=true,renderCache=null;const details=new Map(),pending=new Map();
 origin=auth&&trustedOrigin?hostedOrigin(origin):localWorkerOrigin(origin);const helpers=createLedgerApi(presentation);
 const override=localTodayOverride(today,pageOrigin),getToday=()=>override||businessToday(clock());

 // Every Worker call carries the opaque session token; a 401 asks for interactive sign-in and retries once
 // (nothing was processed), a 403 means the account is not allowed (shown on the sign-in screen, never retried).
 async function authHeaders(){return auth?{Authorization:'Bearer '+await auth.ensureToken()}:{};}
 async function authFailure(response,data){
  const code=(data??await response.json().catch(()=>({})))?.error||'unauthorized';auth.reject(response.status,code);
  const e=Error(response.status===403?'This account is not allowed to open the ledger.':'Your sign-in could not be verified.');e.status=response.status;e.code=code;e.auth=true;e.retry=false;return e;
 }
 async function get(path,params={}){
  if(renderCache){const key=path+JSON.stringify(params);if(!renderCache.has(key))renderCache.set(key,request(path,params));return renderCache.get(key);}
  return request(path,params);
 }
 async function request(path,params={}){
  const url=new URL(path,origin);for(const [k,v] of Object.entries(params))if(v!==undefined&&v!=='')url.searchParams.set(k,v);
  let error;
  let reauth=0;
  for(let attempt=0;attempt<=retries;attempt++){
   const headers=await authHeaders();
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
   try{const response=await fetcher(url,{signal:controller.signal,credentials:'omit',cache:'no-store',headers});
    if(auth&&(response.status===401||response.status===403)){const e=await authFailure(response);if(response.status===401&&reauth++<1){attempt--;error=e;continue;}throw e;}
    if(!response.ok){const e=Error('Unable to load ledger ('+response.status+').');e.retry=response.status>=500;if(path==='/documents'&&response.status===503){documentsEnabled=false;e.retry=false;}throw e;}return await response.json();}
   catch(e){error=e;if(e.retry===false)break;if(attempt<retries)await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)));}finally{clearTimeout(timer);}
  }
  if(error?.auth)throw error;
  onState('error');throw Error(error?.name==='AbortError'?'Ledger request timed out.':error?.message||'Unable to load ledger.');
 }
 const normalize=r=>({...r,client:r.guest??r.client,total:r.originalPrice??(r.flags?.needsPrice?null:r.agreedPrice),financialTotal:r.agreedPrice,settled:r.status==='Settled'||!!r.settled,cancelled:r.status==='Cancelled'||!!r.cancelled});
 async function post(path,body,callTimeout=timeout,retryAuth=true,extraHeaders={}){
  for(let reauth=0;;reauth++){
  const headers={'Content-Type':'application/json',...extraHeaders,...await authHeaders()};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),callTimeout);
  try{const response=await fetcher(new URL(path,origin),{method:'POST',body:JSON.stringify(body),headers,credentials:'omit',cache:'no-store',signal:controller.signal});
   if(auth&&(response.status===401||response.status===403)){const e=await authFailure(response);if(retryAuth&&response.status===401&&reauth<1)continue;throw e;}
   const data=await response.json().catch(error=>{if(response.ok)throw error;return {};});if(!response.ok){const e=Error(data.error||'Unable to save ledger ('+response.status+').');e.status=response.status;throw e;}return data;}
  finally{clearTimeout(timer);}
  }
 }
 async function save(command){
  const fingerprint=JSON.stringify({...command,expectedRevision:undefined}),scope=command.bookingId||command.commands?.[0]?.bookingId||'new-intake';let entry=pending.get(fingerprint);
  if(entry?.promise)return entry.promise;
  if(!entry){if([...pending.values()].some(e=>e.scope===scope))throw Error('A previous save is awaiting confirmation. Restore the original form values and try again before making another change.');entry={requestId:crypto.randomUUID(),scope,command};pending.set(fingerprint,entry);}
  entry.promise=(async()=>{try{const result=await post('/command',{...entry.command,requestId:entry.requestId});pending.delete(fingerprint);renderCache=null;for(const r of result.state.records)details.set(r.id,r);return result.record;}
   catch(e){if(e.status){pending.delete(fingerprint);if(e.status===409){details.clear();renderCache=null;if(command.bookingId)await detail(command.bookingId);}}throw e;}
   finally{entry.promise=null;}})();return entry.promise;
 }
 async function detail(id){const {record,displayMeta,reminderMailEnabled,bookingEmailLink}=await get('/bookings/'+encodeURIComponent(id));details.set(id,record);return {...record,...displayMeta,reminderMailEnabled,bookingEmailLink,balance:balance(record)};}
 async function commands(type,id,values={}){
  const r=id?(details.get(id)||await detail(id)):null;
  if(type==='edit'){const fields=['client','phone','contract','type','date','due','covers','projector','audio','bar','security','notes'];values={...Object.fromEntries(fields.map(k=>[k,r[k]])),total:r.total,...values};}
  if(type==='markSettled')values={cutoff:getToday(),...values};
  return save({type,bookingId:id,expectedRevision:r?.revision,values});
 }
 // The frozen sample ledger keeps its original look: an unchanged sample row never gets the new reminders.
 function frozenSample(r){
  const o=typeof helpers.original==='function'?helpers.original(r.id):null;
  // Unchanged means every field we can see equals the sample (fields a row does not carry are ignored).
  return !!o&&['client','date','type','contract','total','paid','due','depositHeld'].every(k=>r[k]===undefined||r[k]===o[k]);
 }
 async function createBooking(values,metadata){
  if(!values.due&&/^\d{4}-\d{2}-\d{2}$/.test(values.date||''))values={...values,due:balanceDueDate(values.date,getToday())};
  values={...values,...Object.fromEntries(['email','guestCount','rentalWindow'].filter(k=>metadata[k]!==undefined).map(k=>[k,metadata[k]]))};
  const fields=['client','phone','type','date','due','covers','projector','audio','bar','security','notes'];
  const batch=[{type:'create',values},{type:'edit',bookingId:'$created',values:{...Object.fromEntries(fields.filter(k=>values[k]!==undefined).map(k=>[k,values[k]])),contract:'',lines:metadata.lines,reason:'Initial itemized price'}}];
  // Contract and revision are resolved from the newly created record inside the transaction.
  batch[1].values.contract='$created';
  if(metadata.depositStatus==='Held')batch.push({type:'deposit',bookingId:'$created',values:{kind:'receive',amount:600,date:getToday(),method:values.method,reason:'Initial refundable deposit'}});
  if(metadata.depositStatus==='Waived')batch.push({type:'waiveDeposit',bookingId:'$created',values:{reason:metadata.waiverReason||''}});
  const made=await save({type:'batch',commands:batch});return {...made,balance:balance(made)};
 }
 async function list({q='',filter='all',sort='date',from='',to='',archived=''}={}){
  let rows=(await get('/bookings',{q:q.trim()||undefined,from:from||undefined,to:to||undefined,archived:archived||undefined})).records.map(normalize);
  rows=rows.filter(r=>filter==='all'||filter==='due'&&r.balance>0&&!r.cancelled||filter==='attention'&&(r.flags?.needsPrice||r.importedDifference||r.due&&r.due<getToday()&&r.balance>0||(balanceAlert(r,getToday())||depositAlert({...r,depositOwed:r.flags?.depositOwed},getToday()))&&!frozenSample(r)||r.date<getToday()&&r.type!=='Blackout'||r.flags?.depositHeld)&&!r.settled||filter==='upcoming'&&r.date>=getToday()&&!r.cancelled||filter==='past'&&r.date<getToday()||filter==='cancelled'&&r.cancelled||filter==='settled'&&r.settled);
  return rows.sort(sort==='guest'?(a,b)=>a.client.localeCompare(b.client):sort==='balance'?(a,b)=>(b.balance||0)-(a.balance||0):(a,b)=>a.date.localeCompare(b.date));
 }
 async function payments(params={}){let out=[],offset=0;for(;;){const page=await get('/payments',{...params,offset,limit:500});out=out.concat(page.records);if(out.length>=page.summary.count)return out;offset+=500;if(offset>50000)throw Error('Narrow the payment search.');}}
 // Square (owner only). Plain errors with the Worker's own message; a 403 here never signs anyone out.
 async function squareRequest(path,options={}){
  const response=await fetcher(new URL(path,origin),{...options,headers:{...(options.headers||{}),...await authHeaders()},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(options.timeout||30000)});
  if(auth&&response.status===401)throw await authFailure(response);
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const e=Error(data.error||'Square is unavailable ('+response.status+').');e.status=response.status;throw e;}
  return data;
 }
 return {...helpers,beginRead(){renderCache=new Map();},endRead(){renderCache=null;},mode:'http',get today(){return getToday();},get documentsEnabled(){return documentsEnabled;},set documentsEnabled(value){documentsEnabled=value!==false;},list,search:q=>list({q}),
  detail,cachedDetail:id=>{const r=details.get(id);return r?{...r,client:r.guest??r.client,balance:balance(r)}:null;},
  async settings(path,{method='GET',body,signal}={}){
   const response=await fetcher(new URL(path,origin),{
    method,headers:{...await authHeaders(),...(body===undefined?{}:{'Content-Type':'application/json'})},
    credentials:'omit',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000),
    ...(body===undefined?{}:{body:JSON.stringify(body)})
   });
   const data=await response.json().catch(()=>({}));
   if(auth&&response.status===401&&data.error!=='reauth_required'&&path!=='/settings/reauth')throw await authFailure(response,data);
   if(!response.ok)throw Object.assign(Error('Settings request failed.'),{status:response.status,code:data.error});
   return data;
  },
  me:()=>request('/me'),counts:()=>get('/counts'),summary:async()=>{const [s,p]=await Promise.all([get('/summary'),get('/payments',{limit:1})]);return {...s,balance:s.balanceToCollect,novemberPayments:s.monthPayments,novemberEvents:s.eventsThisMonth,depositHeld:p.summary.depositHeld};},
  attention:async()=> (await get('/attention')).items,insights:year=>get('/insights',{year:year||getToday().slice(0,4)}),payments,
  calendar:async(year,month)=>(await get('/calendar',{year:year??getToday().slice(0,4),month:month??getToday().slice(5,7)})).records,
  calendarInfo:(year,month)=>get('/calendar',{year:year??getToday().slice(0,4),month:month??getToday().slice(5,7)}),
  exportYears:async kind=>(await get('/export/'+kind+'.years')).years,
  async exportCsv(kind,year){
   const filename=exportName(kind,year);
   const response=await fetcher(new URL('/export/'+kind+'.csv?year='+year,origin),{headers:await authHeaders(),credentials:'omit',cache:'no-store'});
   if(auth&&(response.status===401||response.status===403))throw await authFailure(response);
   if(!response.ok||!response.headers.get('Content-Type')?.startsWith('text/csv'))throw Error('Export download unavailable.');
   return {filename,blob:await response.blob()};
  },
  commands,createBooking,commandBatch:commands=>save({type:'batch',commands}),
  warmDocuments:()=>post('/documents/warm',{},timeout,false),
  documents:async bookingId=>(await request('/documents',{bookingId})).documents,
  createContract:async(id,values,requestId)=>post('/documents/contract',{bookingId:id,expectedRevision:(await detail(id)).revision,values,requestId},timeout,false),
  issueReceipt:(bookingId,requestId)=>post('/documents/receipt',{bookingId,requestId},timeout),
  emailBooking:(id,body,requestId,revision)=>post('/bookings/'+encodeURIComponent(id)+'/booking-email',body,45000,false,{'Idempotency-Key':requestId,'If-Match':String(revision)}),
  emailReminder:(id,to,requestId,revision)=>post('/bookings/'+encodeURIComponent(id)+'/reminder-email',{to},45000,false,{'Idempotency-Key':requestId,'If-Match':String(revision)}),
  emailDocument:(id,to,requestId)=>post('/documents/'+encodeURIComponent(id)+'/email',{to},45000,false,{'Idempotency-Key':requestId}),
  retryDocument:id=>post('/documents/'+encodeURIComponent(id)+'/retry',{},timeout,false),
  async downloadDocument(id){const response=await fetcher(new URL('/documents/'+encodeURIComponent(id)+'/download',origin),{headers:await authHeaders(),credentials:'omit',cache:'no-store'});if(auth&&(response.status===401||response.status===403))throw await authFailure(response);if(!response.ok||!response.headers.get('Content-Type')?.startsWith('application/pdf'))throw Error('Document download unavailable.');return {preview:response.headers.get('X-Document-Preview')==='true',blob:await response.blob(),filename:decodeURIComponent(response.headers.get('Content-Disposition')?.split("UTF-8''")[1]||'Document.pdf')};},
  squareStatus:()=>squareRequest('/square/status').catch(()=>({configured:false})),
  squarePayments:fresh=>squareRequest('/square/payments'+(fresh?'?fresh=1':'')),
  async squareLink(bookingId,amount,requestId,to){const out=await squareRequest('/square/links',{method:'POST',body:JSON.stringify({bookingId,amount,...(to?{to}:{})}),headers:{'Content-Type':'application/json','Idempotency-Key':requestId}});if(out.email?.status==='sent'){details.clear();renderCache=null;}return out;},
  async squareConfirm(paymentId,bookingId){const out=await squareRequest('/square/confirm',{method:'POST',body:JSON.stringify({paymentId,bookingId}),headers:{'Content-Type':'application/json'}});details.clear();renderCache=null;return out;},
  async ics(id){const r=await this.detail(id);return bookingIcs(r);}
 };
}
