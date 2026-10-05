import {createClient} from '../../lib/supabase/server';
import {supabaseConfigured} from '../../lib/supabase/config';
import PasswordForm from './form';
export const dynamic='force-dynamic';
export default async function ResetPassword(){
 if(!supabaseConfigured())return <main className="dashboard"><h1>Recuperación en preparación</h1><p>El acceso todavía está pendiente de activación.</p><a href="/acceso">Volver al acceso</a></main>;
 try{const client=await createClient();const {data,error}=await client.auth.getUser();if(!error&&data.user)return <main className="dashboard"><h1>Elige tu nueva contraseña</h1><PasswordForm/></main>;}catch{/* Session validation failed: ask for a new link. */}
 return <main className="dashboard"><h1>Solicita un nuevo enlace</h1><p>El enlace puede haber caducado o ya haberse utilizado. Vuelve al acceso y selecciona «Olvidé mi contraseña».</p><a href="/acceso">Volver al acceso</a></main>;
}
