// HTTP is the sole data source in this adapter. Fixture adapter is presentation/price
// helpers only; no read fallback and no Stage 3 command transport.
import {createLedgerApi,balance} from './adapter.mjs';
export function localWorkerOrigin(value){const url=new URL(value);if(url.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Worker must be a loopback HTTP origin.');return url.origin;}
export function hostedOrigin(value){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Worker must be an exact https origin.');return url.origin;}
export function createHttpLedgerApi(presentation,{origin,timeout=4000,retries=1,fetcher=fetch,onState=()=>{},auth=null,trustedOrigin=false}){
 let renderCache=null;const details=new Map(),pending=new Map();
 origin=auth&&trustedOrigin?hostedOrigin(origin):localWorkerOrigin(origin);const helpers=createLedgerApi(presentation);

 // Sign-in (Stage 4): every Worker call carries the Google ID token; a 401 asks auth to renew/re-sign-in and retries once
 // (nothing was processed), a 403 means the account is not allowed (shown on the sign-in screen, never retried).
 async function authHeaders(){return auth?{Authorization:'Bearer '+await auth.ensureToken()}:{};}
 async function authFailure(response){
  const code=(await response.json().catch(()=>({})))?.error||'unauthorized';auth.reject(response.status,code);
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
    if(!response.ok){const e=Error('Unable to load ledger ('+response.status+').');e.retry=response.status>=500;throw e;}return await response.json();}
   catch(e){error=e;if(e.retry===false)break;if(attempt<retries)await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)));}finally{clearTimeout(timer);}
  }
  if(error?.auth)throw error;
  onState('error');throw Error(error?.name==='AbortError'?'Ledger request timed out.':error?.message||'Unable to load ledger.');
 }
 const normalize=r=>({...r,client:r.guest??r.client,total:r.originalPrice??(r.flags?.needsPrice?null:r.agreedPrice),financialTotal:r.agreedPrice,settled:r.status==='Settled'||!!r.settled,cancelled:r.status==='Cancelled'||!!r.cancelled});
 async function post(path,body){
  for(let reauth=0;;reauth++){
  const headers={'Content-Type':'application/json',...await authHeaders()};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetcher(new URL(path,origin),{method:'POST',body:JSON.stringify(body),headers,credentials:'omit',cache:'no-store',signal:controller.signal});
   if(auth&&(response.status===401||response.status===403)){const e=await authFailure(response);if(response.status===401&&reauth<1)continue;throw e;}
   const data=await response.json();if(!response.ok){const e=Error(data.error||'Unable to save ledger ('+response.status+').');e.status=response.status;throw e;}return data;}
  finally{clearTimeout(timer);}
  }
 }
 async function save(command){
  const fingerprint=JSON.stringify({...command,expectedRevision:undefined}),scope=command.bookingId||'new-intake';let entry=pending.get(fingerprint);
  if(entry?.promise)return entry.promise;
  if(!entry){if([...pending.values()].some(e=>e.scope===scope))throw Error('A previous save is awaiting confirmation. Restore the original form values and try again before making another change.');entry={requestId:crypto.randomUUID(),scope,command};pending.set(fingerprint,entry);}
  entry.promise=(async()=>{try{const result=await post('/command',{...entry.command,requestId:entry.requestId});pending.delete(fingerprint);renderCache=null;for(const r of result.state.records)details.set(r.id,r);return result.record;}
   catch(e){if(e.status){pending.delete(fingerprint);if(e.status===409){details.clear();renderCache=null;if(command.bookingId)await detail(command.bookingId);}}throw e;}
   finally{entry.promise=null;}})();return entry.promise;
 }
 async function detail(id){const {record,displayMeta}=await get('/bookings/'+encodeURIComponent(id));details.set(id,record);return {...record,...displayMeta,balance:balance(record)};}
 async function commands(type,id,values={}){
  const r=id?(details.get(id)||await detail(id)):null;
  if(type==='edit'){const fields=['client','phone','contract','type','date','due','covers','projector','audio','bar','security','notes'];values={...Object.fromEntries(fields.map(k=>[k,r[k]])),total:r.total,...values};}
  if(type==='markSettled')values={cutoff:helpers.today,...values};
  return save({type,bookingId:id,expectedRevision:r?.revision,values});
 }
 async function createBooking(values,metadata){
  if(!values.due){const d=new Date(values.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-20);values={...values,due:d.toISOString().slice(0,10)};}
  values={...values,...Object.fromEntries(['email','guestCount','rentalWindow'].filter(k=>metadata[k]!==undefined).map(k=>[k,metadata[k]]))};
  const fields=['client','phone','type','date','due','covers','projector','audio','bar','security','notes'];
  const batch=[{type:'create',values},{type:'edit',bookingId:'$created',values:{...Object.fromEntries(fields.filter(k=>values[k]!==undefined).map(k=>[k,values[k]])),contract:'',lines:metadata.lines,reason:'Initial itemized price'}}];
  // Contract and revision are resolved from the newly created record inside the transaction.
  batch[1].values.contract='$created';
  if(metadata.depositStatus==='Held')batch.push({type:'deposit',bookingId:'$created',values:{kind:'receive',amount:300,date:helpers.today,method:values.method,reason:'Initial refundable deposit'}});
  if(metadata.depositStatus==='Waived')batch.push({type:'waiveDeposit',bookingId:'$created',values:{reason:metadata.waiverReason||''}});
  const made=await save({type:'batch',commands:batch});return {...made,balance:balance(made)};
 }
 async function list({q='',filter='all',sort='date',from='',to=''}={}){
  let rows=(await get('/bookings',{q:q.trim()||undefined,from:from||undefined,to:to||undefined})).records.map(normalize);
  rows=rows.filter(r=>filter==='all'||filter==='due'&&r.balance>0&&!r.cancelled||filter==='attention'&&(r.flags?.needsPrice||r.importedDifference||r.due<helpers.today&&r.balance>0||r.date<helpers.today&&r.type!=='Blackout'||r.flags?.depositHeld)&&!r.settled||filter==='upcoming'&&r.date>=helpers.today&&!r.cancelled||filter==='past'&&r.date<helpers.today||filter==='cancelled'&&r.cancelled||filter==='settled'&&r.settled);
  return rows.sort(sort==='guest'?(a,b)=>a.client.localeCompare(b.client):sort==='balance'?(a,b)=>(b.balance||0)-(a.balance||0):(a,b)=>a.date.localeCompare(b.date));
 }
 async function payments(params={}){let out=[],offset=0;for(;;){const page=await get('/payments',{...params,offset,limit:500});out=out.concat(page.records);if(out.length>=page.summary.count)return out;offset+=500;if(offset>50000)throw Error('Narrow the payment search.');}}
 return {...helpers,beginRead(){renderCache=new Map();},endRead(){renderCache=null;},mode:'http',list,search:q=>list({q}),
  detail,
  me:()=>request('/me'),counts:()=>get('/counts'),summary:async()=>{const [s,p]=await Promise.all([get('/summary'),get('/payments',{limit:1})]);return {...s,balance:s.balanceToCollect,novemberPayments:s.monthPayments,novemberEvents:s.eventsThisMonth,depositHeld:p.summary.depositHeld};},
  attention:async()=> (await get('/attention')).items,insights:year=>get('/insights',{year:year||'2026'}),payments,
  calendar:async(year,month)=>(await get('/calendar',{year,month})).records,
  calendarInfo:(year,month)=>get('/calendar',{year,month}),
  commands,createBooking,
  async ics(id){const r=await this.detail(id);return bookingIcs(r);}
 };
}
export function bookingIcs(r){
 const escape=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const next=new Date(r.date+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Oryan//Ledger//EN','BEGIN:VEVENT','UID:'+escape(r.id)+'@oryan.local','DTSTAMP:20261115T000000Z','DTSTART;VALUE=DATE:'+r.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replace(/-/g,''),'SUMMARY:'+escape(r.client+' · '+r.type),'DESCRIPTION:'+escape(r.contract),...(r.cancelled?['STATUS:CANCELLED']:[]),'END:VEVENT','END:VCALENDAR'];
 // RFC5545 folding is by UTF-8 octets, never by JS character count.
 return lines.map(line=>{let out='',bytes=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>75){out+='\r\n ';bytes=1;}out+=c;bytes+=n;}return out;}).join('\r\n')+'\r\n';
}
