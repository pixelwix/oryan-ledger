/* Fictional PDF generator and immutable browser copies. No private contract wording. */
const BetaContracts = (() => {
 const key='oryan-beta-contract-copies-v1',templateVersion='fictional-summary-1',limit=2000000;
 const read=()=>JSON.parse(localStorage.getItem(key)||'[]');
 function pdf(lines){
  const safe=s=>String(s).replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&');
  const content='BT /F1 12 Tf 50 740 Td '+lines.map((s,i)=>(i?'0 -22 Td ':'')+'('+safe(s)+') Tj').join('\n')+' ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream'];
  let out='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
  const start=out.length;out+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';return btoa(out);
 }
 function create(r,v,id){
  if(!r||r.cancelled||r.type==='Blackout')throw Error('Choose an active event booking.');
  const total=r.total==null?Ledger.cents(v.missingPrice):Ledger.cents(r.total),initial=Ledger.cents(v.initial);
  if(initial>total)throw Error('Initial amount exceeds agreed price.');
  const copy={id,bookingId:r.id,createdBy:'Beta tester',createdAt:new Date().toISOString(),totalCents:total,templateVersion,filename:'Oryan-beta-contract-'+id+'.pdf'};
  const rates=Ledger.pricing(r.date).rates, dollars=cents=>'$'+(cents/100).toFixed(0);
  copy.base64=pdf(['BETA - FICTIONAL CONTRACT SAMPLE','Summary only - no private contract terms or signatures',r.client,'Booking: '+r.contract,'Event date: '+r.date,'Rental: '+v.start+' to '+v.end,'Agreed event total: $'+(total/100).toFixed(2),'Initial scheduled: $'+(initial/100).toFixed(2),'Remaining scheduled: $'+((total-initial)/100).toFixed(2),'Extras: '+Ledger.extrasList(r).filter(x=>x!=='Security').join(', '),'Bar: included free','Security: '+(r.security?v.securityHours+' hours at '+dollars(rates.security)+'/hour, separate':'not selected'),'Hall rates: Fri/Sat '+dollars(rates.weekend)+'; Sun '+dollars(rates.sunday)+'; Mon-Thu '+dollars(rates.weekday),'Federal holidays (actual date): '+dollars(rates.holiday),'Covers '+dollars(rates.covers)+'; Sound '+dollars(rates.audio)+'; Projector '+dollars(rates.projector),'Created by: '+copy.createdBy,'Created: '+copy.createdAt,'Template: '+templateVersion]);return copy;
 }
 async function save(copy){
  if(!navigator.locks)throw Error('This browser cannot safely save copies. Download the PDF and use a current browser.');
  return navigator.locks.request(key,()=>{
   const copies=read(),existing=copies.find(c=>c.id===copy.id);
   if(existing){if(JSON.stringify(existing)!==JSON.stringify(copy))throw Error('Copy identity is already in use.');return existing;}
   const json=JSON.stringify([...copies,copy]);if(json.length>limit)throw Error('Beta copy storage is full. Download this PDF; reset beta data only after saving copies you need.');
   try{localStorage.setItem(key,json);}catch{throw Error('Browser storage is unavailable or full. Download this PDF and retry saving its copy.');}return copy;
  });
 }
 return {create,save,list:id=>read().filter(c=>c.bookingId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)),get:(id,bookingId)=>read().find(c=>c.id===id&&c.bookingId===bookingId),reset:()=>localStorage.removeItem(key)};
})();
