const scaledFields=['visits','points','redeemed','pending','new_customers','active_customers','returning_customers','returning_revenue'];

export function demoRollingPeriod(month,range){
 const days=Number(range.days)||30,factor=days/30;
 const metrics=month.metrics.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[
  key,scaledFields.includes(key)?Math.round(Number(value||0)*factor):value
 ])));
 const current=metrics.find(row=>row.period==='current');
 const visits=Math.max(0,Number(current?.visits||0));
 const start=new Date(range.start+'T12:00:00Z');
 const activity=Array.from({length:days},(_,index)=>{
  const date=new Date(start);date.setUTCDate(date.getUTCDate()+index);
  return {label:new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',timeZone:'UTC'}).format(date),active_users:0};
 });
 for(let visit=0;visit<visits;visit++){
  const index=Math.min(days-1,Math.floor((visit+.5)*days/Math.max(1,visits)));
  activity[index].active_users++;
 }
 return {...month,metrics,activity};
}
