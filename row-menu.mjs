export function closeRowMenu(menu){
 menu.removeAttribute('open');
 const row=menu.closest('.ledger-row[data-status="cancelled"]');
 if(row){row.style.removeProperty('position');row.style.removeProperty('z-index');}
}
export function positionRowMenu(menu,trigger){
 // The cancelled row's opacity forms a stacking context. Raise it while its menu is open.
 const row=trigger.closest('.ledger-row[data-status="cancelled"]');
 if(row){row.style.position='relative';row.style.zIndex=getComputedStyle(menu).zIndex;}

 // Viewport positioning escapes the table's scrolling clip without changing the locked component.
 menu.style.position='fixed';menu.style.top='0px';menu.style.right='auto';menu.style.marginTop='0px';
 menu.querySelectorAll('.dropdown-item').forEach(item=>item.style.minHeight='44px');
 const anchor=trigger.getBoundingClientRect(),box=menu.getBoundingClientRect();
 menu.style.left=Math.max(4,Math.min(innerWidth-box.width-4,anchor.right-box.width))+'px';
 menu.style.top=Math.max(4,Math.min(innerHeight-box.height-4,anchor.bottom+4))+'px';
}
export function positionBookingMenu(menu){
 menu.style.removeProperty('max-height');
 menu.style.removeProperty('top');
 const panel=menu.getBoundingClientRect();
 const nav=document.querySelector('.mobile-bottom-bar')?.getBoundingClientRect();
 const bottom=nav?.height?nav.top:innerHeight;
 const below=bottom-panel.top-4;
 if(panel.height<=below)return;
 const anchor=menu.offsetParent.getBoundingClientRect();
 const above=anchor.top-10;
 if(below<88&&above>below){
  const height=Math.min(panel.height,above);
  menu.style.maxHeight=height+'px';
  menu.style.top=(-height-6)+'px';
 }else menu.style.maxHeight=Math.max(44,below)+'px';
}

export function rowMenuKeyboard(e){
 const trigger=e.target.closest('[data-toggle-menu]'),menu=e.target.closest('.dropdown-menu[open],.more-dropdown-menu[open]');
 const itemsFor=panel=>[...(panel?.querySelectorAll('.dropdown-item,.more-menu-item:not([hidden])')||[])];
 if(trigger&&['ArrowDown','ArrowUp'].includes(e.key)){
  e.preventDefault();
  if(trigger.getAttribute('aria-expanded')!=='true')trigger.click();
  const items=itemsFor(document.getElementById(trigger.dataset.toggleMenu));
  (e.key==='ArrowUp'?items[items.length-1]:items[0])?.focus();
 }
 if(menu&&['ArrowDown','ArrowUp','Home','End','Escape','Tab'].includes(e.key)){
  if(e.key==='Tab'&&!menu.matches('.more-dropdown-menu'))return;
  const items=itemsFor(menu),index=items.indexOf(document.activeElement);
  if(e.key!=='Tab')e.preventDefault();
  if(e.key==='Escape'||e.key==='Tab'){
   closeRowMenu(menu);
   const opener=[...document.querySelectorAll('[data-toggle-menu]')].find(b=>b.dataset.toggleMenu===menu.id);
   opener?.setAttribute('aria-expanded','false');
   opener?.focus();
  }else if(items.length)items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
 }
}

// Row menus use viewport coordinates and close on scroll. Booking menus move with the action bar.
export function closeOpenMenus(){
 document.querySelectorAll('.dropdown-menu[open],.more-dropdown-menu[open]').forEach(closeRowMenu);
 document.querySelectorAll('[data-toggle-menu][aria-expanded="true"]').forEach(button=>button.setAttribute('aria-expanded','false'));
}
export function installMenuAutoClose(){
 let openedAt=0;
 // Opening a menu can nudge the page (focus, layout); ignore scroll events right after a menu button is pressed.
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-toggle-menu]'))openedAt=performance.now();},true);
 addEventListener('scroll',e=>{
  if(performance.now()-openedAt<350)return;
  if(e.target?.closest?.('.dropdown-menu,.more-dropdown-menu'))return;   // scrolling inside the menu itself keeps it open
  if(document.querySelector('.dropdown-menu[open]'))closeOpenMenus();
 },{capture:true,passive:true});
 addEventListener('resize',()=>{if(performance.now()-openedAt>=350)closeOpenMenus();});
 addEventListener('orientationchange',()=>closeOpenMenus());
}
