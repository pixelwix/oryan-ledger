// Calendar days for the venue. UTC remains the timestamp format.
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'});
export function businessToday(now=new Date()){
 const parts=Object.fromEntries(formatter.formatToParts(new Date(now)).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function localTodayOverride(value,origin){
 try{const url=new URL(origin);if(!['http:','https:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return undefined;}catch{return undefined;}
 return /^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value?value:undefined;
}
