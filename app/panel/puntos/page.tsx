import { query, authScope } from "../../../lib/foundation/db";
import { requireRole, requireBusiness } from "../../../lib/foundation/session";
import { ActionForm } from "../../../lib/foundation/forms";
import { Field, Hidden } from "../../../lib/foundation/fields";
import { saveProgram, addReward } from "../../../lib/foundation/actions";
import {
  manageStaff,
  reviewRedemption,
  editReward,
} from "../../../lib/points/actions";
import { ProgramLogo } from "../../../lib/points/program-logo";
import { PrintQr } from "../../../lib/points/print-qr";
import { ProgramPreview } from "../../../lib/points/program-preview";
export const dynamic = "force-dynamic";
export default async function PointsPanel({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const actor = await requireRole("owner"),
    params = await searchParams;
  const businesses = await query(
    actor,
    "select id,name,slug from nival_pr.businesses order by name",
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
    "select r.id,r.name,r.points_cost,r.position,r.active from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 order by r.position",
    [b.id],
  );
  const redemptions = await query(
    actor,
    "select d.id,d.status,d.photo_path,r.name reward,c.name customer,l.created_at,l.points from nival_pr.redemptions d join nival_pr.point_ledger l on l.id=d.ledger_id join nival_pr.customers c on c.id=l.customer_id join nival_pr.rewards r on r.id=d.reward_id where l.business_id=$1 order by l.created_at desc limit 100",
    [b.id],
  );
  return (
    <main className="dashboard">
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
      <section className="reviewBox">
        <h2>Una tarjeta con tu identidad</h2>
        <ActionForm action={saveProgram} label="Guardar programa">
          <Hidden name="businessId" value={b.id} />
          <Field
            name="name"
            label="Nombre del programa"
            value={program?.name || "Mis recompensas"}
          />
          <Field
            name="color"
            label="Color de tu tarjeta"
            type="color"
            value={program?.color || "#164d3b"}
          />
          <ProgramLogo initial={program?.logo_url || ""} />
          <label>
            Modo de premio
            <select name="mode" defaultValue={program?.mode || "single"}>
              <option value="single">Un premio para todos</option>
              <option value="choose">
                El cliente elige y bloquea su premio
              </option>
              <option value="sequence">Secuencia que se repite</option>
            </select>
          </label>
          <Field
            name="points"
            label="Puntos por visita"
            type="number"
            min={1}
            max={1000}
            value={program?.points_per_visit || 1}
          />
          <Field
            name="hours"
            label="Horas mínimas entre visitas"
            type="number"
            min={0}
            max={720}
            value={program?.rules?.min_hours_between_visits ?? 6}
          />
          <Field
            name="max"
            label="Máximo de visitas por día"
            type="number"
            min={1}
            max={100}
            value={program?.rules?.max_visits_per_day ?? 1}
          />
        </ActionForm>
        <h3>Tus premios, en orden</h3>
        {rewards.map((r) => (
          <article key={r.id} className="customerRow">
            <h3>
              {r.position + 1}. {r.name} {r.active ? "" : "· Desactivado"}
            </h3>
            <ActionForm action={editReward} label="Actualizar premio">
              <Hidden name="businessId" value={b.id} />
              <Hidden name="rewardId" value={r.id} />
              <Field name="name" label="Nombre del premio" value={r.name} />
              <Field
                name="cost"
                label="Puntos necesarios"
                type="number"
                min={1}
                max={100000}
                value={r.points_cost}
              />
              <Field
                name="position"
                label="Orden"
                type="number"
                min={0}
                value={r.position}
              />
              <label className="consentLabel">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={r.active}
                />
                <span>Premio activo</span>
              </label>
            </ActionForm>
          </article>
        ))}
        <ActionForm action={addReward} label="Agregar premio">
          <Hidden name="businessId" value={b.id} />
          <Field name="name" label="Nombre del premio" />
          <Field name="cost" label="Puntos necesarios" type="number" min={1} />
          <Field
            name="position"
            label="Orden (empieza en 0)"
            type="number"
            min={0}
            value={
              rewards.length
                ? Math.max(...rewards.map((r) => r.position)) + 1
                : 0
            }
          />
        </ActionForm>
      </section>
      <ProgramPreview business={b.name} program={program} reward={rewards.find((r) => r.active)} />
      <section className="reviewBox">
        <h2>Tu equipo</h2>
        <p>
          Cada mesero recibe su identificador y un PIN individual de 6 a 8
          dígitos. El PIN se guarda mediante hash con una función de derivación.
        </p>
        <ActionForm action={manageStaff} label="Crear mesero">
          <Hidden name="businessId" value={b.id} />
          <Field name="name" label="Nombre del mesero" />
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
            <p>
              Identificador: <code>{s.id}</code>
            </p>
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
      </section>
      <section className="reviewBox">
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
      </section>
      <section className="reviewBox">
        <h2>QR para tu mostrador</h2>
        <PrintQr name={b.name} slug={b.slug} logo={program?.logo_url} />
      </section>
    </main>
  );
}
