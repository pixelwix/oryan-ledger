// Synthetic preview assets only; never a legal contract or payment receipt.
export const previewPDF='%PDF-1.4\n% SYNTHETIC PREVIEW - NOT A CONTRACT OR RECEIPT\n%%EOF';
export function previewDocuments(){return [
 {id:'contract-preview-089',request_id:'contract-preview-089',booking_id:'sophia',kind:'contract',filename:'Contract_C-2026-089.pdf',page_count:5,generated_at:'2026-10-16T12:00:00.000Z',status:'saved',preview:true,display:'5 pages · Generated Oct 16, 2026'},
 {id:'receipt-preview-089',request_id:'receipt-preview-089',booking_id:'sophia',kind:'receipt',filename:'Receipt_RCP-089-2.pdf',page_count:1,generated_at:'2026-11-10T12:00:00.000Z',status:'saved',preview:true,display:'$1,950.00 paid · Nov 10, 2026'}];}
export function fixtureDocuments(detail,today){const rows=previewDocuments();return {
 documents:async id=>{const record=detail(id);for(const tx of [...record.payments,...record.refunds,...record.depositTransactions].filter(t=>t.id.startsWith('local-'))){const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(tx.id))),key='receipt-'+[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');if(!rows.some(r=>r.id===key))rows.push({id:key,request_id:key,booking_id:id,kind:'receipt',filename:'Synthetic-Receipt-Preview.pdf',page_count:1,generated_at:today+'T12:00:00.000Z',status:'saved',preview:true});}return rows.filter(r=>r.booking_id===id);},
 async createContract(id,values,requestId){const r={id:requestId,request_id:requestId,booking_id:id,kind:'contract',filename:'Preview.pdf',page_count:detail(id).lines?.extras?.some(e=>!e.key)?6:5,generated_at:today+'T12:00:00.000Z',status:'saved',preview:true};rows.push(r);return r;},
 retryDocument:async id=>rows.find(r=>r.id===id),issueReceipt:async(bookingId,requestId)=>rows.find(r=>r.booking_id===bookingId&&r.id===requestId),
 downloadDocument:async()=>({blob:new Blob([previewPDF],{type:'application/pdf'}),filename:'SYNTHETIC-PREVIEW.pdf',preview:true})
 };}
