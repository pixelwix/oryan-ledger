// What's new, shown from the footer ("v2.x.y · What's new"). Newest entry FIRST.
// RULE: every change staff can notice adds an entry here and bumps the version (the footer number is CHANGELOG[0].version).
// Write for staff, in plain words. Dates are YYYY-MM-DD (Chicago business date).
export const CHANGELOG=[
 {version:'2.7.1',date:'2026-11-22',title:'Steadier booking toolbar',items:[
  'The booking action bar no longer lets the page show through above it while you scroll.',
  'Request payment link is back on bookings with a balance (a release dropped the Square settings for a few hours; nothing was recorded or sent).'
 ]},
 {version:'2.7.0',date:'2026-11-21',title:'Send more emails from a booking',items:[
  'Open Documents → Send email… to preview and send booking confirmations, paid-in-full summaries, refund notices, cancellation notices and event reminders.',
  'The booking history records each confirmed send.',
  'The More menu shows the correct action when you reopen a cancelled booking.'
 ]},
 {version:'2.6.0',date:'2026-11-21',title:'A simpler booking action bar',items:[
  'Record payment, Request payment link and Email reminder are easy to find at the top of a booking whenever they apply.',
  'Open Documents for PDFs and receipts, Edit to update booking details, pricing or dates, and More to book again, cancel or archive. On a phone the menus sit together below the payment buttons.'
 ]},
 {version:'2.5.0',date:'2026-11-21',title:'Square payment links by email, and receipt-style emails',items:[
  'The owner can send a customer a Square payment link from a booking ("Request payment link"), for any amount from $1.00 up to the balance. The sheet shows the exact email first and sends it to the customer\u2019s address (you can change it, or create the link without emailing). Each link works once, and nothing is recorded in the ledger until the owner confirms the payment.',
  'Payments shows "Square payments to review": completed Square payments from the last 14 days. The owner checks the amount and booking, then records each one with a single click. A payment that matches no link needs the owner to choose its booking first.',
  'Payment reminder, contract and receipt emails now look like the receipt: the venue name and address, a gold title, the amount or attached document in a cream box, and the details below. The PDFs are still attached, and the wording is unchanged. The Email reminder preview shows exactly what the customer will receive.',
  'The Square controls stay hidden for everyone until Square is connected, so nothing about payments changes for staff yet.'
 ]},
 {version:'2.4.0',date:'2026-11-20',title:'Insights by month, steadier header, spaced buttons',items:[
  'On Insights, click any month in the chart to see just that month: the three totals, the celebration mix and the day-of-the-week chart all switch to it. Click the month again, or use Show whole year, to go back. Changing the year also goes back to the whole year.',
  'The highlighted bar on Insights now marks the real peak month. It used to be stuck on June.',
  'The header no longer shifts sideways on Calendar and Payments. Those pages are shorter, so they had no scrollbar, which moved everything a few pixels.',
  'Cancel and Save are no longer touching on the deposit, refund, contract status and payment follow-up sheets, the payment picker and the sign-in prompts. They now sit apart on the right, like the other sheets.'
 ]},
 {version:'2.3.0',date:'2026-11-18',title:'Cancellation charges, booking details and exports',items:[
  'Confirm cancellations with a reason and a charge that starts at the amount already paid. You can also set the charge on older cancellations.',
  'Use Edit details to update the guest, contact information, event type, headcount, rental hours or notes. Changing the guest name or event type resets the contract status.',
  'Search Bookings by email, use Book again to start a new reservation with the same guest details, or block up to 31 dates at once.',
  'Download Bookings and Payments as CSV files for a year or for all years, and export upcoming events from Calendar.',
  'Preview and send a payment reminder from the booking page. The ledger records each confirmed send.'
 ]},
 {version:'2.2.2',date:'2026-11-18',title:'One steady header',items:[
  'The header and its tabs (Overview, Bookings, Calendar, Payments, Insights) no longer move when you switch pages: it is one header on every page, and only the page below it changes.',
  'The header buttons are the same on every page: Overview no longer shows the "St. Paul · Live" tag, and Payments shows "+ New booking" (Record payment is still on the Payments page itself).'
 ]},
 {version:'2.2.1',date:'2026-11-18',title:'Button sizes: Email and Unarchive',items:[
  'The Email to customer button under Saved copies is now the same size as the Download button beside it (it was larger).',
  'Unarchive on an archived booking now sits with the other buttons at the top of the booking, the same size as them, instead of inside the "Archived on" line.'
 ]},
 {version:'2.2.0',date:'2026-11-18',title:'Email saved PDFs, edit contact info, payment reminders',items:[
  'Needs attention now reminds the team: "Balance due today" 20 days before the event, "Final balance deadline" from 14 days before if the balance is still unpaid, and "Security deposit not received" from 7 days before if the deposit is still owed.',
  'New booking: the refundable damage deposit now starts as "Owed before event". It only records a received deposit if you choose "Received & Held".',
  'The balance is due 20 days before the event, and never later than 14 days before it. The contract PDF now prints the same date as the ledger.',
  'The contract\'s Initial payment now starts with the amount already recorded as paid.',
  'Edit contact info: change a booking\'s phone number or email at any time from the booking page. The price, date and payments are not touched.',
  'Send a saved contract or receipt from the booking page. Confirm the customer’s email address before sending and see the latest send under Saved copies.'
 ]},
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
