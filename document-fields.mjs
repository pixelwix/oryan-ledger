import {balanceDueDate} from './due-date.mjs?v=2.2.1';
// Port of v0.8.4 contractFields_; parity is tested against the protected source.
const Ledger=(()=>{
  function text(value, limit = 500) { return String(value == null ? '' : value).trim().slice(0, limit); }
  function cents(value, maximum = 1000000) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value.trim()))) throw Error('Enter a valid amount with no more than two decimal places.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > maximum || Math.abs(n * 100 - Math.round(n * 100)) > 0.00001) throw Error('Enter an amount between $0 and $1,000,000 with no more than two decimals.');
    return Math.round(n * 100);
  }
return {text,cents};})();
function contractDay_(day,offset){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
export function contractFields_(r, input, today) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Enter the contract details.');
  const allowed = ['start','end','address','staff','title','phone','securityHours','initial','method','missingPrice','confirmSchedule'];
  if (Object.keys(input).some(k => !allowed.includes(k))) throw Error('Unexpected contract field. Reopen the form.');
  const field = (key, limit) => {
    if (input[key] != null && typeof input[key] !== 'string') throw Error('Enter valid contract details.');
    const value = input[key] || '';
    if (key !== 'address' && /[\r\n]/.test(value)) throw Error('Use one line for this contract field.');
    if (key === 'address' && value.split(/\r?\n/).length > 4) throw Error('Use no more than four address lines.');
    if (value.trim().length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw Error('A contract field is too long or invalid.');
    return Ledger.text(value, limit);
  };
  const start = field('start', 5), end = field('end', 5);
  if (![start,end].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || start === end) throw Error('Enter different rental start and end times.');
  const totalCents = r.total == null ? Ledger.cents(field('missingPrice', 20)) : Ledger.cents(r.total,11000000);
  if (r.total == null && !field('missingPrice', 20)) throw Error('Enter the missing agreed price for this PDF.');
  if (r.total != null && input.missingPrice) throw Error('The agreed price comes from the ledger. Reopen the form.');
  const initial = Ledger.cents(field('initial', 20));
  if (initial > totalCents) throw Error('The initial amount cannot exceed the agreed price.');
  const deadline = balanceDueDate(r.date, today);
  if (deadline < today && input.confirmSchedule !== true) throw Error('Confirm the payment schedule for this event.');
  if (input.confirmSchedule != null && typeof input.confirmSchedule !== 'boolean') throw Error('Confirm the payment schedule.');
  const method = field('method', 20);
  if (method && !['Cash','Card','Check','CashApp','Venmo','Zelle'].includes(method)) throw Error('Choose an initial payment method or leave it blank.');
  const securityHours = field('securityHours', 5);
  if (r.security && (!/^\d{1,2}(\.\d{1,2})?$/.test(securityHours) || Number(securityHours) <= 0 || Number(securityHours) > 24)) throw Error('Enter security hours between 0 and 24.');
  if (!r.security && securityHours) throw Error('Security is not selected for this booking.');
  const fmt = n => '$' + (n/100).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
  const written = s => { const d=new Date(s+'T12:00:00Z'); return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getUTCMonth()]+' '+d.getUTCDate()+', '+d.getUTCFullYear(); };
  const time = s => {const [h,m]=s.split(':').map(Number);return (h%12||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM');};
  const address=field('address',180), phone=Object.prototype.hasOwnProperty.call(input,'phone') ? field('phone',40) : Ledger.text(r.phone,40);
  const mark = value => value ? '[X] ' : '___';
  return {client:Ledger.text(r.client,150).replace(/\s+/g,' '), today:written(today), date:written(r.date), hours:time(start)+' – '+time(end)+(end<start?' (next day)':''),
    type:Ledger.text(r.type,80), total:fmt(totalCents), initial:fmt(initial), remaining:fmt(totalCents-initial), deadline:deadline.slice(5,7)+'/'+deadline.slice(8)+'/'+deadline.slice(0,4),
    covers:mark(r.covers), audio:mark(r.audio||r.sound), projector:mark(r.projector), security:mark(r.security), bar:mark(r.bar), securityHours:r.security?'('+securityHours+(Number(securityHours)===1?' hour)':' hours)'):'',
    customExtras:(r.lines?.extras||[]).filter(e=>!e.key).map(e=>e.label).join('\n'), staff:field('staff',80), title:field('title',60), contact:[address,phone].filter(Boolean).join('\n'),
    cash:mark(method==='Cash'),card:mark(method==='Card'),check:mark(method==='Check'),cashapp:mark(method==='CashApp'),venmo:mark(method==='Venmo'),zelle:mark(method==='Zelle')};
}
