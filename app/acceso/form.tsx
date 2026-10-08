'use client';
import {useState} from 'react';
import {authClient} from '../../lib/backend/client';
import {TurnstileWidget} from '../../lib/security/turnstile-widget';
type Mode='login'|'register'|'recover'|'resend';
const titles={login:'Entrar como dueño de negocio',register:'Crear cuenta de negocio',recover:'Recuperar contraseña',resend:'Confirmar mi correo'};
const buttons={login:'Entrar a mi negocio',register:'Crear mi cuenta',recover:'Enviar enlace de recuperación',resend:'Reenviar confirmación'};
export default function AccessForm({turnstileSiteKey,initialMode='login'}:{turnstileSiteKey:string;initialMode?:'login'|'register'}) {
 const [mode,setMode]=useState<Mode>(initialMode);const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [failed,setFailed]=useState(false);
 function changeMode(value:Mode){setMode(value);setNotice('');setFailed(false);setPassword('');}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setNotice('');setFailed(false);
  try{
   const client=authClient;const address=email.trim();
   if(mode==='register'){
    const token=(event.currentTarget.elements.namedItem('cf-turnstile-response') as HTMLInputElement|null)?.value||'';
    const anti=await fetch('/api/security/turnstile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
    if(!anti.ok){setFailed(true);setNotice('No se pudo validar la protección anti-bot. Revisa la conexión de Cloudflare y vuelve a intentarlo.');return;}
    const {data,error}=await client.signUp.email({email:address,password,name:address.split('@')[0],callbackURL:new URL('/entrar',window.location.origin).href});if(error)throw error;
    if(data?.user){window.location.href='/entrar';return;}
    setNotice('Revisa tu correo para confirmar tu cuenta. Si ya la tienes, inicia sesión.');
   }else if(mode==='login'){
    const {error}=await client.signIn.email({email:address,password});
    if(error){setFailed(true);setNotice('No se pudo iniciar sesión. Revisa tus datos o confirma tu correo.');return;}
    window.location.href='/entrar';
   }else if(mode==='recover'){
    const {error}=await client.requestPasswordReset({email:address,redirectTo:new URL('/restablecer',window.location.origin).href});if(error)throw error;
    setNotice('Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña. Revisa también la carpeta de spam.');
   }else{
    const {error}=await client.sendVerificationEmail({email:address,callbackURL:new URL('/entrar',window.location.origin).href});if(error)throw error;
    setNotice('Si tu cuenta necesita confirmación, recibirás un nuevo correo. Revisa también la carpeta de spam.');
   }
  }catch{setFailed(true);setNotice('No se pudo completar la solicitud. Espera un minuto y vuelve a intentarlo.');}finally{setBusy(false);}
 }
 const passwordNeeded=mode==='login'||mode==='register';
 return <section className="reviewBox"><h2>{titles[mode]}</h2><form className="configGrid" onSubmit={submit}><label>Correo<input type="email" required autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy}/></label>{passwordNeeded&&<label>Contraseña<input type="password" required minLength={mode==='register'?8:1} maxLength={128} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} disabled={busy}/></label>}{mode==='register'&&<TurnstileWidget siteKey={turnstileSiteKey}/>}<button disabled={busy}>{busy?'Procesando…':buttons[mode]}</button></form><p role={failed?'alert':'status'} className={failed?'error':''}>{notice}</p><div className="actions">{mode==='login'?<><button type="button" disabled={busy} onClick={()=>changeMode('register')}>Crear cuenta de negocio</button><button type="button" disabled={busy} onClick={()=>changeMode('recover')}>Olvidé mi contraseña</button><button type="button" disabled={busy} onClick={()=>changeMode('resend')}>No recibí la confirmación</button></>:<button type="button" disabled={busy} onClick={()=>changeMode('login')}>¿Ya tienes cuenta? Inicia sesión</button>}</div></section>;
}