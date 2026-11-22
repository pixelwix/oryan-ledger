import {businessToday} from './business-date.mjs?v=2.7.1';
import {shiftDay} from './due-date.mjs?v=2.7.1';
import {reminderFields} from './reminder-message.mjs?v=2.7.1';

export const bookingEmailLabels = Object.freeze({
 confirmation:'Booking confirmation', paid:'Paid in full', refund:'Refund notice',
 cancellation:'Cancellation notice', event:'Event reminder'
});

const cents = value => Number.isFinite(value) ? Math.round(value * 100) : null;

export function bookingRefunds(record) {
 return [...(record.refunds || []), ...(record.depositTransactions || []).filter(t => t.kind === 'refund')]
  .filter(t => t.amount > 0 && !record.voids?.some(v => v.targetId === t.id));
}

export function bookingEmailKinds(record,today) {
 if (record.type === 'Blackout') return [];
 const kinds = [];
 if (!record.cancelled) {
  kinds.push('confirmation');
  if (record.financialTotal != null && cents(record.financialTotal) === cents(record.paid)) kinds.push('paid');
 }
 if (bookingRefunds(record).length) kinds.push('refund');
 if (record.cancelled) kinds.push('cancellation');
 if (!record.cancelled && record.date > today && record.date <= shiftDay(today,7)) kinds.push('event');
 return kinds;
}

export function bookingEmailFields(record,kind,refundId) {
 const {firstName,eventDate} = reminderFields(record);
 const total = cents(record.financialTotal), paid = cents(record.paid);
 const balance = total == null || paid == null ? null : Math.max(0,total-paid);
 const hours = record.rentalWindow?.start && record.rentalWindow?.end
  ? record.rentalWindow.start+'–'+record.rentalWindow.end : undefined;
 const facts = {};
 if (kind === 'confirmation' || kind === 'event') facts.hours = hours;
 if (kind === 'confirmation') Object.assign(facts,{eventType:record.type,guests:record.guestCount,total,paid,balance,depositHeld:record.depositHeld>0?cents(record.depositHeld):undefined});
 if (kind === 'paid') Object.assign(facts,{total,paid,balance});
 if (kind === 'refund') {
  const refund = bookingRefunds(record).find(t => t.id === refundId);
  if (!refund) return null;
  Object.assign(facts,{amount:cents(refund.amount),method:refund.method,refundDate:refund.date||undefined,
   security:record.depositTransactions?.some(t => t.id === refund.id) || false});
 }
 if (kind === 'cancellation') {
  const at = Date.parse(record.cancelledAt);
  const refunds = bookingRefunds(record).filter(t => record.refunds?.some(r => r.id === t.id));
  Object.assign(facts,{cancelledOn:/^\d{4}-\d{2}-\d{2}$/.test(record.cancelledAt||'')?record.cancelledAt:Number.isFinite(at)?businessToday(new Date(at)):undefined,
   refunded:refunds.length?cents(refunds.reduce((sum,t)=>sum+t.amount,0)):undefined,
   retained:record.cancellationFee != null && paid != null ? Math.min(cents(record.cancellationFee),paid) : undefined,
   depositReturned:record.depositRefunded>0?cents(record.depositRefunded):undefined,
   depositDeducted:record.depositDeducted>0?cents(record.depositDeducted):undefined});
 }
 if (kind === 'event') Object.assign(facts,{hall:typeof record.hall==='string'?record.hall:undefined,balance,url:balance>0?record.bookingEmailLink?.url:undefined,linkAmount:balance>0?record.bookingEmailLink?.amountCents:undefined});
 return {firstName,eventDate,kind,facts:Object.fromEntries(Object.entries(facts).filter(([,value])=>value!=null))};
}
