import {shiftDay} from './due-date.mjs?v=2.4.0';

export function reminderEligible(record,today){
 return !record.cancelled&&!record.archived&&record.type!=='Blackout'&&record.date>today&&record.financialTotal>record.paid&&record.financialTotal!=null;
}
export function reminderFields(record){
 return {
  firstName:String(record.client||'').trim().split(/\s+/)[0].replace(/[^\p{L}\p{M}\p{N}'’.-]/gu,'').slice(0,60),
  eventDate:record.date,amountDueCents:Math.round((record.financialTotal-record.paid)*100),dueDate:record.due||shiftDay(record.date,-20)
 };
}
// The standalone Apps Script helper has the same wording. Round 15 tests compare both versions.
export function reminderMessage_(r){
 const day=value=>new Date(value+'T00:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const subject="Payment reminder from O'Ryan Event Center";
 const body="Hello"+(r.firstName?' '+r.firstName:'')+",\n\nThis is a friendly reminder that the remaining balance of $"+(r.amountDueCents/100).toFixed(2)+" for your event on "+day(r.eventDate)+" is due on "+day(r.dueDate)+". If you have already sent your payment, thank you, and please disregard this note.\n\nIf you have any questions, just reply to this email.\n\nThank you,\nO'Ryan Event Center\n786 University Avenue West, St. Paul, MN 55104";
 return {subject,body};
}
