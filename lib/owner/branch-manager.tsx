import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageBranch} from './actions';

export function BranchManager({businessId,branches}:{businessId:string;branches:Record<string,any>[]}){
 const active=branches.filter(b=>b.active).length;
 return <div className="branchManager">
  {branches.map(branch=><article className="ownerCard branchItem" key={branch.id}>
   <div className="branchHeader"><div><h3>{branch.name}{branch.is_primary?' · Principal':''}</h3><p>Código de sucursal: <strong>{branch.code}</strong> · {branch.staff_count} empleados · {branch.active?'Activa':'Pausada'}</p></div></div>
   <ActionForm action={manageBranch} label="Guardar cambios"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Field name="name" label="Nombre de sucursal" value={branch.name}/><Hidden name="active" value="true"/></ActionForm>
   {!branch.is_primary&&branch.active&&<ActionForm action={manageBranch} label="Pausar sucursal"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Hidden name="name" value={branch.name}/><Hidden name="active" value="false"/></ActionForm>}
   {!branch.is_primary&&!branch.active&&<ActionForm action={manageBranch} label="Reactivar sucursal"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branch.id}/><Hidden name="name" value={branch.name}/><Hidden name="active" value="true"/></ActionForm>}
  </article>)}
  <p>{active} de 10 sucursales activas.</p>
  {active<10&&<ActionForm action={manageBranch} label="Agregar sucursal"><Hidden name="businessId" value={businessId}/><Field name="name" label="Nombre de la nueva sucursal"/></ActionForm>}
  {active>=10&&<p className="ownerEmpty">Llegaste al máximo de 10. Pausa una sucursal para liberar un espacio.</p>}
 </div>;
}
