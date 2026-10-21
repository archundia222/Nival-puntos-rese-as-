import {PlanChoices} from './plan-choices';
import {AccountState} from './account-state';
import {entitlements,planLimits} from '../foundation/entitlements.mjs';
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
import {defaultMessages} from './messages.mjs';
import {saveMessageTemplate,markCampaignSent} from './actions';
import {saveSegments} from './actions';
import {CardCatalog} from '../points/card-catalog';
import {RewardWorkspace} from './reward-workspace';
import {CampaignFlow} from './campaign-flow';
import {TeamWorkspace} from './team-workspace';
import {TeamUnified} from './team-unified';
import {RedemptionTable} from './redemption-table';
import {ReportWorkspace} from './report-workspace';
import {BranchManager} from './branch-manager';
import {NextActions} from './next-actions';
import {CampaignOverview} from './campaign-overview';
import {StartGuide,startGuideState} from './start-guide';
import type {Actor} from '../foundation/db';
import {SegmentCard} from './clients';
import {BranchGoogleSettings} from './branch-google-settings';
import {CopyPayLink} from './copy-pay-link';
const number=(v:number)=>Number(v||0).toLocaleString('es-MX');
const percentChange=(current:number,previous:number)=>previous===0?'Sin datos previos':`${current>previous?'+':''}${Math.round((current-previous)/previous*100)}%`;
const visitsLabel=(value:number)=>`${number(value)} ${Number(value)===1?'visita':'visitas'}`;
function Metric({label,value,previous}:{label:string;value:number|string;previous?:number}){return <article className="ownerCard ownerMetric"><span>{label}</span><strong>{typeof value==='number'?number(value):value}</strong>{previous!==undefined&&<small>{Number(value)-previous>0?'+':''}{number(Number(value)-previous)} vs. anterior</small>}</article>;}
function ActivityChart({items,days}:{items:Record<string,any>[];days:number}){const source:Record<string,any>[]=items||[],size=Math.max(1,Math.ceil(source.length/7)),rows:Record<string,any>[]=source.reduce<Record<string,any>[]>((out,item,index)=>{const i=Math.floor(index/size);if(!out[i])out[i]={label:item.label,active_users:0};out[i].active_users+=Number(item.active_users||0);out[i].label=item.label;return out;},[] as Record<string,any>[]),max=Math.max(1,...rows.map((x:Record<string,any>)=>Number(x.active_users||0))),coords=rows.map((x:Record<string,any>,i:number)=>({x:20+i*(480/Math.max(1,rows.length-1)),y:146-(Number(x.active_users||0)/max)*118})),line=coords.map((p:{x:number;y:number},i:number)=>(i?"L":"M")+p.x+" "+p.y).join(" "),area=coords.length?"M20 150 "+line+" L500 150 Z":"";return <article className="ownerCard ownerActivityCard"><header><div><span className="workspaceEyebrow">ÚLTIMOS {days} DÍAS</span><h2>Visitas registradas</h2><div className="activityTotalLine"><strong>{rows.reduce((sum,x)=>sum+Number(x.active_users||0),0)}</strong><span>visitas en el periodo</span></div></div><span className="activityLegend"><i/> Visitas</span></header>{rows.length?<><svg className="ownerActivityChart" viewBox="0 0 520 170" role="img" aria-label={`Gráfica de visitas registradas durante ${days} días`}><defs><linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1d7657" stopOpacity=".2"/><stop offset="100%" stopColor="#1d7657" stopOpacity="0"/></linearGradient></defs><g className="activityGridLines" aria-hidden="true">{[28,68,108,150].map(y=><line key={y} x1="20" x2="500" y1={y} y2={y}/>)}</g><path d={area} fill="url(#activityFill)"/><path d={line} fill="none" stroke="#1d7657" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{coords.map((point:{x:number;y:number},i:number)=><circle key={i} cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#1d7657" strokeWidth="2"><title>{rows[i].label}: {rows[i].active_users} visitas</title></circle>)}</svg><div className="activityDayLabels">{rows.map((x:Record<string,any>,i:number)=><span key={i}>{x.label}</span>)}</div></>:<p className="ownerEmpty">Tu primera visita aparecerá aquí.</p>}</article>;}
function RetentionMetric({current,previous}:{current:Record<string,any>;previous:Record<string,any>}){const rate=current.active_customers?Math.round(Number(current.returning_customers||0)/Number(current.active_customers)*100):0;const before=previous.active_customers?Math.round(Number(previous.returning_customers||0)/Number(previous.active_customers)*100):0;return <article className="ownerCard ownerMetric"><span>Retención</span><strong>{rate}%</strong><small>{rate-before>0?'+':''}{rate-before} pp. vs. anterior</small></article>;}
function CustomerMix({current}:{current:Record<string,any>}){const total=Number(current.active_customers||0),returning=Number(current.returning_customers||0),newCustomers=Math.max(0,total-returning),share=total?Math.round(returning/total*100):0;return <article className="ownerCard customerMixCard"><header><div><span className="workspaceEyebrow">VISITAS DEL PERIODO</span><h3>Nuevos y recurrentes</h3></div></header>{total?<div className="customerMixBody"><div className="customerMixDonut" style={{background:`conic-gradient(#174d37 ${share}%, #d9ed78 ${share}% 100%)`}} role="img" aria-label={`${share}% de los clientes activos ya había visitado antes`}><span><b>{total}</b><small>clientes</small></span></div><div className="customerMixLegend"><span><i className="mixReturning"/>Recurrentes <b>{number(returning)}</b></span><span><i className="mixNew"/>Nuevos <b>{number(newCustomers)}</b></span></div></div>:<p className="ownerEmpty">Sin visitas aún</p>}</article>;}
function ProductHub({data,reviewLimit,nfcLimit}:{data:Record<string,any>;reviewLimit:number;nfcLimit:number}){
 const activePoints=Boolean(data.program?.card_enabled),activeNfc=((data.reviewCards||[]) as Record<string,any>[]).filter(card=>card.active).length;
 const details=[activePoints?'Tarjeta de puntos activa':'Configura tu tarjeta de puntos',...(nfcLimit>0?[`${activeNfc} de ${nfcLimit} tarjetas de reseñas activas`]:[])].join(' · ');
 return <section className="productHub" aria-labelledby="product-hub-title"><header><span className="workspaceEyebrow">ACCESO RÁPIDO</span><h2 id="product-hub-title">Tus tarjetas</h2></header><div className="productHubGrid"><a className="productHubCard product-points" href="#mis-tarjetas"><span className="productHubSymbol" aria-hidden="true"><Icon name="points" size={20}/></span><span className="productHubCopy"><strong>Tarjetas</strong><small>{details}</small></span><span className="productHubAction">Configurar <Icon name="arrow" size={14}/></span></a></div></section>;
}
export async function OwnerView({actor,b,businesses,range,data,demo=false,mobilePreview=false,embedded=false,teamTab='personal'}:{actor:Record<string,any>;b:Record<string,any>;businesses:Record<string,any>[];range:ReturnType<typeof periodRange>;data:Record<string,any>;demo?:boolean;mobilePreview?:boolean;embedded?:boolean;teamTab?:'personal'|'actividad'}){
 const price=Number(b.price_mxn||299);
 const pointsOnly=price!==299&&b.features?.points_only===true;
 const current=data.metrics.find((x:Record<string,any>)=>x.period==='current')!,prev=data.metrics.find((x:Record<string,any>)=>x.period==='previous')!;
 const settings=data.settings||{new_days:14,frequent_days:30,frequent_visits:3,risk_from:31,lost_after:60,risk_visits:2};
 const segments=[['new','Nuevos','is_new'],['frequent','Frecuentes','is_frequent'],['risk','En riesgo','is_risk'],['absent','Sin visita este mes','absent_month']];
 const quote=quoteUrl(b);
 const access=entitlements(b);
 const limits=planLimits(b);
 const active=access.active;
 const risk=data.segments.filter((c:Record<string,any>)=>c.is_risk&&!c.is_lost).length;
 const status=active||demo?'Activo':b.status==='pausado'?'Pausado':'Por activar';
 const startState=demo?{
  complete:false,
  completed:2,
  steps:[
   {done:true,label:'Crear tu primera promoción',icon:'gift',href:'#premios'},
   {done:true,label:'Configurar y publicar tu tarjeta',icon:'card',href:'#mis-tarjetas'},
   {done:false,label:'Colocar QR de reseñas',icon:'google',href:'#reseñas'},
   {done:false,label:'Registrar primer cliente',icon:'check',href:'#compartir'},
  ],
 }:await startGuideState(actor as Actor,b.id,data.reviewCards||[]);
 if(!demo&&!active&&!data.segments.length&&!data.last)return <DashboardShell name={b.name} owner={actor.name} status={status} demo={false} logout={<form action={logout}><button className="logoutButton" type="submit"><Icon name="logout" size={16}/><span>Salir</span></button></form>}><AccountState b={b}/></DashboardShell>;
 const responseLimit=limits.reviewLimit;

 const planName=price>=549?'Plus':price>=399?'Esencial':'Básico';
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
 const groupRows=[['clientes-new','Nuevos',newCount,'#0e7c66'],['clientes-frequent','Frecuentes',frequentCount,'#1f4a3f'],['clientes-risk','En riesgo',riskCount,'#b96b2f'],['clientes-absent','Sin visita este mes',absentCount,'#8c9890']] as const;
 const DashboardContent=embedded?'div':'main';
 return <DashboardShell pointsOnly={pointsOnly} name={b.name} owner={actor.name} status={status} demo={demo} mobilePreview={mobilePreview} homeUrl={demo?'/demo/panel':'/panel?business='+b.id+(data.selectedBranch?.id?'&branch='+data.selectedBranch.id:'')} planName={planName} price={price} responseLimit={responseLimit} nfcLimit={limits.nfcCards} periodDay={periodDay} branches={data.branches||[]} branchId={data.selectedBranch?.id} logout={<form action={logout}><button className="logoutButton" aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18}/></button></form>}><DashboardContent className="ownerDashboard">
 {!demo&&!active&&<AccountState b={b}/>}

 <section id="inicio" data-panel="inicio" className="ownerBlock">
  <header className="impactMasterHeader"><h2>Inicio</h2><form className="impactPeriodFilter" method="get" action={demo?'/demo/panel':'/panel'}>{!demo&&<input type="hidden" name="business" value={b.id}/>} {data.selectedBranch?.id&&<input type="hidden" name="branch" value={data.selectedBranch.id}/>}
  {[7,30,90].map(days=><button type="submit" name="days" value={days} key={days} aria-pressed={periodDays===days}>{days} días</button>)}</form></header>
  {(emptyState||demo)&&<StartGuide state={startState||undefined}/>}
  <header className="homeSectionHeading"><small>HOY</small><h3>Revisa estos pendientes</h3></header>
  <div className="ownerMetrics homePending">
    {[
      ['En riesgo',riskCount,'clientes-risk'],
      ['Canjes por revisar',Number(current.pending||0),'canjes'],
      ['Días restantes',Math.max(0,30-periodDay),'plan']
    ].map(([label,value,target])=><a className={"ownerCard ownerMetric "+(label==="En riesgo"?"ownerMetricRisk":"")} key={String(label)} href={'#'+target} data-from-home="true" aria-label={'Abrir '+label}><span>{label}</span><strong>{number(Number(value))}</strong><small>Ver detalle →</small></a>)}
  </div>
  <div className="homeQuickActions" aria-label="Acciones rápidas"><header className="homeQuickActionsHeading"><small>ATAJOS</small><h3>Haz una tarea</h3></header>
   {[
    {label:'Crear promoción',hint:'Elige tu siguiente premio',icon:'gift',href:'#premios'},
    {label:'QR del mostrador',hint:'Compártelo con tus clientes',icon:'compartir',href:'#mis-tarjetas'},
    {label:'Agregar trabajador',hint:'Prepara a tu equipo',icon:'equipo',href:'#equipo'},
    {label:'Descargar informe',hint:'Tu resumen del periodo',icon:'download',href:'/panel/reportes?business='+b.id}
   ].map(action=><a className="quickActionCard" href={action.href} key={action.label}><span className="quickActionIcon"><Icon name={action.icon} size={21}/></span><span><strong>{action.label}</strong><small>{action.hint}</small></span><Icon name="arrow" size={17}/></a>)}
  </div>
  <header className="homeSectionHeading"><small>ESTE PERIODO</small><h3>Visitas, clientes y premios</h3></header>
  <div className="ownerMetrics homeCoreMetrics">
   {[
     ['Visitas',Number(current.visits||0),Number(prev.visits||0)],
     ['Clientes nuevos',Number(current.new_customers||0),Number(prev.new_customers||0)],
     ['Premios canjeados',Number(current.redeemed||0),Number(prev.redeemed||0)],
     ['Clientes recurrentes',Number(current.returning_customers||0),Number(prev.returning_customers||0)]
   ].map(([label,value,previous])=>{const delta=Number(value)-Number(previous);const trend=delta>0?"up":delta<0?"down":"steady";return <article className="ownerCard ownerMetric" key={String(label)}><span>{label}</span><strong>{number(Number(value))}</strong><small className={"metricChange metricChange-"+trend} aria-label={delta>0?"Aumentó":delta<0?"Disminuyó":"Sin cambio"}><b aria-hidden="true">{Number(previous)===0?"—":delta>0?"↑":delta<0?"↓":"→"}</b>{Number(previous)===0?'Sin datos previos':percentChange(Number(value),Number(previous))+' vs. periodo anterior'}</small></article>})}
  </div>

  <header className="workspaceSectionHeader homeFrequencyHeading"><h3>Clientes por frecuencia de visita</h3><a href="#clientes">Ver detalle →</a></header>
  <article className="ownerCard homeFrequencyCard"><div className="homeStackedBar" aria-hidden="true">{groupRows.map(([id,label,count,color])=><span key={id} style={{width:(registered?100*count/registered:0)+"%",background:color}}/>)}</div>
   {groupRows.map(([id,label,count,color])=><a className="clientStatusRow" href={'#'+id} key={id}><span className="frequencyLabel"><i className="frequencyDot" style={{background:color}}/>{label}</span><b>{count} <small>{registered?Math.round(100*count/registered):0}%</small></b></a>)}
  </article>
  <div className="impactMasterDetails">
   <div className="homeDetailGroup"><header className="workspaceSectionHeader"><h3>Últimas visitas y canjes</h3><a href="#canjes">Ver detalle →</a></header><article className="ownerCard homeMovementsCard">
    {(data.recentMovements||[]).length?(data.recentMovements||[]).map((m:Record<string,any>)=><div className="clientStatusRow movementRow" key={m.id}><span className="movementAvatar" aria-hidden="true">{String(m.customer||"?").slice(0,1).toUpperCase()}</span><span className="movementIdentity"><strong>{m.customer}</strong><span>{m.type==='visit'?'Visita':'Canje'}</span></span><small>{new Date(m.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City',hour:'2-digit',minute:'2-digit'})}</small></div>):<p className="ownerEmpty">Sin movimientos</p>}
   </article></div>
   <div className="homeDetailGroup"><header className="workspaceSectionHeader"><h3>Sucursales con más visitas</h3><a href="#sucursales">Ver detalle →</a></header><article className="ownerCard homeBranchCard">{(data.branchStats||[]).slice().sort((a:Record<string,any>,b:Record<string,any>)=>Number(b.visits||0)-Number(a.visits||0)).slice(0,3).map((branch:Record<string,any>,i:number)=><div className="clientStatusRow" key={branch.branch_id}><span>{i+1}. {branch.name}</span><b>{visitsLabel(Number(branch.visits||0))}</b><i className="rankBar"><em style={{width:Math.min(100,100*Number(branch.visits||0)/Math.max(1,...(data.branchStats||[]).map((x:Record<string,any>)=>Number(x.visits||0))))+"%"}}/></i></div>)}
    <h3>Trabajadores con más visitas</h3>{data.ranking.slice(0,3).map((r:Record<string,any>,i:number)=><div className="clientStatusRow" key={r.staff_id}><span>{i+1}. {r.name}</span><b>{visitsLabel(Number(r.visits||0))} · {r.redemptions} canjes</b><i className="rankBar"><em style={{width:Math.min(100,100*Number(r.visits||0)/Math.max(1,...data.ranking.map((x:Record<string,any>)=>Number(x.visits||0))))+"%"}}/></i></div>)}
   </article></div>
  </div>
  <a href="#mis-tarjetas" className="workspaceSecondary">Tus tarjetas →</a>
 </section>
 <section data-panel="reseñas" className="ownerBlock reviewReferenceLayout">
  <div className="reviewDashboardReference">
    <article className="reviewStatsCard">
      <div className="reviewStatsGrid"><div><span>Calificación</span><strong>—</strong></div><div><span>Reseñas</span><strong>—</strong></div><div><span>Respondidas</span><strong>—</strong></div><div><span>Por responder</span><strong>—</strong></div></div>
      <div className="reviewPlanUsage"><span>Respuestas del plan</span><strong>0 de {limits.reviewLimit}</strong><div className="reviewUsageTrack"><i/></div></div>
    </article>
    <article className="ownerCard reviewImproveCard"><h3>Qué mejorar en las reseñas</h3><p>El análisis estará disponible con el siguiente reporte.</p></article>
    <article className="ownerCard reviewNfcRow"><span className="reviewNfcIcon"><Icon name="card" size={20}/></span><div><strong>Tarjetas NFC de reseñas</strong><small>{(data.reviewCards||[]).filter((item:Record<string,any>)=>item.active).length} de {limits.nfcCards} activas</small></div><a href="#mis-tarjetas">Ver tarjetas NFC</a></article>
    {data.selectedBranch?.id&&<div id="configuracion-resenas"><BranchGoogleSettings businessId={b.id} branchId={data.selectedBranch.id} branchName={data.selectedBranch.name||b.name} url={data.selectedBranch.google_maps_url||''}/></div>}
  </div>
 </section>
 <section data-panel="tarjetas-nfc" className="ownerBlock"><h2>Mis tarjetas NFC</h2><div className="ownerMetrics">
   <Metric label="Puntos" value={(data.branches||[]).filter((x:Record<string,any>)=>x.active).length}/>
   <Metric label="Reseñas activas" value={(data.reviewCards||[]).filter((x:Record<string,any>)=>x.active).length}/>
   <Metric label="Reseñas incluidas" value={limits.nfcCards}/>
 </div><a className="workspaceSecondary" href="https://wa.me/525539044788" target="_blank" rel="noreferrer">Solicitar tarjetas adicionales</a></section>
 <section data-panel="premios" className="ownerBlock"><RewardWorkspace businessId={b.id} rewards={data.rewards||[]} redemptions={data.redemptions||[]} periodStart={range.start}/></section>
 <section data-panel="mis-tarjetas" className="ownerBlock"><CardCatalog businessId={b.id} business={b.name} slug={b.slug} program={data.program} rewards={data.rewards||[]} demo={demo} nfcLimit={limits.nfcCards} branchId={data.selectedBranch?.id} branchName={data.selectedBranch?.name||b.name} reviewCards={data.reviewCards||[]} googleUrl={data.selectedBranch?.google_maps_url||null} setupState={startState||undefined}/></section>
 <section data-panel="estadisticas-puntos" className="ownerBlock"><div className="ownerSectionTitle"><h2>Estadísticas · Puntos</h2><p>Impacto del programa, lealtad y crecimiento de ingresos durante el periodo seleccionado.</p></div><div className="ownerMetrics"><Metric label="Visitas" value={current.visits}/><Metric label="Clientes nuevos" value={current.new_customers}/><Metric label="Canjes registrados" value={current.redeemed}/><Metric label="Ticket promedio" value={'$'+number(current.visits?Number(current.ticket_revenue||0)/Number(current.visits):0)+' MXN'}/><Metric label="Ingresos del programa" value={'$'+number(current.ticket_revenue||0)+' MXN'} previous={Number(prev.ticket_revenue||0)}/><RetentionMetric current={current} previous={prev}/></div></section>
 <section data-panel="sucursales" className="ownerBlock"><div className="ownerSectionTitle"><div><h2>Administra tus sucursales</h2></div></div><BranchManager businessId={b.id} branches={data.branches||[]} branchStats={data.branchStats||[]} branchLimit={limits.branches}/></section>
  <section id="promociones" data-panel="promociones" className="ownerBlock"><CampaignOverview businessId={b.id} demo={demo} program={data.program} rewards={data.rewards||[]} branchName={data.selectedBranch?.name||b.name} branchId={data.selectedBranch?.id} branchRules={data.selectedBranch?.campaign_rules}/></section>
 <section data-panel="plan" className="ownerBlock"><div className="ownerSectionTitle"><h2>Plan y facturación</h2><p>Plan {planName} · ${price} MXN por periodo de 30 días. Día de corte: {b.paid_until?new Date(b.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'al activar'}. Próximo pago: {b.paid_until?new Date(b.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'pendiente de activación'}.</p></div>{!demo&&<><PlanChoices b={b}/><article className="ownerCard"><h3>Historial de pagos</h3>{data.payments?.length?data.payments.map((p:Record<string,any>,i:number)=><p className="paymentHistoryRow" key={i}>{new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(p.amount))} · {p.method} · {new Date(p.paid_at).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'})}<small>{String(p.period_start).slice(0,10)} → {String(p.period_end).slice(0,10)}{p.reference?' · '+p.reference:''}</small></p>):<p className="ownerEmpty">Los pagos confirmados aparecerán aquí.</p>}</article></>}</section>
 <section data-panel="configuracion" className="ownerBlock"><div className="ownerSectionTitle"><h2>Configuración</h2><p>Ubica aquí los ajustes operativos de tu negocio. Cada opción abre el módulo donde se guardan realmente los cambios.</p></div><div className="settingsHubGrid"><a className="ownerCard settingsHubLink" href="#mis-tarjetas"><Icon name="card" size={23}/><strong>Tarjeta y puntos</strong><span>Diseño, reglas, premios, caducidad y canjes</span><b>Configurar →</b></a><a className="ownerCard settingsHubLink" href="#sucursales"><Icon name="pin" size={23}/><strong>Sucursales y datos</strong><span>Ubicación y enlace de Google Maps</span><b>Ver sucursales →</b></a><a className="ownerCard settingsHubLink" href="#equipo"><Icon name="equipo" size={23}/><strong>Personal</strong><span>Accesos individuales y registro de actividad</span><b>Administrar →</b></a><a className="ownerCard settingsHubLink" href="#plan"><Icon name="settings" size={23}/><strong>Plan y servicio</strong><span>Estado de tu servicio, límites y vigencia</span><b>Consultar →</b></a></div></section>
 <section id="clientes" data-panel="clientes" className="ownerBlock"><CustomerExplorer customers={data.segments} demo={demo} businessId={b.id}/>
 <details className="customerCampaigns"><summary><strong>Campañas y notificaciones</strong><span>Bienvenida · Te extrañamos · Segmentos</span></summary><div className="customerCampaignsInner"><h3>Comunícate con el grupo correcto</h3><p>Prepara mensajes para clientes nuevos, frecuentes o en riesgo. Enviar avisos mediante Google Wallet requiere pases guardados, integración compatible y permiso para contactarles.</p><p>Los mensajes mediante WhatsApp con consentimiento se gestionan desde las fichas y grupos de clientes. Las notificaciones de Google Wallet no están activas todavía.</p><a href="#clientes-risk" className="workspaceSecondary">Ver clientes en riesgo</a></div></details></section>

 {segments.map(([key,title,flag])=>{const customers=data.segments.filter((c:Record<string,any>)=>c[flag]);return <section key={key} id={'clientes-'+key} data-panel={'clientes-'+key} className="ownerBlock"><div className="ownerSectionTitle"><small>CLIENTES · {number(customers.length)}</small><h2>{title}</h2></div>{customers.length>0&&<SegmentCard title="Siguiente paso" description="Contacta solo a quienes autorizaron mensajes." segment={String(key)} customers={customers} templates={data.templates||[]} businessName={b.name} demo={demo} messages={data.messages||[]}/>}<details className="customerDirectoryDetails"><summary><span>Lista completa del grupo</span><strong>{number(customers.length)} clientes</strong></summary><CustomerExplorer key={key} customers={customers} demo={demo} businessId={b.id} fixedSegment={key}/></details></section>;})}

 {!demo&&<section id="canjes" data-panel="canjes" className="ownerBlock"><h2>Revisa los canjes de premios</h2><RedemptionTable items={data.redemptions||[]} staff={data.staff||[]} branches={data.branches||[]} periodStart={range.start}/></section>}
 {demo&&<section id="canjes" data-panel="canjes" className="ownerBlock"><h2>Canjes de ejemplo</h2><RedemptionTable items={data.redemptions||[]} staff={data.staff||[]} branches={data.branches||[]} periodStart={range.start}/></section>}
 {!demo&&<section id="informes" data-panel="informes" className="ownerBlock">
   <ReportWorkspace businessId={b.id} start={range.start} rangeKind={range.kind==='day'&&'days' in range?'month':range.kind} metrics={data.metrics||[]} activity={data.activity||[]} segments={data.segments||[]} ranking={data.ranking||[]} branchStats={data.branchStats||[]} branches={data.branches||[]} branchId={data.selectedBranch?.id} redemptions={data.redemptions||[]}/>
  </section>}
 {demo&&<section id="informes" data-panel="informes" className="ownerBlock"><div className="ownerSectionTitle"><small>MUESTRA DEL PANEL</small><h2>Consulta el informe del periodo</h2><p>Resumen del periodo de ejemplo. Los informes reales de tu negocio se preparan con sus datos registrados.</p></div><article className="ownerCard periodReportCard"><h3>Avance del periodo de 30 días</h3><p>Este ejemplo muestra el avance del periodo. En una cuenta activa podrás consultar el PDF al cierre de cada ciclo.</p><div className="periodProgressLabels"><span>Día {periodDay}</span><span>Día 30</span></div><div className="periodProgress"><i style={{width:(periodDay/30*100)+'%'}}/></div></article></section>}
 <section data-panel="campañas-clientes" className="ownerBlock">{price<399?<div className="ownerCard"><h3>Disponible en Esencial</h3><p>Las campañas se activan con el plan Esencial o Plus.</p><a className="workspaceSecondary" href="#plan">Ver planes</a></div>:<CampaignFlow businessId={b.id} customers={data.segments||[]} counts={{new:newCount,risk:riskCount,frequent:frequentCount,near_reward:(data.segments||[]).filter((c:Record<string,any>)=>Number(c.balance||0)>0).length}} messages={data.messages||[]} defaults={defaultMessages} history={data.campaignHistory||[]} demo={demo}/>}</section>
 {!demo&&<section data-panel="asociados" className="ownerBlock"><TeamWorkspace businessId={b.id} slug={b.slug} staff={data.staff||[]} branches={data.branches||[]}/></section>}
 <section data-panel="equipo" className="ownerBlock"><TeamUnified businessId={b.id} slug={b.slug} staff={data.staff||[]} branches={data.branches||[]} ranking={data.ranking||[]} initialTab={teamTab}/></section>
 <section data-panel="compartir" className="ownerBlock"><div className="ownerSectionTitle"><small>MENOS PASOS. MÁS PARTICIPACIÓN.</small><h2>Compartir QR y tarjeta</h2><p>{demo?'Esta muestra abre una tarjeta ficticia y no guarda datos. En un negocio activo, el QR permite a cada cliente crear su tarjeta. Después de una compra, el empleado escanea el QR personal del cliente para sumar puntos.':'Este QR permite que tus clientes creen su tarjeta. Para sumar puntos, tu empleado escanea el QR personal que aparece en la tarjeta de cada cliente.'}</p></div><ShareTools slug={b.slug} name={b.name} demo={demo}/></section>
 {demo&&<section data-panel="programa" className="ownerBlock"><h2>Programa de puntos</h2><p>En tu cuenta configura la tarjeta, reglas de visitas y premios desde esta sección.</p></section>}
 <section data-panel="ajustes" className="ownerBlock"><div className="ownerSectionTitle"><small>CUENTA DEL NEGOCIO</small><h2>Consulta los datos del negocio</h2>{!demo&&<a href={"/panel/reportes?business="+b.id}>Mis informes PDF</a>}<p>Consulta los datos y el estado de servicio de tu negocio. La tarjeta y los premios se configuran en sus secciones.</p></div><div className="settingsOverview"><article className="ownerCard"><span className="workspaceEyebrow">TU NEGOCIO</span><h3>{b.name}</h3><dl><div><dt>Responsable</dt><dd>{b.owner_name||actor.name}</dd></div><div><dt>Giro</dt><dd>{b.giro||'Sin registrar'}</dd></div><div><dt>Servicio</dt><dd>{status}</dd></div><div><dt>Plan</dt><dd>{b.plan_name||'Por confirmar con Nival'}</dd><dt>Vencimiento</dt><dd>{b.paid_until?new Date(b.paid_until).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'Comienza al activar el código'}</dd></div></dl>{!demo&&<a className="workspaceSecondary" href={quote} target="_blank" rel="noreferrer">Hablar con Nival</a>}</article></div>
 {!demo&&businesses.length>1&&<article className="ownerCard"><h3>Cambiar de negocio</h3><div className="workspaceActionRow">{businesses.map((x:Record<string,any>)=><a className="workspaceSecondary" key={x.id} href={'/panel?business='+x.id+'#ajustes'} aria-current={x.id===b.id?'page':undefined}>{x.name}</a>)}</div></article>}
  {!demo&&<details className="ownerCard"><summary>Configurar umbrales de clientes</summary><ActionForm action={saveSegments} label="Guardar umbrales"><Hidden name="businessId" value={b.id}/>{[['new_days','Días para nuevos',365],['frequent_days','Ventana de frecuentes (días)',365],['frequent_visits','Visitas mínimas para frecuentes',100],['risk_from','Días sin venir: inicio de riesgo',730],['lost_after','Días sin venir: fin de riesgo',731],['risk_visits','Visitas mínimas previas para riesgo',100]].map(([name,label,max])=><Field key={name} name={String(name)} label={String(label)} type="number" min={name==='lost_after'?2:1} max={Number(max)} value={settings[String(name)]}/>)}</ActionForm></details>} {!demo&&<details className="ownerCard"><summary>Plantillas de WhatsApp</summary><p>Variables disponibles: {'{nombre}'}, {'{puntos}'}, {'{premio}'} y {'{negocio}'}. El envío es individual y requiere autorización del cliente.</p>{Object.entries(defaultMessages).map(([key,body])=><ActionForm key={key} action={saveMessageTemplate} label="Guardar plantilla"><Hidden name="businessId" value={b.id}/><Hidden name="segment" value={key}/><label>Mensaje: {({new:'Nuevo',active:'Activo',frequent:'Frecuente',risk:'En riesgo',lost:'Inactivo',near_reward:'Cerca del premio'} as Record<string,string>)[key]}<textarea name="body" required maxLength={1500} defaultValue={data.messages?.find((t:Record<string,any>)=>t.segment===key)?.body||body}/></label></ActionForm>)}</details>} {!demo&&<details className="ownerCard"><summary>Registrar otro negocio</summary><ActionForm action={registerBusiness} label="Registrar negocio" preserveOnError><RegistrationFields/></ActionForm></details>}{demo&&<div className="workspaceInfoCard"><Icon name="ajustes"/><div><h3>En tu cuenta puedes personalizar el programa</h3><p>La demo permite recorrer el panel. Los cambios de configuración se realizan dentro del negocio registrado.</p></div></div>}</section>
 </DashboardContent></DashboardShell>;
}
