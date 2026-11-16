// Estimated waiting feedback, never a measurement of helper work.
export function documentProgress(elapsed,kind='contract',reduced=false){
 const t=Math.max(0,Number(elapsed)||0);
 const stage=t>=60000?4:t>=25000?3:t>=8000?2:t>=2000?1:0;
 const text=['Sending to the PDF service...',`Preparing the ${kind}. The first save can take up to 25 seconds.`,'Saving to Drive...','Still working... this is normal the first time',`Taking longer than usual. Check Saved copies or Retry; saving this ${kind} has not been confirmed.`][stage];
 return {value:reduced?[4,12,40,72,86][stage]:Math.min(90,4+86*(1-Math.exp(-t/18000))),text};
}
export function createDocumentProgress(parent,kind='contract',started=Date.now()){
 const box=document.createElement('div');box.dataset.documentProgress='';
 const label=document.createElement('p');label.className='form-label-note';label.textContent='Estimated progress';
 const track=document.createElement('div');track.setAttribute('role','progressbar');track.setAttribute('aria-label','Estimated PDF save progress');track.setAttribute('aria-busy','true');track.style.cssText='height: var(--space-2); background: var(--bg-subtle); border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden;';
 const fill=document.createElement('div');fill.setAttribute('aria-hidden','true');fill.style.cssText='height: 100%; background: var(--btn-primary-bg); width: 0%;';track.append(fill);
 const status=document.createElement('div');status.className='alert alert-info';status.setAttribute('role','status');status.setAttribute('aria-live','polite');box.append(label,track,status);parent.append(box);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let timer;
 const update=()=>{if(!box.isConnected&&box.dataset.mounted){stop();return;}if(box.isConnected)box.dataset.mounted='true';const next=documentProgress(Date.now()-started,kind,reduced);fill.style.width=next.value+'%';box.dataset.value=String(next.value);if(status.textContent!==next.text)status.textContent=next.text;};
 const visibility=()=>{clearInterval(timer);if(document.visibilityState==='visible'&&box.isConnected)timer=setInterval(update,200);};
 const stop=()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility);track.setAttribute('aria-busy','false');};
 update();if(document.visibilityState==='visible')timer=setInterval(update,200);document.addEventListener('visibilitychange',visibility);
 return {box,stop,async finish(saved){stop();if(saved){fill.style.width='100%';box.dataset.value='100';}status.textContent=saved?'Saved.':'Saving, check Saved copies. Retry is available there.';await new Promise(r=>setTimeout(r,120));},error(message){stop();status.className='alert alert-danger';status.setAttribute('role','alert');status.textContent=message;}};
}
