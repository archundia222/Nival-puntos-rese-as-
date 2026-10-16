'use client';
import {useState} from 'react';
import {authClient} from '../../../lib/backend/client';

export default function EmployeeRegistrationForm(){
 const[name,setName]=useState('');const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[confirmation,setConfirmation]=useState('');const[busy,setBusy]=useState(false);const[notice,setNotice]=useState('');const[failed,setFailed]=useState(false);const[complete,setComplete]=useState(false);
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy)return;setNotice('');setFailed(false);
  if(password!==confirmation){setFailed(true);setNotice('Las contraseñas no coinciden.');return;}
  setBusy(true);
  try{
   const{error}=await authClient.signUp.email({email:email.trim().toLowerCase(),password,name:name.trim(),callbackURL:new URL('/personal',window.location.origin).href});
   if(error)throw error;
   setComplete(true);setNotice('Cuenta creada. Confirma tu correo y pide al responsable del negocio que active tu acceso.');
  }catch{setFailed(true);setNotice('No se pudo crear la cuenta. Revisa tus datos o inicia sesión si ya tienes una.');}finally{setBusy(false);}
 }
 if(complete)return <section className="reviewBox registrationSuccess"><h2>Revisa tu correo</h2><p role="status">{notice}</p><a className="primary" href="/personal/acceso">Ir a iniciar sesión</a></section>;
 return <section className="reviewBox employeeRegistration"><h2>Crear cuenta de personal</h2><form className="configGrid" onSubmit={submit}>
  <label>Nombre completo<input name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label>
  <label>Correo<input name="email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>
  <label>Contraseña<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><small>Usa al menos 8 caracteres.</small></label>
  <label>Confirmar contraseña<input name="confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></label>
  <button disabled={busy}>{busy?'Creando cuenta…':'Crear cuenta'}</button>
  <p role={failed?'alert':'status'} className={failed?'error':''}>{notice}</p>
 </form><p className="registrationFootnote">Después de confirmar tu correo, la persona responsable del negocio debe asignarte acceso.</p><p className="accessRegisterPrompt">¿Ya tienes cuenta? <a href="/personal/acceso">Iniciar sesión</a></p></section>;
}
