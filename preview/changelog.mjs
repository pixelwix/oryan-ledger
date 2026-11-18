// What's new, shown from the footer ("v2.x.y · What's new"). Newest entry FIRST.
// RULE: every change staff can notice adds an entry here and bumps the version (the footer number is CHANGELOG[0].version).
// Write for staff, in plain words. Dates are YYYY-MM-DD (Chicago business date).
export const CHANGELOG=[
 {version:'2.0.3',date:'2026-11-17',title:'Overview first, deposit and capacity',items:[
  'Overview is now the first screen after you sign in, so what needs your attention is the first thing you see.',
  'Clicking the O\u2019Ryan logo takes you to the Overview.',
  'New booking: the hall capacity note reads 250 (150 seated), and a refundable damage deposit is $600.'
 ]},
 {version:'2.0.2',date:'2026-11-17',title:'Latest events first',items:[
  'Bookings now show the latest events first instead of the earliest.',
  'The footer shows the version number, and "What\'s new" lists what changed (this list).'
 ]},
 {version:'2.0.1',date:'2026-11-17',title:'Go-live fixes',items:[
  'Balance to collect leaves out settled events and says how much it left out.',
  'The Overview and Calendar show today\'s real date, and today is marked on the calendar.',
  'Booked days show a marker on the calendar.',
  'Cancelled bookings no longer show up as "Past event not marked settled".',
  'Insights and history wording cleaned up.',
  'Contracts and receipts wait longer for the first save of a new booking.'
 ]},
 {version:'2.0.0',date:'2026-11-17',title:'The new ledger',items:[
  'New ledger for phone and computer, with Google sign-in.',
  'Void and Return buttons on payments.',
  'Contracts and receipts are saved to Drive from the ledger.'
 ]}
];
export const VERSION=CHANGELOG[0].version;
