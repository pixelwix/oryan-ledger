// Balance due date (owner rule 2026-11-18): 20 days before the event, and never later than 14 days before it.
// Booked far ahead -> 20 days before. If 20 days before has already passed (a late booking) -> 14 days before.
// If 14 days before has passed too, the contract dialog asks staff to confirm the payment schedule.
export function shiftDay(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function balanceDueDate(eventDate,today){
 const standard=shiftDay(eventDate,-20);
 return standard>=today?standard:shiftDay(eventDate,-14);
}
