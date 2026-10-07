'use client';
import {useState} from 'react';
import {authClient} from '../../lib/backend/client';

export default function AdminAccessForm(){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setNotice('');
  try{
   const {error}=await authClient.signIn.email({email:email.trim(),password});
   if(error){setNotice('No se pudo iniciar sesión como administrador. Revisa tus datos.');return;}
   window.location.href='/admin';
  }catch{setNotice('No se pudo completar el acceso. Intenta de nuevo.');}
  finally{setBusy(false);}
 }
 return <section className="reviewBox"><h2>Acceso de administrador</h2><p>Este acceso es exclusivo para la operación interna de Nival. No crea cuentas de negocio.</p><form className="configGrid" onSubmit={submit}><label>Correo de administrador<input type="email" required autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label><label>Contraseña<input type="password" required autoComplete="current-password" maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><button disabled={busy}>{busy?'Verificando…':'Entrar al panel de administrador'}</button></form><p role="alert" className={notice?'error':''}>{notice}</p></section>;
}