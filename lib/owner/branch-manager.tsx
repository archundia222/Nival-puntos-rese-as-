import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageBranch} from './actions';

export function BranchManager({businessId,branches,branchStats,branchLimit}:{businessId:string;branches:Record<string,any>[];branchStats:Record<string,any>[];branchLimit:number}){
 const active=branches.filter(b=>b.active).length;
 return <div className="branchManager">
  <header className="branchManagerHead"><span>{active} <small>/ {branchLimit} activas</small></span>
   {active<branchLimit&&<details className="branchAdd"><summary>+ Agregar sucursal</summary><ActionForm action={manageBranch} label="Crear sucursal"><Hidden name="businessId" value={businessId}/><Field name="name" label="Nombre"/><Hidden name="active" value="true"/></ActionForm></details>}
  </header>
  <div className="branchGrid">{branches.map(branch=>{const stats=branchStats.find(x=>x.branch_id===branch.id)||{};return <article className={'ownerCard branchItem'+(!branch.active?' isPaused':'')} key={branch.id}>
   <div className="branchCardTop"><span className="branchAvatar">{branch.name.slice(0,1).toUpperCase()}</span><span className={'branchStatus'+(branch.active?'':' isPaused')}>{branch.active?'Activa':'Pausada'}</span></div>
   <h3>{branch.name}</h3><small className="branchCode">{branch.is_primary?'Principal · ':''}{branch.code}</small>
   <div className="branchStatGrid"><div><strong>{Number(stats.customers||0).toLocaleString('es-MX')}</strong><small>Clientes</small></div><div><strong>{Number(stats.visits||0).toLocaleString('es-MX')}</strong><small>Visitas</small></div><div><strong>{Number(stats.redemptions||0).toLocaleString('es-MX')}</strong><small>Canjes</small></div></div>
   {branch.active&&<a className="branchSelect" href={'/panel?business='+encodeURIComponent(businessId)+'&branch='+encodeURIComponent(branch.id)+'#inicio'}>Ver dashboard de esta sucursal <span aria-hidden="true">→</span></a>}
   <details className="branchEdit"><summary>Editar sucursal</summary><ActionForm action={manageBranch} label="Guardar"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Field name="name" label="Nombre" value={branch.name}/><Hidden name="active" value={String(Boolean(branch.active))}/></ActionForm>
    {!branch.is_primary&&<ActionForm action={manageBranch} label={branch.active?'Pausar sucursal':'Reactivar sucursal'}><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Hidden name="name" value={branch.name}/><Hidden name="active" value={String(!branch.active)}/></ActionForm>}
   </details>
  </article>})}</div>
  {active>=branchLimit&&<p className="branchLimitNote">Límite de sucursales alcanzado</p>}
 </div>;
}
