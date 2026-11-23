// Square controls for the owner: a payment link on a booking, and a review list on Payments.
// Everything here is hidden unless the Worker says Square is configured for this owner, so the
// locked screens are unchanged (and the pixel baselines too) until Square is switched on.
import paymentScreen from './screens/record-payment.mjs?v=2.9.1';
import {paymentLinkMessage_} from './email-template.mjs?v=2.9.1';
import {reminderFields} from './reminder-message.mjs?v=2.9.1';

const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n;};
const money=n=>'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const dayLabel=iso=>new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/Chicago'});
const dueOf=r=>Math.max(0,Math.round((Number(r.financialTotal||0)-Number(r.paid||0))*100)/100);
const opening=new WeakSet();

export async function mountSquare({api,screen,route,toast,go}){
 if(api.mode!=='http'||typeof api.squareStatus!=='function')return;
 const body=document.body;
 let status;try{status=await api.squareStatus();}catch{return;}
 if(!status?.configured||document.body!==body)return;
 if(screen==='booking')await bookingButton({api,route,toast,body});
 if(screen==='payments')await inbox({api,toast,go,body,status});
}

// ---- a modal built from the locked payment sheet, like the other runtime sheets ----
async function sheet({api,id,title,subtitle,opener}){
 const body=document.body,host=el('div');
 host.innerHTML=paymentScreen(await api.presentation('record-payment'));
 if(document.body!==body||body.querySelector('#'+id))return null;
 const modal=host.querySelector('.modal-backdrop'),form=modal.querySelector('form'),close=modal.querySelector('.modal-close-btn');
 const footerStyle=form.querySelector('#btnSavePayment').parentElement.getAttribute('style');
 modal.id=id;form.id=id+'Form';form.dataset.commandForm='true';
 modal.querySelector('.modal-title').textContent=title;
 modal.querySelector('.modal-header .badge').textContent='Square';
 modal.querySelector('.modal-header p').textContent=subtitle;
 modal.querySelector('.modal-header').nextElementSibling.remove();
 modal.querySelector('.modal-dialog').setAttribute('aria-modal','true');
 close.removeAttribute('href');close.tabIndex=0;close.setAttribute('role','button');close.setAttribute('aria-label','Close');
 form.replaceChildren();
 const state={busy:false};
 const cleanup=()=>{window.removeEventListener('hashchange',cleanup);document.removeEventListener('keydown',key,true);const after=state.onClose;state.onClose=null;modal.remove();after?.();};
 const dismiss=()=>{if(state.busy)return;cleanup();opener?.focus?.({preventScroll:true});};
 const key=e=>{if(!modal.isConnected){cleanup();return;}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}};
 document.addEventListener('keydown',key,true);window.addEventListener('hashchange',cleanup);
 close.onclick=e=>{e.preventDefault();e.stopPropagation();dismiss();};
 modal.addEventListener('click',e=>{if(e.target===modal){e.stopPropagation();dismiss();}});
 const footer=el('div');footer.setAttribute('style',footerStyle);
 const error=el('p','alert alert-danger');error.setAttribute('role','alert');error.style.display='none';
 const fail=message=>{error.textContent=message;error.style.display='';};
 document.body.append(modal);
 return {modal,form,footer,error,fail,dismiss,cleanup,state};
}

