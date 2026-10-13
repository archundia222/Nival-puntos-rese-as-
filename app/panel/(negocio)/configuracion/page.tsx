import {redirect} from 'next/navigation';
import {createClient} from '../../../../lib/backend/server';
import {backendConfigured} from '../../../../lib/backend/config';
import {businessPlan,PLAN_DETAILS} from '../../../../lib/business-plan';
import {BusinessSettingsForm} from '../../forms';

export const dynamic='force-dynamic';
const dateLabel=(value:string|null)=>value?new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value.slice(0,10)}T12:00:00Z`)):'Sin registrar';
const money=(value:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(value);

export default async function SettingsPage(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error}=await client.from('npr_businesses').select('id,name,plan,category,neighborhood,risk_days,max_visits_per_customer_per_day,points_expiration_days,plan_started_at,period_end_date,next_payment_at,subscription_status,reward_goal,reward_name').eq('owner_id',claims.claims.sub).maybeSingle();
 if(error)return <main className="dashboard"><h1>Configuración</h1><section className="panelState panelError"><p role="alert">No se pudo cargar tu configuración. Verifica que la migración de ajustes esté aplicada.</p><a href="/panel">Volver a Inicio</a></section></main>;
 if(!business)return <main className="dashboard"><h1>Configuración</h1><p>Registra tu negocio desde Inicio para continuar.</p><a href="/panel">Ir a Inicio</a></main>;
 const{data:payments,error:paymentError}=await client.from('npr_manual_payments').select('id,amount,paid_on').eq('business_id',business.id).order('paid_on',{ascending:false}).order('id',{ascending:false});
 const plan=businessPlan(business.plan);const details=PLAN_DETAILS[plan];
 const waMessage=encodeURIComponent(`Hola, quiero cambiar mi plan de Nival. Mi negocio es ${business.name}.`);
 return <main className="dashboard settingsDashboard"><header className="dashHead"><div><small>NIVAL · CONFIGURACIÓN</small><h1>Configuración</h1><p>Datos, reglas y facturación de {business.name}.</p></div></header>
  <section className="settingsSection"><span className="eyebrow">TU NEGOCIO</span><h2>Datos del negocio y reglas</h2><BusinessSettingsForm name={business.name} category={business.category||''} neighborhood={business.neighborhood||''} riskDays={business.risk_days} dailyLimit={Number(business.max_visits_per_customer_per_day??1)} expirationDays={business.points_expiration_days===null?null:Number(business.points_expiration_days)}/></section>
  <section className="settingsSection"><span className="eyebrow">PÁGINA DEL CLIENTE</span><h2>Lo que ve tu cliente</h2><p>La tarjeta actual muestra los puntos, la meta y el premio. Se controla desde la sección Tarjetas.</p><a className="textLink" href="/panel/tarjetas">Configurar tarjeta</a></section>
  <section className="settingsSection"><span className="eyebrow">PLAN Y FACTURACIÓN</span><h2>Solo lectura</h2><div className="billingGrid"><article><span>Plan actual</span><strong>{details.label}</strong></article><article><span>Precio</span><strong>{money(details.price)} / mes</strong></article><article><span>Inicio del plan</span><strong>{dateLabel(business.plan_started_at)}</strong></article><article><span>Fin del periodo</span><strong>{dateLabel(business.period_end_date)}</strong></article><article><span>Próximo pago</span><strong>{dateLabel(business.next_payment_at)}</strong></article><article><span>Estado</span><strong className={business.subscription_status==='expired'?'billingExpired':'billingActive'}>{business.subscription_status==='expired'?'Vencido':'Activo'}</strong></article></div><a className="whatsappPlan" href={`https://wa.me/525539044788?text=${waMessage}`} target="_blank" rel="noopener noreferrer">Solicitar cambio de plan por WhatsApp</a>
   <div className="paymentHistory"><h3>Pagos registrados</h3>{paymentError?<p role="alert">No se pudo cargar el historial de pagos.</p>:!payments?.length?<p className="empty">No hay pagos registrados todavía.</p>:<div className="paymentList">{payments.map(payment=><article key={payment.id}><span>{dateLabel(payment.paid_on)}</span><strong>{money(Number(payment.amount))}</strong></article>)}</div>}</div>
  </section>
  <section className="settingsSection upcomingSettings"><div><span className="comingSoon">Próximamente</span><h2>Sucursales</h2><p>La administración de sucursales se habilitará después.</p></div></section>
  <section className="settingsSection upcomingSettings"><div><span className="comingSoon">Próximamente</span><h2>Usuarios y empleados</h2><p>La administración de usuarios se habilitará después.</p></div></section>
 </main>;
}
