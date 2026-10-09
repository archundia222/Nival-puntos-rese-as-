import {AdminNavigation} from '../../lib/admin/navigation';
import {quoteUrl} from "../../lib/foundation/registration.mjs";
import {redirect} from 'next/navigation';
import {foundationEnabled,query,transaction} from '../../lib/foundation/db';
import {requireAdminRole} from '../../lib/foundation/session';
import {logout} from '../../lib/foundation/actions';
import {ActionForm} from '../../lib/foundation/forms';
import {Field,Hidden} from '../../lib/foundation/fields';
import {
 changeBusinessStatus,setBusinessPlan,saveBusinessNotes,registerPayment30,generateActivationCode,
 publishContent,createTask
} from '../../lib/admin/actions';
import {syncServiceTasks} from '../../lib/admin/service-tasks';
import {TestimonialForm} from '../../lib/admin/testimonial-form';
import TaskBoard from './task-board';

export const dynamic='force-dynamic';
const states=['registrado','cotizando','pago_pendiente','activo','por_vencer','pausado','cancelado'];
const stateLabels:Record<string,string>={registrado:'Registrado',cotizando:'En cotización',pago_pendiente:'Pago pendiente',activo:'Activo',por_vencer:'Por vencer',pausado:'Pausado',cancelado:'Cancelado'};

