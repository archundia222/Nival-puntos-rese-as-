import {OwnerView} from '../../../lib/owner/view';
import {periodRange,rollingPeriodRange} from '../../../lib/owner/domain.mjs';
import fixture from '../../../lib/owner/demo-fixtures.json';
import {demoRollingPeriod} from '../../../lib/owner/demo-period.mjs';
export default async function DemoOwner({searchParams}:{searchParams:Promise<{kind?:string;period?:string;days?:string;mobile?:string;embed?:string}>}){
 const params=await searchParams;
 const demoNow=new Date('2026-10-05T12:00:00Z');
 const range=params.days?rollingPeriodRange(Number(params.days),demoNow):periodRange(params.kind,params.period,demoNow);
 const data=params.days?demoRollingPeriod(fixture.month,range):fixture[range.kind as keyof typeof fixture];
 const exampleKey=range.kind==='day'?'2026-10-05':range.kind==='year'?'2026':'2026-10';
 const shown=params.days||range.key===exampleKey?data:{...data,metrics:data.metrics.map((r:Record<string,any>)=>({...r,visits:0,points:0,new_customers:0,redeemed:0,pending:0})),ranking:[],last:null,google:null,reports:[],changes:[]};
 const b={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',name:'Café Demo',slug:'cafe-demo',status:'activo',price_mxn:549,plan_name:'Plus'};
 const demoComparison={rating:4.5,reviews:110,average_rating:4.3,average_reviews:94,difference:0.2,sample:true};
 const demoData={...shown,zoneComparison:demoComparison};
 return <div className={params.mobile==='1'?'mobilePreviewPage':undefined}>{params.mobile==='1'&&<p className="mobilePreviewCaption">Panel del dueño · vista de 360 px · datos ficticios</p>}<div className={params.mobile==='1'?'mobilePreview':undefined}>{params.embed==='1'&&<style>{'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'}</style>}<OwnerView actor={{id:'11111111-1111-4111-8111-111111111111',name:'Dueño de Café Demo'}} b={b} businesses={[b]} range={range} data={demoData} demo mobilePreview={params.mobile==='1'}/></div></div>;
}
