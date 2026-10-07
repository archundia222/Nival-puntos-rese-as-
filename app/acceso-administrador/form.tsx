'use client';
import {useState} from 'react';
import {administratorAccess} from './actions';
type Mode='login'|'setup'|'recover';
export default function AdminAccessForm({initialError=''}:{initialError?:string}){
  const [mode,setMode]=useState<Mode>('login');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState(initialError);
  const [failed,setFailed]=useState(Boolean(initialError));
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault(); if(busy)return;
    const form=new FormData(event.currentTarget);
    setBusy(true);setNotice('');
    try{const result=await administratorAccess(mode,form);setFailed(!result.ok);setNotice(result.message);if(result.enter)window.location.assign('/admin');}
    catch{setFailed(true);setNotice('No se pudo completar la solicitud. Intenta de nuevo.');}
    finally{setBusy(false);}
  }
  function change(next:Mode){setMode(next);setNotice('');setFailed(false);}
  return <section className="adminAccessCard">
    <span className="adminAccessBadge">Acceso privado · Fundador</span>
    <h2>{mode==='setup'?'Configura tu acceso privado':mode==='recover'?'Recupera tu acceso':'Tu centro de operación'}</h2>
    <p>{mode==='setup'?'Recibe en tu correo autorizado los enlaces para confirmar tu identidad y definir tu contraseña privada.':mode==='recover'?'El enlace de recuperación se envía al correo autorizado.':'Solo la cuenta autorizada y confirmada puede entrar a la administración de Nival.'}</p>
    <form key={mode} className="configGrid" onSubmit={submit}>
      <label>Tu correo autorizado<input name="email" type="email" autoComplete="username" required maxLength={254} disabled={busy}/></label>
      {mode==='login'&&<label>Tu contraseña<input name="password" type="password" required maxLength={128} autoComplete="current-password" disabled={busy}/></label>}
      <button disabled={busy}>{busy?'Verificando…':mode==='setup'?'Recibir mis enlaces privados':mode==='recover'?'Enviar enlace privado':'Abrir mi administración'}</button>
    </form>
    {notice&&<p className={failed?'error':'adminAccessNotice'} role={failed?'alert':'status'}>{notice}</p>}
    <div className="adminAccessOptions">{mode==='login'?<><button type="button" disabled={busy} onClick={()=>change('setup')}>Primera vez: configurar mi acceso</button><button type="button" disabled={busy} onClick={()=>change('recover')}>Recuperar mi acceso</button></>:<button type="button" disabled={busy} onClick={()=>change('login')}>Volver al acceso privado</button>}</div>
    <p className="adminAccessFootnote">La administración no se habilita desde el registro de negocios.</p>
  </section>;
}
