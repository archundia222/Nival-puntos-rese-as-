import {redirect} from 'next/navigation';
import {createClient} from '../../../lib/backend/server';
import {backendConfigured} from '../../../lib/backend/config';
import {BusinessSidebar} from './sidebar';

export const dynamic='force-dynamic';

export default async function BusinessLayout({children}:{children:React.ReactNode}) {
  if(!backendConfigured())redirect('/acceso');
  const client=await createClient();
  const {data:claims,error:authError}=await client.auth.getClaims();
  if(authError||!claims?.claims.sub)redirect('/acceso');
  const {data:business,error}=await client.from('npr_businesses').select('id,name,plan').eq('owner_id',claims.claims.sub).maybeSingle();
  if(error)return <main className="businessSetupError"><h1>No se pudo abrir el panel</h1><p role="alert">No pudimos leer el plan de tu negocio. Revisa que la migración del plan esté aplicada en Neon.</p><a href="/acceso">Volver al acceso</a></main>;
  if(!business)return <>{children}</>;
  return <div className="businessLayout"><BusinessSidebar businessName={business.name} plan={business.plan}/><div className="businessContent">{children}</div></div>;
}