// ---- booking page: Request payment link ----
async function bookingButton({api,route,toast,body}){
 const record=await api.detail(route.id);
 if(document.body!==body||!record||record.cancelled||record.archived||record.type==='Blackout'||dueOf(record)<1)return;
 const bar=document.querySelector('.booking-action-menus');
 if(!bar||document.querySelector('[data-square-link]'))return;
 const button=el('button','btn btn-quiet','Request payment link');   // same class as its neighbours: same size
 button.type='button';button.dataset.squareLink=record.id;
 button.onclick=()=>linkSheet({api,record,opener:button,toast}).catch(()=>toast('Unable to open the payment link form.'));
 (bar.previousElementSibling?.matches('[data-booking-action=reminderEmail]') ? bar.previousElementSibling : bar).before(button);
}
async function linkSheet({api,record,opener,toast}){
 if(opening.has(api))return;opening.add(api);
 try{
  const due=dueOf(record),s=await sheet({api,id:'squareLinkModal',title:'Request payment by link',subtitle:record.client,opener});
  if(!s)return;
  const requestId=crypto.randomUUID(),fields=reminderFields(record);
  const group=el('div','form-group'),label=el('label','form-label','Amount to request'),input=el('input','form-input');
  input.type='number';input.id=label.htmlFor='squareLinkAmount';input.min='1';input.max=String(due);input.step='0.01';input.required=true;input.value=due.toFixed(2);
  input.style.minHeight='var(--touch-target-min)';
  group.append(label,input,el('p','form-label-note','Balance due: '+money(due)+'. Each link works once and opens Square’s own payment page. Nothing is recorded here until you confirm the payment on the Payments page.'));
  const toGroup=el('div','form-group'),toLabel=el('label','form-label','Email the link to'),to=el('input','form-input');
  to.type='email';to.id=toLabel.htmlFor='squareLinkTo';to.autocomplete='email';to.maxLength=254;to.value=record.email||'';to.style.minHeight='var(--touch-target-min)';
  toGroup.append(toLabel,to);
  if(!record.email)toGroup.append(el('p','form-label-note','No email on file. Enter one to send, or create the link without emailing.'));
  const previewGroup=el('div','form-group'),previewLabel=el('p','form-label','The email your customer will get'),frame=el('iframe');
  frame.id='squareLinkPreview';frame.title='Email preview';frame.setAttribute('sandbox','');
  frame.style.cssText='width:100%;height:360px;border:1px solid var(--line-subtle);border-radius:var(--radius-md);background:#fff';
  const render=()=>{const cents=Math.round(Number(input.value)*100);
   frame.srcdoc=Number.isFinite(cents)&&cents>=100?paymentLinkMessage_({...fields,amountCents:cents,url:'https://square.link/u/LINK'}).htmlBody:'<p style="font:14px Helvetica,Arial,sans-serif;padding:16px;color:#666">Enter an amount to preview the email.</p>';};
  input.addEventListener('input',render);render();
  previewGroup.append(previewLabel,frame,el('p','form-label-note','The real link is added when you send.'));
  const only=el('button','btn btn-quiet btn-sm','Create link without emailing');only.type='button';only.id='squareLinkOnly';
  const cancel=el('button','btn btn-quiet','Cancel'),send=el('button','btn btn-primary','Send link');
  cancel.type='button';send.type='submit';for(const b of [cancel,send])b.style.minHeight='var(--touch-target-min)';
  cancel.onclick=()=>s.dismiss();
  s.footer.append(cancel,send);s.form.append(group,toGroup,previewGroup,only,s.error,s.footer);
  input.focus();
  async function run(emailIt){
   if(s.state.busy)return;
   to.required=emailIt;
   if(!s.form.reportValidity())return;
   s.state.busy=true;send.disabled=true;only.disabled=true;s.error.style.display='none';
   try{
    const out=await api.squareLink(record.id,input.value,requestId,emailIt?to.value.trim():undefined);
    s.state.busy=false;
    const done=el('div','form-group'),status=el('p',out.email?.status==='failed'?'alert alert-danger':'card-subtitle',
     !out.email?'Link created. Copy it and send it to your customer.':out.email.status==='sent'?'Emailed to '+out.email.to+'.':'The link was created, but the email was not sent: '+out.email.error);
    if(out.email?.status==='failed')status.setAttribute('role','alert');
    const linkLabel=el('label','form-label','Payment link ('+money(out.amount)+', single use)'),box=el('input','form-input');
    box.id=linkLabel.htmlFor='squareLinkUrl';box.readOnly=true;box.value=out.url;box.style.minHeight='var(--touch-target-min)';
    done.append(status,linkLabel,box);
    const copy=el('button','btn btn-primary','Copy link'),close=el('button','btn btn-quiet','Done');
    copy.type='button';close.type='button';for(const b of [copy,close])b.style.minHeight='var(--touch-target-min)';
    copy.onclick=async()=>{try{await navigator.clipboard.writeText(out.url);}catch{box.select();document.execCommand?.('copy');}toast('Link copied.');};
    close.onclick=()=>s.dismiss();
    s.footer.replaceChildren(close,copy);
    s.form.replaceChildren(done,s.footer);box.focus();box.select();
    if(out.email?.status==='sent')s.state.onClose=()=>window.dispatchEvent(new HashChangeEvent('hashchange'));   // when the sheet closes, the booking re-renders and shows the new contact history entry
   }catch(error){s.state.busy=false;send.disabled=false;only.disabled=false;s.fail(error.message||'Could not create the link.');}
  }
  s.form.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();run(true);});
  only.onclick=()=>run(false);
 }finally{opening.delete(api);}
}

