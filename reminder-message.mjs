import {shiftDay} from './due-date.mjs?v=2.8.0';

export function reminderEligible(record,today){
 return !record.cancelled&&!record.archived&&record.type!=='Blackout'&&record.date>today&&record.financialTotal>record.paid&&record.financialTotal!=null;
}
export function reminderFields(record){
 return {
  firstName:String(record.client||'').trim().split(/\s+/)[0].replace(/[^\p{L}\p{M}\p{N}'’.-]/gu,'').slice(0,60),
  eventDate:record.date,amountDueCents:Math.round((record.financialTotal-record.paid)*100),dueDate:record.due||shiftDay(record.date,-20)
 };
}
// The Apps Script helper carries a copy of the same template; tests compare both (see v2/email-template.mjs).
export {reminderMessage_} from './email-template.mjs?v=2.8.0';
