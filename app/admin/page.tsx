import {AdminNavigation} from '../../lib/admin/navigation';
import {quoteUrl} from "../../lib/foundation/registration.mjs";
import {redirect} from 'next/navigation';
import {foundationEnabled,query,transaction} from '../../lib/foundation/db';
import {requireAdminRole} from '../../lib/foundation/session';
import {logout} from '../../lib/foundation/actions';
import {ActionForm} from '../../lib/foundation/forms';
import {Field,Hidden} from '../../lib/foundation/fields';
import {
 changeBusinessStatus,setBusinessPlan,registerPayment30,generateActivationCode,saveZoneComparison,savePayCardLink
} from '../../lib/admin/actions';
import {syncServiceTasks} from '../../lib/admin/service-tasks';
import TaskBoard from './task-board';

export const dynamic='force-dynamic';
const states=['registrado','cotizando','pago_pendiente','activo','por_vencer','pausado','cancelado'];
const stateLabels:Record<string,string>={registrado:'Registrado',cotizando:'En cotización',pago_pendiente:'Pago pendiente',activo:'Activo',por_vencer:'Por vencer',pausado:'Pausado',cancelado:'Cancelado'};

function mxn(value:unknown){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(value||0))}
function date(value:unknown){return value?new Date(String(value)).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'—'}
function waReminder(b:any){
 const msg=`Hola ${b.owner_name||''}, te escribo de Nival Tech sobre ${b.name}. Tu servicio ${b.paid_until?'vence/venció el '+date(b.paid_until):'está pendiente de activación'}. ¿Te apoyo para renovarlo?`;
 const phone=String(b.phone||'').replace(/\D/g,'');
 return 'https://wa.me/'+(phone.startsWith('52')?phone:'52'+phone)+'?text='+encodeURIComponent(msg);
}
function waQuote(b:any,plan:any){return quoteUrl(b,plan);}


