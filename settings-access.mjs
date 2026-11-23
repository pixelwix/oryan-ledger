export function settingsAccess(identity, overview) {
 const elevated=Boolean(identity&&(identity.isSuperAdmin===true||overview?.role==='super_admin'));
 return {owner:identity?.isOwner===true||elevated,elevated};
}

export function syncSettingsChrome(body,{owner,active=false,production=false}) {
 body.classList.toggle('settings-enabled',owner);
 const desktop=body.querySelector('.nav-tabs');
 const phone=body.querySelector('.mobile-nav-items');
 for(const [nav,className] of [[desktop,'nav-link'],[phone,'mobile-nav-link']]){
  if(!nav)continue;
  let link=nav.querySelector('[href="#/settings"]');
  if(!owner){link?.remove();continue;}
  if(!link){
   link=document.createElement('a');
   link.href='#/settings';
   link.className=className;
   if(nav===desktop){link.dataset.label='Settings';link.textContent='Settings';}
   else link.innerHTML='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-6 2v4"/></svg><span>Settings</span>';
   nav.append(link);
  }
  if(active)for(const other of nav.querySelectorAll('.active')){other.classList.remove('active');other.removeAttribute('aria-current');}
  link.classList.toggle('active',active);
  if(active)link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
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
