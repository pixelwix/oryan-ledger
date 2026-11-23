export function settingsAccess(identity, overview) {
 const elevated=Boolean(identity&&(identity.isSuperAdmin===true||overview?.role==='super_admin'));
 return {owner:identity?.isOwner===true||elevated,elevated};
}

export function syncSettingsChrome(body,{owner,active=false,production=false}) {
 body.classList.toggle('settings-enabled',owner);
 const desktop=body.querySelector('.nav-tabs');
 // Phones: Settings is a round icon next to the theme switcher, never a bottom-nav slot.
 body.querySelector('.mobile-nav-items [href="#/settings"]')?.remove();
 const bar=body.querySelector('.mobile-top-bar');
 const actions=bar?.querySelector('.theme-toggle-btn')?.parentElement;
 let tab=desktop?.querySelector('[href="#/settings"]');
 let icon=bar?.querySelector('.settings-icon-btn');
 if(!owner){tab?.remove();icon?.remove();}
 else{
  if(desktop&&!tab){
   tab=document.createElement('a');tab.href='#/settings';tab.className='nav-link';
   tab.dataset.label='Settings';tab.textContent='Settings';desktop.append(tab);
  }
  if(actions&&!icon){
   icon=document.createElement('a');icon.href='#/settings';icon.className='settings-icon-btn';
   icon.setAttribute('aria-label','Settings');icon.title='Settings';
   icon.innerHTML='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
   actions.querySelector('.theme-toggle-btn').after(icon);
  }
  if(active&&desktop)for(const other of desktop.querySelectorAll('.active')){other.classList.remove('active');other.removeAttribute('aria-current');}
  for(const link of [tab,icon]){
   if(!link)continue;
   link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
 }
 let strip=body.querySelector('.production-strip');
 if(!owner||!production){strip?.remove();return;}
 if(!strip){
  strip=document.createElement('div');
  strip.className='production-strip';
  strip.textContent='Production: real money';
  body.querySelector('.mobile-top-bar,.main-content')?.after(strip);
 }
}
