export const settingsSections=Object.freeze({
 people:'People',square:'Square',helper:'Contract helper',wording:'Contract wording',email:'Email and reminders',health:'Backups and health',audit:'Audit log'
});

export const routeMap={bookings:'#/bookings',overview:'#/overview',calendar:'#/calendar',payments:'#/payments',insights:'#/insights',booking:'#/booking/sophia','edit-booking':'#/booking/sophia/edit','record-payment':'#/booking/sophia/pay','new-booking':'#/new',states:'#/states'};
export function parseRoute(hash){
 const [pathname,query='']=(hash.replace(/^#/,'')||'/overview').split('?');
 const settings=pathname.match(/^\/settings(?:\/([^/]+))?$/);
 if(settings&&(!settings[1]||Object.hasOwn(settingsSections,settings[1])))return {screen:'settings',section:settings[1]||'people',id:null,query:new URLSearchParams(query)};
 const match=pathname.match(/^\/booking\/([^/]+)(?:\/(edit|pay))?$/);
 if(match)return {screen:match[2]==='edit'?'edit-booking':match[2]==='pay'?'record-payment':'booking',id:decodeURIComponent(match[1]),query:new URLSearchParams(query)};
 const screen=Object.keys(routeMap).find(k=>routeMap[k]==='#'+pathname);
 return {screen:screen||'overview',id:null,query:new URLSearchParams(query)};
}
