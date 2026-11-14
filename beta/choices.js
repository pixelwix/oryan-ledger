/* Shared single-choice form groups and compact filter menus. Selects remain the
   canonical programmatic/FormData fields; no native select is exposed to users. */
const SiteChoices=(()=>{
 let serial=0;
 const descriptor=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
 function setup(){document.querySelectorAll('select').forEach(select=>{
  if(select.dataset.siteChoice)return;select.dataset.siteChoice='true';
  const formChoice=!!select.closest('form')&&select.name!=='betaAction';
  const host=document.createElement(formChoice?'fieldset':'span');host.className=formChoice?'site-choices':'site-menu';select.after(host);
  const label=select.closest('label');const title=select.getAttribute('aria-label')||[...(label?.childNodes||[])].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||select.name;
  select.hidden=true;select.tabIndex=-1;
  function render(){host.replaceChildren();if(formChoice){const legend=document.createElement('legend');legend.textContent=title;host.append(legend);const name='site-choice-'+(++serial);
   for(const option of select.options){const row=document.createElement('label'),radio=document.createElement('input'),text=document.createElement('span');radio.type='radio';radio.name=name;radio.checked=option.selected;radio.disabled=select.disabled||option.disabled;radio.value=option.value;text.textContent=option.textContent;radio.onchange=()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));};row.append(radio,text);host.append(row);}
  }else{const button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=(select.selectedOptions[0]?.textContent||'Choose')+' ▾';button.setAttribute('aria-label',title);button.setAttribute('aria-haspopup','dialog');button.disabled=select.disabled;button.onclick=()=>{
   const dialog=document.createElement('dialog');dialog.className='beta-picker site-options';dialog.setAttribute('aria-label',title);
   for(const option of select.options){const item=document.createElement('button');item.type='button';item.textContent=option.textContent;item.disabled=option.disabled;item.setAttribute('aria-pressed',String(option.selected));item.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));dialog.close();};dialog.append(item);}
   const close=document.createElement('button');close.type='button';close.textContent='Close menu';close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dialog.close();}});dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();dialog.close();});dialog.onclose=()=>{dialog.remove();button.focus();};document.body.append(dialog);dialog.showModal();dialog.querySelector('[aria-pressed=true]')?.focus();};host.append(button);}
  }
  Object.defineProperty(select,'value',{get:()=>descriptor.get.call(select),set:v=>{if(v!=null&&String(v)&&![...select.options].some(o=>o.value===String(v)))select.add(new Option(String(v),String(v)));descriptor.set.call(select,v);render();}});
  select.addEventListener('change',render);new MutationObserver(render).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected']});select.form?.addEventListener('reset',()=>queueMicrotask(render));render();
 });}
 document.addEventListener('formdata',e=>{for(const key of [...e.formData.keys()])if(key.startsWith('site-choice-'))e.formData.delete(key);});
 document.addEventListener('DOMContentLoaded',()=>{setup();new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});});return {setup};
})();
