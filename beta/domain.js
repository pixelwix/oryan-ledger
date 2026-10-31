/* Shared validation and money rules, also shipped to Google Apps Script. */
const Ledger = (() => {
  const types = ['Wedding', 'Birthday', 'Baby Shower', 'Bridal Shower', 'Graduation', 'Engagement', 'Business', 'Quinceañera', 'Baptism', 'Blackout', 'Other'];
  const methods = ['Cash', 'Card', 'Zelle', 'CashApp', 'Venmo', 'Check', 'Other'];
  const deposits = ['Unknown', 'Owed', 'Not Refunded', 'Refunded'];
  function text(value, limit = 500) { return String(value == null ? '' : value).trim().slice(0, limit); }
  // Format only complete US numbers; preserve incomplete, international and free text verbatim.
  function phone(value) {
    const raw = String(value ?? '');
    if (!/^[\d\s()+.-]+$/.test(raw)) return raw;
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
    else if (raw.trim().startsWith('+')) return raw;
    return digits.length === 10 ? '(' + digits.slice(0,3) + ')' + digits.slice(3,6) + '-' + digits.slice(6) : raw;
  }
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
  // Pure cents-based suggestion. Stored agreed prices are never recalculated here.
  function pricing(value, extras = {}) {
    if (extras.type === 'Blackout' || !value) return null;
    const d = new Date(value + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+d) || d.toISOString().slice(0, 10) !== value) throw Error('Choose a valid date.');
    const year = d.getUTCFullYear(), weekday = d.getUTCDay();
    const utc = (month, day) => { const result = new Date(0); result.setUTCFullYear(year, month - 1, day); return result; };
    const nth = (month, day, n) => utc(month, 1 + (day - utc(month, 1).getUTCDay() + 7) % 7 + 7 * (n - 1)).toISOString().slice(5, 10);
    const memorial = utc(6, 0);
    memorial.setUTCDate(memorial.getUTCDate() - (memorial.getUTCDay() + 6) % 7);
    // Actual dates only; there are no observed-weekday substitutions.
    const holidays = {
      '01-01': "New Year's Day", [nth(1, 1, 3)]: 'Martin Luther King Jr. Day',
      [nth(2, 1, 3)]: "Presidents' Day", [memorial.toISOString().slice(5, 10)]: 'Memorial Day',
      '06-19': 'Juneteenth', '07-04': 'Independence Day', [nth(9, 1, 1)]: 'Labor Day',
      [nth(10, 1, 2)]: 'Columbus Day', '11-11': 'Veterans Day', [nth(11, 4, 4)]: 'Thanksgiving', '12-25': 'Christmas Day'
    };
    const rates = {weekend:140000, sunday:120000, weekday:100000, holiday:180000, covers:20000, audio:10000, projector:10000, security:3000};
    const holiday = holidays[value.slice(5)] || '';
    const hallCents = holiday ? rates.holiday : weekday === 5 || weekday === 6 ? rates.weekend : weekday === 0 ? rates.sunday : rates.weekday;
    const parts = [{label: holiday || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday] + ' rate', cents: hallCents}];
    for (const [key, label] of [['covers', 'Table Covers'], ['audio', 'Sound'], ['projector', 'Projector']]) {
      if (extras[key] || (key === 'audio' && extras.sound)) parts.push({label, cents: rates[key]});
    }
    return {rates, holiday, hallCents, totalCents: parts.reduce((sum, part) => sum + part.cents, 0), parts, securityHourlyCents: rates.security};
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
  return { phone, pricing, types, methods, deposits, text, cents, date, booking, payment, balance, review, extrasList };
})();
