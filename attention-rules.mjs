// Team reminders shown in Needs attention (owner rules, 2026-11-18; in-app only, the contract is unchanged):
//   deadline    - 14 days before the event (or later) and the balance is still unpaid  -> "Final balance deadline"
//   overdue     - past the due date (20 days before the event) but before the 14-day mark -> existing "Overdue" row
//   due         - the balance is due today (20 days before the event)                    -> "Balance due today"
//   depositDue  - 7 days before the event (or less) and the security deposit is still "Owed" -> "Security deposit not received"
// worker/read-path.mjs mirrors these rules in SQL; worker/test/attention-rules.test.mjs proves both agree.
import {shiftDay} from './due-date.mjs?v=2.6.0';
export const DEPOSIT_AMOUNT=600;
const upcoming=(r,today)=>r.date>=today&&!r.cancelled&&r.type!=='Blackout';
export function balanceAlert(r,today){
 if(!upcoming(r,today)||!(r.balance>0))return null;
 const due=r.due||shiftDay(r.date,-20);                       // older bookings have no stored due date: the screens use 20 days before
 if(today>=shiftDay(r.date,-14))return 'deadline';
 if(due<today)return 'overdue';
 if(due===today)return 'due';
 return null;
}
export function depositAlert(r,today){
 return upcoming(r,today)&&!!r.depositOwed&&r.date<=shiftDay(today,7);
}
// A booking record (full engine record) -> the flag the rules use.
export function depositOwed(record){
 return record.deposit==='Owed'&&!(record.depositTransactions&&record.depositTransactions.length)&&!record.depositWaiver;
}
