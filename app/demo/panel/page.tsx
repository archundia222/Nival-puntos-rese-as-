import {OwnerView} from '../../../lib/owner/view';
import {periodRange,rollingPeriodRange} from '../../../lib/owner/domain.mjs';
import fixture from '../../../lib/owner/demo-fixtures.json';
import {demoRollingPeriod} from '../../../lib/owner/demo-period.mjs';
export default async function DemoOwner({searchParams}:{searchParams:Promise<{kind?:string;period?:string;days?:string;mobile?:string;embed?:string;branch?:string}>}){
 const params=await searchParams;
 const demoNow=new Date('2026-10-05T12:00:00Z');
 const range=params.days?rollingPeriodRange(Number(params.days),demoNow):periodRange(params.kind,params.period,demoNow);
 const data=params.days?demoRollingPeriod(fixture.month,range):fixture[range.kind as keyof typeof fixture];
 const exampleKey=range.kind==='day'?'2026-10-05':range.kind==='year'?'2026':'2026-10';
 const shown=params.days||range.key===exampleKey?data:{...data,metrics:data.metrics.map((r:Record<string,any>)=>({...r,visits:0,points:0,new_customers:0,redeemed:0,pending:0})),ranking:[],last:null,google:null,reports:[],changes:[]};
 const b={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',name:'Café Demo',slug:'cafe-demo',status:'activo',price_mxn:549,plan_name:'Plus',pay_card_url:'/demo/panel#nival-pay',pay_card_label:'Café Demo'};
 const demoComparison={rating:4.8,reviews:1486,average_rating:4.5,average_reviews:1320,difference:0.3,sample:true};
 const branches=[{id:'demo-branch-1',business_id:b.id,name:'Condesa',active:true,is_primary:true},{id:'demo-branch-2',business_id:b.id,name:'Roma Norte',active:true},{id:'demo-branch-3',business_id:b.id,name:'Mixcoac',active:true}],selectedBranch=branches.find(branch=>branch.id===params.branch)||branches[0];
 const totalVisits=Number(shown.metrics?.find((row:Record<string,any>)=>row.period==='current')?.visits||0);
 const split=[Math.round(totalVisits*.45),Math.round(totalVisits*.35),0];split[2]=totalVisits-split[0]-split[1];
 const branchStats=branches.map((branch,i)=>({branch_id:branch.id,name:branch.name,visits:split[i],customers:[44,39,37][i],redemptions:Math.round(split[i]*.13)}));
 const names=['María López','Diego Ramos','Sofía Ortiz','Luis García','Fernanda Cruz','Miguel Torres','Paola Ruiz','Daniel Vega'];
 const ranking=(shown.ranking||[]).map((person:Record<string,any>,i:number)=>({...person,staff_id:'d4e00000-0000-4000-8000-'+String(i+1).padStart(12,'0'),name:names[i]||'Asociado'}));
 const staff=ranking.map((person:Record<string,any>,i:number)=>({id:person.staff_id,name:person.name,active:true,branch_id:branches[i%3].id,branch_name:branches[i%3].name}));
 const customers=shown.segments||[];
 const recentMovements=Array.from({length:5},(_,i)=>({id:'move-'+i,type:i%3===2?'redeem':'visit',customer:customers[i]?.name||'Cliente',staff_id:ranking[i%ranking.length]?.staff_id,created_at:new Date(Date.parse('2026-10-05T12:00:00Z')-i*3600000).toISOString()}));
 const redemptions=Array.from({length:7},(_,i)=>({id:'demo-redeem-'+i,reward:shown.rewards?.[i%Math.max(1,shown.rewards?.length||1)]?.name||'Premio',customer:customers[i]?.name||'Cliente',points:-10,status:'aprobado',value_mxn:[48,35,65,79,70,42,52][i],photo_path:'/assets/demo/ticket-'+(i+1)+'.svg',staff_id:ranking[i%ranking.length]?.staff_id,branch_id:branches[i%3].id,created_at:new Date(Date.parse('2026-10-05T12:00:00Z')-i*86400000).toISOString()}));
 const demoData={...shown,repliesUsed:Math.min(94,100),activeRewards:3,zoneComparison:demoComparison,program:shown.program,rewards:shown.rewards,reviewCards:shown.reviewCards,activity:shown.activity,branches,selectedBranch,branchStats,ranking,staff,recentMovements,redemptions};

 return <div className={params.mobile==='1'?'mobilePreviewPage':undefined}>{params.mobile==='1'&&<p className="mobilePreviewCaption">Panel del dueño · vista de 360 px · datos ficticios</p>}<div className={params.mobile==='1'?'mobilePreview':undefined}>{params.embed==='1'&&<style>{'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'}</style>}<OwnerView actor={{id:'11111111-1111-4111-8111-111111111111',name:'Dueño de Café Demo'}} b={b} businesses={[b]} range={range} data={demoData} demo mobilePreview={params.mobile==='1'}/></div></div>;
}