export default async function Admin({searchParams}:{searchParams:Promise<{business?:string;q?:string;status?:string;view?:string}>}){
 if(!foundationEnabled())redirect('/demo/admin');
 const actor=await requireAdminRole();
 const params=await searchParams;
 const view=['negocios','tareas','comparacion'].includes(params.view||'')?params.view:(params.business?'negocios':'tareas');
 await syncServiceTasks(actor);
 // Sin cron externo, cada entrada de superadmin sincroniza el estado de cobro.
 await transaction(actor,[
  {text:"update nival_pr.businesses set status='por_vencer' where status='activo' and paid_until is not null and paid_until between now() and now()+interval '7 days'"},
  {text:"update nival_pr.businesses set status='pausado' where status in ('activo','por_vencer') and greatest(coalesce(paid_until,'-infinity'),coalesce(trial_ends_at,'-infinity'))<=now()"},
 ]);
 const q=(params.q||'').slice(0,100),status=states.includes(params.status||'')?params.status||'':'';
 const businesses=await query(actor,`select b.*,p.name plan_name,p.price_mxn,p.interval,
   case when p.price_mxn=399 then 30 when p.price_mxn=549 then 100 else coalesce((p.features->>'review_limit')::int,0) end review_limit,
   (select count(*)::int from nival_pr.reviews rv where rv.business_id=b.id and rv.published_at>=coalesce(b.service_started_at,b.paid_until-interval '30 days')+floor(extract(epoch from now()-coalesce(b.service_started_at,b.paid_until-interval '30 days'))/2592000)*interval '30 days' and rv.published_at<coalesce(b.service_started_at,b.paid_until-interval '30 days')+(floor(extract(epoch from now()-coalesce(b.service_started_at,b.paid_until-interval '30 days'))/2592000)+1)*interval '30 days') replies_used,
   (select r.id from nival_pr.generated_reports r where r.business_id=b.id and r.kind='period_summary' and r.status='approved' order by r.period_end desc limit 1) latest_pdf_id
  from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id
  where ($1='' or b.name ilike '%'||$1||'%' or coalesce(b.owner_name,'') ilike '%'||$1||'%' or coalesce(b.email,'') ilike '%'||$1||'%')
    and ($2='' or b.status=$2)
  order by b.created_at desc limit 250`,[q,status]);
 const selected=params.business?businesses.find(x=>x.id===params.business)||null:null;
 const plans=await query(actor,'select id,name,price_mxn,interval from nival_pr.plans order by price_mxn');
 const selectedPlan=selected?plans.find(p=>p.id===selected.plan_id):null;
 const plusBusinesses=businesses.filter(b=>Number(b.price_mxn)===549);
 const comparisonRows=plusBusinesses.length?await query(actor,'select * from nival_pr.business_comparisons where business_id=any($1::uuid[])',[plusBusinesses.map(b=>b.id)]):[];
 const payments=selected?await query(actor,'select * from nival_pr.payments where business_id=$1 order by paid_at desc limit 40',[selected.id]):[];
 const codes=selected?await query(actor,'select code,expires_at,used_at from nival_pr.activation_codes where business_id=$1 order by expires_at desc limit 20',[selected.id]):[];
 const todayTasks=await query(actor,`select t.id,t.title,t.status,t.due_date,t.recurrence,b.name business_name,b.id business_id,b.slug business_code,b.phone business_phone,b.email business_email
   ,(select r.id from nival_pr.generated_reports r where r.business_id=b.id and r.kind='period_summary' and r.status='approved' order by r.period_end desc limit 1) period_summary_id
   from nival_pr.tasks t left join nival_pr.businesses b on b.id=t.business_id
   where t.title in ('Responder reseñas pendientes','Hacer resumen de reseñas','Mandar recordatorio de fin de periodo','Mandar recordatorio de pago','Mandar PDF de resumen al cierre')
     and ((t.status in ('pendiente','en_progreso') and (t.due_date is null or t.due_date<=(now() at time zone 'America/Mexico_City')::date)) or (t.status='completada' and t.due_date=(now() at time zone 'America/Mexico_City')::date))
     and (t.business_id is null or (t.title='Mandar PDF de resumen al cierre' and exists(select 1 from nival_pr.generated_reports r where r.business_id=b.id and r.kind='period_summary' and r.status='approved' and r.sent_at is null and r.period_end=(b.paid_until at time zone 'America/Mexico_City')::date)) or (b.status in ('activo','por_vencer','pago_pendiente') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now()))
   order by t.due_date nulls first,t.created_at asc limit 80`);


 return <main className="dashboard adminShell">
  <header className="dashHead adminHead"><div><small>NIVAL · ADMINISTRACIÓN</small><h1>Centro de operación</h1><p>Un lugar para atender negocios, activaciones y tareas.</p></div><div className="actions"><span className="adminSignedIn">Sesión de administrador</span><form action={logout}><button>Cerrar sesión</button></form></div></header>
  <div className="adminWorkspace">
   <AdminNavigation view={view||'inicio'}/>
   <div className="adminContent">

  {view==='negocios'&&<section id="negocios" className="adminSection">
   <div className="sectionTitle"><div><small>OPERACIÓN</small><h2>Negocios</h2></div></div>
   <form className="adminFilters"><Hidden name="view" value="negocios"/><input name="q" defaultValue={q} placeholder="Buscar negocio, dueño o correo"/><select name="status" defaultValue={status}><option value="">Todos los estados</option>{states.map(s=><option key={s} value={s}>{stateLabels[s]||s}</option>)}</select><button>Filtrar</button></form>
   <div className="adminSplit"><div className="businessTableWrap"><table className="dataTable"><thead><tr><th>Negocio</th><th>Plan</th><th>Día del periodo</th><th>Pago</th><th>Respuestas usadas</th><th>Resumen PDF</th></tr></thead><tbody>{businesses.map(b=>{const start=Date.parse(String(b.paid_until||''))-30*86400000,day=Number.isFinite(start)?Math.max(1,Math.min(30,Math.floor((Date.now()-start)/86400000)+1)):0;return <tr key={b.id} className={selected?.id===b.id?'selectedRow':''}><td><a href={'/admin?view=negocios&business='+b.id+'&q='+encodeURIComponent(q)+'&status='+encodeURIComponent(status)}><b>{b.name}</b><small><span className={'statusChip status-'+b.status}>{stateLabels[b.status]||b.status}</span></small></a></td><td>{b.plan_name||'—'}<small>{mxn(b.price_mxn)} / 30 días</small></td><td>{day?`${day} de 30`:'—'}</td><td>{b.status==='activo'||b.status==='por_vencer'?'Al corriente':b.status==='pago_pendiente'?'Pendiente':stateLabels[b.status]||b.status}</td><td>{b.review_limit?`${b.replies_used||0} / ${b.review_limit}`:'No incluido'}</td><td>{b.latest_pdf_id?<a href={'/api/reports/'+b.latest_pdf_id}>Descargar PDF</a>:<span>Se genera al cierre</span>}</td></tr>})}</tbody></table>{!businesses.length&&<p className="empty">No hay resultados.</p>}</div>
   {params.business&&selected&&<aside className="businessDetail">
    <div className="sectionTitle adminBusinessTitle"><div><small>FICHA DEL NEGOCIO</small><h2>{selected.name}</h2><p>{selected.giro||'Sin giro'} · {selected.owner_name||'Sin dueño'}</p></div><span className={'statusChip status-'+selected.status}>{stateLabels[selected.status]||selected.status}</span></div>
    <dl className="detailGrid"><div><dt>ID</dt><dd>{selected.id}</dd></div><div><dt>Slug</dt><dd>{selected.slug}</dd></div><div><dt>Teléfono</dt><dd>{selected.phone||'—'}</dd></div><div><dt>Correo</dt><dd>{selected.email||'—'}</dd></div><div><dt>Vigencia</dt><dd>{date(selected.paid_until)}</dd></div><div><dt>Creado</dt><dd>{date(selected.created_at)}</dd></div></dl>
    <div className="actions"><a className="primary smallBtn" href={'/admin/negocio/'+selected.id}>Abrir vista del negocio</a><a href={waQuote(selected,selectedPlan)} target="_blank" rel="noreferrer">Cotizar/activar por WhatsApp</a>{selected.phone&&<a href={waReminder(selected)} target="_blank" rel="noreferrer">Recordar pago por WhatsApp</a>}</div>

    <section className="adminFlowStep"><h3>Estado automático del servicio</h3><p>La vigencia y el pago determinan el acceso. El vencimiento bloquea las operaciones y conserva el historial.</p>{selected.status!=='cancelado'&&<ActionForm action={changeBusinessStatus} label="Cancelar servicio"><Hidden name="businessId" value={selected.id}/><Hidden name="status" value="cancelado"/></ActionForm>}</section>

    <section className="adminFlowStep"><div className="adminStepHeading"><span>PASO 1 · PLAN</span><p>Elige el plan que acordaste con el negocio.</p></div><ActionForm action={setBusinessPlan} label="Guardar plan"><Hidden name="businessId" value={selected.id}/><label>Plan<select name="planId" defaultValue={selected.plan_id||''}>{plans.map(p=><option key={p.id} value={p.id}>{p.name} · {mxn(p.price_mxn)}/{p.interval}</option>)}</select></label></ActionForm></section>

    <section className="adminFlowStep"><div className="adminStepHeading"><span>NIVAL PAY · TARJETA NFC</span><p>Asocia el negocio de Nival Pay pegando su enlace público. El dueño verá la tarjeta, el QR y un botón para abrirla en su panel.</p></div><ActionForm action={savePayCardLink} label="Guardar vínculo"><Hidden name="businessId" value={selected.id}/><Field name="payBusinessRef" label="Referencia del negocio de Nival Pay" value={selected.pay_business_ref||''} required={false}/><Field name="payCardLabel" label="Nombre de la tarjeta" value={selected.pay_card_label||selected.name} required={false}/><Field name="payCardUrl" label="Enlace público de Nival Pay" value={selected.pay_card_url||''} required={false}/></ActionForm>{selected.pay_card_url&&<p><a href={selected.pay_card_url} target="_blank" rel="noreferrer">Probar tarjeta vinculada</a></p>}</section>


    <section className="adminFlowStep adminPaymentStep"><div className="adminStepHeading"><span>PASO 2 · PAGO RECIBIDO</span><p>Registra el pago únicamente después de confirmar que el dinero llegó. Este registro extiende la vigencia del servicio.</p></div><ActionForm action={registerPayment30} label="Registrar pago confirmado"><Hidden name="businessId" value={selected.id}/><Field name="amount" label="Monto MXN" type="number" min={1} value={Number(selectedPlan?.price_mxn||399)}/><label>Método<select name="method" defaultValue="transferencia"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mercado_pago">Mercado Pago</option><option value="otro">Otro</option></select></label><Field name="reference" label="Referencia" required={false}/></ActionForm>
    <div className="historyList">{payments.map(p=><p key={p.id}><b>{mxn(p.amount)}</b> · {p.method} · {date(p.paid_at)}<small>{String(p.period_start).slice(0,10)} → {String(p.period_end).slice(0,10)} {p.reference?'· '+p.reference:''}</small></p>)}</div></section>

    <section className="adminFlowStep adminCodeStep"><div className="adminStepHeading"><span>PASO 3 · ACTIVACIÓN</span><p>Genera un código y entrégaselo al dueño por WhatsApp o en persona. El negocio lo canjea desde su panel.</p></div><ActionForm action={generateActivationCode} label="Generar código"><Hidden name="businessId" value={selected.id}/><Field name="expiresHours" label="Vence en horas" type="number" min={1} max={720} value={72}/></ActionForm>
    <div className="historyList">{codes.map(c=><p key={c.code}><code>{c.code}</code><small>{c.used_at?'Usado '+date(c.used_at):'Vence '+date(c.expires_at)}</small></p>)}</div></section>

   </aside>}</div>
  </section>}

  {view==='tareas'&&<section id="tareas" className="adminSection"><div className="sectionTitle"><div><small>OPERACIÓN DIARIA</small><h2>Pendientes del día</h2><p>Marca cada pendiente cuando esté listo. Las respuestas y los resúmenes se cargan manualmente desde Google y reseñas.</p></div></div><TaskBoard tasks={todayTasks as any}/></section>}
  {view==='comparacion'&&<section className="adminSection"><div className="sectionTitle"><div><small>PLAN PLUS</small><h2>Comparación con la zona</h2><p>Captura los datos de Google del negocio y el promedio de negocios parecidos de su zona.</p></div></div>{plusBusinesses.map(b=>{const c=comparisonRows.find(row=>row.business_id===b.id);return <article className="reviewBox" key={b.id}><h3>{b.name}</h3><ActionForm action={saveZoneComparison} label="Guardar comparación"><Hidden name="businessId" value={b.id}/><Field name="businessRating" label="Calificación del negocio" type="number" min={1} max={5} step={0.1} value={c?.business_rating||''}/><Field name="businessReviews" label="Número de reseñas del negocio" type="number" min={0} value={c?.business_reviews||''}/><Field name="zoneRating" label="Promedio de calificación en la zona" type="number" min={1} max={5} step={0.1} value={c?.zone_average_rating||''}/><Field name="zoneReviews" label="Promedio de reseñas en la zona" type="number" min={0} value={c?.zone_average_reviews||''}/></ActionForm></article>})}{!plusBusinesses.length&&<p className="empty">Aún no hay negocios con Plus.</p>}</section>}
 </div></div></main>;
}
