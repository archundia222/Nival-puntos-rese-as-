import {legalDefaults} from "../../lib/foundation/legal.mjs";
import {quoteUrl} from "../../lib/foundation/registration.mjs";
import {GoogleReportForm} from '../../lib/owner/google-form';
import {redirect} from 'next/navigation';
import {foundationEnabled,query,transaction} from '../../lib/foundation/db';
import {requireRole} from '../../lib/foundation/session';
import {logout} from '../../lib/foundation/actions';
import {ActionForm} from '../../lib/foundation/forms';
import {Field,Hidden} from '../../lib/foundation/fields';
import {
 changeBusinessStatus,setBusinessPlan,saveBusinessNotes,registerPayment30,generateActivationCode,
 createTask,saveContentDraft,publishContent,saveGoogleReport,createReviewTask,markReviewResponded,upsertShortLink
} from '../../lib/admin/actions';
import TaskBoard from './task-board';

export const dynamic='force-dynamic';
const states=['registrado','cotizando','pago_pendiente','activo','por_vencer','pausado','cancelado'];
const contentFields=[
 ['hero_title','Título del hero','Haz que tus clientes regresen y además te recomienden.'],
 ['hero_description','Descripción del hero','Premia visitas frecuentes y convierte buenas experiencias en reseñas de Google.'],
 ['price','Precio mostrado','$399 MXN/mes'],
 ['whatsapp','WhatsApp','5539044788'],
 ['testimonials','Testimonios',''],
 ['faq','Preguntas frecuentes',''],
 ...Object.entries(legalDefaults).map(([key,text])=>[key,key==='legal_terms'?'Términos':key==='legal_privacy'?'Privacidad':'Consentimiento del cliente',text]),
] as const;

