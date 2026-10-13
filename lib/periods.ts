import {mexicoDate} from './monthly-report.ts';

export type DatePeriod={start:string;end:string};
const shift=(date:string,days:number)=>{const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10)};

export function periodEndingOn(end:string):DatePeriod{return {start:shift(end,-29),end};}
export function recentPeriod(now=new Date()):DatePeriod{return periodEndingOn(mexicoDate(now));}
export function previousPeriods(count:number,now=new Date()):DatePeriod[]{
  const today=mexicoDate(now);
  return Array.from({length:Math.max(0,count)},(_,index)=>{const end=shift(today,-30*(index+1));return {start:shift(end,-29),end};});
}
export function periodCountFrom(earliest:string,now=new Date()):number{
  const today=mexicoDate(now);
  const start=earliest.length===10?earliest:mexicoDate(new Date(earliest));
  const days=Math.floor((Date.parse(`${today}T12:00:00Z`)-Date.parse(`${start}T12:00:00Z`))/86400000)+1;
  return Math.max(1,Math.ceil(days/30));
}
export function isInPeriod(value:string,period:DatePeriod):boolean{
  const date=value.length===10?value:mexicoDate(new Date(value));
  return date>=period.start&&date<=period.end;
}
export function periodLabel(period:DatePeriod):string{
  const format=(value:string)=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
  return `${format(period.start)} – ${format(period.end)}`;
}
export function calendarDaysBetween(start:string,end:string):number{
  return Math.floor((Date.parse(`${end}T12:00:00Z`)-Date.parse(`${start}T12:00:00Z`))/86400000);
}
