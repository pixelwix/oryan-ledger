// UI limits follow the existing engine; refunds have no source-payment allocation.
const cents=value=>Math.round(Number(value||0)*100);
export function bookingTransactions(record){
 const voids=record.voids||[];
 return [
  ...(record.openingPaid>0?[{id:'opening:'+record.id,amount:record.openingPaid,date:record.openingDate||'',method:record.openingMethod||'',category:'payment',opening:true}]:[]),
  ...(record.payments||[]).map(t=>({...t,category:'payment'})),
  ...(record.refunds||[]).map(t=>({...t,category:'refund'})),
  ...(record.depositTransactions||[]).map(t=>({...t,category:'deposit'}))
 ].map(t=>({...t,voided:voids.some(v=>v.targetId===t.id)}));
}
export function transactionActions(record,transactionId){
 const transaction=bookingTransactions(record).find(t=>t.id===transactionId);
 if(!transaction)return null;
 const deposit=transaction.category==='deposit';
 const canReturn=!transaction.voided&&(transaction.category==='payment'||deposit&&transaction.kind==='receive');
 const capCents=canReturn?Math.max(0,Math.min(cents(transaction.amount),cents(deposit?record.depositHeld:record.paid))):0;
 return {transaction,canVoid:!transaction.voided,canReturn:capCents>0,cap:capCents/100,
  capMessage:deposit?'Returns cannot exceed this entry or the security deposit currently held.':'Returns are not linked to individual payments in this ledger. The limit is the smaller of this payment and net valid event payments; earlier refunds reduce the net limit.'};
}
export function transactionCommand(record,transactionId,action,values){
 const policy=transactionActions(record,transactionId);
 if(!policy||action==='void'&&!policy.canVoid||action==='return'&&!policy.canReturn)throw Error('This transaction is no longer available for this action.');
 const reason=String(values.reason||'').trim();
 if(!reason||reason.length>500)throw Error('Enter a reason of 1 to 500 characters.');
 if(action==='void')return {type:'void',values:{targetId:transactionId,reason}};
 if(action!=='return')throw Error('Choose Void or Return.');
 const amount=Number(values.amount);
 if(!Number.isFinite(amount)||amount<=0||amount>policy.cap)throw Error('Return amount must be greater than zero and cannot exceed '+policy.cap.toFixed(2)+'.');
 return {type:policy.transaction.category==='deposit'?'deposit':'refund',values:{amount,date:values.date,method:values.method,note:values.note||'',reason,...(policy.transaction.category==='deposit'?{kind:'refund'}:{})}};
}
