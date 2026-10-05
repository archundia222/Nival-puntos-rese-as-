'use client';
import {useState} from 'react';
import {authClient} from '../../lib/backend/client';
export default function PasswordForm({token}:{token:string}){
 const [password,setPassword]=useState('');const [confirmation,setConfirmation]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState(false);
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy)return;setError('');
  if(password.length<8||password.length>128){setError('Usa una contraseña de 8 a 128 caracteres.');return;}
  if(password!==confirmation){setError('Las contraseñas no coinciden.');return;}
  setBusy(true);
  try{const {error:authError}=await authClient.resetPassword({newPassword:password,token});if(authError){setError('No se pudo cambiar la contraseña. Prueba otra contraseña o solicita un nuevo enlace.');return;}setPassword('');setConfirmation('');setDone(true);}catch{setError('No se pudo completar el cambio. Revisa tu conexión e inténtalo nuevamente.');}finally{setBusy(false);}
 }
 if(done)return <section className="reviewBox"><h2>Contraseña actualizada</h2><p role="status">Ya puedes usar tu nueva contraseña.</p><a className="primary" href="/acceso">Iniciar sesión</a></section>;
 return <section className="reviewBox"><form className="configGrid" onSubmit={submit}><label>Nueva contraseña<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} disabled={busy}/></label><label>Repite la contraseña<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} disabled={busy}/></label><button disabled={busy}>{busy?'Guardando…':'Guardar nueva contraseña'}</button><p role="alert" className="error">{error}</p></form><a href="/acceso">Volver al acceso</a></section>;
}
