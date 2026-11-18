// Hall price for an event date: Fri/Sat, Sunday, Mon-Thu, and the eleven holidays (actual dates, no observed-weekday substitutions).
// Same rates and holiday rules as the engine's Ledger.pricing (dist/domain.js); tools/test/day-price.test.mjs keeps them identical for every day of nine years.
export const HALL_RATES={weekend:1400,sunday:1200,weekday:1000,holiday:1800};
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function dayPrice(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
 const d=new Date(value+'T12:00:00Z');
 if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==value)return null;
 const year=d.getUTCFullYear(),weekday=d.getUTCDay();
 const utc=(month,day)=>{const result=new Date(0);result.setUTCFullYear(year,month-1,day);return result;};
 const nth=(month,day,n)=>utc(month,1+(day-utc(month,1).getUTCDay()+7)%7+7*(n-1)).toISOString().slice(5,10);
 const memorial=utc(6,0);memorial.setUTCDate(memorial.getUTCDate()-(memorial.getUTCDay()+6)%7);
 const holidays={
  '01-01':"New Year's Day",[nth(1,1,3)]:'Martin Luther King Jr. Day',[nth(2,1,3)]:"Presidents' Day",[memorial.toISOString().slice(5,10)]:'Memorial Day',
  '06-19':'Juneteenth','07-04':'Independence Day',[nth(9,1,1)]:'Labor Day',[nth(10,1,2)]:'Columbus Day','11-11':'Veterans Day',[nth(11,4,4)]:'Thanksgiving','12-25':'Christmas Day'
 };
 const holiday=holidays[value.slice(5)]||'';
 const hall=holiday?HALL_RATES.holiday:weekday===5||weekday===6?HALL_RATES.weekend:weekday===0?HALL_RATES.sunday:HALL_RATES.weekday;
 return {hall,holiday,label:holiday||DAYS[weekday]};
}

// Security guard is billed by the hour. Same rate as the engine's extraRates.security ($30/hour).
export const SECURITY_HOURLY=30;
export function securityCost(hours){const h=Number(hours);return Number.isFinite(h)&&h>0?Math.round(h*SECURITY_HOURLY*100)/100:0;}
