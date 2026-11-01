/* Shared production site controls. Fields show 10/31/2026 and 12:00 AM; .value and submitted form data stay ISO strings. */
const BetaControls = (() => {
 const pad=n=>String(n).padStart(2,'0');
 function parseDate(value){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);if(!m||+m[1]<1)return null;
  const d=new Date(0);d.setUTCFullYear(+m[1],+m[2]-1,+m[3]);d.setUTCHours(0,0,0,0);
  return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3]?d:null;
 }
 const iso=d=>`${String(d.getUTCFullYear()).padStart(4,'0')}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
 function shift(value,days){const d=parseDate(value);d.setUTCDate(d.getUTCDate()+days);return iso(d);}
 function month(value,delta){const d=parseDate(value),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+delta);const last=new Date(d);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);d.setUTCDate(Math.min(day,last.getUTCDate()));return iso(d);}
 function error(value,kind,min,max){
  if(!value)return '';
  if(kind==='date'?!parseDate(value):!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return kind==='date'?'Enter a real date as MM/DD/YYYY.':'Enter a time like 10:00 AM.';
  if(min&&value<min)return `Choose ${show(min,kind)} or later.`;if(max&&value>max)return `Choose ${show(max,kind)} or earlier.`;return '';
 }
 const timeLabel=v=>`${+v.slice(0,2)%12||12}:${v.slice(3)} ${+v.slice(0,2)<12?'AM':'PM'}`;
 // Typed text to ISO. Anything unrecognised comes back as typed so validation can reject it.
 function typed(text,kind){
  const value=String(text??'').trim();
  if(kind==='date'){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);return m?`${m[3]}-${pad(m[1])}-${pad(m[2])}`:value;}
  const m=/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m?\.?$/i.exec(value);if(!m||+m[1]<1||+m[1]>12)return value;
  return `${pad(+m[1]%12+(/p/i.test(m[3])?12:0))}:${m[2]||'00'}`;
 }
 function show(text,kind){
  const value=typed(text,kind);if(!value||error(value,kind))return String(text??'');
  return kind==='date'?`${value.slice(5,7)}/${value.slice(8)}/${value.slice(0,4)}`:timeLabel(value);
 }
 if(typeof document==='undefined')return {parseDate,iso,shift,month,error,timeLabel,typed,show};
 let serial=0,active=null;
 const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
 function bind(input,kind){
  const initial=nativeValue.get.call(input);input.defaultValue=show(input.defaultValue,kind);nativeValue.set.call(input,show(initial,kind));
  Object.defineProperty(input,'value',{configurable:true,get:()=>typed(nativeValue.get.call(input),kind),set:v=>nativeValue.set.call(input,show(v,kind))});
  input.addEventListener('blur',()=>{input.value=input.value;});
 }
 function clear(input){input.removeAttribute('aria-invalid');const e=document.getElementById(input.dataset.controlError);if(e)e.hidden=true;}
 function validate(input,show=true){
  if(input.dataset.siteKind)input.setCustomValidity(error(input.value,input.dataset.siteKind,input.min,input.max));
  if(!input.willValidate||input.validity.valid){clear(input);return true;}
  if(show){let e=document.getElementById(input.dataset.controlError);if(!e){e=document.createElement('span');e.id=`beta-field-error-${++serial}`;e.className='form-error beta-field-error';e.setAttribute('role','alert');input.insertAdjacentElement('afterend',e);input.dataset.controlError=e.id;input.setAttribute('aria-describedby',[input.getAttribute('aria-describedby'),e.id].filter(Boolean).join(' '));}e.textContent=input.validationMessage;e.hidden=false;input.setAttribute('aria-invalid','true');}
  return false;
 }
 function validateForm(form){let first;for(const el of form.elements)if(typeof el.checkValidity==='function'&&!validate(el))first ||=el;if(first)first.focus();return !first;}
 function setup(root=document){
  root.querySelectorAll('form').forEach(form=>{form.noValidate=true;form.reportValidity=()=>validateForm(form);});
  root.querySelectorAll('form input,form select,form textarea').forEach(input=>{
   if(input.dataset.siteReady)return;input.dataset.siteReady='true';input.reportValidity=()=>{const valid=validate(input);if(!valid)input.focus();return valid;};
   if(input.type==='number')input.inputMode=input.step&&input.step!=='1'?'decimal':'numeric';
   if(input.type!=='date'&&input.type!=='time')return;
   const kind=input.type;input.dataset.siteKind=kind;input.type='text';input.placeholder=kind==='date'?'MM/DD/YYYY':'10:00 AM';input.autocomplete='off';bind(input,kind);
   const wrap=document.createElement('span');wrap.className='beta-control';input.before(wrap);wrap.append(input);
   const button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=kind==='date'?'Calendar':'Time';button.setAttribute('aria-label',`Choose ${kind} for ${input.name}`);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');wrap.append(button);button.onclick=()=>open(input,button);
   validate(input,false);
  });
 }
 function open(input,trigger){
  if(input.disabled||input.readOnly)return;
  if(active)active.close();
  const picker=document.createElement('dialog');picker.className='beta-picker';picker.setAttribute('aria-label',input.dataset.siteKind==='date'?'Choose date':'Choose time');document.body.append(picker);active=picker;
  trigger.setAttribute('aria-expanded','true');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
  let cursor=parseDate(input.value)?input.value:today();if(input.min&&cursor<input.min)cursor=input.min;if(input.max&&cursor>input.max)cursor=input.max;
  function choose(value){if(input.disabled||input.readOnly)return;if(error(value,input.dataset.siteKind,input.min,input.max))return;input.value=value;validate(input);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));picker.close();}
  function render(focus=false){
   picker.replaceChildren();
   const close=document.createElement('button');close.type='button';close.className='quiet';close.textContent='Close picker';close.onclick=()=>picker.close();
   if(input.dataset.siteKind==='time'){
    const title=document.createElement('h3');title.textContent='Choose time';picker.append(title);const list=document.createElement('div');list.className='beta-time-list';
    for(let i=0;i<48;i++){const value=`${pad(Math.floor(i/2))}:${i%2?'30':'00'}`,b=document.createElement('button');b.type='button';b.textContent=timeLabel(value);b.disabled=!!error(value,'time',input.min,input.max);b.setAttribute('aria-pressed',String(input.value===value));b.onclick=()=>choose(value);list.append(b);}picker.append(list,close);return;
   }
   const nav=document.createElement('div');nav.className='beta-picker-nav';const title=document.createElement('h3');title.id=`beta-month-${++serial}`;title.setAttribute('aria-live','polite');title.textContent=parseDate(cursor).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
   for(const [delta,label] of [[-1,'Previous month'],[1,'Next month']]){const b=document.createElement('button');b.type='button';b.className='quiet';b.textContent=delta<0?'‹':'›';b.setAttribute('aria-label',label);b.onclick=()=>{cursor=month(cursor,delta);render(true);};if(delta<0)nav.append(b,title);else nav.append(b);}
   const grid=document.createElement('div');grid.className='beta-date-grid';grid.setAttribute('role','grid');grid.setAttribute('aria-labelledby',title.id);
   const header=document.createElement('div');header.setAttribute('role','row');for(const day of ['Su','Mo','Tu','We','Th','Fr','Sa']){const cell=document.createElement('span');cell.setAttribute('role','columnheader');cell.textContent=day;header.append(cell);}grid.append(header);
   const first=cursor.slice(0,8)+'01',start=shift(first,-parseDate(first).getUTCDay());
   for(let row=0;row<6;row++){const line=document.createElement('div');line.setAttribute('role','row');for(let col=0;col<7;col++){
    const value=shift(start,row*7+col),b=document.createElement('button');b.type='button';b.textContent=String(+value.slice(8));b.dataset.date=value;b.setAttribute('role','gridcell');b.setAttribute('aria-label',value);b.setAttribute('aria-selected',String(value===input.value));if(value===today())b.setAttribute('aria-current','date');b.classList.toggle('beta-other-month',value.slice(0,7)!==cursor.slice(0,7));b.disabled=!!error(value,'date',input.min,input.max);b.tabIndex=value===cursor?0:-1;b.onclick=()=>choose(value);
    b.onkeydown=e=>{const moves={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-parseDate(value).getUTCDay(),End:6-parseDate(value).getUTCDay()};if(e.key in moves||e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();const next=e.key==='PageUp'?month(value,-1):e.key==='PageDown'?month(value,1):shift(value,moves[e.key]);if(!error(next,'date',input.min,input.max)){cursor=next;render(true);}}};line.append(b);
   }grid.append(line);}picker.append(nav,grid,close);if(focus)picker.querySelector(`[data-date="${cursor}"]`)?.focus();
  }
  picker.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();picker.close();}});
  picker.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();picker.close();});
  picker.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');picker.remove();if(active===picker)active=null;input.focus();});
  render();picker.showModal();picker.querySelector('[tabindex="0"], [aria-pressed="true"]')?.focus();
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');style.textContent=`form input[type=number]{appearance:textfield;-moz-appearance:textfield}form input[type=number]::-webkit-inner-spin-button,form input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.beta-control{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.beta-control input{flex:1 1 130px;min-width:0;width:100%}.beta-control button{min-height:44px}.beta-field-error{display:block;flex-basis:100%;white-space:normal;word-break:normal}.beta-field-error[hidden]{display:none}.beta-picker{box-sizing:border-box;width:350px;max-width:100vw;max-height:calc(100dvh - 16px);padding:4px;overflow:auto;background:var(--card,#202224);color:var(--text,#eee);border:1px solid var(--line,#555);border-radius:9px}.beta-picker::backdrop{background:#0009}.beta-picker button{min-height:44px;min-width:0;padding:4px;border:1px solid var(--line,#555);border-radius:5px;background:var(--card,#202224);color:inherit}.beta-picker button:focus-visible{outline:2px solid #cfb25d;outline-offset:-3px}.beta-picker button:disabled{opacity:.3}.beta-picker-nav{display:flex;align-items:center;justify-content:space-between;gap:4px}.beta-picker-nav button{min-width:44px}.beta-picker h3{font-size:16px;word-break:normal}.beta-date-grid [role=row]{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.beta-date-grid [role=columnheader]{text-align:center;padding:6px 0}.beta-picker [aria-selected=true],.beta-picker [aria-pressed=true]{background:#cfb25d;color:#171819}.beta-picker [aria-current=date]{border:2px solid #cfb25d}.beta-other-month{opacity:.55}.beta-time-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;max-height:55dvh;overflow:auto}`;document.head.append(style);
  setup();new MutationObserver(()=>setup()).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('formdata',e=>{for(const input of e.target.elements)if(input.dataset.siteKind&&e.formData.has(input.name))e.formData.set(input.name,input.value);});
  document.addEventListener('invalid',e=>{e.preventDefault();validate(e.target);},true);
  document.addEventListener('submit',e=>{if(!validateForm(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('input',e=>{if(e.target.matches('input,select,textarea'))validate(e.target,!!e.target.dataset.controlError);},true);
  document.addEventListener('reset',e=>{if(active)active.close();queueMicrotask(()=>{for(const input of e.target.elements){clear(input);if(input.dataset.siteKind)input.setCustomValidity(error(input.value,input.dataset.siteKind,input.min,input.max));}});},true);
 });
 return {parseDate,iso,shift,month,error,timeLabel,typed,show,setup,validateForm};
})();
if(typeof module!=='undefined')module.exports=BetaControls;
