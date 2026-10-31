/* Isolated beta transport: local fictional data or a separately configured beta Apps Script project. */
const BetaClient = (() => {
 const key='oryan-workflow-beta-v1';let state;
 const remote=window.ORYAN_BETA_REMOTE===true;
 const clone=x=>JSON.parse(JSON.stringify(x));
 function readState(){const s=localStorage.getItem(key);if(!s)return BetaLedger.initial(BETA_SEED);const stored=JSON.parse(s);return {...stored,records:stored.records.map(BetaLedger.derive)};}
 function save(s){try{localStorage.setItem(key,JSON.stringify(s));}catch{throw Error('This browser could not save beta data. Nothing was changed.');}state=s;}
 function google(name,args){return new Promise((resolve,reject)=>googleThis().withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e.message)))[name](...args));}
 function googleThis(){if(!window.google?.script?.run)throw Error('The separate beta backend is not connected.');return window.google.script.run;}
 async function command(cmd,requestId){
  if(remote)return google('mutateBeta',[cmd,requestId]);
  // Re-read shared storage and hold a browser-wide lock when available (two-tab stale edits are rejected).
  const run=()=>{const result=BetaLedger.execute(readState(),cmd,requestId,{id:uuid(),actor:'Beta tester',at:new Date().toISOString()});save(result.state);return {record:result.record,duplicate:result.duplicate};};
  if(!navigator.locks)throw Error('This browser cannot safely save beta changes. Open the beta link in a current browser.');
  return navigator.locks.request(key,run);
 }
 async function rpc(name,...args){
  if(name==='getLedger'){
   if(remote)return google('getBetaLedger',[]);
   state=readState();return {records:clone(state.records),actor:'Beta tester',today:new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),summary:BetaLedger.summary(state.records)};
  }
  if(name==='betaCommand')return command(args[0],args[1]);
  if(name==='createBooking')return command({type:'create',values:args[0]},args[1]);
  const r=records.find(r=>r.id===(name==='recordPayment'?args[0].bookingId:args[0]));if(!r)throw Error('Choose a booking.');
  if(name==='recordPayment'){const {bookingId,...values}=args[0];return command({type:'payment',bookingId,expectedRevision:r.revision,values},args[1]);}
  if(name==='cancelBooking')return command({type:'cancel',bookingId:r.id,expectedRevision:r.revision,values:{reason:args[1]||'Cancelled by beta tester'}},args[2]||uuid());
  throw Error('This action is not available in the isolated beta.');
 }
 return {rpc,reset:()=>{if(remote)throw Error('Reset is only available for local fictional data.');localStorage.removeItem(key);},remote};
})();
