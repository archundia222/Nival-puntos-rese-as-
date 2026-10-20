'use client';
import {useState} from 'react';
import {TeamWorkspace} from './team-workspace';
type Row=Record<string,any>;
type Staff={id:string;name:string;active:boolean;branch_id?:string;branch_name?:string};
type Branch={id:string;name:string;active?:boolean;is_primary?:boolean};
export function TeamUnified({businessId,slug,staff,branches,ranking,initialTab='personal'}:{businessId:string;slug:string;staff:Staff[];branches:Branch[];ranking:Row[];initialTab?:'personal'|'actividad'}){
 const [tab,setTab]=useState<'personal'|'actividad'>(initialTab);
 function selectTab(next:'personal'|'actividad'){
  setTab(next);
  const url=new URL(window.location.href);
  if(next==='personal')url.searchParams.delete('teamTab');else url.searchParams.set('teamTab',next);
  window.history.replaceState(null,'',url);
 }
 return <section>
  <div className="workspaceActionRow" role="tablist" aria-label="Equipo">
   <button type="button" className={tab==='personal'?'workspacePrimary':'workspaceSecondary'} aria-selected={tab==='personal'} role="tab" onClick={()=>selectTab('personal')}>Equipo</button>
   <button type="button" className={tab==='actividad'?'workspacePrimary':'workspaceSecondary'} aria-selected={tab==='actividad'} role="tab" onClick={()=>selectTab('actividad')}>Actividad</button>
  </div>
  {tab==='personal'?<TeamWorkspace businessId={businessId} slug={slug} staff={staff} branches={branches}/>:<div className="ownerCard">
   <p className="cardCaption">Señales para revisar, no prueban fraude.</p>
   <div style={{overflowX:'auto'}}><table className="customerTable"><thead><tr><th>Trabajador</th><th>Sucursal</th><th>Visitas</th><th>Canjes</th><th>Clientes únicos</th><th>Revisar</th></tr></thead><tbody>
   {ranking.map(r=>{const person=staff.find(x=>x.id===r.staff_id);const peers=ranking.filter(x=>x.staff_id!==r.staff_id);const mean=peers.length?peers.reduce((sum,x)=>sum+Number(x.visits||0),0)/peers.length:0;const high=peers.length>0&&r.visits>=10&&r.visits>mean*2;return <tr key={String(r.staff_id)}><td>{person?.name||r.name}</td><td>{person?.branch_name||branches.find(x=>x.id===person?.branch_id)?.name||'—'}</td><td>{r.visits||0}</td><td>{r.redemptions||0}</td><td>{r.customers||0}</td><td>{high?'Volumen alto':r.reversed>0?'Canjes revertidos':'—'}</td></tr>})}
   </tbody></table></div>
   {!ranking.length&&<p className="ownerEmpty">Sin actividad registrada</p>}
  </div>}
 </section>;
}
