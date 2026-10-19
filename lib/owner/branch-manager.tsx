import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageBranch} from './actions';

export function BranchManager({businessId,branches,branchStats,branchLimit}:{businessId:string;branches:Record<string,any>[];branchStats:Record<string,any>[];branchLimit:number}){
 const active=branches.filter(b=>b.active).length;
 const maxVisits=Math.max(1,...branchStats.map(s=>Number(s.visits||0)));
 return <div className="branchManager">
  <header className="branchManagerHead"><div><strong>{active}</strong><span>de {branchLimit} sucursales activas</span></div>
   {active<branchLimit&&<details className="branchAdd"><summary>+ Agregar sucursal</summary><ActionForm action={manageBranch} label="Crear sucursal"><Hidden name="businessId" value={businessId}/><Field name="name" label="Nombre"/><Hidden name="active" value="true"/></ActionForm></details>}
  </header>
  <div className="branchGrid">{branches.map(branch=>{const stats=branchStats.find(x=>x.branch_id===branch.id)||{};return <article className={'ownerCard branchItem'+(!branch.active?' isPaused':'')} key={branch.id}>
   <div className="branchCardTop"><span className="branchAvatar">{branch.name.slice(0,1).toUpperCase()}</span><span className={'branchStatus'+(branch.active?'':' isPaused')}>{branch.active?'Activa':'Pausada'}</span></div>
   <h3>{branch.name}{branch.is_primary&&<small className="branchPrimaryTag">Principal</small>}</h3><small className="branchCode">{branch.code}</small>
   <div className="branchStatGrid"><div><strong>{Number(stats.customers||0).toLocaleString('es-MX')}</strong><small>Clientes</small></div><div><strong>{Number(stats.visits||0).toLocaleString('es-MX')}</strong><small>Visitas</small></div><div><strong>{Number(stats.redemptions||0).toLocaleString('es-MX')}</strong><small>Premios</small></div><div><strong>{stats.google_rating??"—"}</strong><small>Google ★</small></div><div><strong>{Number(stats.staff_count||0)}</strong><small>Trabajadores</small></div></div>
   <div className="branchVisitCompare"><span>Actividad relativa</span><div role="meter" aria-label={'Actividad de '+branch.name+' comparada con las sucursales'} aria-valuemin={0} aria-valuemax={maxVisits} aria-valuenow={Number(stats.visits||0)}><i style={{width:(Math.min(100,Number(stats.visits||0)/maxVisits*100))+'%'}}/></div></div>
   {branch.active&&<a className="branchSelect" href={'/panel?business='+encodeURIComponent(businessId)+'&branch='+encodeURIComponent(branch.id)+'#inicio'}>Abrir dashboard <span aria-hidden="true">→</span></a>}
   <details className="branchEdit"><summary>Editar sucursal</summary><ActionForm action={manageBranch} label="Guardar"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Field name="name" label="Nombre" value={branch.name}/><Hidden name="active" value={String(Boolean(branch.active))}/></ActionForm>
    {!branch.is_primary&&<ActionForm action={manageBranch} label={branch.active?'Pausar sucursal':'Reactivar sucursal'}><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Hidden name="name" value={branch.name}/><Hidden name="active" value={String(!branch.active)}/></ActionForm>}
   </details>
  </article>})}</div>
  {active>=branchLimit&&<p className="branchLimitNote">Límite de sucursales alcanzado. <a href="#plan">Ver planes</a></p>}
 </div>;
}
