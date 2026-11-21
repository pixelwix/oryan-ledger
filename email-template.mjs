// HTML + plain-text emails in the receipt's look (Georgia headline, gold rule, cream amount box, small
// uppercase labels, address footer). Email-safe: tables and inline styles only, no scripts, no remote assets.
// The Apps Script helper carries a byte-identical copy of everything between the BEGIN/END markers
// (tests run both and compare the output).
// BEGIN EMAIL_TEMPLATE
var EMAIL_GOLD='#b8963e',EMAIL_INK='#1c1c1c',EMAIL_MUTED='#7a7a7a',EMAIL_CREAM='#faf6ec',EMAIL_CREAM_LINE='#e6d9b3',EMAIL_CREAM_TEXT='#7a6322';
function emailEsc_(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function emailDay_(value){return new Date(value+'T00:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});}
function emailMoney_(cents){return '$'+(cents/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function emailHtml_(o){
 var sans="Helvetica,Arial,sans-serif",serif="Georgia,'Times New Roman',serif";
 var greeting='Hello'+(o.firstName?' '+emailEsc_(o.firstName):'')+',';
 var rows=o.details.map(function(d){return '<tr><td style="padding:10px 0;border-bottom:1px solid #eeeeee;font:10.5px '+sans+';letter-spacing:1.4px;text-transform:uppercase;color:'+EMAIL_MUTED+'">'+emailEsc_(d[0])+'</td><td align="right" style="padding:10px 0;border-bottom:1px solid #eeeeee;font:14px '+sans+';color:'+EMAIL_INK+'">'+emailEsc_(d[1])+'</td></tr>';}).join('');
 var button=o.link?'<tr><td align="center" style="padding:24px 32px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="'+EMAIL_GOLD+'" style="border-radius:6px"><a href="'+emailEsc_(o.link.url)+'" style="display:inline-block;padding:14px 34px;font:bold 15px '+sans+';color:#ffffff;text-decoration:none;border-radius:6px">'+emailEsc_(o.link.label)+'</a></td></tr></table></td></tr>'
  +'<tr><td align="center" style="padding:12px 32px 0;font:12px/1.5 '+sans+';color:'+EMAIL_MUTED+'">If the button does not work, copy this address into your browser:<br><a href="'+emailEsc_(o.link.url)+'" style="color:'+EMAIL_CREAM_TEXT+';word-break:break-all">'+emailEsc_(o.link.url)+'</a></td></tr>':'';
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+emailEsc_(o.title)+'</title></head>'
 +'<body style="margin:0;padding:0;background:#f4f1e8">'
 +'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1e8"><tr><td align="center" style="padding:24px 12px">'
 +'<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:6px">'
 +'<tr><td style="padding:28px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid '+EMAIL_GOLD+'"><tr>'
 +'<td valign="top" style="padding-bottom:16px"><div style="font:bold 20px '+serif+';color:'+EMAIL_INK+';letter-spacing:.3px">O’Ryan Event Center</div><div style="font:11.5px/1.5 '+sans+';color:#555555;margin-top:2px">786 University Avenue West<br>St. Paul, MN 55104</div></td>'
 +'<td valign="top" align="right" style="padding-bottom:16px;font:600 18px '+sans+';letter-spacing:3px;color:'+EMAIL_GOLD+'">'+emailEsc_(o.kicker)+'</td></tr></table></td></tr>'
 +'<tr><td style="padding:24px 32px 0;font:15px/1.6 '+serif+';color:'+EMAIL_INK+'">'+greeting+'<br><br>'+o.paragraphs.map(emailEsc_).join('<br><br>')+'</td></tr>'
 +'<tr><td style="padding:20px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="'+EMAIL_CREAM+'" style="background:'+EMAIL_CREAM+';border:1px solid '+EMAIL_CREAM_LINE+';border-radius:6px"><tr>'
 +'<td style="padding:18px 22px"><div style="font:12px '+sans+';letter-spacing:1.5px;text-transform:uppercase;color:'+EMAIL_CREAM_TEXT+'">'+emailEsc_(o.amountLabel)+'</div><div style="font:bold '+(o.valueSize||32)+'px '+sans+';color:'+EMAIL_INK+';margin-top:4px">'+emailEsc_(o.value)+'</div></td>'
 +'<td align="right" valign="middle" style="padding:18px 22px;font:12.5px/1.6 '+sans+';color:#444444">'+o.meta.map(emailEsc_).join('<br>')+'</td></tr></table></td></tr>'
 +button
 +'<tr><td style="padding:22px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #cccccc">'+rows+'</table></td></tr>'
 +'<tr><td style="padding:22px 32px 0;font:14px/1.6 '+serif+';color:'+EMAIL_INK+'">'+o.closing.map(emailEsc_).join('<br><br>')+'<br><br>Thank you,<br>O’Ryan Event Center</td></tr>'
 +'<tr><td style="padding:22px 32px 28px"><div style="border-top:1px solid #dddddd;padding-top:10px;font:10.5px/1.5 '+sans+';color:#777777">O’Ryan Event Center · 786 University Avenue West, St. Paul, MN 55104 · Just reply to this email with any questions.</div></td></tr>'
 +'</table></td></tr></table></body></html>';
}
function paymentLinkMessage_(r){
 var amount=emailMoney_(r.amountCents),day=emailDay_(r.eventDate);
 var subject="Your payment link from O'Ryan Event Center";
 var body="Hello"+(r.firstName?' '+r.firstName:'')+",\n\nHere is your secure link to pay "+amount+" toward your event on "+day+":\n\n"+r.url+"\n\nThe link can be used once and opens Square's secure payment page. If you would rather pay another way, or you have any questions, just reply to this email.\n\nThank you,\nO'Ryan Event Center\n786 University Avenue West, St. Paul, MN 55104";
 var htmlBody=emailHtml_({title:subject,kicker:'PAYMENT LINK',firstName:r.firstName,
  paragraphs:['Here is your secure link to pay toward your event on '+day+'.'],
  amountLabel:'Amount to pay',value:amount,meta:['Event date',day],
  link:{label:'Pay securely with Square',url:r.url},
  details:[['Event date',day],['Amount',amount],['Payment method','Card, through Square']],
  closing:['The link can be used once and opens Square’s secure payment page. If you would rather pay another way, or you have any questions, just reply to this email.']});
 return {subject:subject,body:body,htmlBody:htmlBody};
}
function reminderMessage_(r){
 var amount=emailMoney_(r.amountDueCents),day=emailDay_(r.eventDate),due=emailDay_(r.dueDate);
 var subject="Payment reminder from O'Ryan Event Center";
 var body="Hello"+(r.firstName?' '+r.firstName:'')+",\n\nThis is a friendly reminder that the remaining balance of "+amount+" for your event on "+day+" is due on "+due+". If you have already sent your payment, thank you, and please disregard this note.\n\nIf you have any questions, just reply to this email.\n\nThank you,\nO'Ryan Event Center\n786 University Avenue West, St. Paul, MN 55104";
 var htmlBody=emailHtml_({title:subject,kicker:'PAYMENT REMINDER',firstName:r.firstName,
  paragraphs:['This is a friendly reminder about the remaining balance for your event on '+day+'.'],
  amountLabel:'Balance due',value:amount,meta:['Due '+due,'Event '+day],
  link:null,
  details:[['Event date',day],['Balance due',amount],['Due date',due]],
  closing:['If you have already sent your payment, thank you, and please disregard this note. If you have any questions, just reply to this email.']});
 return {subject:subject,body:body,htmlBody:htmlBody};
}
function documentMessage_(r){
 var day=emailDay_(r.eventDate),isReceipt=r.kind==='receipt',noun=isReceipt?'receipt':'contract';
 var subject="Your "+r.kind+" from O'Ryan Event Center"+(r.receiptNumber?' (Receipt #'+r.receiptNumber+')':'');
 var body="Hello"+(r.firstName?' '+r.firstName:'')+",\n\nAttached is your "+r.kind+" for your event on "+day+" at O'Ryan Event Center.\n\nIf you have any questions, just reply to this email.\n\nThank you,\nO'Ryan Event Center\n786 University Avenue West, St. Paul, MN 55104";
 var htmlBody=emailHtml_({title:subject,kicker:isReceipt?'RECEIPT':'CONTRACT',firstName:r.firstName,
  paragraphs:['Attached is your '+noun+' for your event on '+day+' at O\u2019Ryan Event Center.'],
  amountLabel:'Attached',value:isReceipt?'Your receipt':'Your contract',valueSize:28,meta:isReceipt&&r.receiptNumber?['PDF attachment','No. '+r.receiptNumber]:['PDF attachment','Event '+day],
  link:null,
  details:isReceipt?[['Event date',day],['Document','Receipt (PDF)']].concat(r.receiptNumber?[['Receipt number',r.receiptNumber]]:[]):[['Event date',day],['Document','Contract (PDF)']],
  closing:['If you have any questions, just reply to this email.']});
 return {subject:subject,body:body,htmlBody:htmlBody};
}
// END EMAIL_TEMPLATE
export {emailHtml_,paymentLinkMessage_,reminderMessage_,documentMessage_};
