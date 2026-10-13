import {StaffAccess} from '../../../lib/points/staff-access';
import {StartGuide} from '../../../lib/owner/start-guide';
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
import {ReviewCardManager} from "../../../lib/owner/review-card-manager";
import {
  manageStaff,
  reviewRedemption,
  editReward,
} from "../../../lib/points/actions";

import { ProgramEditor } from "../../../lib/points/program-editor";
import {CardWorkspace} from "../../../lib/points/card-workspace";
export const dynamic = "force-dynamic";
export default async function PointsPanel({
  searchParams,
}: {
  searchParams: Promise<{ business?: string;view?:string;period?:string }>;
}) {
  const actor = await requireRole("owner"),
    params = await searchParams;
  const businesses = await query(
    actor,
    "select b.*,p.name plan_name,p.price_mxn,p.features from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name",
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
  const view=['programa','promociones','equipo','canjes','compartir'].includes(params.view||'')?params.view:'programa';
  const programView=view==='programa'||view==='promociones';
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
  const branches=await query(authScope(actor.id),"select * from nival_pr_private.list_branches($1)",[b.id]);
  const rewards = await query(
    actor,
    "select r.id,r.name,r.points_cost,r.position,r.active,r.weight,r.stock,r.photo_url,to_char((r.expires_at at time zone 'America/Mexico_City')-interval '1 day','YYYY-MM-DD') expiry from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 order by r.position",
    [b.id],
  );
  const redemptions = await query(
    actor,
    "select d.id,d.status,d.photo_path,d.value_mxn,r.name reward,r.reward_type,r.photo_url product_photo,c.name customer,l.created_at,l.points,l.staff_id from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id join nival_pr.customers c on c.id=l.customer_id join nival_pr.rewards r on r.id=d.reward_id where l.business_id=$1 order by l.created_at desc limit 100",
    [b.id],
  );
  const period=["7","30","90","365"].includes(params.period||"")?params.period! : "30";
  let cardMetrics={visits:0,customers:0,redemptions:0,income:null as number|null},recent:any[]=[],reviewCards:any[]=[];
  if(programView){
    try{
      const [counts]=await query(actor,`select
       (select count(*)::int from nival_pr.point_ledger where business_id=$1 and type='visit' and created_at>=now()-($2::int*interval '1 day')) visits,
       (select count(*)::int from nival_pr.customers where business_id=$1 and created_at>=now()-($2::int*interval '1 day')) customers,
       (select count(*)::int from nival_pr.point_ledger where business_id=$1 and type='redeem' and created_at>=now()-($2::int*interval '1 day')) redemptions`,[b.id,period]);
      cardMetrics={...cardMetrics,...counts};
    }catch{}
    try{const [income]=await query(actor,"select coalesce(sum(ticket_value_mxn),0)::numeric income from nival_pr.point_ledger where business_id=$1 and type='visit' and created_at>=now()-($2::int*interval '1 day')",[b.id,period]);cardMetrics.income=Number(income?.income||0);}catch{}
    try{recent=await query(actor,"select c.name,l.type,l.points,r.name reward,l.created_at from nival_pr.point_ledger l join nival_pr.customers c on c.id=l.customer_id left join nival_pr.rewards r on r.id=l.reward_id where l.business_id=$1 and l.type in ('visit','redeem') order by l.created_at desc,l.id desc limit 8",[b.id]);}catch{}
    try{reviewCards=await query(authScope(actor.id),"select * from nival_pr_private.list_review_cards($1)",[b.id]);}catch{}
  }
  return (
    <DashboardShell name={b.name} owner={actor.name} status={b.status==='activo'?'Activo':'Inactivo'} demo={false} initialSection={view==='programa'?'tus-tarjetas':view==='equipo'?'equipo':view} homeUrl={'/panel?business='+b.id} planName={b.plan_name||'Puntos'} price={Number(b.price_mxn||299)} responseLimit={Number(b.features?.review_limit||0)} periodDay={Math.max(1,Math.min(30,Math.floor((Date.now()-(Date.parse(String(b.paid_until||''))-30*86400000))/86400000)+1))} logout={<form action={logout}><button className="logoutButton" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button></form>}>
    {view==='programa'&&<StartGuide actor={actor} businessId={b.id}/>}<main className="dashboard programWorkspace">
      <header className="dashHead">
        <div>
          <small>NIVAL · PUNTOS</small>
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

      {programView&&<><CardWorkspace businessId={b.id} business={b.name} slug={b.slug} program={program} reward={rewards.find((r:any) => r.active)} metrics={cardMetrics} recent={recent} period={period} reviewCards={reviewCards} reviewManager={<ReviewCardManager businessId={b.id} cards={reviewCards} googleUrl={b.google_maps_url}/>} editor={<ProgramEditor businessId={b.id} business={b.name} program={program} reward={rewards.find((r:any) => r.active)} />}/><details className="reviewBox extraRewards"><summary>Administrar premios adicionales</summary>
        <h2>Premios y reglas avanzadas</h2><p>Conserva tus premios, edita su información y define el orden de entrega. Las metas que un cliente ya eligió se protegen hasta su canje.</p><details><summary>¿Cómo funcionan los otros modos?</summary><p>Premios a elegir: cada cliente elige una meta. Por etapas: los premios se entregan en el orden configurado. Los premios asignados y su costo se muestran hasta completar el canje.</p></details><h3 id="premios">Premios del programa</h3>{!rewards.length&&<p className="ownerEmpty">Todavía no tienes un premio. Agrégalo antes de compartir la tarjeta con tus clientes.</p>}
        {rewards.map((r) => (
          <details key={r.id} className="customerRow"><summary>{r.name} · {r.points_cost} puntos · {r.active?'Activo':'Desactivado'}</summary>
            <h3>
              {r.position + 1}. {r.name} {r.active ? "" : "· Desactivado"}
            </h3>
            <ActionForm action={editReward} label="Actualizar premio">
              <Hidden name="businessId" value={b.id} />
              <Hidden name="rewardId" value={r.id} />
              <Field name="name" label="Nombre del premio o promoción" value={r.name} /><label>Tipo<select name="rewardType" defaultValue={r.reward_type||'product'}><option value="product">Producto</option><option value="discount">Descuento</option></select></label><Field name="valueMxn" label="Valor en pesos (MXN)" type="number" min={0} max={1000000} step={0.01} required={false} value={r.value_mxn??''}/><Field name="photoUrl" label="Foto del producto (URL HTTPS)" required={false} value={r.photo_url||''}/><Field
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
          <Field name="name" label="Nombre del premio o promoción" />
          <label>Tipo<select name="rewardType" defaultValue="product"><option value="product">Producto</option><option value="discount">Descuento</option></select></label>
          <Field name="valueMxn" label="Valor en pesos (MXN)" type="number" min={0} max={1000000} step={0.01} required={false}/>
          <Field name="photoUrl" label="Foto del producto (URL HTTPS)" required={false}/>
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
      </details>
      </>}
      {view==='equipo'&&<section className="reviewBox" id="personal">
        <h2>Tu equipo</h2><p>También puedes atender tú desde <a href={'/panel/operar?business='+b.id}>Puntos y canjes</a>. Crea un acceso solo para quienes van a registrar visitas o entregar premios.</p>
        <p>
          Cada integrante tiene su propio PIN de 6 a 8 dígitos. Comparte su enlace de acceso y entrega el PIN por separado.
        </p>
        <ActionForm action={manageStaff} label="Crear acceso del empleado">
          <Hidden name="businessId" value={b.id} />
          <Field name="name" label="Nombre del integrante" />
          <label>Sucursal asignada<select name="branchId" required defaultValue={branches.find((x:any)=>x.is_primary)?.id||branches[0]?.id}>{branches.filter((x:any)=>x.active).map((x:any)=><option key={x.id} value={x.id}>{x.name} · {x.code}</option>)}</select></label>
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
            <small>Sucursal: {s.branch_name||'Sin asignar'} · Código {s.branch_code||'—'}</small>
            <StaffAccess slug={b.slug} id={s.id} name={s.name}/>
            <ActionForm
              action={manageStaff}
              label={s.active ? "Desactivar al instante" : "Reactivar acceso"}
            >
              <Hidden name="businessId" value={b.id} />
              <Hidden name="staffId" value={s.id} />
              <Hidden name="active" value={s.active ? "false" : "true"} />
              <label>Sucursal asignada<select name="branchId" required defaultValue={s.branch_id}>{branches.filter((x:any)=>x.active).map((x:any)=><option key={x.id} value={x.id}>{x.name} · {x.code}</option>)}</select></label>
            </ActionForm>
          </article>
        ))}
      </section>}
      {view==='canjes'&&<section className="reviewBox" id="canjes">
        <h2>Historial de canjes</h2>
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
                {d.reward_type==='discount'?'Descuento':'Producto'} · {d.value_mxn!==null?'$'+Number(d.value_mxn).toFixed(2)+' MXN':'Valor no registrado'} · {-d.points} puntos · {staff.find((person:any)=>person.id===d.staff_id)?.name||'Empleado'} ·{" "}
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
