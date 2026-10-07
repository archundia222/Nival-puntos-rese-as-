'use client';
import {useState} from 'react';
import {resetAdministratorPassword} from './actions';
export default function ResetAdminForm({token}:{token:string}){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);if(data.get('password')!==data.get('confirmation')){setMessage('Las contraseñas no coinciden.');return;}setBusy(true);try{const ok=await resetAdministratorPassword(data);setMessage(ok?'Contraseña actualizada. Ya puedes entrar a tu administración.':'El enlace no es válido o venció. Solicita uno nuevo.');}finally{setBusy(false);}}
  return <form className="configGrid" onSubmit={submit}><input name="token" type="hidden" value={token}/><label>Nueva contraseña<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><label>Confirma tu contraseña<input name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><button disabled={busy||!token}>{busy?'Guardando…':'Guardar mi contraseña privada'}</button><p role="status">{message}</p></form>;
}