// Schedule from completion so a slow poll and a manual refresh cannot overlap.
export function squarePolling({load,active,visible,schedule=setTimeout,cancel=clearTimeout}){
 let timer,busy=false,stopped=false,delay=60000;
 function stop(){stopped=true;cancel(timer);}
 function queue(){
  if(!stopped&&active())timer=schedule(()=>visible()?run():queue(),delay);
 }
 async function run(manual=false){
  if(stopped||!active()||busy)return;
  cancel(timer);
  busy=true;
  try{delay=await load(manual)?20000:60000;}
  catch{delay=120000;}
  finally{busy=false;queue();}
 }
 return {run,stop};
}

export function hasNewSquarePayment(previous,items){
 return previous!==null&&items.some(item=>!previous.has(item.id));
}

// ---- Payments page: Square payments to review ----
async function inbox({api,toast,go,body,status}){
 const header=document.querySelector('.main-content .page-header');
 if(!header||document.querySelector('[data-square-inbox]'))return;
 const card=el('section','card');card.dataset.squareInbox='true';card.style.marginBottom='var(--space-6)';
 const top=el('div','card-header'),titles=el('div'),title=el('h2','card-title','Square payments to review');
 const sub=el('p','card-subtitle','Completed Square payments from the last 14 days'+(status.environment==='sandbox'?' (test mode)':'')+'. Check the amount and booking, then confirm once.');
 titles.append(title,sub);
 const refresh=el('button','btn btn-quiet btn-sm','Refresh');refresh.type='button';
 top.append(titles,refresh);
 const list=el('div');list.setAttribute('aria-live','polite');
 card.append(top,list);header.after(card);
 const names=new Map();
 async function nameOf(id){if(!id)return '';if(!names.has(id))names.set(id,api.detail(id).then(r=>r?.client||id,()=>id));return names.get(id);}
 const active=()=>document.body===body&&card.isConnected;
 let previous=null,lastView=null;
 async function render(manual){
  refresh.disabled=true;
  if(previous===null)list.replaceChildren(el('p','card-subtitle','Checking Square…'));
  try{
   const data=await api.squarePayments(manual===true);
   if(!active())return;
   const view=JSON.stringify([data.items,data.truncated,data.windowDays]);
   if(view!==lastView){
    const rows=[];
    for(const p of data.items){
     const row=el('div','square-row');row.dataset.paymentId=p.id;
     const main=el('div','square-main'),line=el('strong',null,money(p.amount)+' · '+dayLabel(p.at));
     const note=el('p','form-label-note',p.confirmed?'Recorded in the ledger':p.bookingId?'For '+await nameOf(p.bookingId):(p.needs||''));
     main.append(line,note);row.append(main);
     if(p.confirmed){row.append(el('span','badge badge-paid','Recorded'));}
     else if(!p.needs){const ok=el('button','btn btn-primary btn-sm','Confirm');ok.type='button';ok.onclick=()=>confirmSheet({api,payment:p,bookingId:p.bookingId,client:note.textContent.replace(/^For /,''),toast,go,opener:ok,done:()=>polling.run(true)});row.append(ok);}
     else if(p.needs==='Choose the booking.'){const pick=el('button','btn btn-quiet btn-sm','Choose booking');pick.type='button';pick.onclick=()=>chooseSheet({api,payment:p,toast,go,opener:pick,done:()=>polling.run(true)});row.append(pick);}
     rows.push(row);
    }
    if(!active())return;
    list.replaceChildren(...(rows.length?rows:[el('p','card-subtitle','No Square payments in the last '+data.windowDays+' days.')]),...(data.truncated?[el('p','form-label-note','Showing the newest payments only. Older ones need a look in Square.')]:[]));
    lastView=view;
   }
   if(hasNewSquarePayment(previous,data.items))toast('New Square payment to review.');
   previous=new Set(data.items.map(item=>item.id));
   return data.liveUpdates;
  }catch(error){
   if(active()&&(manual||previous===null)){
    list.replaceChildren(el('p','alert alert-danger',error.message||'Could not reach Square.'));
    lastView=null;
   }
   throw error;
  }finally{
   if(active())refresh.disabled=false;
  }
 }
 const polling=squarePolling({load:render,active,visible:()=>document.visibilityState==='visible'});
 const observer=new MutationObserver(()=>{
  if(active())return;
  observer.disconnect();
  polling.stop();
 });
 observer.observe(document.documentElement,{childList:true});
 refresh.onclick=()=>polling.run(true);
 await polling.run(true);
}

