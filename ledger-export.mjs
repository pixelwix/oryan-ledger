import {bookingTransactions} from './transaction-actions.mjs?v=2.7.1';
import {depositOwed} from './attention-rules.mjs?v=2.7.1';
import {shiftDay} from './due-date.mjs?v=2.7.1';

const headers = {
 bookings:['Contract','Guest','Phone','Email','Event date','Type','Status','Agreed total','Paid','Balance','Balance due date','Cancellation charge','Deposit status','Deposit held','Settled','Guest count'],
 payments:['Date','Kind','Method','Amount','Voided','Booking contract','Guest']
};
function csvCell(value){
 if(typeof value==='number')return String(value);
 let text=String(value??'');
 if(/^[=+\-@\t\r]/.test(text))text="'"+text;
 return /[",\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;
}
const dollars=value=>value==null?'':{amount:Number(value).toFixed(2)};
const line=fields=>fields.map(value=>value?.amount??csvCell(value)).join(',');
const matches=(date,year)=>year==='all'||date.slice(0,4)===year;
export function exportName(kind,year){
 if(!Object.prototype.hasOwnProperty.call(headers,kind)||!(year==='all'||/^\d{4}$/.test(year)))throw Error('Choose a valid export year.');
 return kind+'-'+year+'.csv';
}
function datedTransactions(record){
 return bookingTransactions(record).filter(t=>t.date&&!(t.opening&&record.imported));
}
const voidDate=(record,transaction)=>transaction.voided?record.voids.find(v=>v.targetId===transaction.id)?.createdAt?.slice(0,10):null;
export function exportYears(records,kind){
 const years=new Set();
 for(const record of records){
  if(kind==='bookings')years.add(record.date.slice(0,4));
  else for(const t of datedTransactions(record)){
   years.add(t.date.slice(0,4));
   const date=voidDate(record,t);
   if(date)years.add(date.slice(0,4));
  }
 }
 return [...years].sort().reverse();
}
export function ledgerCsv(records,kind,year){
 exportName(kind,year);
 const lines=[line(headers[kind])];
 if(kind==='bookings'){
  for(const r of records){
   if(!matches(r.date,year))continue;
   const status=r.archived?'archived':r.cancelled?'cancelled':r.type==='Blackout'?'blocked':'active';
   const deposit=r.depositHeld>0?'Held':r.depositWaiver?'Waived':depositOwed(r)?'Owed':r.depositRefunded>0?'Refunded':r.depositDeducted>0?'Deducted':r.deposit;
   lines.push(line([r.contract,r.client,r.phone,r.email,r.date,r.type,status,dollars(r.total),dollars(r.paid),
    dollars(r.financialTotal==null?null:Math.max(0,r.financialTotal-r.paid)),r.cancelled?r.cancellationDue:r.type==='Blackout'?'':r.due||shiftDay(r.date,-20),
    dollars(r.cancellationFee),deposit,dollars(r.depositHeld),r.settled?'Yes':'No',r.guestCount]));
  }
 }else{
  const payments=[];
  for(const r of records)for(const t of datedTransactions(r)){
   const kind=t.category==='deposit'?'deposit '+t.kind:t.category;
   const amount=t.category==='refund'||t.category==='deposit'&&t.kind!=='receive'?-t.amount:t.amount;
   if(matches(t.date,year))payments.push([t.date,kind,t.method,dollars(amount),t.voided?'Yes':'No',r.contract,r.client]);
   const date=voidDate(r,t);
   if(date&&matches(date,year))payments.push([date,'void',t.method,dollars(-amount),'Yes',r.contract,r.client]);
  }
  for(const row of payments.sort((a,b)=>b[0].localeCompare(a[0])))lines.push(line(row));
 }
 return '\ufeff'+lines.join('\r\n')+'\r\n';
}
export function downloadBlob(blob,filename){
 const url=URL.createObjectURL(blob), link=document.createElement('a');
 link.href=url;
 link.download=filename;
 link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
