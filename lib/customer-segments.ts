import {calendarDaysBetween,isInPeriod} from './periods.ts';
import type {DatePeriod} from './periods.ts';

export const CUSTOMER_LOOKBACK_DAYS=30;
export const FREQUENT_VISIT_THRESHOLD=3;
export const WEEKLY_ADVICE={
  atRisk:(count:number)=>`Tienes ${count} clientes en riesgo. Mándales una promoción para que vuelvan.`,
  neverVisited:(count:number)=>`${count} clientes se registraron pero nunca han venido. Invítalos con un premio de bienvenida.`,
  frequent:'Tus clientes frecuentes son tu mejor activo. Reconócelos con una promoción especial.',
} as const;

export type SegmentCustomer={id:string;created_at:string};
export type SegmentMovement={customer_id:string;kind:string;happened_at:string};
export type CustomerGroups={atRisk:Set<string>;neverVisited:Set<string>;new:Set<string>;frequent:Set<string>};

export function customerGroups(customers:SegmentCustomer[],movements:SegmentMovement[],period:DatePeriod,today:string,riskDays:number):CustomerGroups{
  const visitsByCustomer=new Map<string,string[]>();
  for(const movement of movements)if(movement.kind==='visit')visitsByCustomer.set(movement.customer_id,[...(visitsByCustomer.get(movement.customer_id)||[]),movement.happened_at]);
  const groups:CustomerGroups={atRisk:new Set(),neverVisited:new Set(),new:new Set(),frequent:new Set()};
  for(const customer of customers){
    const visits=visitsByCustomer.get(customer.id)||[];
    if(visits.length){
      const lastVisit=visits.map(value=>value.length===10?value:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))).sort().at(-1)!;
      if(calendarDaysBetween(lastVisit,today)>riskDays){groups.atRisk.add(customer.id);continue;}
    } else {groups.neverVisited.add(customer.id);continue;}
    if(isInPeriod(customer.created_at,period)){groups.new.add(customer.id);continue;}
    if(visits.filter(value=>isInPeriod(value,period)).length>=FREQUENT_VISIT_THRESHOLD)groups.frequent.add(customer.id);
  }
  return groups;
}

export function weeklyAdvice(groups:CustomerGroups):string{
  if(groups.atRisk.size)return WEEKLY_ADVICE.atRisk(groups.atRisk.size);
  if(groups.neverVisited.size)return WEEKLY_ADVICE.neverVisited(groups.neverVisited.size);
  return WEEKLY_ADVICE.frequent;
}
