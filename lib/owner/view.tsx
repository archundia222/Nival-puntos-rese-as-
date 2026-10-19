import {PlanChoices} from './plan-choices';
import {AccountState} from './account-state';
import {entitlements,planLimits} from '../foundation/entitlements.mjs';
import {ReviewInsights} from './review-insights-view';
import {DashboardShell} from './shell';
import {CustomerExplorer} from './customer-explorer';
import {ShareTools} from './share-tools';
import {Icon} from './icons';
import {quoteUrl} from "../foundation/registration.mjs";
import {RegistrationFields} from "../foundation/registration-fields";
import {logout,registerBusiness} from '../foundation/actions';
import {redeemActivationCode} from '../admin/actions';
import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {checklistLabels,periodRange,inclusivePeriodEnd,formatPeriodDate} from './domain.mjs';
import {Bars,RatingLine} from './charts';
import {defaultMessages} from './messages.mjs';
import {saveMessageTemplate} from './actions';
import {saveSegments} from './actions';
import {CardCatalog} from '../points/card-catalog';
import {RewardWorkspace} from './reward-workspace';
import {TeamWorkspace} from './team-workspace';
import {TeamUnified} from './team-unified';
import {BranchManager} from './branch-manager';
import {NextActions} from './next-actions';
import {CampaignOverview} from './campaign-overview';
import {StartGuide,startGuideState} from './start-guide';
import type {Actor} from '../foundation/db';
import {SegmentCard} from './clients';
import {BranchGoogleSettings} from './branch-google-settings';
import {CopyPayLink} from './copy-pay-link';
const number=(v:number)=>Number(v||0).toLocaleString('es-MX');
const percentChange=(current:number,previous:number)=>previous===0?(current>0?'Nuevo':'0%'):`${current>previous?'+':''}${Math.round((current-previous)/previous*100)}%`;
function Metric({label,value,previous}:{label:string;value:number|string;previous?:number}){return <article className="ownerCard ownerMetric"><span>{label}</span><strong>{typeof value==='number'?number(value):value}</strong>{previous!==undefined&&<small>{Number(value)-previous>0?'+':''}{number(Number(value)-previous)} vs. anterior</small>}</article>;}
function ActivityChart({items,days}:{items:Record<string,any>[];days:number}){const source:Record<string,any>[]=items||[],size=Math.max(1,Math.ceil(source.length/7)),rows:Record<string,any>[]=source.reduce<Record<string,any>[]>((out,item,index)=>{const i=Math.floor(index/size);if(!out[i])out[i]={label:item.label,active_users:0};out[i].active_users+=Number(item.active_users||0);out[i].label=item.label;return out;},[] as Record<string,any>[]),max=Math.max(1,...rows.map((x:Record<string,any>)=>Number(x.active_users||0))),coords=rows.map((x:Record<string,any>,i:number)=>({x:20+i*(480/Math.max(1,rows.length-1)),y:146-(Number(x.active_users||0)/max)*118})),line=coords.map((p:{x:number;y:number},i:number)=>(i?"L":"M")+p.x+" "+p.y).join(" "),area=coords.length?"M20 150 "+line+" L500 150 Z":"";return <article className="ownerCard ownerActivityCard"><header><div><span className="workspaceEyebrow">ÚLTIMOS {days} DÍAS</span><h2>Visitas registradas</h2><div className="activityTotalLine"><strong>{rows.reduce((sum,x)=>sum+Number(x.active_users||0),0)}</strong><span>visitas en el periodo</span></div></div><span className="activityLegend"><i/> Visitas</span></header>{rows.length?<><svg className="ownerActivityChart" viewBox="0 0 520 170" role="img" aria-label={`Gráfica de visitas registradas durante ${days} días`}><defs><linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1d7657" stopOpacity=".2"/><stop offset="100%" stopColor="#1d7657" stopOpacity="0"/></linearGradient></defs><g className="activityGridLines" aria-hidden="true">{[28,68,108,150].map(y=><line key={y} x1="20" x2="500" y1={y} y2={y}/>)}</g><path d={area} fill="url(#activityFill)"/><path d={line} fill="none" stroke="#1d7657" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{coords.map((point:{x:number;y:number},i:number)=><circle key={i} cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#1d7657" strokeWidth="2"><title>{rows[i].label}: {rows[i].active_users} visitas</title></circle>)}</svg><div className="activityDayLabels">{rows.map((x:Record<string,any>,i:number)=><span key={i}>{x.label}</span>)}</div></>:<p className="ownerEmpty">Tu primera visita aparecerá aquí.</p>}</article>;}
function RetentionMetric({current,previous}:{current:Record<string,any>;previous:Record<string,any>}){const rate=current.active_customers?Math.round(Number(current.returning_customers||0)/Number(current.active_customers)*100):0;const before=previous.active_customers?Math.round(Number(previous.returning_customers||0)/Number(previous.active_customers)*100):0;return <article className="ownerCard ownerMetric"><span>Retención</span><strong>{rate}%</strong><small>{rate-before>0?'+':''}{rate-before} pp. vs. anterior</small></article>;}
function CustomerMix({current}:{current:Record<string,any>}){const total=Number(current.active_customers||0),returning=Number(current.returning_customers||0),newCustomers=Math.max(0,total-returning),share=total?Math.round(returning/total*100):0;return <article className="ownerCard customerMixCard"><header><div><span className="workspaceEyebrow">VISITAS DEL PERIODO</span><h3>Nuevos y recurrentes</h3></div></header>{total?<div className="customerMixBody"><div className="customerMixDonut" style={{background:`conic-gradient(#174d37 ${share}%, #d9ed78 ${share}% 100%)`}} role="img" aria-label={`${share}% de los clientes activos ya había visitado antes`}><span><b>{total}</b><small>clientes</small></span></div><div className="customerMixLegend"><span><i className="mixReturning"/>Recurrentes <b>{number(returning)}</b></span><span><i className="mixNew"/>Nuevos <b>{number(newCustomers)}</b></span></div></div>:<p className="ownerEmpty">Sin visitas aún</p>}</article>;}
function ProductHub({data,reviewLimit,nfcLimit}:{data:Record<string,any>;reviewLimit:number;nfcLimit:number}){
 const activePoints=Boolean(data.program?.card_enabled),activeNfc=((data.reviewCards||[]) as Record<string,any>[]).filter(card=>card.active).length;
 const details=[activePoints?'Tarjeta de puntos activa':'Configura tu tarjeta de puntos',...(nfcLimit>0?[`${activeNfc} de ${nfcLimit} tarjetas de reseñas activas`]:[])].join(' · ');
 return <section className="productHub" aria-labelledby="product-hub-title"><header><span className="workspaceEyebrow">ACCESO RÁPIDO</span><h2 id="product-hub-title">Tus tarjetas</h2></header><div className="productHubGrid"><a className="productHubCard product-points" href="#mis-tarjetas"><span className="productHubSymbol" aria-hidden="true"><Icon name="points" size={20}/></span><span className="productHubCopy"><strong>Tarjetas</strong><small>{details}</small></span><span className="productHubAction">Configurar <Icon name="arrow" size={14}/></span></a></div></section>;
}
export async function OwnerView({actor,b,businesses,range,data,demo=false,mobilePreview=false,embedded=false}:{actor:Record<string,any>;b:Record<string,any>;businesses:Record<string,any>[];range:ReturnType<typeof periodRange>;data:Record<string,any>;demo?:boolean;mobilePreview?:boolean;embedded?:boolean}){
 const price=Number(b.price_mxn||299);
 const pointsOnly=price!==299&&b.features?.points_only===true;
 const current=data.metrics.find((x:Record<string,any>)=>x.period==='current')!,prev=data.metrics.find((x:Record<string,any>)=>x.period==='previous')!;
 const settings=data.settings||{new_days:14,frequent_days:30,frequent_visits:3,risk_from:31,lost_after:60,risk_visits:2};
 const segments=[['new','Nuevos','is_new'],['frequent','Frecuentes','is_frequent'],['risk','En riesgo','is_risk'],['absent','Sin visita este mes','absent_month']];
 const last=data.last,distribution=last?.distribution||{},hasDistribution=[1,2,3,4,5].reduce((s,n)=>s+Number(distribution[n]||0),0)===Number(last?.total_reviews)&&Object.keys(distribution).length>0;
 const quote=quoteUrl(b);
 const access=entitlements(b);
 const limits=planLimits(b);
 const active=access.active;
 const risk=data.segments.filter((c:Record<string,any>)=>c.is_risk&&!c.is_lost).length;
 const pendingReviews=data.google&&data.google.answered!==null?Math.max(0,Number(data.google.fresh)-Number(data.google.answered)):null;
 const status=active||demo?'Activo':b.status==='pausado'?'Pausado':'Por activar';
 const startState=demo?null:await startGuideState(actor as Actor,b.id,data.reviewCards||[]);
 if(!demo&&!active&&!data.segments.length&&!data.last)return <DashboardShell name={b.name} owner={actor.name} status={status} demo={false} logout={<form action={logout}><button>Cerrar sesión</button></form>}><AccountState b={b}/></DashboardShell>;
 const responseLimit=limits.reviewLimit;
 const giftCardActive=!demo&&Boolean(b.pay_card_url);
 const planName=price>=549?'Plus':price>=399?'Esencial':'Puntos';
 const paidUntil=Date.parse(String(b.paid_until||''));
 const periodStart=Number.isFinite(paidUntil)?paidUntil-30*86400000:Date.now();
 const periodDay=Math.max(1,Math.min(30,Math.floor((Date.now()-periodStart)/86400000)+1));
 const periodDays=Number((range as ReturnType<typeof periodRange>&{days?:number}).days||30);
 const registered=data.segments.length;
 const emptyState=!demo&&registered===0&&Number(current.visits||0)===0&&Number(current.active_customers||0)===0;
 const returningRevenue=Number(current.returning_revenue||0),previousReturningRevenue=Number(prev.returning_revenue||0);
 const money=(value:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
 const activityRows=data.activity?.length?data.activity:demo?['Mié','Jue','Vie','Sáb','Dom','Lun','Mar'].map((label,i)=>({label,active_users:[1,2,1,3,2,4,3][i]})):[];
 const newCount=data.segments.filter((c:Record<string,any>)=>c.is_new).length;
 const frequentCount=data.segments.filter((c:Record<string,any>)=>c.is_frequent).length;
 const riskCount=data.segments.filter((c:Record<string,any>)=>c.is_risk&&!c.is_lost).length;
 const absentCount=data.segments.filter((c:Record<string,any>)=>c.absent_month).length;
 const reviewed=Number(data.repliesUsed||0);
 const groupRows=[['clientes-new','Nuevos',newCount,'#0e7c66'],['clientes-frequent','Frecuentes',frequentCount,'#1f4a3f'],['clientes-risk','En riesgo',riskCount,'#b96b2f'],['clientes-absent','Sin visita este mes',absentCount,'#8c9890']] as const;
 const DashboardContent=embedded?'div':'main';
 return <DashboardShell pointsOnly={pointsOnly} name={b.name} owner={actor.name} status={status} demo={demo} mobilePreview={mobilePreview} homeUrl={demo?'/demo/panel':'/panel?business='+b.id+(data.selectedBranch?.id?'&branch='+data.selectedBranch.id:'')} planName={planName} price={price} responseLimit={responseLimit} nfcLimit={limits.nfcCards} periodDay={periodDay} branches={data.branches||[]} branchId={data.selectedBranch?.id} logout={<form action={logout}><button className="logoutButton" aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18}/></button></form>}><DashboardContent className="ownerDashboard">
 {!demo&&!active&&<AccountState b={b}/>}

 <section id="inicio" data-panel="inicio" className="ownerBlock">
  <header className="impactMasterHeader"><h2>Inicio</h2><form className="impactPeriodFilter" method="get" action={demo?'/demo/panel':'/panel'}>{!demo&&<input type="hidden" name="business" value={b.id}/>} {data.selectedBranch?.id&&<input type="hidden" name="branch" value={data.selectedBranch.id}/>}
  {[7,30,90].map(days=><button type="submit" name="days" value={days} key={days} aria-pressed={periodDays===days}>{days} días</button>)}</form></header>
  {emptyState&&<StartGuide state={startState||undefined}/>}
  <div className="ownerMetrics homePending">
    {[
      ['En riesgo',riskCount,'clientes-risk'],
      ['Reseñas pendientes',pendingReviews??0,'reseñas'],
      ['Canjes por revisar',Number(current.pending||0),'canjes'],
      ['Días restantes',Math.max(0,30-periodDay),'plan']
    ].map(([label,value,target])=><a className="ownerCard ownerMetric" key={String(label)} href={'#'+target}><span>{label}</span><strong>{number(Number(value))}</strong><small>Ver detalle →</small></a>)}
  </div>
  <div className="workspaceActionRow homeQuickActions">
   <a className="workspacePrimary" href="#premios">Crear promoción</a>
   <a className="workspaceSecondary" href="#mis-tarjetas">Ver QR del mostrador</a>
   <a className="workspaceSecondary" href="#equipo">Agregar trabajador</a>
   <a className="workspaceSecondary" href={'/panel/reportes?business='+b.id}>Descargar informe</a>
  </div>
  <div className="ownerMetrics homeCoreMetrics">
   {[
     ['Visitas',Number(current.visits||0),Number(prev.visits||0)],
     ['Clientes nuevos',Number(current.new_customers||0),Number(prev.new_customers||0)],
     ['Premios canjeados',Number(current.redeemed||0),Number(prev.redeemed||0)],
     ['Clientes recurrentes',Number(current.returning_customers||0),Number(prev.returning_customers||0)]
   ].map(([label,value,previous])=><article className="ownerCard ownerMetric" key={String(label)}><span>{label}</span><strong>{number(Number(value))}</strong><small>{percentChange(Number(value),Number(previous))} vs. anterior</small></article>)}
  </div>
  <div className="impactMasterDetails">
   <ActivityChart items={activityRows} days={periodDays}/>
   <CustomerMix current={current}/>
  </div>
  <article className="ownerCard homeGoogle">
   <header className="workspaceSectionHeader"><h3>Google</h3><a href="#reseñas">Ver detalle →</a></header>
   <div className="ownerMetrics"><Metric label="Calificación" value={last?Number(last.rating).toFixed(1)+' ★':'—'}/><Metric label="Reseñas" value={Number(last?.total_reviews||0)}/><Metric label="Respondidas" value={data.google?.answered??0}/><Metric label="Pendientes" value={pendingReviews??0}/></div>
   <div className="replyProgress"><i style={{width:(responseLimit?Math.min(100,100*reviewed/responseLimit):0)+'%'}}/></div>
   <small>{reviewed} de {responseLimit} respuestas del plan</small>
  </article>
  <article className="ownerCard"><header className="workspaceSectionHeader"><h3>Clientes</h3><a href="#clientes">Ver detalle →</a></header>
   {groupRows.map(([id,label,count,color])=><a className="clientStatusRow" href={'#'+id} key={id}><span>{label}</span><b>{count}</b><i><em style={{width:(registered?Math.min(100,count/registered*100):0)+'%',background:color}}/></i></a>)}
  </article>
  <div className="impactMasterDetails">
   <article className="ownerCard"><header className="workspaceSectionHeader"><h3>Actividad reciente</h3><a href="#canjes">Ver detalle →</a></header>
    {(data.recentMovements||[]).length?(data.recentMovements||[]).map((m:Record<string,any>)=><div className="clientStatusRow" key={m.id}><span>{m.type==='visit'?'Visita':'Canje'} · {m.customer}</span><small>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City',hour:'2-digit',minute:'2-digit'})}</small></div>):<p className="ownerEmpty">Sin movimientos</p>}
   </article>
   <article className="ownerCard"><header className="workspaceSectionHeader"><h3>Top sucursales</h3><a href="#sucursales">Ver detalle →</a></header>{(data.branchStats||[]).slice().sort((a:Record<string,any>,b:Record<string,any>)=>Number(b.visits||0)-Number(a.visits||0)).slice(0,3).map((branch:Record<string,any>,i:number)=><div className="clientStatusRow" key={branch.branch_id}><span>{i+1}. {branch.name}</span><b>{branch.visits} visitas</b></div>)}
    <h3>Top trabajadores</h3>{data.ranking.slice(0,3).map((r:Record<string,any>,i:number)=><div className="clientStatusRow" key={r.staff_id}><span>{i+1}. {r.name}</span><b>{r.visits} visitas · {r.redemptions} canjes</b></div>)}
   </article>
  </div>
  {planName==='Plus'&&<article className="ownerCard"><header className="workspaceSectionHeader"><h3>Tu zona</h3><a href="#reseñas">Ver detalle →</a></header>{data.zoneComparison&&!data.zoneComparison.sample?<strong>{Number(data.zoneComparison.business_rating).toFixed(1)} ★ vs {Number(data.zoneComparison.zone_average_rating).toFixed(1)} ★ · {Number(data.zoneComparison.difference)>0?'+':''}{Number(data.zoneComparison.difference).toFixed(1)} ★</strong>:<p>Próximamente</p>}</article>}
  <a href="#mis-tarjetas" className="workspaceSecondary">Tus tarjetas →</a>
 </section>
 <section data-panel="reseñas" className="ownerBlock">
   <header className="workspaceSectionHeader"><h2>Reseñas</h2>{data.selectedBranch?.google_maps_url?<a className="workspaceSecondary" target="_blank" rel="noreferrer" href={data.selectedBranch.google_maps_url}>Abrir Google</a>:<a href="#sucursales">Agregar ficha de Google</a>}</header>
   <div className="ownerMetrics">
     <Metric label="Calificación" value={last?Number(last.rating).toFixed(1)+' ★':'—'}/>
     <Metric label="Reseñas" value={Number(last?.total_reviews||0)}/>
     <Metric label="Respondidas" value={data.google?.answered??0}/>
     <Metric label="Por responder" value={pendingReviews??0}/>
   </div>
   <article className="ownerCard"><strong>{reviewed} de {responseLimit} respuestas del plan</strong><div className="replyProgress"><i style={{width:(responseLimit?Math.min(100,100*reviewed/responseLimit):0)+'%'}}/></div></article>
   {last&&hasDistribution&&<Bars title="Reseñas por calificación" unit="Reseñas" items={[5,4,3,2,1].map(n=>({label:n+' ★',value:Number(distribution[n]||0),color:'#175d47'}))}/>}
   <article className="ownerCard"><h3>Análisis y recomendaciones</h3>{last?.notes?<ReviewInsights notes={last.notes}/>:<p>El análisis estará disponible con el siguiente reporte.</p>}</article>
   <article className="ownerCard"><h3>Tarjetas NFC de reseñas</h3><strong>{(data.reviewCards||[]).filter((c:Record<string,any>)=>c.active).length} de {limits.nfcCards} activas</strong><div className="workspaceActionRow"><a className="workspaceSecondary" href="#tarjetas-nfc">Ver tarjetas NFC</a></div></article>
   {planName==='Plus'&&<article className="ownerCard"><h3>Comparación con la zona</h3>
    {data.zoneComparison&&!data.zoneComparison.sample?<table><thead><tr><th></th><th>Calificación</th><th>Reseñas</th></tr></thead><tbody><tr><td>Tu negocio</td><td>{data.zoneComparison.business_rating}</td><td>{data.zoneComparison.business_reviews}</td></tr><tr><td>Zona</td><td>{data.zoneComparison.zone_average_rating}</td><td>{data.zoneComparison.zone_average_reviews}</td></tr></tbody></table>:<p>Próximamente</p>}
   </article>}
 </section>
 <section data-panel="tarjetas-nfc" className="ownerBlock"><h2>Mis tarjetas NFC</h2><div className="ownerMetrics">
   <Metric label="Puntos" value={(data.branches||[]).filter((x:Record<string,any>)=>x.active).length}/>
   <Metric label="Reseñas activas" value={(data.reviewCards||[]).filter((x:Record<string,any>)=>x.active).length}/>
   <Metric label="Reseñas incluidas" value={limits.nfcCards}/>
 </div><a className="workspaceSecondary" href="https://wa.me/525539044788" target="_blank" rel="noreferrer">Solicitar tarjetas adicionales</a></section>
 <section data-panel="premios" className="ownerBlock"><RewardWorkspace businessId={b.id} rewards={data.rewards||[]}/></section>
 <section data-panel="mis-tarjetas" className="ownerBlock"><CardCatalog businessId={b.id} business={b.name} slug={b.slug} program={data.program} rewards={data.rewards||[]} demo={demo} nfcLimit={limits.nfcCards} branchId={data.selectedBranch?.id} branchName={data.selectedBranch?.name||b.name} reviewCards={data.reviewCards||[]} googleUrl={data.selectedBranch?.google_maps_url||null} giftCardUrl={giftCardActive?b.pay_card_url:null} setupState={startState||undefined}/></section>
 <section data-panel="estadisticas-puntos" className="ownerBlock"><div className="ownerSectionTitle"><h2>Estadísticas · Puntos</h2><p>Impacto del programa, lealtad y crecimiento de ingresos durante el periodo seleccionado.</p></div><div className="ownerMetrics"><Metric label="Visitas" value={current.visits}/><Metric label="Clientes nuevos" value={current.new_customers}/><Metric label="Canjes registrados" value={current.redeemed}/><Metric label="Ticket promedio" value={'$'+number(current.visits?Number(current.ticket_revenue||0)/Number(current.visits):0)+' MXN'}/><Metric label="Ingresos del programa" value={'$'+number(current.ticket_revenue||0)+' MXN'} previous={Number(prev.ticket_revenue||0)}/><RetentionMetric current={current} previous={prev}/></div></section>
 <section data-panel="sucursales" className="ownerBlock"><div className="ownerSectionTitle"><div><h2>Sucursales</h2></div></div><BranchManager businessId={b.id} branches={data.branches||[]} branchStats={data.branchStats||[]} branchLimit={limits.branches}/></section>
  <section id="promociones" data-panel="promociones" className="ownerBlock"><CampaignOverview businessId={b.id} demo={demo} program={data.program} rewards={data.rewards||[]} branchName={data.selectedBranch?.name||b.name} branchId={data.selectedBranch?.id} branchRules={data.selectedBranch?.campaign_rules}/></section>
 <section id="nival-pay" data-panel="nival-pay" className="ownerBlock"><div className="ownerSectionTitle"><h2>Tarjeta de regalo</h2><p>Nival Pay · NFC y QR.</p></div><div className="complementCardPreview"><div className="physicalCardMock"><span>NIVAL PAY</span><strong>{b.pay_card_label||b.name}</strong><small>TARJETA DE REGALO · NFC</small></div><div><span className={'cardSystemStatus'+(demo?'':giftCardActive?' isOn':'')}>{demo?'Ejemplo':giftCardActive?'Activa':'Disponible para configurar'}</span>{giftCardActive?<><p>Tu enlace y QR están listos.</p><img className="payCardQr" src={'/api/nival-pay/qr?business='+b.id} width="140" height="140" alt={'Código QR de la tarjeta Nival Pay para '+b.name}/><div className="workspaceActionRow"><a className="workspacePrimary" href={b.pay_card_url} target="_blank" rel="noreferrer">Abrir tarjeta</a><CopyPayLink url={b.pay_card_url}/></div></>:demo?<p>Vista ilustrativa. La demo no tiene un enlace de regalo ni un QR para compartir.</p>:<><p>Solicita el enlace para empezar a usar Nival Pay con tus clientes.</p><a className="workspacePrimary" href="https://wa.me/525539044788?text=Hola%2C%20quiero%20configurar%20la%20tarjeta%20de%20regalo%20Nival%20Pay%20para%20mi%20negocio." target="_blank" rel="noreferrer">Solicitar configuración <Icon name="arrow" size={15}/></a></>}</div></div></section>
 <section data-panel="plan" className="ownerBlock"><div className="ownerSectionTitle"><h2>Plan y facturación</h2><p>Plan {planName} · ${price} MXN por periodo de 30 días. Día de corte: {b.paid_until?new Date(b.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'al activar'}. Próximo pago: {b.paid_until?new Date(b.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'pendiente de activación'}.</p></div>{!demo&&<><PlanChoices b={b}/><article className="ownerCard"><h3>Historial de pagos</h3>{data.payments?.length?data.payments.map((p:Record<string,any>,i:number)=><p className="paymentHistoryRow" key={i}>{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(p.amount))} · {p.method} · {new Date(p.paid_at).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'})}<small>{String(p.period_start).slice(0,10)} → {String(p.period_end).slice(0,10)}{p.reference?' · '+p.reference:''}</small></p>):<p className="ownerEmpty">Los pagos confirmados aparecerán aquí.</p>}</article></>}</section>
 <section data-panel="configuracion" className="ownerBlock"><div className="ownerSectionTitle"><h2>Ajustes de la cuenta</h2><p>Aquí se configuran los datos del negocio, los segmentos de clientes y las plantillas de WhatsApp. El diseño y las reglas de puntos están en Tarjetas → Mis tarjetas → Configurar.</p></div></section>
 <section id="clientes" data-panel="clientes" className="ownerBlock"><div className="ownerSectionTitle"><small>TUS CLIENTES</small><h2>Quién vuelve y a quién recuperar</h2><p>Abre un grupo para ver clientes y elegir una acción.</p></div><CustomerExplorer customers={data.segments} demo={demo} businessId={b.id}/>
 <details className="customerCampaigns"><summary><strong>Campañas y notificaciones</strong><span>Bienvenida · Te extrañamos · Segmentos</span></summary><div className="customerCampaignsInner"><h3>Comunícate con el grupo correcto</h3><p>Prepara mensajes para clientes nuevos, frecuentes o en riesgo. Enviar avisos mediante Google Wallet requiere pases guardados, integración compatible y permiso para contactarles.</p><p>Los mensajes mediante WhatsApp con consentimiento se gestionan desde las fichas y grupos de clientes. Las notificaciones de Google Wallet no están activas todavía.</p><a href="#clientes-risk" className="workspaceSecondary">Ver clientes en riesgo</a></div></details></section>

 {segments.map(([key,title,flag])=>{const customers=data.segments.filter((c:Record<string,any>)=>c[flag]);return <section key={key} id={'clientes-'+key} data-panel={'clientes-'+key} className="ownerBlock"><div className="ownerSectionTitle"><small>CLIENTES · {number(customers.length)}</small><h2>{title}</h2></div>{customers.length>0&&<SegmentCard title="Siguiente paso" description="Contacta solo a quienes autorizaron mensajes." segment={String(key)} customers={customers} templates={data.templates||[]} businessName={b.name} demo={demo} messages={data.messages||[]}/>}<details className="customerDirectoryDetails"><summary><span>Lista completa del grupo</span><strong>{number(customers.length)} clientes</strong></summary><CustomerExplorer key={key} customers={customers} demo={demo} businessId={b.id} fixedSegment={key}/></details></section>;})}

 {!demo&&<section id="canjes" data-panel="canjes" className="ownerBlock"><h2>Canjes</h2>
   {(data.redemptions||[]).length?<div className="ownerCard">{(data.redemptions||[]).map((d:Record<string,any>)=><article key={d.id} className="customerRow"><strong>{d.reward}</strong><span>{d.customer} · {Math.abs(Number(d.points||0))} puntos</span><small>{String(d.status)} · {new Date(d.created_at).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'})}</small></article>)}</div>:<p className="ownerEmpty">Sin canjes registrados</p>}
  </section>}
 {demo&&<section id="canjes" data-panel="canjes" className="ownerBlock"><div className="ownerSectionTitle"><small>MUESTRA DEL PANEL</small><h2>Historial de canjes</h2><p>En un negocio activo, aquí puedes revisar los premios que canjeó cada cliente.</p></div><article className="ownerCard"><h3>Movimientos de ejemplo</h3><p className="ownerEmpty">La demo no guarda canjes reales. Los canjes de tu negocio aparecerán aquí con su fecha, cliente y premio.</p></article></section>}
 {!demo&&<section id="informes" data-panel="informes" className="ownerBlock">
  <div className="workspaceSectionHeader"><h2>Informes</h2><a className="workspaceSecondary" href={'/panel/reportes?business='+b.id}>PDF del periodo <Icon name="arrow" size={16}/></a></div>
  <div className="ownerMetrics">
   <Metric label="Visitas por puntos" value={Number(current.visits||0)}/>
   <Metric label="Canjes" value={Number(current.redeemed||0)}/>
   <Metric label="Clientes" value={registered}/>
   <Metric label="Clientes recurrentes" value={Number(current.returning_customers||0)}/>
  </div>
  <details className="ownerCard" open><summary><strong>Sistema de puntos</strong></summary><div className="ownerMetrics">
   <Metric label="Puntos emitidos" value={Number(current.points||0)}/>
   <Metric label="Ingresos registrados" value={money(Number(current.ticket_revenue||0))}/>
   <RetentionMetric current={current} previous={prev}/>
  </div></details>
  <details className="ownerCard"><summary><strong>Tarjeta de regalo</strong></summary><p>{giftCardActive?'Tarjeta configurada.':'Tarjeta inactiva.'}</p><p>Los movimientos de regalo aparecerán cuando esté habilitado su registro.</p></details>
  <details className="ownerCard"><summary><strong>Google y reseñas</strong></summary><div className="ownerMetrics">
   <Metric label="Reseñas totales" value={Number(last?.total_reviews||0)}/>
   <Metric label="Calificación Google" value={last?Number(last.rating).toFixed(1):'—'}/>
   <Metric label="Respuestas usadas" value={reviewed}/>
  </div></details>
  <details className="ownerCard"><summary><strong>Equipo</strong></summary>
   {data.ranking.length?<div className="ownerMetrics">{data.ranking.map((r:Record<string,any>)=><article className="ownerCard ownerMetric" key={r.staff_id}><span>{r.name}</span><strong>{number(r.visits||0)} visitas</strong><small>{number(r.redemptions||0)} canjes</small></article>)}</div>:<p className="ownerEmpty">Sin actividad registrada</p>}
  </details>
  <details className="ownerCard"><summary><strong>Clientes</strong></summary><div className="ownerMetrics">
   <Metric label="Nuevos" value={newCount}/><Metric label="Frecuentes" value={frequentCount}/><Metric label="En riesgo" value={riskCount}/><Metric label="Sin visita" value={absentCount}/>
  </div></details>
  <details className="ownerCard"><summary><strong>Recomendaciones</strong></summary><div className="workspaceActionRow">
   {riskCount>0?<a className="workspacePrimary" href="#campañas-clientes">Recuperar {riskCount} clientes</a>:registered>0?<a className="workspacePrimary" href="#campañas-clientes">Crear una campaña</a>:<a className="workspacePrimary" href="#mis-tarjetas">Compartir tarjeta de puntos</a>}
   {pendingReviews!==null&&pendingReviews>0&&<a className="workspaceSecondary" href="#google">Revisar reseñas pendientes: {pendingReviews}</a>}
  </div></details>
 </section>}
 {demo&&<section id="informes" data-panel="informes" className="ownerBlock"><div className="ownerSectionTitle"><small>MUESTRA DEL PANEL</small><h2>Informes</h2><p>Resumen del periodo de ejemplo. Los informes reales de tu negocio se preparan con sus datos registrados.</p></div><article className="ownerCard periodReportCard"><h3>Informe del periodo</h3><p>Este ejemplo muestra el avance del periodo. En una cuenta activa podrás consultar el PDF al cierre de cada ciclo.</p><div className="periodProgressLabels"><span>Día {periodDay}</span><span>Día 30</span></div><div className="periodProgress"><i style={{width:(periodDay/30*100)+'%'}}/></div></article></section>}
 <section data-panel="campañas-clientes" className="ownerBlock">
  <div className="ownerSectionTitle"><h2>Campañas</h2></div>
  <div className="campaignRewardStrip">
   {[
    {key:'new',name:'Bienvenida',count:newCount},
    {key:'risk',name:'Te extrañamos',count:riskCount},
    {key:'frequent',name:'Gracias por volver',count:frequentCount},
    {key:'near_reward',name:'Cerca del premio',count:data.segments.filter((c:Record<string,any>)=>Number(c.balance||0)>0).length},
   ].map(c=><article className="campaignRewardCard" key={c.key}><strong>{c.name}</strong><small>{c.count} clientes</small><a href="#campañas-clientes">Editar mensaje <Icon name="arrow" size={15}/></a></article>)}
  </div>
  {!demo&&<div className="ownerCard"><h3>Mensajes</h3>
   {Object.entries(defaultMessages).map(([key,body])=><div key={key} id={'mensaje-'+key} style={{marginBlock:16}}>
    <ActionForm action={saveMessageTemplate} label="Guardar cambios"><Hidden name="businessId" value={b.id}/><Hidden name="segment" value={key}/>
     <label>{({new:'Bienvenida',active:'Activos',frequent:'Frecuentes',risk:'Te extrañamos',lost:'Inactivos',near_reward:'Cerca del premio'} as Record<string,string>)[key]}<textarea name="body" required maxLength={1500} defaultValue={data.messages?.find((t:Record<string,any>)=>t.segment===key)?.body||body}/></label>
    </ActionForm>
   </div>)}
  </div>}
  <p className="cardCaption">Las notificaciones automáticas de Google Wallet estarán disponibles cuando se active la integración de pases y se valide el consentimiento de tus clientes.</p>
 </section>
 {!demo&&<section data-panel="asociados" className="ownerBlock"><TeamWorkspace businessId={b.id} slug={b.slug} staff={data.staff||[]} branches={data.branches||[]}/></section>}
 <section data-panel="equipo" className="ownerBlock"><TeamUnified businessId={b.id} slug={b.slug} staff={data.staff||[]} branches={data.branches||[]} ranking={data.ranking||[]}/></section>
 <section data-panel="compartir" className="ownerBlock"><div className="ownerSectionTitle"><small>MENOS PASOS. MÁS PARTICIPACIÓN.</small><h2>Compartir QR y tarjeta</h2><p>{demo?'Esta muestra abre una tarjeta ficticia y no guarda datos. En un negocio activo, el QR permite a cada cliente crear su tarjeta. Después de una compra, el empleado escanea el QR personal del cliente para sumar puntos.':'Este QR permite que tus clientes creen su tarjeta. Para sumar puntos, tu empleado escanea el QR personal que aparece en la tarjeta de cada cliente.'}</p></div><ShareTools slug={b.slug} name={b.name} demo={demo}/></section>
 {demo&&<section data-panel="programa" className="ownerBlock"><h2>Programa de puntos</h2><p>En tu cuenta configura la tarjeta, reglas de visitas y premios desde esta sección.</p></section>}
 <section data-panel="ajustes" className="ownerBlock"><div className="ownerSectionTitle"><small>CUENTA DEL NEGOCIO</small><h2>Datos del negocio</h2>{!demo&&<a href={"/panel/reportes?business="+b.id}>Mis informes PDF</a>}<p>Consulta los datos y el estado de servicio de tu negocio. La tarjeta y los premios se configuran en sus secciones.</p></div><div className="settingsOverview"><article className="ownerCard"><span className="workspaceEyebrow">TU NEGOCIO</span><h3>{b.name}</h3><dl><div><dt>Responsable</dt><dd>{b.owner_name||actor.name}</dd></div><div><dt>Giro</dt><dd>{b.giro||'Sin registrar'}</dd></div><div><dt>Servicio</dt><dd>{status}</dd></div><div><dt>Plan</dt><dd>{b.plan_name||'Por confirmar con Nival'}</dd><dt>Vencimiento</dt><dd>{b.paid_until?new Date(b.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'Comienza al activar el código'}</dd></div></dl>{!demo&&<a className="workspaceSecondary" href={quote} target="_blank" rel="noreferrer">Hablar con Nival</a>}</article></div>
 {!demo&&businesses.length>1&&<article className="ownerCard"><h3>Cambiar de negocio</h3><div className="workspaceActionRow">{businesses.map((x:Record<string,any>)=><a className="workspaceSecondary" key={x.id} href={'/panel?business='+x.id+'#ajustes'} aria-current={x.id===b.id?'page':undefined}>{x.name}</a>)}</div></article>}
  {!demo&&<details className="ownerCard"><summary>Configurar umbrales de clientes</summary><ActionForm action={saveSegments} label="Guardar umbrales"><Hidden name="businessId" value={b.id}/>{[['new_days','Días para nuevos',365],['frequent_days','Ventana de frecuentes (días)',365],['frequent_visits','Visitas mínimas para frecuentes',100],['risk_from','Días sin venir: inicio de riesgo',730],['lost_after','Días sin venir: fin de riesgo',731],['risk_visits','Visitas mínimas previas para riesgo',100]].map(([name,label,max])=><Field key={name} name={String(name)} label={String(label)} type="number" min={name==='lost_after'?2:1} max={Number(max)} value={settings[String(name)]}/>)}</ActionForm></details>} {!demo&&<details className="ownerCard"><summary>Plantillas de WhatsApp</summary><p>Variables disponibles: {'{nombre}'}, {'{puntos}'}, {'{premio}'} y {'{negocio}'}. El envío es individual y requiere autorización del cliente.</p>{Object.entries(defaultMessages).map(([key,body])=><ActionForm key={key} action={saveMessageTemplate} label="Guardar plantilla"><Hidden name="businessId" value={b.id}/><Hidden name="segment" value={key}/><label>Mensaje: {({new:'Nuevo',active:'Activo',frequent:'Frecuente',risk:'En riesgo',lost:'Inactivo',near_reward:'Cerca del premio'} as Record<string,string>)[key]}<textarea name="body" required maxLength={1500} defaultValue={data.messages?.find((t:Record<string,any>)=>t.segment===key)?.body||body}/></label></ActionForm>)}</details>} {!demo&&<details className="ownerCard"><summary>Registrar otro negocio</summary><ActionForm action={registerBusiness} label="Registrar negocio" preserveOnError><RegistrationFields/></ActionForm></details>}{demo&&<div className="workspaceInfoCard"><Icon name="ajustes"/><div><h3>En tu cuenta puedes personalizar el programa</h3><p>La demo permite recorrer el panel. Los cambios de configuración se realizan dentro del negocio registrado.</p></div></div>}</section>
 </DashboardContent></DashboardShell>;
}