function mxn(value:unknown){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(value||0))}
function date(value:unknown){return value?new Date(String(value)).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'—'}
function reviewPayload(title:string){
 try{return title.startsWith('REVIEW:')?JSON.parse(title.slice(7)) as {reviewer:string;stars:number;text:string}:null}catch{return null}
}
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
 const view=['inicio','negocios','tareas','testimonios','actividad'].includes(params.view||'')?params.view:(params.business?'negocios':'inicio');
 await syncServiceTasks(actor);
 // Sin cron externo, cada entrada de superadmin sincroniza el estado de cobro.
 await transaction(actor,[
  {text:"update nival_pr.businesses set status='por_vencer' where status='activo' and paid_until is not null and paid_until between now() and now()+interval '7 days'"},
  {text:"update nival_pr.businesses set status='pausado' where status in ('activo','por_vencer') and greatest(coalesce(paid_until,'-infinity'),coalesce(trial_ends_at,'-infinity'))<=now()"},
 ]);
 const q=(params.q||'').slice(0,100),status=states.includes(params.status||'')?params.status||'':'';
 const [metric]=await query(actor,`select
  count(*) filter(where b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now())::int active,
  coalesce(sum(case when b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now() and p.interval='month' then p.price_mxn else 0 end),0) mrr,
  count(*) filter(where b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now() and b.paid_until between now() and now()+interval '7 days')::int expiring
  from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id`);
 const businesses=await query(actor,`select b.*,p.name plan_name,p.price_mxn,p.interval
  from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id
  where ($1='' or b.name ilike '%'||$1||'%' or coalesce(b.owner_name,'') ilike '%'||$1||'%' or coalesce(b.email,'') ilike '%'||$1||'%')
    and ($2='' or b.status=$2)
  order by b.created_at desc limit 250`,[q,status]);
 const selected=params.business?businesses.find(x=>x.id===params.business)||null:null;
 const plans=await query(actor,'select id,name,price_mxn,interval from nival_pr.plans order by price_mxn');
 const selectedPlan=selected?plans.find(p=>p.id===selected.plan_id):null;
 const payments=selected?await query(actor,'select * from nival_pr.payments where business_id=$1 order by paid_at desc limit 40',[selected.id]):[];
 const codes=selected?await query(actor,'select code,expires_at,used_at from nival_pr.activation_codes where business_id=$1 order by expires_at desc limit 20',[selected.id]):[];
 const audit=selected?await query(actor,'select action,data,created_at from nival_pr.audit_log where business_id=$1 order by created_at desc limit 40',[selected.id]):[];
 const globalAudit=await query(actor,`select a.action,a.created_at,a.data,b.name business_name from nival_pr.audit_log a left join nival_pr.businesses b on b.id=a.business_id order by a.created_at desc limit 40`);
 const todayTasks=await query(actor,`select t.id,t.title,t.status,t.due_date,t.recurrence,b.name business_name,b.id business_id,b.slug business_code,b.phone business_phone,b.email business_email
   from nival_pr.tasks t left join nival_pr.businesses b on b.id=t.business_id
   where ((t.status in ('pendiente','en_progreso') and (t.due_date is null or t.due_date<=(now() at time zone 'America/Mexico_City')::date)) or (t.status='completada' and t.due_date=(now() at time zone 'America/Mexico_City')::date))
     and (t.business_id is null or (t.title='Cobrar mensualidad' and b.status<>'cancelado') or (b.status in ('activo','por_vencer') and greatest(coalesce(b.paid_until,'-infinity'),coalesce(b.trial_ends_at,'-infinity'))>now())) and t.title not like 'REVIEW:%'
   order by t.due_date nulls first,t.created_at asc limit 80`);
 const contents=await query(actor,"select key,value_draft,published_at from nival_pr.site_content where key like 'testimonial_%' order by key");


 return <main className="dashboard adminShell">
  <header className="dashHead adminHead"><div><small>NIVAL · ADMINISTRACIÓN</small><h1>Centro de operación</h1><p>Un lugar para atender negocios, activaciones y tareas.</p></div><div className="actions"><span className="adminSignedIn">Sesión de administrador</span><form action={logout}><button>Cerrar sesión</button></form></div></header>
  <div className="adminWorkspace">
   <AdminNavigation view={view||'inicio'}/>
   <div className="adminContent">

  {view==='inicio'&&<section id="resumen" className="adminMetrics" aria-label="Resumen del servicio">
   <article><span>Negocios activos</span><b>{metric?.active||0}</b></article>
   <article><span>Ingreso mensual previsto</span><b>{mxn(metric?.mrr)}</b></article>
   <article><span>Por vencer · 7 días</span><b>{metric?.expiring||0}</b></article>
   <article><span>Tareas por resolver hoy</span><b>{todayTasks.filter(t=>t.status!=='completada').length}</b></article>
  </section>}

  {view==='negocios'&&<section id="negocios" className="adminSection">
   <div className="sectionTitle"><div><small>CRM</small><h2>Negocios</h2></div><div className="actions"><a href="/admin/export/businesses">Exportar negocios CSV</a><a href="/admin/export/payments">Exportar pagos CSV</a></div></div>
   <form className="adminFilters"><Hidden name="view" value="negocios"/><input name="q" defaultValue={q} placeholder="Buscar negocio, dueño o correo"/><select name="status" defaultValue={status}><option value="">Todos los estados</option>{states.map(s=><option key={s} value={s}>{stateLabels[s]||s}</option>)}</select><button>Filtrar</button></form>
   <div className="adminSplit"><div className="businessTableWrap"><table className="dataTable"><thead><tr><th>Negocio</th><th>Estado</th><th>Plan</th><th>Vigencia</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id} className={selected?.id===b.id?'selectedRow':''}><td><a href={'/admin?view=negocios&business='+b.id+'&q='+encodeURIComponent(q)+'&status='+encodeURIComponent(status)}><b>{b.name}</b><small>{b.owner_name||b.email||b.slug}</small></a></td><td><span className={'statusChip status-'+b.status}>{stateLabels[b.status]||b.status}</span></td><td>{b.plan_name||'—'}</td><td>{date(b.paid_until)}</td></tr>)}</tbody></table>{!businesses.length&&<p className="empty">No hay resultados.</p>}</div>
   {params.business&&selected&&<aside className="businessDetail">
    <div className="sectionTitle adminBusinessTitle"><div><small>FICHA DEL NEGOCIO</small><h2>{selected.name}</h2><p>{selected.giro||'Sin giro'} · {selected.owner_name||'Sin dueño'}</p></div><span className={'statusChip status-'+selected.status}>{stateLabels[selected.status]||selected.status}</span></div>
    <dl className="detailGrid"><div><dt>ID</dt><dd>{selected.id}</dd></div><div><dt>Slug</dt><dd>{selected.slug}</dd></div><div><dt>Teléfono</dt><dd>{selected.phone||'—'}</dd></div><div><dt>Correo</dt><dd>{selected.email||'—'}</dd></div><div><dt>Vigencia</dt><dd>{date(selected.paid_until)}</dd></div><div><dt>Creado</dt><dd>{date(selected.created_at)}</dd></div></dl>
    <div className="actions"><a className="primary smallBtn" href={'/admin/negocio/'+selected.id}>Abrir vista del negocio</a><a href={waQuote(selected,selectedPlan)} target="_blank" rel="noreferrer">Cotizar/activar por WhatsApp</a>{selected.phone&&<a href={waReminder(selected)} target="_blank" rel="noreferrer">Recordar pago por WhatsApp</a>}</div>

    <section className="adminFlowStep"><h3>Estado automático del servicio</h3><p>La vigencia y el pago determinan el acceso. El vencimiento bloquea las operaciones y conserva el historial.</p>{selected.status!=='cancelado'&&<ActionForm action={changeBusinessStatus} label="Cancelar servicio"><Hidden name="businessId" value={selected.id}/><Hidden name="status" value="cancelado"/></ActionForm>}</section>

    <section className="adminFlowStep"><div className="adminStepHeading"><span>PASO 1 · PLAN</span><p>Elige el plan que acordaste con el negocio.</p></div><ActionForm action={setBusinessPlan} label="Guardar plan"><Hidden name="businessId" value={selected.id}/><label>Plan<select name="planId" defaultValue={selected.plan_id||''}>{plans.map(p=><option key={p.id} value={p.id}>{p.name} · {mxn(p.price_mxn)}/{p.interval}</option>)}</select></label></ActionForm></section>

    <section className="adminFlowStep adminPaymentStep"><div className="adminStepHeading"><span>PASO 2 · PAGO RECIBIDO</span><p>Registra el pago únicamente después de confirmar que el dinero llegó. Este registro extiende la vigencia del servicio.</p></div><ActionForm action={registerPayment30} label="Registrar pago confirmado"><Hidden name="businessId" value={selected.id}/><Field name="amount" label="Monto MXN" type="number" min={1} value={Number(selectedPlan?.price_mxn||399)}/><label>Método<select name="method" defaultValue="transferencia"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mercado_pago">Mercado Pago</option><option value="otro">Otro</option></select></label><Field name="reference" label="Referencia" required={false}/></ActionForm>
    <div className="historyList">{payments.map(p=><p key={p.id}><b>{mxn(p.amount)}</b> · {p.method} · {date(p.paid_at)}<small>{String(p.period_start).slice(0,10)} → {String(p.period_end).slice(0,10)} {p.reference?'· '+p.reference:''}</small></p>)}</div></section>

    <section className="adminFlowStep adminCodeStep"><div className="adminStepHeading"><span>PASO 3 · ACTIVACIÓN</span><p>Genera un código y entrégaselo al dueño por WhatsApp o en persona. El negocio lo canjea desde su panel.</p></div><ActionForm action={generateActivationCode} label="Generar código"><Hidden name="businessId" value={selected.id}/><Field name="expiresHours" label="Vence en horas" type="number" min={1} max={720} value={72}/></ActionForm>
    <div className="historyList">{codes.map(c=><p key={c.code}><code>{c.code}</code><small>{c.used_at?'Usado '+date(c.used_at):'Vence '+date(c.expires_at)}</small></p>)}</div></section>

    <details className="adminAdvanced"><summary>Notas y registro de actividad</summary><div><h3>Notas internas</h3><ActionForm action={saveBusinessNotes} label="Guardar notas"><Hidden name="businessId" value={selected.id}/><label className="wide">Notas<textarea name="notes" defaultValue={selected.notes||''} maxLength={10000}/></label></ActionForm>

    <h3>Registro de actividad</h3><div className="activityList">{audit.map((a,i)=><p key={i}><time>{new Date(a.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</time><b>{a.action}</b><small>{JSON.stringify(a.data)}</small></p>)}</div></div></details>
   </aside>}</div>
  </section>}

  {view==='tareas'&&<section id="tareas" className="adminSection"><div className="sectionTitle"><div><small>OPERACIÓN DIARIA</small><h2>Agenda de Nival</h2><p>Renovaciones y seguimientos se programan según cada plan. Añade aquí cualquier trabajo manual por negocio.</p></div></div><div className="adminTaskComposer"><h3>Programar tarea</h3><p>Las tareas recurrentes vuelven a la agenda cuando marcas la anterior como hecha.</p><ActionForm action={createTask} label="Agregar a la agenda"><label>Negocio<select name="businessId" defaultValue=""><option value="">Operación general de Nival</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><Field name="title" label="Qué hay que hacer" required/><Field name="dueDate" label="Fecha límite" type="date" required={false}/><label>Repetir<select name="recurrence" defaultValue=""><option value="">No repetir</option><option value="daily">Cada día</option><option value="weekly">Cada semana</option><option value="monthly">Cada mes</option></select></label></ActionForm></div><TaskBoard tasks={todayTasks as any}/></section>}
  {view==='testimonios'&&<section className="adminSection"><h2>Testimonios de negocios</h2><p>Prepara cada caso con foto, nombre del local y su experiencia. Publica únicamente con autorización del negocio.</p><TestimonialForm/><div className="contentGrid">{contents.filter(c=>c.key.startsWith('testimonial_')).map(c=><article key={c.key}><img src={c.value_draft?.photo} alt={'Local de '+c.value_draft?.businessName} width="260" height="180" style={{objectFit:'cover',maxWidth:'100%'}}/><h3>{c.value_draft?.businessName}</h3><blockquote>{c.value_draft?.quote}</blockquote><p>{c.value_draft?.author}</p>{c.published_at?<p>Publicado</p>:<ActionForm action={publishContent} label="Publicar testimonio"><Hidden name="key" value={c.key}/></ActionForm>}</article>)}</div></section>}

  {view==='actividad'&&<section className="adminSection">
   <div className="sectionTitle"><div><small>AUDITORÍA</small><h2>Actividad reciente</h2></div></div>
   <div className="activityList">{globalAudit.map((a,i)=><p key={i}><time>{new Date(a.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</time><b>{a.business_name||'Sistema'} · {a.action}</b><small>{JSON.stringify(a.data)}</small></p>)}</div>
  </section>}
 </div></div></main>;
}
