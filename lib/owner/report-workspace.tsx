'use client';
import {useMemo,useState} from 'react';
import {AxisChart} from './axis-chart';
type Row=Record<string,any>;
const N=(x:any)=>Number(x||0).toLocaleString('es-MX');
function Lines({rows,title='Visitas por día',period='periodo seleccionado',yLabel='número de visitas'}:{rows:Row[];title?:string;period?:string;yLabel?:string}){return <AxisChart title={title} period={period} xLabel="fecha" yLabel={yLabel} kind="line" points={rows.map((r,i)=>({label:String(r.label||r.day||i+1).slice(0,10),value:Number(r.active_users||0)}))}/>;}

function Stat({title,value}:{title:string;value:any}){return <article className="ownerCard ownerMetric"><span>{title}</span><strong>{typeof value==='number'?N(value):value}</strong></article>;}
export function ReportWorkspace({businessId,start,rangeKind,metrics,activity,segments,ranking,branchStats,branches,branchId,redemptions}:{businessId:string;start:string;rangeKind:string;metrics:Row[];activity:Row[];segments:Row[];ranking:Row[];branchStats:Row[];branches:Row[];branchId?:string;redemptions:Row[]}){
 const [tab,setTab]=useState('resumen'),[order,setOrder]=useState('visits');
 const chartPeriod=start+' · '+(rangeKind==='day'?'día':rangeKind==='month'?'mes':rangeKind==='year'?'año':'periodo');
 const current=metrics.find(x=>x.period==='current')||{},previous=metrics.find(x=>x.period==='previous')||{};
 const total=N(current.visits),active=N(current.active_customers),red=N(current.redeemed),newCount=N(current.new_customers);
 const rewardStats=useMemo(()=>{const counts=new Map<string,number>();for(const r of redemptions){counts.set(r.reward,(counts.get(r.reward)||0)+1)}return [...counts.entries()].sort((a,b)=>b[1]-a[1]);},[redemptions]);
 const maxReward=Math.max(1,...rewardStats.map(x=>x[1]));

 const weekdays=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],weekdayCounts=[0,0,0,0,0,0,0];
 for(const item of activity){const date=new Date(String(item.day||item.date||item.label||'').slice(0,10)+'T12:00:00Z');if(!Number.isNaN(date.getTime()))weekdayCounts[(date.getUTCDay()+6)%7]+=Number(item.active_users||0);}
 const weekdayMax=Math.max(1,...weekdayCounts);

 const totalCustomers=segments.length,ret=Number(current.active_customers)>0?Math.round(100*Number(current.returning_customers||0)/Number(current.active_customers)):0;
 const groups=[['Nuevos',segments.filter(x=>x.is_new).length],['Frecuentes',segments.filter(x=>x.is_frequent).length],['En riesgo',segments.filter(x=>x.is_risk&&!x.is_lost).length],['Sin visita',segments.filter(x=>x.absent_month).length]] as const;
 const groupsMax=Math.max(1,...groups.map(x=>x[1]));
 const summary=[['Visitas',Number(current.visits||0),Number(previous.visits||0)],['Clientes nuevos',Number(current.new_customers||0),Number(previous.new_customers||0)],['Canjes',Number(current.redeemed||0),Number(previous.redeemed||0)],['Recurrentes',Number(current.returning_customers||0),Number(previous.returning_customers||0)]];
 const trend=(a:number,b:number)=>b?((a-b)*100/b).toFixed(0)+'%':a?'Nuevo':'0%';
 const url=(kind:string,br=branchId)=>'/panel?business='+encodeURIComponent(businessId)+'&kind='+kind+(br?'&branch='+encodeURIComponent(br):'')+'#informes';
 return <section className="reportWorkspace">
  <header className="workspaceSectionHeader"><h2>Informes</h2><div className="workspaceActionRow">{['day','month','year'].map((kind,i)=><a key={kind} className={rangeKind===kind?'workspacePrimary':'workspaceSecondary'} href={url(kind)}>{['Día','Mes','Año'][i]}</a>)}
    <label>Sucursal <select value={branchId||''} onChange={e=>window.location.assign(url(rangeKind,e.target.value||undefined))}><option value="">Todas</option>{branches.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label></div></header>
  <div className="workspaceActionRow" role="tablist" aria-label="Informes">{[['resumen','Resumen'],['puntos','Puntos'],['clientes','Clientes'],['sucursales','Sucursales'],['equipo','Equipo']].map(([key,title])=><button key={key} type="button" role="tab" aria-selected={tab===key} className={tab===key?'workspacePrimary':'workspaceSecondary'} onClick={()=>setTab(key)}>{title}</button>)}</div>
  {tab==='resumen'&&<><div className="ownerMetrics">{summary.map(([label,value,prev])=><article className="ownerCard ownerMetric" key={String(label)}><span>{label}</span><strong>{N(value)}</strong><small>{trend(Number(value),Number(prev))} vs anterior</small></article>)}</div><a className="workspaceSecondary" href={'/panel/reportes?business='+businessId}>Descargar PDF del periodo de 30 días</a></>}
  {tab==='puntos'&&<><article className="ownerCard"><h3>Visitas por día</h3><Lines rows={activity} period={chartPeriod}/></article><div className="ownerMetrics"><Stat title="Premios canjeados" value={Number(current.redeemed||0)}/></div><article className="ownerCard"><h3>Premios más canjeados</h3>{rewardStats.length?<AxisChart title="Premios más canjeados" period={chartPeriod} xLabel="premio" yLabel="número de canjes" points={rewardStats.slice(0,8).map(([label,value])=>({label,value}))}/>:<p className="ownerEmpty">Sin canjes</p>}</article></>}
  {tab==='puntos'&&<article className="ownerCard"><h3>Visitas por día de la semana</h3><AxisChart title="Visitas por día de la semana" period={chartPeriod} xLabel="día de la semana" yLabel="número de visitas" points={weekdays.map((label,i)=>({label,value:weekdayCounts[i]}))}/></article>}
  {tab==='clientes'&&<><div className="ownerMetrics"><Stat title="Clientes" value={totalCustomers}/><Stat title="Tasa de retorno" value={ret+'%'}/><Stat title="Nuevos" value={newCount}/><Stat title="Recurrentes" value={N(current.returning_customers)}/></div><article className="ownerCard"><h3>Estado de clientes</h3><AxisChart title="Estado de clientes" period={chartPeriod} xLabel="segmento" yLabel="número de clientes" points={groups.map(([label,value])=>({label,value}))}/></article></>}
  {tab==='sucursales'&&<article className="ownerCard"><div className="workspaceActionRow"><label>Ordenar por <select value={order} onChange={e=>setOrder(e.target.value)}><option value="visits">Visitas</option><option value="customers">Clientes</option><option value="redemptions">Canjes</option></select></label></div><div style={{overflowX:'auto'}}><table className="customerTable"><thead><tr><th>Sucursal</th><th>Visitas</th><th>Clientes</th><th>Canjes</th><th>Google</th></tr></thead><tbody>{branchStats.slice().sort((a,b)=>Number(b[order]||0)-Number(a[order]||0)).map(b=><tr key={b.branch_id}><td>{b.name}</td><td>{b.visits||0}</td><td>{b.customers||0}</td><td>{b.redemptions||0}</td><td>{b.google_rating||'—'}</td></tr>)}</tbody></table></div></article>}
  {tab==='equipo'&&<article className="ownerCard"><p className="cardCaption">Señales para revisar, no prueban fraude.</p><div style={{overflowX:'auto'}}><table className="customerTable"><thead><tr><th>Trabajador</th><th>Visitas</th><th>Canjes</th><th>Clientes</th><th>Revisiones</th></tr></thead><tbody>{ranking.map(r=><tr key={String(r.staff_id)}><td>{r.name}</td><td>{r.visits||0}</td><td>{r.redemptions||0}</td><td>{r.customers||0}</td><td>{Number(r.pending||0)+Number(r.reversed||0)}</td></tr>)}</tbody></table></div></article>}
 </section>;
}
