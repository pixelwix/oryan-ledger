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
export function rowMenuKeyboard(e){
 const trigger=e.target.closest('[data-toggle-menu]'),menu=e.target.closest('.dropdown-menu[open]');
 if(trigger&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(trigger.getAttribute('aria-expanded')!=='true')trigger.click();const items=document.getElementById(trigger.dataset.toggleMenu)?.querySelectorAll('.dropdown-item');(e.key==='ArrowUp'?[...items].slice(-1)[0]:items?.[0])?.focus();}
 if(menu&&['ArrowDown','ArrowUp','Home','End','Escape'].includes(e.key)){
  e.preventDefault();const items=[...menu.querySelectorAll('.dropdown-item')],index=items.indexOf(document.activeElement);
  if(e.key==='Escape'){closeRowMenu(menu);const opener=[...document.querySelectorAll('[data-toggle-menu]')].find(b=>b.dataset.toggleMenu===menu.id);opener?.setAttribute('aria-expanded','false');opener?.focus();}
  else items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
 }
}

// Close any open "..." / More actions menu when the page scrolls or the window changes size, so a menu never floats away from its row.
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
  if(document.querySelector('.dropdown-menu[open],.more-dropdown-menu[open]'))closeOpenMenus();
 },{capture:true,passive:true});
 addEventListener('resize',()=>{if(performance.now()-openedAt>=350)closeOpenMenus();});
 addEventListener('orientationchange',()=>closeOpenMenus());
}
