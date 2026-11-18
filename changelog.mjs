// What's new, shown from the footer ("v2.x.y · What's new"). Newest entry FIRST.
// RULE: every change staff can notice adds an entry here and bumps the version (the footer number is CHANGELOG[0].version).
// Write for staff, in plain words. Dates are YYYY-MM-DD (Chicago business date).
export const CHANGELOG=[
 {version:'2.1.3',date:'2026-11-18',title:'Security hours on Edit price',items:[
  'Edit price now has the same Security Guard hours box as New booking: enter the hours and the amount is set to hours times $30. A booking that already has a security amount shows its hours.'
 ]},
 {version:'2.1.2',date:'2026-11-18',title:'New booking and calendar fixes',items:[
  'New booking now fills in the hall price for the event date you pick: Friday and Saturday $1,400, Sunday $1,200, Monday to Thursday $1,000, holidays $1,800. You can still change it, and a price you type yourself is never overwritten.',
  'New booking now starts clean: no extras are ticked and the initial down payment is empty unless you enter an amount.',
  'Security Guard: when you tick it, enter the hours needed. The cost is hours times $30 and it is added to the total (the booking also notes the hours).',
  '"Chair & Table Covers" now reads "Extra Chair & Table Covers".',
  'The Calendar\'s "Block a date" button now works: pick a date and say what it is for. Blocked dates can be moved or released later.',
  'The Change date button on a booking is now the same size as the buttons beside it.'
 ]},
 {version:'2.1.1',date:'2026-11-18',title:'Menu and update fixes',items:[
  'The "..." menu now closes when you scroll the page, so it never floats away from its row.',
  'After an update the app now always loads the newest files, which fixes pages (like the Calendar) that showed old or missing events until you cleared your browser data.'
 ]},
 {version:'2.1.0',date:'2026-11-18',title:'Change dates and archive cancellations',items:[
  'Move a booking or a blocked date without changing the price or payments. Saved contracts keep the old date.',
  'Archive cancelled bookings with no remaining charge or credit to clear them from Bookings and Needs attention. Open Archived to bring them back.'
 ]},
 {version:'2.0.6',date:'2026-11-18',title:'Record payment button',items:[
  'The Record payment buttons at the top of Bookings, Overview, Payments and Calendar now ask which booking to record the payment for (search by guest, phone or contract). Before, they opened an error.'
 ]},
 {version:'2.0.5',date:'2026-11-17',title:'Hall capacity matches the contract',items:[
  'New booking: the hall capacity note now reads 153, the same as the maximum occupancy in the contract, and the guest count can be no more than 153.',
  'Insights: the year picker now lists every year that has bookings (not just 2026 and 2027), plus All-time overview.'
 ]},
 {version:'2.0.4',date:'2026-11-17',title:'Hall capacity',items:[
  'New booking: the hall capacity note now reads 150, and the guest count can be no more than 150.',
  'Six old test bookings were removed from the ledger.'
 ]},
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
