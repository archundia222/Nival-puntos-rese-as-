import {StaffAccess} from '../../../lib/points/staff-access';
import {entitlements} from '../../../lib/foundation/entitlements.mjs';
import {AccountState} from '../../../lib/owner/account-state';
import {redirect} from 'next/navigation';
import {DashboardShell} from "../../../lib/owner/shell";
import {logout} from "../../../lib/foundation/actions";
import {Icon} from "../../../lib/owner/icons";
import { query, authScope } from "../../../lib/foundation/db";
import { requireRole, requireBusiness } from "../../../lib/foundation/session";
import { ActionForm } from "../../../lib/foundation/forms";
import { Field, Hidden } from "../../../lib/foundation/fields";
import { addReward } from "../../../lib/foundation/actions";
import {
  manageStaff,
  reviewRedemption,
  editReward,
} from "../../../lib/points/actions";

import { ProgramEditor } from "../../../lib/points/program-editor";
export const dynamic = "force-dynamic";
export default async function PointsPanel({
  searchParams,
}: {
  searchParams: Promise<{ business?: string;view?:string }>;
}) {
  const actor = await requireRole("owner"),
    params = await searchParams;
  const businesses = await query(
    actor,
    "select b.*,p.features from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name",
  );
  const b = businesses.find((x) => x.id === params.business) || businesses[0];
  if (!b)
    return (
      <main className="dashboard">
        <h1>Primero registra tu negocio</h1>
        <a href="/panel">Ir a mi panel</a>
      </main>
    );
  await requireBusiness(actor, b.id);
  if(!entitlements(b).active)return <main className="dashboard"><a href={"/panel?business="+b.id}>Mi negocio</a><AccountState b={b}/></main>;
  if(params.view==='compartir')redirect('/panel?business='+b.id+'#compartir');
  const view=['programa','equipo','canjes','compartir'].includes(params.view||'')?params.view:'programa';
  const [program] = await query(
    actor,
    "select * from nival_pr.programs where business_id=$1",
    [b.id],
  );
  const staff = await query(
    authScope(actor.id),
    "select * from nival_pr_private.list_staff($1)",
    [b.id],
  );
  const rewards = await query(
    actor,
    "select r.id,r.name,r.points_cost,r.position,r.active,r.weight,r.stock,to_char((r.expires_at at time zone 'America/Mexico_City')-interval '1 day','YYYY-MM-DD') expiry from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 order by r.position",
    [b.id],
  );
  const redemptions = await query(
    actor,
    "select d.id,d.status,d.photo_path,r.name reward,c.name customer,l.created_at,l.points from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id join nival_pr.customers c on c.id=l.customer_id join nival_pr.rewards r on r.id=d.reward_id where l.business_id=$1 order by l.created_at desc limit 100",
    [b.id],
  );
  return (
    <DashboardShell name={b.name} owner={actor.name} status="Mi cuenta" demo={false} initialSection={view==='canjes'?'equipo':view} homeUrl={'/panel?business='+b.id} logout={<form action={logout}><button className="logoutButton" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button></form>}>
    <main className="dashboard programWorkspace">
      <header className="dashHead">
        <div>
          <small>NIVAL PUNTOS · CONFIGURACIÓN</small>
          <h1>{b.name}</h1>
        </div>
        <a href={"/panel?business=" + b.id}>Volver al panel</a>
      </header>
      <nav className="actions">
        {businesses.map((x) => (
          <a key={x.id} href={"/panel/puntos?business=" + x.id}>
            {x.name}
          </a>
        ))}
      </nav>
      <nav className="programTabs" aria-label="Secciones del programa">{[['programa','Programa y premios'],['equipo','Personal'],['canjes','Canjes']].map(([key,label])=><a key={key} aria-current={view===key?'page':undefined} href={'/panel/puntos?business='+b.id+'&view='+key}>{label}</a>)}</nav>
      {view==='programa'&&<><section className="reviewBox" id="programa">
        <h2>1. Personaliza tu tarjeta</h2><p>Empieza con un premio sencillo: por ejemplo, un café gratis después de 8 visitas. Guarda la tarjeta y después agrega el premio.</p>
        <ProgramEditor businessId={b.id} business={b.name} program={program} reward={rewards.find((r) => r.active)} />
        <p>Para empezar, recomendamos un premio para todos, 1 punto por visita y una visita por día. Las reglas se aplican al registrar cada compra.</p><details><summary>¿Cómo funcionan los otros modos?</summary><p>Premios a elegir: cada cliente elige una meta. Por etapas: los premios se entregan en el orden configurado. Premio sorpresa: los pesos se convierten en probabilidades proporcionales. Pesos iguales dan la misma probabilidad. El premio y su costo se muestran desde la asignación y no cambian al recargar. Los premios ya asignados se protegen hasta su canje.</p></details><h3 id="premios">2. Agrega tus premios</h3>{!rewards.length&&<p className="ownerEmpty">Todavía no tienes un premio. Agrégalo antes de compartir la tarjeta con tus clientes.</p>}
        {rewards.map((r) => (
          <details key={r.id} className="customerRow"><summary>{r.name} · {r.points_cost} puntos · {r.active?'Activo':'Desactivado'}</summary>
            <h3>
              {r.position + 1}. {r.name} {r.active ? "" : "· Desactivado"}
            </h3>
            <ActionForm action={editReward} label="Actualizar premio">
              <Hidden name="businessId" value={b.id} />
              <Hidden name="rewardId" value={r.id} />
              <Field name="name" label="Nombre del premio" value={r.name} />              <Field
                name="cost"
                label="Puntos necesarios"
                type="number"
                min={1}
                max={100000}
                value={r.points_cost}
              />
<details><summary>Opciones avanzadas de este premio</summary><Field name="weight" label="Peso para premio sorpresa (1 a 100)" type="number" min={1} max={100} value={r.weight||1}/><Field name="stock" label="Cantidad disponible (vacío: sin límite)" type="number" min={0} max={100000} required={false} value={r.stock??''}/><Field name="expiry" label="Válido hasta (opcional)" type="date" required={false} value={r.expiry||''}/>
              <Field
                name="position"
                label="Orden"
                type="number"
                min={0}
                value={r.position}
              /></details>
              <label className="consentLabel">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={r.active}
                />
                <span>Premio activo</span>
              </label>
            </ActionForm>
          </details>
        ))}
        <ActionForm action={addReward} label="Agregar premio">
          <Hidden name="businessId" value={b.id} />
          <Field name="name" label="Nombre del premio" />
          <Field name="cost" label="Puntos necesarios" type="number" min={1} />
          <Field
            name="position"
            label="Orden del premio (0 es el primero)"
            type="number"
            min={0}
            value={
              rewards.length
                ? Math.max(...rewards.map((r) => r.position)) + 1
                : 0
            }
          />
        </ActionForm><a className="workspacePrimary" href={'/panel?business='+b.id+'#compartir'}>Siguiente: compartir QR y tarjeta →</a>
      </section>
      </>}
      {view==='equipo'&&<section className="reviewBox" id="personal">
        <h2>Tu equipo</h2><p>También puedes atender tú desde <a href={'/panel/operar?business='+b.id}>Puntos y canjes</a>. Crea un acceso solo para quienes van a registrar visitas o entregar premios.</p>
        <p>
          Cada integrante tiene su propio PIN de 6 a 8 dígitos. Comparte su enlace de acceso y entrega el PIN por separado.
        </p>
        <ActionForm action={manageStaff} label="Crear acceso del empleado">
          <Hidden name="businessId" value={b.id} />
          <Field name="name" label="Nombre del integrante" />
          <label>
            PIN
            <input
              name="pin"
              type="password"
              pattern="[0-9]{6,8}"
              minLength={6}
              maxLength={8}
              inputMode="numeric"
              required
              autoComplete="new-password"
            />
          </label>
        </ActionForm>
        <p>Acceso: /staff/acceso · Negocio: {b.slug}</p>
        {staff.map((s) => (
          <article className="customerRow" key={s.id}>
            <strong>
              {s.name} · {s.active ? "Activo" : "Desactivado"}
            </strong>
            <StaffAccess slug={b.slug} id={s.id} name={s.name}/>
            <ActionForm
              action={manageStaff}
              label={s.active ? "Desactivar al instante" : "Reactivar acceso"}
            >
              <Hidden name="businessId" value={b.id} />
              <Hidden name="staffId" value={s.id} />
              <Hidden name="active" value={s.active ? "false" : "true"} />
            </ActionForm>
          </article>
        ))}
      </section>}
      {view==='canjes'&&<section className="reviewBox" id="canjes">
        <h2>Canjes y evidencia</h2>
        {!redemptions.length && (
          <p>Aquí aparecerán los premios entregados por tu equipo.</p>
        )}
        {redemptions.map((d) => (
          <article className="redemptionReview" key={d.id}>
            <div>
              <small>{d.status}</small>
              <h3>
                {d.customer} · {d.reward}
              </h3>
              <p>
                {-d.points} puntos ·{" "}
                {new Date(d.created_at).toLocaleString("es-MX", {
                  timeZone: "America/Mexico_City",
                })}
              </p>
              {d.photo_path ? (
                <a
                  href={"/api/points/evidence?id=" + d.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={"/api/points/evidence?id=" + d.id}
                    alt="Foto privada del canje"
                    width="180"
                    height="160"
                  />
                </a>
              ) : (
                <p>Canje histórico sin evidencia.</p>
              )}
            </div>
            {d.status !== "revertido" && (
              <div>
                <ActionForm action={reviewRedemption} label="Aprobar">
                  <Hidden name="businessId" value={b.id} />
                  <Hidden name="redemptionId" value={d.id} />
                  <Hidden name="operation" value="approve" />
                </ActionForm>
                <ActionForm
                  action={reviewRedemption}
                  label="Revertir y devolver puntos"
                >
                  <Hidden name="businessId" value={b.id} />
                  <Hidden name="redemptionId" value={d.id} />
                  <Hidden name="operation" value="reverse" />
                </ActionForm>
              </div>
            )}
          </article>
        ))}
      </section>}

    </main></DashboardShell>
  );
}
