export type Diagnostic={checked_on:string;rating:number;review_count:number;findings:string;recommendations:string};
export function validDate(value:string,today:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value&&value<=today;}
export function diagnosticsForMonth(rows:Diagnostic[],month:string){
 const ordered=rows.filter(r=>r.checked_on.slice(0,7)<=month).toSorted((a,b)=>b.checked_on.localeCompare(a.checked_on));
 const current=ordered.find(r=>r.checked_on.startsWith(month))??null;
 const previous=ordered.find(r=>r.checked_on.slice(0,7)<month)??null;
 return {current,previous,ratingChange:current&&previous?Math.round((Number(current.rating)-Number(previous.rating))*10)/10:null,reviewChange:current&&previous?current.review_count-previous.review_count:null};
}
