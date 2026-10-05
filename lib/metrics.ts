export type Customer = {id:number;nombre:string;telefono:string;puntos:number;createdAt?:string};
export type Movement = {id:string;customerId:number;kind:'visit'|'redeem'|'adjust';points:number;at:string};
export type Review = {id:string;author:string;rating:number;text:string;date:string;answeredAt:string|null};

export function monthOf(date:string) { return date.slice(0,7); }
export function loyaltyMetrics(customers:Customer[], movements:Movement[], month:string, riskDays:number, now=new Date()) {
  const visits=movements.filter(m=>m.kind==='visit');
  const monthly=visits.filter(m=>monthOf(m.at)===month);
  const returning=new Set<number>();
  for(const v of monthly) if(visits.some(other=>other.customerId===v.customerId && other.at<v.at)) returning.add(v.customerId);
  const risk=customers.filter(c=>{
    const dates=visits.filter(v=>v.customerId===c.id).map(v=>v.at).sort();
    const last=dates.at(-1)||c.createdAt;
    return last && (now.getTime()-new Date(last).getTime())/86400000>riskDays;
  });
  return {newCustomers:customers.filter(c=>c.createdAt && monthOf(c.createdAt)===month).length,returning:returning.size,risk,visits:monthly.length,points:monthly.reduce((s,m)=>s+m.points,0)};
}
export function reviewMetrics(reviews:Review[],month:string) {
  const current=reviews.filter(r=>monthOf(r.date)===month);
  return {total:current.length,positive:current.filter(r=>r.rating>=4).length,neutral:current.filter(r=>r.rating===3).length,negative:current.filter(r=>r.rating<=2).length,answered:current.filter(r=>r.answeredAt!==null).length};
}
