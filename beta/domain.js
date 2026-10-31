/* Shared validation and money rules, also shipped to Google Apps Script. */
const Ledger = (() => {
  const types = ['Wedding', 'Birthday', 'Baby Shower', 'Bridal Shower', 'Graduation', 'Engagement', 'Business', 'Quinceañera', 'Baptism', 'Blackout', 'Other'];
  const methods = ['Cash', 'Card', 'Zelle', 'CashApp', 'Venmo', 'Check', 'Other'];
  const deposits = ['Unknown', 'Owed', 'Not Refunded', 'Refunded'];
  function text(value, limit = 500) { return String(value == null ? '' : value).trim().slice(0, limit); }
  function cents(value) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value.trim()))) throw Error('Enter a valid amount with no more than two decimal places.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 1000000 || Math.abs(n * 100 - Math.round(n * 100)) > 0.00001) throw Error('Enter an amount between $0 and $1,000,000 with no more than two decimals.');
    return Math.round(n * 100);
  }
  function date(value, optional = false) {
    if (optional && !value) return '';
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Choose a valid date.');
    const d = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== value || +value.slice(0, 4) < 1900 || +value.slice(0, 4) > 2100) throw Error('Choose a valid date between 1900 and 2100.');
    return value;
  }
  function booking(input) {
    if (!input || typeof input !== 'object') throw Error('Booking details are required.');
    const client = text(input.client, 150), total = cents(input.total), paid = cents(input.paid);
    if (!client) throw Error('Enter the guest’s name.');
    if (!types.includes(input.type)) throw Error('Choose an event type.');
    if (paid > total) throw Error('The initial event payment cannot exceed the agreed price. Track security deposits separately.');
    if (paid && !methods.includes(input.method)) throw Error('Choose a payment method.');
    const eventDate = date(input.date), due = date(input.due, true);
    if (due && due > eventDate) throw Error('The balance due date must be on or before the event.');
    const isAudio = input.audio === true || input.sound === true;
    const isCovers = input.covers === true || /covers\+/i.test(input.notes || '');
    const isProjector = input.projector === true || /projector/i.test(input.notes || '');
    let notes = text(input.notes, 2000);
    const extraTags = [];
    if (input.covers === true && !/covers\+/i.test(notes)) extraTags.push('Covers+');
    if (input.projector === true && !/projector/i.test(notes)) extraTags.push('Projector');
    if (extraTags.length) {
      notes = notes ? `${notes}\nExtras: ${extraTags.join(', ')}` : `Extras: ${extraTags.join(', ')}`;
    }
    return { client, phone: text(input.phone, 40), contract: text(input.contract, 60), type: input.type, date: eventDate, total: total / 100, paid: paid / 100,
      paymentDate: paid ? date(input.paymentDate) : '', method: paid ? input.method : '', due, deposit: deposits.includes(input.deposit) ? input.deposit : 'Unknown',
      covers: isCovers, projector: isProjector, audio: isAudio, bar: input.bar === true, sound: isAudio, security: input.security === true, notes };
  }
  function payment(input, record) {
    if (!input || !record) throw Error('Choose a booking.');
    if (record.cancelled && !record.beta) throw Error('This booking is cancelled. New payments cannot be recorded.');
    const charge=record.beta?record.financialTotal:record.total;
    if (charge == null) throw Error('Enter the agreed price in Oryan Bookings before recording another payment.');
    const amount = cents(input.amount), remaining = Math.max(0, Math.round((charge - record.paid) * 100));
    if (amount <= 0) throw Error('Enter a payment greater than $0.');
    if (amount > remaining) throw Error('This payment exceeds the remaining event balance. Refresh the booking or track a security deposit separately.');
    if (!methods.includes(input.method)) throw Error('Choose a payment method.');
    return { amount: amount / 100, date: date(input.date), method: input.method, note: text(input.note, 500) };
  }
  const balance = r => {const charge=r.beta?r.financialTotal:r.total;return charge==null?0:Math.max(0,Math.round((charge-r.paid)*100)/100);};
  const review = r => (r.beta?r.financialTotal:r.total) == null || (!(r.beta&&r.reconciliation?.resolved) && ( (r.imported && r.sheetBalance == null) || Math.abs(r.importedDifference || 0) > .005));
  const extrasList = r => [r.covers ? 'Covers+' : '', r.projector ? 'Projector' : '', (r.audio || r.sound) ? 'Audio' : '', r.bar ? 'Bar' : '', r.security ? 'Security' : ''].filter(Boolean);
  return { types, methods, deposits, text, cents, date, booking, payment, balance, review, extrasList };
})();