function mxn(value:unknown){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(value||0))}
function date(value:unknown){return value?new Date(String(value)).toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'}):'—'}
function reviewPayload(title:string){
 try{return title.startsWith('REVIEW:')?JSON.parse(title.slice(7)) as {reviewer:string;stars:number;text:string}:null}catch{return null}
}
function waReminder(b:any){
 const msg=`Hola ${b.owner_name||''}, te escribo de Nival Tech sobre ${b.name}. Tu servicio ${b.paid_until?'vence/venció el '+date(b.paid_until):'está pendiente de activación'}. ¿Te apoyo para renovarlo?`;
 return 'https://wa.me/52'+String(b.phone||'').replace(/\D/g,'')+'?text='+encodeURIComponent(msg);
}
function waQuote(b:any,plan:any){return quoteUrl(b,plan);}


export default async function Admin({searchParams}:{searchParams:Promise<{business?:string;q?:string;status?:string}>}){
 if(!foundationEnabled())redirect('/demo/admin');
 const actor=await requireRole('superadmin');
 const params=await searchParams;
 // Sin cron externo, cada entrada de superadmin sincroniza el estado de cobro.
 await transaction(actor,[
  {text:"update nival_pr.businesses set status='por_vencer' where status='activo' and paid_until is not null and paid_until<=now()"},
  {text:"update nival_pr.businesses set status='pausado' where status='por_vencer' and paid_until is not null and paid_until<=now()-interval '7 days'"},
 ]);
 const q=(params.q||'').slice(0,100),status=states.includes(params.status||'')?params.status||'':'';
 const [metric]=await query(actor,`select
  count(*) filter(where b.status='activo')::int active,
  coalesce(sum(case when b.status='activo' and p.interval='month' then p.price_mxn else 0 end),0) mrr,
  count(*) filter(where b.status='activo' and b.paid_until between now() and now()+interval '7 days')::int expiring,
  (select count(*)::int from nival_pr.tasks t where t.status in ('pendiente','en_progreso') and t.due_date=(now() at time zone 'America/Mexico_City')::date) tasks_today
  from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id`);
 const businesses=await query(actor,`select b.*,p.name plan_name,p.price_mxn,p.interval
  from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id
  where ($1='' or b.name ilike '%'||$1||'%' or coalesce(b.owner_name,'') ilike '%'||$1||'%' or coalesce(b.email,'') ilike '%'||$1||'%')
    and ($2='' or b.status=$2)
  order by b.created_at desc limit 250`,[q,status]);
 const selected=businesses.find(x=>x.id===params.business)||businesses[0]||null;
 const plans=await query(actor,'select id,name,price_mxn,interval from nival_pr.plans order by price_mxn');
 const selectedPlan=selected?plans.find(p=>p.id===selected.plan_id):null;
 const payments=selected?await query(actor,'select * from nival_pr.payments where business_id=$1 order by paid_at desc limit 40',[selected.id]):[];
 const codes=selected?await query(actor,'select code,expires_at,used_at from nival_pr.activation_codes where business_id=$1 order by expires_at desc limit 20',[selected.id]):[];
 const audit=selected?await query(actor,'select action,data,created_at from nival_pr.audit_log where business_id=$1 order by created_at desc limit 40',[selected.id]):[];
 const globalAudit=await query(actor,`select a.action,a.created_at,a.data,b.name business_name from nival_pr.audit_log a left join nival_pr.businesses b on b.id=a.business_id order by a.created_at desc limit 40`);
 const tasks=await query(actor,`select t.id,t.title,t.status,t.due_date,t.recurrence,b.name business_name
   from nival_pr.tasks t left join nival_pr.businesses b on b.id=t.business_id
   where t.status<>'cancelada' and t.title not like 'REVIEW:%' order by t.due_date nulls last,t.created_at desc limit 150`);
 const reviewRows=await query(actor,`select t.id,t.title,t.status,t.due_date,b.name business_name,b.id business_id
   from nival_pr.tasks t join nival_pr.businesses b on b.id=t.business_id
   where t.title like 'REVIEW:%' order by case when t.status='completada' then 1 else 0 end,t.created_at desc limit 100`);
 const reviews:any[]=reviewRows.map(r=>({...r,review:reviewPayload(r.title)})).filter(r=>r.review);
 const contents=await query(actor,'select key,value_draft,value_published,published_at from nival_pr.site_content order by key');
 const contentMap=new Map(contents.map(c=>[c.key,c]));
 const shortLinks=await query(actor,'select s.code,s.target_url,s.business_id,b.name business_name from nival_pr.short_links s left join nival_pr.businesses b on b.id=s.business_id order by s.code limit 100');

 return <main className="dashboard adminShell">
  <header className="dashHead adminHead"><div><small>NIVAL · SUPERADMIN</small><h1>Centro de operación</h1><p>Ventas, activaciones, cobranza, reputación y contenido.</p></div><div className="actions"><a href="#negocios">Negocios</a><a href="#tareas">Tareas</a><a href="#contenido">Contenido</a><form action={logout}><button>Cerrar sesión</button></form></div></header>

  <section className="adminMetrics">
   <article><span>Negocios activos</span><b>{metric?.active||0}</b></article>
   <article><span>MRR</span><b>{mxn(metric?.mrr)}</b></article>
   <article><span>Por vencer · 7 días</span><b>{metric?.expiring||0}</b></article>
   <article><span>Tareas de hoy</span><b>{metric?.tasks_today||0}</b></article>
  </section>

  <section id="negocios" className="adminSection">
   <div className="sectionTitle"><div><small>CRM</small><h2>Negocios</h2></div><div className="actions"><a href="/admin/export/businesses">Exportar negocios CSV</a><a href="/admin/export/payments">Exportar pagos CSV</a></div></div>
   <form className="adminFilters"><input name="q" defaultValue={q} placeholder="Buscar negocio, dueño o correo"/><select name="status" defaultValue={status}><option value="">Todos los estados</option>{states.map(s=><option key={s}>{s}</option>)}</select><button>Filtrar</button></form>
   <div className="adminSplit"><div className="businessTableWrap"><table className="dataTable"><thead><tr><th>Negocio</th><th>Estado</th><th>Plan</th><th>Vigencia</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id} className={selected?.id===b.id?'selectedRow':''}><td><a href={'/admin?business='+b.id+'&q='+encodeURIComponent(q)+'&status='+encodeURIComponent(status)}><b>{b.name}</b><small>{b.owner_name||b.email||b.slug}</small></a></td><td><span className={'statusChip status-'+b.status}>{b.status}</span></td><td>{b.plan_name||'—'}</td><td>{date(b.paid_until)}</td></tr>)}</tbody></table>{!businesses.length&&<p className="empty">No hay resultados.</p>}</div>
   {selected&&<aside className="businessDetail">
    <div className="sectionTitle"><div><small>FICHA</small><h2>{selected.name}</h2><p>{selected.giro||'Sin giro'} · {selected.owner_name||'Sin dueño'}</p></div><span className={'statusChip status-'+selected.status}>{selected.status}</span></div>
    <dl className="detailGrid"><div><dt>ID</dt><dd>{selected.id}</dd></div><div><dt>Slug</dt><dd>{selected.slug}</dd></div><div><dt>Teléfono</dt><dd>{selected.phone||'—'}</dd></div><div><dt>Correo</dt><dd>{selected.email||'—'}</dd></div><div><dt>Vigencia</dt><dd>{date(selected.paid_until)}</dd></div><div><dt>Creado</dt><dd>{date(selected.created_at)}</dd></div></dl>
    <div className="actions"><a className="primary smallBtn" href={'/admin/negocio/'+selected.id}>Ver como este negocio</a><a href={waQuote(selected,selectedPlan)} target="_blank" rel="noreferrer">Cotizar/activar por WhatsApp</a>{selected.phone&&<a href={waReminder(selected)} target="_blank" rel="noreferrer">Recordar pago por WhatsApp</a>}</div>

    <h3>Estado</h3><div className="quickActions">{['activo','pausado','cancelado'].map(s=><ActionForm key={s} action={changeBusinessStatus} label={s==='activo'?'Activar':s==='pausado'?'Pausar':'Cancelar'}><Hidden name="businessId" value={selected.id}/><Hidden name="status" value={s}/></ActionForm>)}</div>
    <ActionForm action={changeBusinessStatus} label="Guardar estado"><Hidden name="businessId" value={selected.id}/><label>Estado<select name="status" defaultValue={selected.status}>{states.map(s=><option key={s}>{s}</option>)}</select></label></ActionForm>

    <h3>Plan</h3><ActionForm action={setBusinessPlan} label="Cambiar plan"><Hidden name="businessId" value={selected.id}/><label>Plan<select name="planId" defaultValue={selected.plan_id||''}>{plans.map(p=><option key={p.id} value={p.id}>{p.name} · {mxn(p.price_mxn)}/{p.interval}</option>)}</select></label></ActionForm>

    <h3>Registrar pago · +30 días</h3><ActionForm action={registerPayment30} label="Registrar pago y activar"><Hidden name="businessId" value={selected.id}/><Field name="amount" label="Monto MXN" type="number" min={1} value={Number(selectedPlan?.price_mxn||399)}/><label>Método<select name="method" defaultValue="transferencia"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mercado_pago">Mercado Pago</option><option value="otro">Otro</option></select></label><Field name="reference" label="Referencia" required={false}/><Field name="periodStart" label="Inicio del periodo" type="date" required={false}/></ActionForm>
    <div className="historyList">{payments.map(p=><p key={p.id}><b>{mxn(p.amount)}</b> · {p.method} · {date(p.paid_at)}<small>{String(p.period_start).slice(0,10)} → {String(p.period_end).slice(0,10)} {p.reference?'· '+p.reference:''}</small></p>)}</div>

    <h3>Código de activación</h3><ActionForm action={generateActivationCode} label="Generar código"><Hidden name="businessId" value={selected.id}/><Field name="expiresHours" label="Vence en horas" type="number" min={1} max={720} value={72}/></ActionForm>
    <div className="historyList">{codes.map(c=><p key={c.code}><code>{c.code}</code><small>{c.used_at?'Usado '+date(c.used_at):'Vence '+date(c.expires_at)}</small></p>)}</div>

    <h3>Notas</h3><ActionForm action={saveBusinessNotes} label="Guardar notas"><Hidden name="businessId" value={selected.id}/><label className="wide">Notas<textarea name="notes" defaultValue={selected.notes||''} maxLength={10000}/></label></ActionForm>

    <h3>Registro de actividad</h3><div className="activityList">{audit.map((a,i)=><p key={i}><time>{new Date(a.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</time><b>{a.action}</b><small>{JSON.stringify(a.data)}</small></p>)}</div>
   </aside>}</div>
  </section>

  <section id="tareas" className="adminSection">
   <div className="sectionTitle"><div><small>OPERACIÓN</small><h2>Tareas</h2></div></div>
   <ActionForm action={createTask} label="Crear tarea"><Field name="title" label="Tarea"/><label>Negocio<select name="businessId" defaultValue=""><option value="">General</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><Field name="dueDate" label="Fecha" type="date" required={false}/><label>Recurrencia<select name="recurrence" defaultValue=""><option value="">Sin recurrencia</option><option value="daily">Diaria</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></label></ActionForm>
   <TaskBoard tasks={tasks as any}/>
  </section>

  <section id="contenido" className="adminSection">
   <div className="sectionTitle"><div><small>LANDING</small><h2>Contenido del sitio</h2><p>La landing pública lee únicamente <b>value_published</b>.</p></div></div>
   <div className="contentGrid">{contentFields.map(([key,label,fallback])=>{const row=contentMap.get(key);const draft=row?.value_draft?.text??fallback;const published=row?.value_published?.text??fallback;return <article key={key}><small>{label}</small><h3>Vista previa</h3><div className="draftPreview">{draft||'Sin contenido'}</div><ActionForm action={saveContentDraft} label="Guardar borrador"><Hidden name="key" value={key}/><label className="wide">Borrador<textarea name="value" defaultValue={draft}/></label></ActionForm><ActionForm action={publishContent} label="Publicar"><Hidden name="key" value={key}/></ActionForm><p><b>Publicado:</b> {published||'—'}</p></article>})}</div>
  </section>

  <section className="adminSection">
   <div className="sectionTitle"><div><small>REPUTACIÓN</small><h2>Bandeja de reseñas</h2></div></div>
   <ActionForm action={createReviewTask} label="Agregar reseña"><label>Negocio<select name="businessId" required>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><Field name="reviewer" label="Nombre en Google"/><label>Estrellas<select name="stars" defaultValue="5">{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} estrellas</option>)}</select></label><label className="wide">Texto<textarea name="text" maxLength={1500}/></label></ActionForm>
   <div className="reviewInbox">{reviews.map(r=><article key={r.id} className={r.status==='completada'?'doneReview':''}><div><small>{r.business_name}</small><h3>{r.review.reviewer} · {'★'.repeat(r.review.stars)}</h3><p>{r.review.text||'Sin texto'}</p></div><div><span className="statusChip">{r.status==='completada'?'respondida':'pendiente'}</span>{r.status!=='completada'&&<ActionForm action={markReviewResponded} label="Marcar respondida"><Hidden name="taskId" value={r.id}/></ActionForm>}</div></article>)}</div>
  </section>

  <section className="adminSection">
   <div className="sectionTitle"><div><small>GOOGLE BUSINESS PROFILE</small><h2>Cargar reporte</h2></div></div>
   <GoogleReportForm businesses={businesses.map(b=>({id:b.id,name:b.name}))}/>

  </section>

  <section className="adminSection">
   <div className="sectionTitle"><div><small>UTILIDADES</small><h2>Links cortos</h2></div></div>
   <ActionForm action={upsertShortLink} label="Guardar link"><Field name="code" label="Código"/><Field name="targetUrl" label="URL destino"/><label>Negocio opcional<select name="businessId" defaultValue=""><option value="">Sin negocio</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label></ActionForm>
   <table className="dataTable"><thead><tr><th>Código</th><th>Destino</th><th>Negocio</th></tr></thead><tbody>{shortLinks.map(s=><tr key={s.code}><td><a href={'/r/'+s.code} target="_blank">/r/{s.code}</a></td><td className="breakCell">{s.target_url}</td><td>{s.business_name||'—'}</td></tr>)}</tbody></table>
  </section>

  <section className="adminSection">
   <div className="sectionTitle"><div><small>AUDITORÍA</small><h2>Actividad reciente</h2></div></div>
   <div className="activityList">{globalAudit.map((a,i)=><p key={i}><time>{new Date(a.created_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})}</time><b>{a.business_name||'Sistema'} · {a.action}</b><small>{JSON.stringify(a.data)}</small></p>)}</div>
  </section>
 </main>;
}
