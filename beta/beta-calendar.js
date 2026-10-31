/* RFC 5545 all-day iCalendar snapshots. No network, invitations or private booking notes. */
const BetaCalendar = (() => {
  const text = value => String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function fold(line){let result='',part='',bytes=0;for(const ch of line){const n=ch.codePointAt(0),size=n<128?1:n<2048?2:n<65536?3:4;if(bytes+size>75){result+=part+'\r\n';part=' ';bytes=1;}part+=ch;bytes+=size;}return result+part;}
  const date = d => Ledger.date(d).replace(/-/g,'');
  function end(d){const n=new Date(d+'T12:00:00Z');n.setUTCDate(n.getUTCDate()+1);return n.toISOString().slice(0,10).replace(/-/g,'');}
  function build(records,options={},at){
    if(!at||!Number.isFinite(Date.parse(at)))throw Error('Calendar export time is required.');
    const testing=options.testing!==false;
    const stamp=new Date(at).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const rows=['BEGIN:VCALENDAR','VERSION:2.0',testing?'PRODID:-//Oryan Event Center//Workflow Beta//EN':'PRODID:-//Oryan Event Center//Ledger//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];let count=0;
    const add=(r,kind,day,title,description)=>{rows.push('BEGIN:VEVENT','UID:oryan-'+(testing?'beta-':'')+kind+'-'+encodeURIComponent(r.id)+'@ledger.oryaneventcenter.com','DTSTAMP:'+stamp,'SEQUENCE:'+Math.max(0,Math.floor(r.revision||0)),'DTSTART;VALUE=DATE:'+date(day),'DTEND;VALUE=DATE:'+end(day),'SUMMARY:'+text(title),'DESCRIPTION:'+text(description),'LOCATION:'+text('O’Ryan Event Center'),'CLASS:PRIVATE','STATUS:CONFIRMED','TRANSP:'+(kind==='payment'?'TRANSPARENT':'OPAQUE'),'END:VEVENT');count++;};
    for(const r of records){
      if(r.cancelled)continue;
      if(r.type==='Blackout'&&options.includeBlocked===false)continue;
      add(r,'booking',r.date,(r.type==='Blackout'?'Blocked date — ':r.type+' — ')+r.client,`${testing?'Fictional workflow beta. ':''}Contract #${r.contract}. All-day reservation; rental hours are not stored. This file is a snapshot, not a live subscription.`);
      if(options.includeDue&&r.type!=='Blackout'&&r.financialTotal!=null&&r.financialTotal-r.paid>0&&r.due){
        add(r,'payment',r.due,'Payment due — '+r.client,`${testing?'Fictional workflow beta. ':''}Event balance $${(Math.round((r.financialTotal-r.paid)*100)/100).toFixed(2)}. Contract #${r.contract}. Security deposits are separate.`);
      }
    }
    if(!count)throw Error('No active bookings match this calendar export.');
    rows.push('END:VCALENDAR');return rows.map(fold).join('\r\n')+'\r\n';
  }
  return {build};
})();
