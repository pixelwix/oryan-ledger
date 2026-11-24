import {validDocumentEmail} from './document-email-address.mjs?v=2.11.2';
import {contractFields_} from './document-fields.mjs?v=2.11.2';
// Synthetic preview assets only; never a legal contract or payment receipt.
export const previewPDF='%PDF-1.4\n% SYNTHETIC PREVIEW - NOT A CONTRACT OR RECEIPT\n%%EOF';
export function previewDocuments(){return [
 {id:'contract-preview-089',request_id:'contract-preview-089',booking_id:'sophia',kind:'contract',filename:'Contract_C-2026-089.pdf',page_count:5,generated_at:'2026-10-16T12:00:00.000Z',status:'saved',preview:true,display:'5 pages · Generated Oct 16, 2026'},
 {id:'receipt-preview-089',request_id:'receipt-preview-089',booking_id:'sophia',kind:'receipt',filename:'Receipt_RCP-089-2.pdf',page_count:1,generated_at:'2026-11-10T12:00:00.000Z',status:'saved',preview:true,display:'$1,950.00 paid · Nov 10, 2026'}];}
export function fixtureDocuments(detail,today,commands){const rows=previewDocuments();return {
 hasReceipts:id=>rows.some(r=>r.booking_id===id&&r.kind!=='contract'&&r.status==='saved'),
 documents:async id=>{const record=detail(id);for(const tx of [...record.payments,...record.refunds,...record.depositTransactions].filter(t=>t.id.startsWith('local-'))){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(tx.id))),key='receipt-'+[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');if(!rows.some(r=>r.id===key))rows.push({id:key,request_id:key,booking_id:id,kind:'receipt',filename:'Synthetic-Receipt-Preview.pdf',page_count:1,generated_at:new Date().toISOString(),status:'saved',preview:true});}for(const v of record.voids){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('void:'+v.targetId+':'+v.createdAt))),key='void-'+[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');if(!rows.some(r=>r.id===key))rows.push({id:key,request_id:key,booking_id:id,kind:'void',filename:'Synthetic-Void-Preview.pdf',page_count:1,generated_at:v.createdAt,status:'saved',preview:true});}return rows.filter(r=>r.booking_id===id);},
 async createContract(id,values,requestId){const record=detail(id);if(record.cancelled||record.type==='Blackout')throw Object.assign(Error('No contract PDF for this booking.'),{status:400});try{contractFields_(record,values,today);}catch(error){error.status=400;throw error;}const existing=rows.find(r=>r.id===requestId);if(existing)return existing;const r={id:requestId,request_id:requestId,booking_id:id,kind:'contract',filename:'Preview.pdf',page_count:detail(id).lines?.extras?.some(e=>!e.key)?6:5,generated_at:new Date().toISOString(),status:'saved',preview:true};rows.push(r);if(record.contractStatus==='Not prepared')commands('contractStatus',id,{status:'Prepared',date:today,reason:'Contract PDF saved.'});return {...r,record:detail(id)};},
 async emailDocument(id,to,requestId){
  const row=rows.find(r=>r.id===id&&r.status==='saved');
  if(!row||!validDocumentEmail(to))throw Object.assign(Error('Saved PDF or email address unavailable.'),{status:400});
  row.emails??=[];
  const prior=row.emails.find(email=>email.id===requestId);
  if(prior){
   if(prior.to_email!==to)throw Object.assign(Error('This send was started with different details.'),{status:409});
   return {alreadySent:true};
  }
  row.emails.unshift({id:requestId,document_id:id,to_email:to,sent_by:'Preview staff',sent_at:new Date().toISOString(),status:'sent'});
  return {alreadySent:false};
 },
 retryDocument:async id=>rows.find(r=>r.id===id),issueReceipt:async(bookingId,requestId)=>rows.find(r=>r.booking_id===bookingId&&r.id===requestId),
 downloadDocument:async()=>({blob:new Blob([previewPDF],{type:'application/pdf'}),filename:'SYNTHETIC-PREVIEW.pdf',preview:true})
 };}
