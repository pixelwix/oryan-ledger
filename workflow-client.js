/* Live-only transport. No fixture, local record store or fallback on failure. */
const BetaClient = (() => {
  function call(name,args){
    if(API)return apiRun(name,args);
    return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e.message||'Could not reach Google Sheets.')))[name](...args));
  }
  // Identity for the contract helper. Blank until the next sign-in, or in the Google-hosted app, where the backend gets its own.
  function idToken(){const t=API&&storedToken();return t&&t.idToken||'';}
  async function moneyCall(name,args){
    const result=await call(name,args);
    // The money response is already committed. PDF work has its own request/timeout.
    if(result.record)setTimeout(()=>savePendingReceipts(result.record.id),0);
    return result;
  }
  async function savePendingReceipts(id){try{const rows=await call('listSavedDocuments',[id]);if(!Array.isArray(rows))return;for(const row of rows.filter(r=>r.pending&&r.documentType!=='contract'))await call('retrySavedDocument',[id,row.requestId,idToken()]);}catch(_){/* Durable pending work is visible on the booking. */}}
  async function rpc(name,...args){
    if(name==='getLedger')return call('workflowGetLedger',[]);
    if(name==='betaCommand')return moneyCall('workflowMutate',args);
    if(name==='getLedgerContractAudience')return call(name,args);
    if(['createContract','listSavedDocuments','getSavedDocument','retrySavedDocument'].includes(name)){
      const sent=name==='createContract'&&args[2]?[args[0],args[1],{...args[2],idToken:idToken()}]:['getSavedDocument','retrySavedDocument'].includes(name)?[...args,idToken()]:args;
      try{return await call(name,sent);}catch(e){if(!/function.*(not found|not exist|undefined)|script function not found|unknown function/i.test(e.message))throw e;
        if(name==='createContract')return call(name,args.slice(0,2));
        if(name==='listSavedDocuments')return {unavailable:true};
        return {unavailable:true};
      }
    }
    // Legacy endpoints preserve retries submitted by tabs open before the rollout.
    if(name==='createBooking'||name==='recordPayment')return moneyCall(name,args);
    if(name==='cancelBooking'){
      const r=records.find(r=>r.id===args[0]);if(!r)throw Error('Choose a booking.');
      return call('workflowMutate',[{type:'cancel',bookingId:r.id,expectedRevision:r.revision,values:{reason:args[1]}},args[2]]);
    }
    throw Error('Unknown ledger action. Refresh the app.');
  }
  return {rpc,remote:true};
})();
