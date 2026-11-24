import {businessToday} from './business-date.mjs?v=2.11.0';
export const contractAllowed=r=>!r.cancelled&&r.type!=='Blackout';
export function schedulePassed(r,today){const date=new Date(r.date+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-14);return date.toISOString().slice(0,10)<today;}
export function outdatedContract(row,r){
 if(row.kind!=='contract'||row.status!=='saved')return '';
 return (r.activity||[]).filter(e=>Date.parse(e.at)>Date.parse(row.generated_at)&&e.changes?.some(c=>c.field==='contractStatus'&&c.after==='Not prepared')).map(e=>businessToday(e.at)).sort().slice(-1)[0]||'';
}
export function refreshContractCard(r){
 if(location.hash.split('?')[0]!=='#/booking/'+encodeURIComponent(r.id))return;
 const header=document.querySelector('.booking-header-card');if(!header)return;
 const badges=[...header.querySelectorAll('.badge')],badge=badges.find(b=>b.textContent.startsWith('Contract '));
 if(badge)badge.textContent='Contract '+(r.contractStatus||'Not prepared').toLowerCase();
 const section=[...document.querySelectorAll('section.card')].find(el=>el.querySelector('h2')?.textContent==='Contract & Documents');
 if(r.contractStatus==='Prepared'&&r.contractStatusDate&&section){section.querySelector('.card-header .badge').textContent='Prepared';section.querySelector('.card-subtitle').textContent='Prepared on '+r.contractStatusDate;}
}
