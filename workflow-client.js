/* Live-only transport. No fixture, local record store or fallback on failure. */
const BetaClient = (() => {
  function call(name,args){
    if(API)return apiRun(name,args);
    return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e.message||'Could not reach Google Sheets.')))[name](...args));
  }
  async function rpc(name,...args){
    if(name==='getLedger')return call('workflowGetLedger',[]);
    if(name==='betaCommand')return call('workflowMutate',args);
    if(name==='createContract')return call(name,args);
    // Legacy endpoints preserve retries submitted by tabs open before the rollout.
    if(name==='createBooking'||name==='recordPayment')return call(name,args);
    if(name==='cancelBooking'){
      const r=records.find(r=>r.id===args[0]);if(!r)throw Error('Choose a booking.');
      return call('workflowMutate',[{type:'cancel',bookingId:r.id,expectedRevision:r.revision,values:{reason:args[1]}},args[2]]);
    }
    throw Error('Unknown ledger action. Refresh the app.');
  }
  return {rpc,remote:true};
})();
