/* Isolated beta transport: local fictional data or a separately configured beta Apps Script project. */
const BetaClient = (() => {
 const key='oryan-workflow-beta-v1';let state;const plans=new Map();
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
  if(['createContract','listContracts','getContract','saveContractCopy'].includes(name)){
   if(remote)throw Error('Saved contract preview is browser-local only. Google storage is not deployed.');
   if(name==='listContracts')return BetaContracts.list(args[0]);
   if(name==='getContract')return BetaContracts.get(args[1],args[0]);
   if(name==='saveContractCopy'){const {saveError,...copy}=args[0];return BetaContracts.save(copy);}
   const r=readState().records.find(r=>r.id===args[0]);
   const copy=BetaContracts.create(r,args[1],args[2]);
   try{await BetaContracts.save(copy);return copy;}catch(error){return {...copy,saveError:error.message};}
  }
  if(name==='betaCommand')return command(args[0],args[1]);
  if(['createBooking','recordPayment'].includes(name)){
   const opening=name==='createBooking',form=document.getElementById(opening?'bookingForm':'paymentForm'),total=opening?args[0].paid:args[0].amount;
   const entries=Number(total)>0?BetaChoices.plan(form,total):[];
   const signature=JSON.stringify([args[0],entries]);let plan=plans.get(args[1]);
   if(plan&&plan.signature!==signature)throw Error('This payment has already started saving. Keep the original details and retry; review saved entries in booking history.');
   if(!plan){plan={signature,entries,done:0,record:null,commands:[],values:structuredClone(args[0]),original:records.find(r=>r.id===args[0].bookingId)};plans.set(args[1],plan);}
   try{
    if(opening&&!plan.record){const first=entries[0];plan.record=(await command({type:'create',values:{...plan.values,paid:first?.amount||0,method:first?.method||plan.values.method}},args[1]+'-opening')).record;plan.done=first?1:0;}
    while(plan.done<entries.length){
     const r=plan.record||plan.original,part=entries[plan.done];
     const values={amount:part.amount,method:part.method,date:opening?plan.values.paymentDate:plan.values.date,note:opening?(plan.values.note||''):plan.values.note};
     const cmd=plan.commands[plan.done]||{type:'payment',bookingId:r.id,expectedRevision:r.revision,values};plan.commands[plan.done]=cmd;
     plan.record=(await command(cmd,args[1]+'-part-'+plan.done)).record;plan.done++;
    }
    return {record:plan.record};
   }catch(error){
    const current=(await rpc('getLedger')).records;records=current.map(normalize);render();
    if(!remote&&!readState().requests.some(r=>r.key.startsWith(args[1]+'-')))plans.delete(args[1]);
    throw Error(error.message+' Saved methods: '+(plan.entries.slice(0,plan.done).map(p=>p.method+' '+money(p.amount)).join(', ')||'none confirmed')+'. Retry with the same details. Saved entries are visible in booking history.');
   }
  }
  const r=records.find(r=>r.id===(name==='recordPayment'?args[0].bookingId:args[0]));if(!r)throw Error('Choose a booking.');
  if(name==='cancelBooking')return command({type:'cancel',bookingId:r.id,expectedRevision:r.revision,values:{reason:args[1]||'Cancelled by beta tester'}},args[2]||uuid());
  throw Error('This action is not available in the isolated beta.');
 }
 return {rpc,validationRecord:(id,r)=>plans.get(id)?.original||r,reset:()=>{if(remote)throw Error('Reset is only available for local fictional data.');localStorage.removeItem(key);BetaContracts.reset();},remote};
})();
