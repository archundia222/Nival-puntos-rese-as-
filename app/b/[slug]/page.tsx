import {walletReady} from '../../../lib/wallet/server';
import {legalText} from "../../../lib/foundation/legal-page";
import {marketingConsent} from "../../../lib/foundation/legal.mjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  foundationEnabled,
  query,
  authScope,
} from "../../../lib/foundation/db";
import { publicBusiness, card } from "../../../lib/points/security";
import { sha256 } from "../../../lib/foundation/security.mjs";
import { CardView } from "../../../lib/points/card-view";
import { enroll, consentCard } from "../../../lib/foundation/actions";
import { ActionForm } from "../../../lib/foundation/forms";
import { Field, Hidden } from "../../../lib/foundation/fields";
import {VerifiedActionForm} from "../../../lib/security/verified-form";
export const dynamic = "force-dynamic";
export default async function Customer({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || "";
  if (!foundationEnabled())
    return (
      <main className="dashboard">
        <h1>Programa en preparación</h1>
      </main>
    );
  const b = await publicBusiness(slug);
  if (!b) notFound();
  const c = await card(b.id);
  const token = (await cookies()).get("nival_customer_" + b.id)?.value;
  const [valid] =
    token && /^[A-Za-z0-9_-]{43}$/.test(token)
      ? await query(
          authScope(),
          "select nival_pr_private.customer_token_valid($1,$2) valid",
          [b.id, sha256(token)],
        )
      : [];
  const qr = c
    ? await QRCode.toDataURL("NIVAL:" + c.id, {
        errorCorrectionLevel: "M",
        width: 320,
        margin: 4,
      })
    : "";
  return (
    <main className="loyaltyShell">
      <header className="loyaltyHeader">
        <a href={"/b/" + slug}>{b.name}</a>
        <span>Tu lealtad tiene premio</span>
      </header>
      {!b.active ? (
        <section className="reviewBox">
          <h1>Programa no disponible</h1>
          <p>Consulta al negocio. Tus puntos se conservan.</p>
        </section>
      ) : !c&&(!b.program?.id||!b.rewards?.length) ? (<section className="enrollCard"><h1>Estamos preparando tus premios</h1><p>{b.name} está terminando su programa. Pregunta al personal cuándo podrás crear tu tarjeta.</p></section>) : c ? (
        <>{!b.active&&<p role="status">El servicio está pausado. Puedes consultar tu tarjeta; tus puntos y premios se conservan. Nuevos puntos y canjes estarán disponibles al renovar.</p>}<CardView business={b} initial={c} qr={qr} walletAvailable={walletReady()} /></>
      ) : (
        <section className="enrollCard">
          <small>BIENVENIDO A {b.name.toUpperCase()}</small>
          <h1>
            {valid?.valid
              ? "Activa tu tarjeta"
              : "Tus visitas merecen algo más."}
          </h1>
          <p>
            Crea tu tarjeta gratis. Muestra tu QR al personal después de cada compra y acumula puntos para tus premios.
          </p>
          <VerifiedActionForm
            siteKey={turnstileSiteKey}
            needsVerification={!valid?.valid}
            action={valid?.valid ? consentCard : enroll}
            label={valid?.valid ? "Activar mi tarjeta" : "Crear mi tarjeta"}
          >
            <Hidden name="slug" value={slug} />
            {!valid?.valid && (
              <>
                <Field name="name" label="Tu nombre" />
                <label>
                  Teléfono de México (+52)
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="55 1234 5678"
                    required
                    maxLength={18}
                  />
                </label>
              </>
            )}
            <label className="wide consentLabel">
              <input name="consent" type="checkbox" required />
              <span>
                {await legalText('legal_customer_consent')} <a href="/terminos" target="_blank" rel="noreferrer">Términos</a> · <a href="/privacidad" target="_blank" rel="noreferrer">Aviso de Privacidad</a>
              </span>
            </label>
            <label className="wide consentLabel"><input name="marketing_consent" type="checkbox"/><span>{marketingConsent}</span></label>
          </VerifiedActionForm>
        </section>
      )}
      <footer className="loyaltyFooter">
        <p>
          Si cambias de celular, pide al mesero que te reenvíe tu tarjeta. Tus
          puntos se conservan.
        </p>
        <a href="/privacidad">Privacidad</a>
        <span>Hecho con Nival Tech</span>
      </footer>
    </main>
  );
}