async function confirmSheet({api,payment,bookingId,client,toast,go,opener,done,chosen=false}){
 const s=await sheet({api,id:'squareConfirmModal',title:chosen?'Confirm chosen booking':'Record Square payment',subtitle:client||'',opener});
 if(!s)return;
 const text=el('p',null,'Record '+money(payment.amount)+' from Square as a card payment'+(client?' on '+client:'')+'? This adds it to the ledger. A mistaken entry can be voided from the Payments list.');
 const cancel=el('button','btn btn-quiet','Cancel'),ok=el('button','btn btn-primary',chosen?'Confirm chosen booking':'Record payment');
 cancel.type='button';ok.type='submit';for(const b of [cancel,ok])b.style.minHeight='var(--touch-target-min)';
 cancel.onclick=()=>s.dismiss();s.footer.append(cancel,ok);s.form.append(text,s.error,s.footer);ok.focus();
 s.form.addEventListener('submit',async e=>{
  e.preventDefault();e.stopPropagation();if(s.state.busy)return;
  s.state.busy=true;ok.disabled=true;s.error.style.display='none';
  try{
   const out=await api.squareConfirm(payment.id,bookingId);
   s.state.busy=false;s.cleanup();toast(out.duplicate?'Already recorded.':'Payment recorded.');
   window.dispatchEvent(new HashChangeEvent('hashchange'));   // re-render the screen so the table and totals show the new payment
  }catch(error){s.state.busy=false;ok.disabled=false;s.fail(error.message||'Could not record the payment.');}
 });
}
async function chooseSheet({api,payment,toast,go,opener,done}){
 const s=await sheet({api,id:'squareChooseModal',title:'Choose the booking',subtitle:money(payment.amount)+' · '+dayLabel(payment.at),opener});
 if(!s)return;
 const search=el('input','form-input');search.type='search';search.placeholder='Search guest, phone or contract…';search.setAttribute('aria-label','Search bookings');search.style.minHeight='var(--touch-target-min)';
 const results=el('div');results.style.cssText='margin-top:12px;max-height:320px;overflow:auto';
 const cancel=el('button','btn btn-quiet','Cancel');cancel.type='button';cancel.style.minHeight='var(--touch-target-min)';cancel.onclick=()=>s.dismiss();
 s.footer.append(cancel);s.form.append(search,results,s.footer);search.focus();
 let seq=0;
 const load=async()=>{
  const mine=++seq,q=search.value.trim();
  const rows=(await api.list(q?{q}:{})).filter(r=>!r.cancelled&&!r.archived&&r.type!=='Blackout'&&r.financialTotal!=null&&dueOf(r)>=payment.amount).slice(0,12);
  if(mine!==seq)return;
  results.replaceChildren(...(rows.length?rows.map(r=>{const b=el('button','btn btn-quiet',r.client+' · '+dayLabel(r.date+'T12:00:00Z')+' · due '+money(dueOf(r)));b.type='button';b.style.cssText='display:flex;width:100%;justify-content:space-between;margin-bottom:6px;text-align:left';
   b.onclick=()=>{s.cleanup();confirmSheet({api,payment,bookingId:r.id,client:r.client,toast,go,opener,done,chosen:true});};return b;}):[el('p','card-subtitle','No matching booking has this much balance due.')]));
 };
 search.addEventListener('input',()=>{clearTimeout(load.t);load.t=setTimeout(()=>load().catch(()=>{}),180);});
 await load();
}
