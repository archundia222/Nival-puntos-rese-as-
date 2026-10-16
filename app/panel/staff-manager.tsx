'use client';
import {useActionState} from 'react';
import {manageStaff,type ActionResult} from './actions';
const initial:ActionResult={};
export function StaffManager({staff,error}:{staff:{user_id:string;email:string;created_at:string;active:boolean}[];error?:boolean}){
 const[state,action,pending]=useActionState(manageStaff,initial);
 return <section className="contentCard" id="staff">
  <div className="sectionHeading"><div><span className="eyebrow">EQUIPO</span><h2>Personal de tienda</h2></div></div>
  <p className="cardIntro">El personal puede registrar clientes, sumar visitas y canjear premios. No puede cambiar la configuración ni ver reportes.</p>
  <form className="configGrid" action={action}><label>Correo de la cuenta del empleado<input name="email" type="email" required maxLength={254} placeholder="persona@negocio.com" autoComplete="email"/></label><button name="operation" value="add" disabled={pending}>Dar acceso</button><p role="status" className={state.error?'error':''}>{state.error||state.success}</p></form>
  <p className="quietNotice">Primero, el empleado crea su cuenta y confirma su correo. Después agrega aquí el mismo correo.</p>
  {error?<p role="alert" className="error">No se pudo cargar la lista del equipo.</p>:staff.length===0?<p className="empty">Todavía no hay personal asignado.</p>:<div className="staffList">{staff.map(person=><article className="staffRow" key={person.user_id}><div><strong>{person.email}</strong><small>{person.active?'Acceso activo':'Acceso desactivado'}</small></div>{person.active&&<form action={action}><input type="hidden" name="userId" value={person.user_id}/><button className="quietButton" name="operation" value="revoke" disabled={pending}>Quitar acceso</button></form>}</article>)}</div>}
 </section>;
}
