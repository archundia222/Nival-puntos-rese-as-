export type ReportCustomer={id:string;created_at:string};
export type ReportMovement={customer_id:string;kind:string;points:number;happened_at:string};
export type ReportReview={rating:number;review_date:string;answered_at:string|null};
export const mexicoDate=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const validMonth=(month:string)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(month);
export function monthlyReport(customers:ReportCustomer[],movements:ReportMovement[],reviews:ReportReview[],month:string){
 if(!validMonth(month))throw new Error('Mes inválido');
 const timestampMonth=(value:string)=>mexicoDate(new Date(value)).slice(0,7);
 const visits=movements.filter(m=>m.kind==='visit');
 const current=visits.filter(m=>timestampMonth(m.happened_at)===month);
 const first=new Map<string,number>();
 for(const visit of visits){const time=Date.parse(visit.happened_at);first.set(visit.customer_id,Math.min(first.get(visit.customer_id)??Infinity,time));}
 const returning=new Set(current.filter(v=>Date.parse(v.happened_at)>(first.get(v.customer_id)??Infinity)).map(v=>v.customer_id));
 const currentReviews=reviews.filter(r=>r.review_date.slice(0,7)===month);
 const pending=currentReviews.filter(r=>!r.answered_at).length;
 const negative=currentReviews.filter(r=>r.rating<=2).length;
 const recommendations:string[]=[];
 if(pending)recommendations.push(`Nival tiene ${pending} reseña${pending===1?'':'s'} de este mes pendiente${pending===1?'':'s'} de responder en Google.`);
 if(negative)recommendations.push(`Revisar los motivos de las ${negative} reseñas negativas y acordar una mejora concreta para el siguiente mes.`);
 if(current.length===0)recommendations.push('Registrar las visitas al entregar puntos para medir la frecuencia de regreso.');
 if(currentReviews.length===0)recommendations.push('Invitar a los clientes a compartir su experiencia en Google mediante la tarjeta de reseñas.');
 if(!recommendations.length)recommendations.push('Mantener el registro de visitas y la revisión de reseñas para comparar el siguiente mes.');
 return {newCustomers:customers.filter(c=>timestampMonth(c.created_at)===month).length,visits:current.length,returning:returning.size,redemptions:movements.filter(m=>m.kind==='redeem'&&timestampMonth(m.happened_at)===month).length,reviews:currentReviews.length,positive:currentReviews.filter(r=>r.rating>=4).length,neutral:currentReviews.filter(r=>r.rating===3).length,negative,answered:currentReviews.length-pending,pending,average:currentReviews.length?currentReviews.reduce((sum,r)=>sum+r.rating,0)/currentReviews.length:null,recommendations};
}

export function rangeReport(customers:ReportCustomer[],movements:ReportMovement[],reviews:ReportReview[],start:string,end:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end)throw new Error('Periodo inválido');
 const dateOf=(value:string)=>value.length===10?value:mexicoDate(new Date(value));
 const inRange=(value:string)=>{const date=dateOf(value);return date>=start&&date<=end;};
 const visits=movements.filter(m=>m.kind==='visit');
 const currentVisits=visits.filter(m=>inRange(m.happened_at));
 const firstVisit=new Map<string,number>();
 for(const visit of visits){const time=Date.parse(visit.happened_at);firstVisit.set(visit.customer_id,Math.min(firstVisit.get(visit.customer_id)??Infinity,time));}
 const returning=new Set(currentVisits.filter(v=>Date.parse(v.happened_at)>(firstVisit.get(v.customer_id)??Infinity)).map(v=>v.customer_id));
 const currentReviews=reviews.filter(r=>inRange(r.review_date));
 const pending=currentReviews.filter(r=>!r.answered_at).length;
 const negative=currentReviews.filter(r=>r.rating<=2).length;
 const recommendations:string[]=[];
 if(pending)recommendations.push(`Hay ${pending} reseña${pending===1?'':'s'} de este periodo pendiente${pending===1?'':'s'} de responder en Google.`);
 if(negative)recommendations.push(`Revisar los motivos de las ${negative} reseñas negativas y acordar una mejora concreta.`);
 if(currentVisits.length===0)recommendations.push('Registrar las visitas al entregar puntos para medir la frecuencia de regreso.');
 if(currentReviews.length===0)recommendations.push('Invitar a los clientes a compartir su experiencia mediante la tarjeta de reseñas.');
 if(!recommendations.length)recommendations.push('Mantener el registro de visitas y revisar las reseñas del siguiente periodo.');
 return {newCustomers:customers.filter(c=>inRange(c.created_at)).length,visits:currentVisits.length,returning:returning.size,redemptions:movements.filter(m=>m.kind==='redeem'&&inRange(m.happened_at)).length,reviews:currentReviews.length,positive:currentReviews.filter(r=>r.rating>=4).length,neutral:currentReviews.filter(r=>r.rating===3).length,negative,answered:currentReviews.filter(r=>!!r.answered_at).length,pending,average:currentReviews.length?currentReviews.reduce((sum,r)=>sum+r.rating,0)/currentReviews.length:null,recommendations};
}
