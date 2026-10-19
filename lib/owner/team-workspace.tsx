'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageStaff} from '../points/actions';
import {StaffAccess} from '../points/staff-access';
type Staff={id:string;name:string;active:boolean;branch_id?:string;branch_name?:string};
type Branch={id:string;name:string;active?:boolean;is_primary?:boolean};
export function TeamWorkspace({businessId,slug,staff,branches}:{businessId:string;slug:string;staff:Staff[];branches:Branch[]}){
 const [adding,setAdding]=useState(false),[sharing,setSharing]=useState<string|null>(null);
 const active=staff.filter(person=>person.active);
 return <section className="teamWorkspace">
  <header className="workspaceSectionHeader"><h2>Equipo</h2><button type="button" className="workspacePrimary" onClick={()=>setAdding(x=>!x)}>{adding?'Cerrar':'+ Agregar'}</button></header>
  {adding&&<div className="ownerCard"><ActionForm action={manageStaff} label="Agregar asociado" onSuccess={()=>setAdding(false)}>
    <Hidden name="businessId" value={businessId}/><Field name="name" label="Nombre"/>
    <label>Sucursal<select name="branchId" required defaultValue={branches.find(b=>b.is_primary&&b.active)?.id||branches.find(b=>b.active)?.id}>{branches.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label>PIN personal<input name="pin" type="password" required inputMode="numeric" pattern="[0-9]{6,8}" minLength={6} maxLength={8} autoComplete="new-password"/></label>
   </ActionForm></div>}
  <div className="campaignRewardStrip">{active.map(person=><article key={person.id} className="ownerCard">
    <strong>{person.name}</strong><small>{person.branch_name||branches.find(b=>b.id===person.branch_id)?.name||'Sucursal'} · Activo</small>
    <div className="workspaceActionRow"><button type="button" className="workspaceSecondary" onClick={()=>setSharing(sharing===person.id?null:person.id)}>Compartir asociado</button>
    <ActionForm action={manageStaff} label="Eliminar asociado" showSubmit={false}><Hidden name="businessId" value={businessId}/><Hidden name="staffId" value={person.id}/><Hidden name="branchId" value={person.branch_id||branches.find(b=>b.active)?.id||''}/><Hidden name="active" value="false"/>
     <button type="submit" style={{color:'#b42318',border:'1px solid #eac5c5',borderRadius:10,padding:12,background:'#fff'}} onClick={event=>{if(!window.confirm('¿Retirar el acceso de este asociado? Sus movimientos quedarán guardados.'))event.preventDefault()}}>Eliminar asociado</button></ActionForm>
    </div>
    {sharing===person.id&&<StaffAccess slug={slug} id={person.id} name={person.name}/>}
   </article>)}</div>
  {!active.length&&<p className="ownerEmpty">Sin asociados activos</p>}
 </section>;
}
