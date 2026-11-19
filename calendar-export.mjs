export function bookingIcs(r){return calendarIcs([r]);}

export function calendarIcs(records,now=new Date()){
 const escape=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Oryan//Ledger//EN'];
 for(const r of records){
  const next=new Date(r.date+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  lines.push('BEGIN:VEVENT','UID:'+escape(r.id)+'@oryan.local','DTSTAMP:'+stamp,
   'DTSTART;VALUE=DATE:'+r.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replace(/-/g,''),
   'SUMMARY:'+escape(r.client+' · '+r.type),'DESCRIPTION:'+escape(r.contract));
  if(r.cancelled)lines.push('STATUS:CANCELLED');
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 const encoder=new TextEncoder();
 return lines.map(line=>{let out='',bytes=0;for(const c of line){const n=encoder.encode(c).length;if(bytes+n>75){out+='\r\n ';bytes=1;}out+=c;bytes+=n;}return out;}).join('\r\n')+'\r\n';
}
