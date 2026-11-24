import states,{styles} from './screens/states.mjs?v=2.11.0';
export function readStates(presentation,retry){
 const sample=document.createElement('div');sample.innerHTML=states(presentation.states);
 const sections=sample.querySelectorAll('.state-section');
 function show(kind){
  document.getElementById('read-'+kind)?.remove();
  const node=sections[{error:0,offline:1,loading:2,empty:3}[kind]].lastElementChild.cloneNode(true);node.id='read-'+kind;
  if(kind==='error'){node.querySelector('strong').textContent='Unable to reach the ledger.';node.querySelector('p').textContent='Reconnect and try again.';}
  if(kind==='offline')node.querySelector('div').textContent='Offline Mode Active: You are currently disconnected. Reconnect to reload the ledger.';
  if(kind==='empty')node.querySelector('p').textContent='No reservations found. Check your spelling or clear your active filter chips.';
  node.querySelector('button')?.addEventListener('click',retry);
  const main=document.querySelector('main')||document.body;main.prepend(node);
  if(kind==='loading'){let style=document.getElementById('read-state-styles');if(!style){style=document.createElement('style');style.id='read-state-styles';style.textContent=styles;document.head.append(style);}}
  return node;
 }
 return {show,clear(kind){document.getElementById('read-'+kind)?.remove();}};
}
