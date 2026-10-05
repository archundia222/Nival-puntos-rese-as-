import { foundationEnabled, query } from "../../lib/foundation/db";
import { requireRole, requireBusiness } from "../../lib/foundation/session";
import {
  registerBusiness,
  addCustomer,
  saveProgram,
  addReward,
  customerLink,
  logout,
} from "../../lib/foundation/actions";
import { redeemActivationCode } from "../../lib/admin/actions";
import { ActionForm } from "../../lib/foundation/forms";
import { Field, Hidden } from "../../lib/foundation/fields";
import { MovementWorkspace } from "../../lib/foundation/workspace";
import Legacy from "./legacy-page";
export const dynamic = "force-dynamic";

function quoteLink(b: any) {
  const message = `Hola, quiero cotizar o activar Nival Tech.
Negocio: ${b.name}
Giro: ${b.giro || "—"}
Dueño: ${b.owner_name || "—"}
Teléfono: ${b.phone || "—"}
Correo: ${b.email || "—"}
ID: ${b.id}
Plan: ${b.plan_name || "Sin plan"}`;
  return "https://wa.me/525539044788?text=" + encodeURIComponent(message);
}

export default async function Panel({
  searchParams,
}: {
  searchParams: Promise<{ business?: string; phone?: string }>;
}) {
  if (!foundationEnabled()) return <Legacy />;
  const actor = await requireRole("owner");
  const params = await searchParams;
  const businesses = await query(
    actor,
    `select b.id,b.name,b.slug,b.status,b.paid_until,b.trial_ends_at,b.giro,b.owner_name,b.phone,b.email,p.name plan_name
  from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name`,
  );
  const business =
    businesses.find((b) => b.id === params.business) || businesses[0];
  if (business) await requireBusiness(actor, business.id);
  const program = business
    ? (
        await query(
          actor,
          "select id,name,mode,color,points_per_visit,rules from nival_pr.programs where business_id=$1",
          [business.id],
        )
      )[0]
    : null;
  const phone = (params.phone || "").replace(/\D/g, "");
  const customers = business
    ? await query(
        actor,
        "select id,name,phone from nival_pr.customers where business_id=$1 and ($2='' or phone=$2) order by created_at desc limit 50",
        [business.id, phone],
      )
    : [];
  const reports = business
    ? await query(
        actor,
        "select period,rating,total_reviews,new_reviews,answered,notes from nival_pr.review_reports where business_id=$1 order by period desc limit 12",
        [business.id],
      )
    : [];
  const now = Date.now(),
    paid = business?.paid_until ? new Date(business.paid_until).getTime() : 0,
    trial = business?.trial_ends_at
      ? new Date(business.trial_ends_at).getTime()
      : 0;
  const writable =
    !!business && business.status === "activo" && (paid > now || trial > now);
  const grace =
    !!business &&
    paid > 0 &&
    paid <= now &&
    now - paid <= 7 * 86400000 &&
    business.status !== "pausado" &&
    business.status !== "cancelado";
  return (
    <main className="dashboard">
      <header className="dashHead">
        <div>
          <small>NIVAL · MI NEGOCIO</small>
          <h1>Hola, {actor.name}</h1>
        </div>
        <form action={logout}>
          <button>Cerrar sesión</button>
        </form>
      </header>
      {businesses.length > 0 && (
        <section className="reviewBox">
          <h2>Tus negocios</h2>
          <div className="actions">
            {businesses.map((b) => (
              <a href={"/panel?business=" + b.id} key={b.id}>
                {b.name}
              </a>
            ))}
          </div>
        </section>
      )}
      {business && (
        <>
          <section className="reviewBox">
            <h2>{business.name}</h2>
            <p>
              <a
                className="primary"
                href={"/panel/puntos?business=" + business.id}
              >
                Configurar tarjeta, meseros y canjes
              </a>
            </p>
            <p>
              <span className={"statusChip status-" + business.status}>
                {business.status}
              </span>{" "}
              · {business.plan_name || "Sin plan"}
            </p>
            <a href={"/b/" + business.slug}>
              Abrir tarjeta pública · /b/{business.slug}
            </a>
            <p>
              Vigencia:{" "}
              {business.paid_until
                ? new Date(business.paid_until).toLocaleDateString("es-MX", {
                    timeZone: "America/Mexico_City",
                  })
                : "Pendiente de pago"}
            </p>
            {business.status === "registrado" && (
              <a
                className="primary"
                href={quoteLink(business)}
                target="_blank"
                rel="noreferrer"
              >
                Cotizar o activar por WhatsApp
              </a>
            )}
            {!writable && (
              <div className="accountLock">
                <h3>
                  {grace
                    ? "Periodo de gracia · solo lectura"
                    : "Servicio sin escritura"}
                </h3>
                <p>
                  {grace
                    ? "Tu información sigue disponible durante 7 días, pero no se pueden registrar visitas nuevas hasta renovar."
                    : "Tus datos no se borran. Registra un pago con Nival o usa un código válido para desbloquear el panel."}
                </p>
                <a href={quoteLink(business)} target="_blank" rel="noreferrer">
                  Hablar con Nival por WhatsApp
                </a>
                <ActionForm
                  action={redeemActivationCode}
                  label="Activar con código"
                >
                  <Hidden name="businessId" value={business.id} />
                  <Field name="code" label="Código NIV-XXXX-XXXX" />
                </ActionForm>
              </div>
            )}
          </section>
          {writable && (
            <>
              <MovementWorkspace actor={actor} businessId={business.id} />
              <section className="reviewBox">
                <h2>Registrar cliente</h2>
                <ActionForm action={addCustomer}>
                  <Hidden name="businessId" value={business.id} />
                  <Field name="name" label="Nombre" />
                  <Field name="phone" label="Teléfono" type="tel" />
                </ActionForm>
              </section>
              <section className="reviewBox">
                <h2>Tarjetas de clientes</h2>
                <form className="configGrid">
                  <Hidden name="business" value={business.id} />
                  <Field
                    name="phone"
                    label="Buscar teléfono exacto"
                    type="tel"
                    required={false}
                    value={phone}
                  />
                  <button>Buscar</button>
                </form>
                {customers.map((c) => (
                  <article key={c.id} className="customerRow">
                    <strong>{c.name}</strong>
                    <p>{c.phone}</p>
                    <ActionForm
                      action={customerLink}
                      label="Crear nuevo acceso"
                    >
                      <Hidden name="businessId" value={business.id} />
                      <Hidden name="customerId" value={c.id} />
                      <Hidden name="operation" value="rotate" />
                    </ActionForm>
                    <ActionForm
                      action={customerLink}
                      label="Desactivar tarjeta"
                    >
                      <Hidden name="businessId" value={business.id} />
                      <Hidden name="customerId" value={c.id} />
                      <Hidden name="operation" value="disable" />
                    </ActionForm>
                  </article>
                ))}
              </section>
            </>
          )}
          <section className="reviewBox">
            <h2>Reportes de Google</h2>
            <p>
              Nival revisa y responde manualmente las reseñas. Aquí aparecen los
              reportes que ya cargó.
            </p>
            {!reports.length && <p>Tu primer reporte está pendiente.</p>}
            {reports.map((r) => (
              <article className="customerRow" key={String(r.period)}>
                <h3>{String(r.period).slice(0, 7)}</h3>
                <p>
                  {r.rating} estrellas · {r.total_reviews} reseñas totales ·{" "}
                  {r.new_reviews} nuevas · {r.answered} respuestas registradas
                </p>
                <p className="preserveLines">{r.notes}</p>
              </article>
            ))}
          </section>
        </>
      )}
      <section className="reviewBox">
        <h2>Registrar otro negocio</h2>
        <ActionForm action={registerBusiness}>
          <Field name="name" label="Nombre del negocio" />
          <Field name="slug" label="Enlace (ejemplo: cafe-demo)" />
          <Field name="giro" label="Giro" required={false} />
        </ActionForm>
      </section>
    </main>
  );
}
