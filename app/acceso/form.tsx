'use client';
import {useState} from 'react';
import {createClient} from '../../lib/supabase/client';
type Mode='login'|'register'|'recover'|'resend';
const titles={login:'Iniciar sesión',register:'Crear cuenta',recover:'Recuperar contraseña',resend:'Confirmar mi correo'};
const buttons={login:'Entrar',register:'Crear cuenta',recover:'Enviar enlace de recuperación',resend:'Reenviar confirmación'};
export default function AccessForm(){
 const [mode,setMode]=useState<Mode>('login');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [failed,setFailed]=useState(false);
 function changeMode(value:Mode){setMode(value);setNotice('');setFailed(false);setPassword('');}
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setNotice('');setFailed(false);
  try{
   const client=createClient();const address=email.trim();const callback=new URL('/auth/confirm',window.location.origin).href;
   if(mode==='register'){
    const {data,error}=await client.auth.signUp({email:address,password,options:{emailRedirectTo:callback}});if(error)throw error;
    if(data.session){window.location.href='/panel';return;}
    setNotice('Revisa tu correo para confirmar tu cuenta. Si ya la tienes, inicia sesión.');
   }else if(mode==='login'){
    const {error}=await client.auth.signInWithPassword({email:address,password});
    if(error){setFailed(true);setNotice('No se pudo iniciar sesión. Revisa tus datos o confirma tu correo.');return;}
    window.location.href='/panel';
   }else if(mode==='recover'){
    const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo:`${callback}?flow=recovery`});if(error)throw error;
    setNotice('Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña. Revisa también la carpeta de spam.');
   }else{
    const {error}=await client.auth.resend({type:'signup',email:address,options:{emailRedirectTo:callback}});if(error)throw error;
    setNotice('Si tu cuenta necesita confirmación, recibirás un nuevo correo. Revisa también la carpeta de spam.');
   }
  }catch{setFailed(true);setNotice('No se pudo completar la solicitud. Espera un minuto y vuelve a intentarlo.');}finally{setBusy(false);}
 }
 const passwordNeeded=mode==='login'||mode==='register';
 return <section className="reviewBox"><h2>{titles[mode]}</h2><form className="configGrid" onSubmit={submit}><label>Correo<input type="email" required autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy}/></label>{passwordNeeded&&<label>Contraseña<input type="password" required minLength={mode==='register'?8:1} maxLength={128} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} disabled={busy}/></label>}<button disabled={busy}>{busy?'Procesando…':buttons[mode]}</button></form><p role={failed?'alert':'status'} className={failed?'error':''}>{notice}</p><div className="actions">{mode==='login'?<><button type="button" disabled={busy} onClick={()=>changeMode('register')}>Crear una cuenta</button><button type="button" disabled={busy} onClick={()=>changeMode('recover')}>Olvidé mi contraseña</button><button type="button" disabled={busy} onClick={()=>changeMode('resend')}>No recibí la confirmación</button></>:<button type="button" disabled={busy} onClick={()=>changeMode('login')}>Volver a iniciar sesión</button>}</div></section>;
}
