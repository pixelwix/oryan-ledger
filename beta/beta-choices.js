/* Beta-only form choices and payment plans. Native radios retain keyboard semantics. */
const BetaChoices = (() => {
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function markup(name,title,options,value,multiple=false,attributes=''){
  const opts=options.map(o=>Array.isArray(o)?o:[o,o]);
  if(!multiple&&!opts.some(([v])=>v===value))opts.unshift([value,value||'Not recorded']);
  return `<fieldset class="beta-choices wide" data-choice="${escape(name)}" ${attributes}><legend>${title}</legend>${opts.filter(([v])=>!multiple||v).map(([v,t])=>`<label><input type="${multiple?'checkbox':'radio'}" name="${escape(name)}" value="${escape(v)}" ${v===value?'checked':''}> <span>${escape(t)}</span></label>`).join('')}</fieldset>`;
 }
 function convert(root){
  root.querySelectorAll('select[name]').forEach(select=>{
   const wrapper=select.closest('label'),name=select.name,multiple=name==='method'&&['bookingForm','paymentForm','contractForm'].includes(select.form?.id);
   const title=[...wrapper.childNodes].filter(n=>n!==select).map(n=>n.textContent).join('');
   wrapper.outerHTML=markup(name,title,[...select.options].map(o=>[o.value,o.textContent]),select.value,multiple,wrapper.hasAttribute('data-initial-payment')?'data-initial-payment hidden':'');
  });
 }
 function parts(total,methods,amounts){
  const cents=Ledger.cents(total);
  if(!methods.length)throw Error('Choose at least one payment method.');
  const result=methods.map(method=>({method,amount:methods.length===1?cents:Ledger.cents(amounts[method])}));
  if(result.some(p=>p.amount<=0)||result.reduce((n,p)=>n+p.amount,0)!==cents)throw Error('Method amounts must add up exactly to the payment amount. Nothing was saved.');
  return result.map(p=>({...p,amount:p.amount/100}));
 }
 function plan(form,total){return parts(total,[...form.querySelectorAll('[name=method]:checked')].map(i=>i.value),Object.fromEntries([...form.querySelectorAll('[data-split-method]')].map(i=>[i.dataset.splitMethod,i.value])));}
 function amounts(form){
  const group=form.querySelector('[data-choice=method]');if(!group)return;
  const checked=[...group.querySelectorAll('[name=method]:checked')];
  group.querySelectorAll('[data-split-method]').forEach(i=>{const hidden=checked.length<2||!checked.some(c=>c.value===i.dataset.splitMethod);i.closest('label').hidden=hidden;i.disabled=hidden;});
  if(checked.length>1)checked.forEach(c=>{if(![...group.querySelectorAll('[data-split-method]')].some(i=>i.dataset.splitMethod===c.value))group.insertAdjacentHTML('beforeend',`<label>${escape(c.value)} amount ($)<input type="number" min="0.01" step="0.01" data-split-method="${escape(c.value)}"></label>`);});
 }
 if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{
  convert(document);
  const style=document.createElement('style');style.textContent='.beta-choices{min-width:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:4px 12px}.beta-choices legend{padding-bottom:8px}.beta-choices label{display:flex;align-items:center;gap:8px;min-height:44px;min-width:0;overflow-wrap:break-word}.beta-choices label:has(>[data-split-method]){display:flex;flex-direction:column;align-items:stretch;gap:6px;grid-column:1/-1}.beta-choices label>[data-split-method]{flex:none;width:100%!important;min-height:44px}.beta-choices input[type=radio],.beta-choices input[type=checkbox]{appearance:none;width:20px;height:20px;min-height:20px;flex:0 0 20px;border:1px solid var(--muted);border-radius:3px;padding:0}.beta-choices input:checked{background:var(--gold,#cfb25d);box-shadow:inset 0 0 0 4px var(--card,#202224)}.beta-choices input:focus-visible{outline:2px solid #cfb25d;outline-offset:3px}.beta-choices input[type=number]{width:100%;min-width:0;height:44px;min-height:44px!important;padding:8px}.beta-choices[hidden],.beta-choices label[hidden]{display:none!important}';document.head.append(style);
  for(const id of ['bookingForm','paymentForm']){const form=document.getElementById(id);form.addEventListener('input',()=>amounts(form));form.addEventListener('reset',()=>queueMicrotask(()=>amounts(form)));}
 });
 return {markup,convert,parts,plan};
})();
