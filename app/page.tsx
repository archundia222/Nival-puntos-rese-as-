import type { ReactNode } from "react";
import LandingIcon from "./landing-icon";
import LandingMotion from "./landing-motion";
import LandingMobileNav from "./landing-mobile-nav";
import "./landing-reference.css";

const quoteUrl = (plan?: string) =>
  "https://wa.me/525539044988?text=" +
  encodeURIComponent(
    `Hola, quiero cotizar ${plan ? `Nival ${plan}` : "Nival Puntos + Reseñas"} para mi negocio.`,
  );
const whatsapp = quoteUrl();

const plans = [
  {
    name: "Puntos",
    price: "$299",
    featured: false,
    items: [
      "Programa de puntos configurable",
      "Tarjeta digital para tus clientes",
      "Registro de visitas y canjes",
      "Hasta 10 sucursales",
      "10 tarjetas NFC + QR para reseñas",
      "Resumen mensual en PDF",
    ],
  },
  {
    name: "Esencial",
    price: "$399",
    featured: true,
    items: [
      "Todo lo del plan Puntos",
      "Hasta 30 respuestas a reseñas cada 30 días",
      "10 tarjetas NFC + QR para reseñas",
    ],
  },
  {
    name: "Plus",
    price: "$549",
    featured: false,
    items: [
      "Todo lo del plan Esencial",
      "Hasta 100 respuestas a reseñas cada 30 días",
      "Comparación de reseñas en tu zona",
      "10 tarjetas NFC + QR para reseñas",
    ],
  },
];

function NivalMark() {
  return (
    <a className="nvBrand" href="#inicio" aria-label="Nival, inicio">
      <span className="nvBrandMark" aria-hidden="true">
        N
      </span>
      <span>NIVAL</span>
    </a>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="nvEyebrow">{children}</span>;
}

function ImagePlaceholder({
  number,
  description,
  className = "",
}: {
  number: number;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`nvImagePlaceholder ${className}`}
      role="img"
      aria-label={`Espacio reservado para imagen ${number}: ${description}`}
    >
      <span className="nvImageNumber">IMAGEN {number}</span>
      <span className="nvImageDescription">{description}</span>
      <span className="nvImageNote">Ilustrativa · pendiente de recibir</span>
    </div>
  );
}

function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={`nvArrowLink ${className}`} href={href}>
      {children}
      <LandingIcon name="arrow" />
    </a>
  );
}

export default function Home() {
  return (
    <main className="nivalLanding" id="inicio">
      <LandingMotion />
      <header className="nvNav">
        <div className="nvNavInner">
          <NivalMark />
          <nav className="nvDesktopNav" aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#resenas">Reseñas</a>
            <a href="#planes">Planes</a>
            <a href="#preguntas">Preguntas</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <div className="nvNavActions">
            <a className="nvLogin" href="/acceso">
              Entrar
            </a>
            <a
              className="nvNavCta"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Cotizar por WhatsApp <LandingIcon name="arrow" />
            </a>
          </div>
          <LandingMobileNav />
        </div>
      </header>

      <section className="nvHero" aria-labelledby="hero-title">
        <div className="nvContainer nvHeroGrid">
          <div className="nvHeroCopy">
            <Eyebrow>PUNTOS Y RESEÑAS PARA TU NEGOCIO</Eyebrow>
            <h1 id="hero-title">
              Que vuelvan.
              <br />
              <em>Que te elijan.</em>
            </h1>
            <p className="nvHeroLead">
              Una tarjeta de puntos para que cada visita cuente y herramientas
              para cuidar lo que tus clientes dicen de ti.
            </p>
            <div className="nvHeroActions">
              <a
                className="nvButton nvButtonPrimary"
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                Cotizar por WhatsApp <LandingIcon name="arrow" />
              </a>
              <a className="nvButton nvButtonOutline" href="/demo">
                Ver demo
              </a>
            </div>
            <small className="nvHeroFootnote">Sin app para tus clientes.</small>
          </div>
          <div className="nvHeroVisual">
            <ImagePlaceholder
              number={1}
              description="Mano con celular acercándose a soporte NFC en un mostrador (4:5)"
              className="nvHeroImage"
            />
            <div
              className="nvPhoneCard"
              aria-label="Ejemplo de tarjeta digital de puntos"
            >
              <span>CAFÉ DE EJEMPLO</span>
              <b>
                Tu próxima visita
                <br />
                tiene premio.
              </b>
              <div className="nvStampRow" aria-hidden="true">
                <i>✓</i>
                <i>✓</i>
                <i>✓</i>
                <i>·</i>
                <i>·</i>
                <i>·</i>
              </div>
              <small>3 de 6 visitas · ejemplo</small>
            </div>
            <div className="nvFloat nvFloatPoints">
              <b>+1 punto</b>
              <small>Visita registrada</small>
            </div>
            <div className="nvFloat nvFloatReview">
              <b>Nueva reseña</b>
              <small>Opinión de ejemplo</small>
            </div>
          </div>
        </div>
      </section>

      <section
        className="nvIndustriesSection"
        id="giros"
        aria-labelledby="industries-title"
      >
        <div className="nvContainer">
          <div className="nvSectionHeading nvSectionHeadingCompact">
            <div>
              <Eyebrow>UNA IDEA PARA CADA MOSTRADOR</Eyebrow>
              <h2 id="industries-title">
                Hecha para el ritmo
                <br />
                de tu negocio.
              </h2>
            </div>
            <span className="nvExampleTag">Ejemplos de diseño</span>
          </div>
          <div className="nvIndustryTrack">
            <article className="nvIndustryTile nvIndustryCafe">
              <ImagePlaceholder
                number={2}
                description="Interior de cafetería con luz de mañana (16:9)"
              />
              <div className="nvIndustryCaption">
                <span>Cafetería</span>
                <b>
                  6 visitas <i>→</i> café de cortesía
                </b>
                <div className="nvProgress">
                  <i style={{ width: "62%" }} />
                </div>
              </div>
            </article>
            <article className="nvIndustryTile nvIndustryTaco">
              <ImagePlaceholder number={3} description="Taquería" />
              <div className="nvIndustryCaption">
                <span>Taquería</span>
                <b>Tu pedido frecuente</b>
                <div className="nvBigPoint">
                  +1 <small>por visita</small>
                </div>
              </div>
            </article>
            <article className="nvIndustryTile nvIndustryBakery">
              <ImagePlaceholder number={4} description="Pan dulce" />
              <div className="nvIndustryCaption">
                <span>Panadería</span>
                <b>Un antojo con premio</b>
                <div className="nvStampRow">
                  <i>✓</i>
                  <i>✓</i>
                  <i>·</i>
                  <i>·</i>
                  <i>·</i>
                </div>
              </div>
            </article>
            <article className="nvIndustryTile nvIndustryRestaurant">
              <ImagePlaceholder number={5} description="Mesa de restaurante" />
              <div className="nvIndustryCaption">
                <span>Restaurante</span>
                <b>Vuelve por tu favorito</b>
                <div className="nvProgress">
                  <i style={{ width: "42%" }} />
                </div>
              </div>
            </article>
            <article
              className="nvIndustryTile nvIndustryCafe"
              aria-hidden="true"
            >
              <ImagePlaceholder
                number={2}
                description="Interior de cafetería con luz de mañana (16:9)"
              />
              <div className="nvIndustryCaption">
                <span>Cafetería</span>
                <b>
                  6 visitas <i>→</i> café de cortesía
                </b>
                <div className="nvProgress">
                  <i style={{ width: "62%" }} />
                </div>
              </div>
            </article>
            <article
              className="nvIndustryTile nvIndustryTaco"
              aria-hidden="true"
            >
              <ImagePlaceholder number={3} description="Taquería" />
              <div className="nvIndustryCaption">
                <span>Taquería</span>
                <b>Tu pedido frecuente</b>
                <div className="nvBigPoint">
                  +1 <small>por visita</small>
                </div>
              </div>
            </article>
            <article
              className="nvIndustryTile nvIndustryBakery"
              aria-hidden="true"
            >
              <ImagePlaceholder number={4} description="Pan dulce" />
              <div className="nvIndustryCaption">
                <span>Panadería</span>
                <b>Un antojo con premio</b>
                <div className="nvStampRow">
                  <i>✓</i>
                  <i>✓</i>
                  <i>·</i>
                  <i>·</i>
                  <i>·</i>
                </div>
              </div>
            </article>
            <article
              className="nvIndustryTile nvIndustryRestaurant"
              aria-hidden="true"
            >
              <ImagePlaceholder number={5} description="Mesa de restaurante" />
              <div className="nvIndustryCaption">
                <span>Restaurante</span>
                <b>Vuelve por tu favorito</b>
                <div className="nvProgress">
                  <i style={{ width: "42%" }} />
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        className="nvHowSection"
        id="como-funciona"
        aria-labelledby="how-title"
      >
        <div className="nvContainer">
          <div className="nvSectionHeading">
            <div>
              <Eyebrow>ASÍ PASA EN EL MOSTRADOR</Eyebrow>
              <h2 id="how-title">
                Escanean.
                <br />
                <em>Suman. Canjean.</em>
              </h2>
            </div>
            <p>Un recorrido corto para tu equipo y tus clientes.</p>
          </div>
          <div className="nvHowLayout">
            <div className="nvHowSticky">
              <p>
                La tarjeta vive en el celular. Tu equipo registra la visita y
                entrega el premio cuando se completa la meta.
              </p>
              <div className="nvWhyNote">
                <span>¿Por qué puntos?</span>
                <b>
                  Porque volver se siente mejor cuando hay algo que esperar.
                </b>
              </div>
              <div className="nvWhyNote nvWhyNoteLight">
                <span>¿Y las reseñas?</span>
                <b>Invita a opinar con libertad y responde con atención.</b>
              </div>
            </div>
            <div className="nvHowSteps">
              <article className="nvHowStep">
                <div>
                  <span className="nvStepNumber">01</span>
                  <h3>Escanean el QR.</h3>
                  <p>
                    Tu cliente abre su tarjeta desde el teléfono, sin descargar
                    una app.
                  </p>
                </div>
                <div className="nvStepMock">
                  <ImagePlaceholder
                    number={6}
                    description="Celular acercándose al soporte NFC"
                  />
                  <div className="nvMiniPhone">
                    Tu tarjeta
                    <br />
                    <b>3 de 6 visitas</b>
                  </div>
                </div>
              </article>
              <article className="nvHowStep">
                <div>
                  <span className="nvStepNumber">02</span>
                  <h3>Tu equipo suma.</h3>
                  <p>
                    En el mostrador, un empleado confirma la visita y agrega el
                    punto.
                  </p>
                </div>
                <div className="nvStepMock">
                  <ImagePlaceholder
                    number={7}
                    description="Manos de empleado registrando una visita"
                  />
                  <div className="nvMiniPhone nvMiniAction">
                    Visita registrada
                    <br />
                    <b>+1 punto</b>
                  </div>
                </div>
              </article>
              <article className="nvHowStep">
                <div>
                  <span className="nvStepNumber">03</span>
                  <h3>Canjean su premio.</h3>
                  <p>
                    Al llegar a la meta, el equipo registra el canje y la visita
                    sigue su curso.
                  </p>
                </div>
                <div className="nvStepMock">
                  <ImagePlaceholder
                    number={8}
                    description="Mano entregando café con concha y ticket"
                  />
                  <div className="nvMiniPhone">
                    ¡Meta lista!
                    <br />
                    <b>Premio canjeado</b>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="nvReturnSection" aria-labelledby="return-title">
        <div className="nvPatternMark" aria-hidden="true" />
        <div className="nvContainer nvReturnGrid">
          <div className="nvReturnCopy">
            <Eyebrow>UN MOTIVO PARA VOLVER</Eyebrow>
            <h2 id="return-title">
              La próxima visita
              <br />
              ya tiene <em>motivo.</em>
            </h2>
            <p>
              Cada punto acerca a tus clientes a la recompensa que tú eliges.
            </p>
            <div className="nvLoopPoint" aria-hidden="true">
              +1 punto
            </div>
            <div className="nvReturnProgress">
              <span>4 de 6 visitas</span>
              <i>
                <b />
              </i>
            </div>
          </div>
          <div className="nvReturnVisual">
            <ImagePlaceholder
              number={2}
              description="Interior de cafetería con luz de mañana (recorte para sección verde)"
            />
            <ImagePlaceholder
              number={11}
              description="Patrón verde repetible para fondos y cierre"
              className="nvPatternPlaceholder"
            />
            <div className="nvRewardCard">
              <small>TARJETA DE EJEMPLO</small>
              <b>
                Un café
                <br />
                por tu cuenta.
              </b>
              <div className="nvStampRow">
                <i>✓</i>
                <i>✓</i>
                <i>✓</i>
                <i>✓</i>
                <i>·</i>
                <i>·</i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="nvReviewsSection"
        id="resenas"
        aria-labelledby="reviews-title"
      >
        <div className="nvContainer nvReviewsGrid">
          <div className="nvReviewVisual">
            <ImagePlaceholder
              number={9}
              description="Mesa con taza, concha y celular"
            />
            <div className="nvReviewCard">
              <div>
                <b>Reseñas recientes</b>
                <small>Ejemplos</small>
              </div>
              <article>
                <span>★★★★★</span>
                <p>“Buen café y atención muy amable.”</p>
                <small>Ejemplo · Ana</small>
                <i>Respondida</i>
                <blockquote>
                  “Gracias por visitarnos, Ana. Nos da gusto que disfrutaras tu
                  café.”
                </blockquote>
              </article>
              <article>
                <span>★★★★★</span>
                <p>“El pan está recién hecho.”</p>
                <small>Ejemplo · Luis</small>
                <i className="is-pending">Pendiente</i>
              </article>
              <article>
                <span>★★★★☆</span>
                <p>“Regresaría por el desayuno.”</p>
                <small>Ejemplo · Mar</small>
                <i className="is-pending">Pendiente</i>
              </article>
            </div>
          </div>
          <div className="nvReviewsCopy">
            <Eyebrow>RESEÑAS, CON ATENCIÓN</Eyebrow>
            <h2 id="reviews-title">
              Una opinión merece
              <br />
              <em>una respuesta.</em>
            </h2>
            <p>
              Invita a tus clientes a contar su experiencia con libertad. Yo
              reviso y respondo las reseñas incluidas en tu plan.
            </p>
            <div className="nvReviewPromise">
              <b>Plazo de respuesta por confirmar.</b>
              <span>Lo definimos antes de activar el servicio.</span>
            </div>
            <ArrowLink href="#planes">Ver planes</ArrowLink>
          </div>
        </div>
      </section>

      <section
        className="nvOwnerSection"
        id="panel"
        aria-labelledby="owner-title"
      >
        <div className="nvContainer nvOwnerGrid">
          <div className="nvOwnerCopy">
            <Eyebrow>TU PANEL, A TU ALCANCE</Eyebrow>
            <h2 id="owner-title">
              Entiende quién
              <br />
              <em>ya volvió.</em>
            </h2>
            <p>
              Consulta tus clientes, visitas y canjes desde un solo lugar. La
              información de esta vista es de ejemplo.
            </p>
            <div className="nvSegmentList">
              <div>
                <i className="nvDot nvDotNew" />
                <span>
                  <b>Nuevos</b>
                  <small>Primera visita · ejemplo</small>
                </span>
              </div>
              <div>
                <i className="nvDot nvDotRegular" />
                <span>
                  <b>Frecuentes</b>
                  <small>Visitas que se repiten · ejemplo</small>
                </span>
              </div>
              <div>
                <i className="nvDot nvDotRisk" />
                <span>
                  <b>En riesgo</b>
                  <small>Sin volver en X días · umbral por confirmar</small>
                </span>
              </div>
              <div>
                <i className="nvDot nvDotQuiet" />
                <span>
                  <b>Sin visita reciente</b>
                  <small>30 días sin visita · ejemplo</small>
                </span>
              </div>
            </div>
            <div className="nvOwnerAdvice">
              <span>CONSEJO · EJEMPLO</span>
              <b>
                Reconoce a quienes ya volvieron con una recompensa que sí
                usarían.
              </b>
            </div>
            <div className="nvPdfNote">
              <LandingIcon name="card" />
              <span>
                <b>Resumen mensual en PDF</b>
                <small>Se genera cada 30 días.</small>
              </span>
            </div>
          </div>
          <div className="nvOwnerVisual">
            <ImagePlaceholder
              number={10}
              description="Dueño de espaldas con laptop"
            />
            <div className="nvDashboardMock">
              <div className="nvDashboardHead">
                <b>Mi negocio</b>
                <small>DATOS DE EJEMPLO</small>
              </div>
              <div className="nvMetrics">
                <article>
                  <small>Clientes</small>
                  <b>—</b>
                </article>
                <article>
                  <small>Visitas</small>
                  <b>—</b>
                </article>
                <article>
                  <small>Canjes</small>
                  <b>—</b>
                </article>
              </div>
              <div className="nvDashboardRows">
                <span>
                  Nuevos <b>Ejemplo</b>
                </span>
                <span>
                  Frecuentes <b>Ejemplo</b>
                </span>
                <span>
                  En riesgo <b>Por definir</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="nvPlansSection"
        id="planes"
        aria-labelledby="plans-title"
      >
        <div className="nvContainer">
          <div className="nvPlansIntro">
            <Eyebrow>PRECIOS MENSUALES</Eyebrow>
            <h2 id="plans-title">
              Elige cómo
              <br />
              <em>quieres empezar.</em>
            </h2>
            <p>Los tres planes incluyen 10 tarjetas NFC + QR para reseñas.</p>
          </div>
          <div className="nvPlanGrid">
            {plans.map((plan) => (
              <article
                className={`nvPlanCard${plan.featured ? " is-featured" : ""}`}
                key={plan.name}
              >
                {plan.featured && (
                  <span className="nvPlanFlag">RECOMENDADO</span>
                )}
                <span className="nvPlanName">
                  NIVAL {plan.name.toUpperCase()}
                </span>
                <h3 className="nvPlanPrice">
                  {plan.price}
                  <small>
                    {" "}
                    MXN <i>/ mes</i>
                  </small>
                </h3>
                <p>Programa de puntos para tu negocio.</p>
                <ul>
                  {plan.items.map((item) => (
                    <li key={item}>
                      <LandingIcon name="check" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={quoteUrl(plan.name)}
                  target="_blank"
                  rel="noreferrer"
                  className={`nvButton ${plan.featured ? "nvButtonPrimary" : "nvButtonOutline"}`}
                >
                  Cotizar {plan.name}
                  <LandingIcon name="arrow" />
                </a>
              </article>
            ))}
          </div>
          <p className="nvPlanCycle">
            Cobro mensual. Respuestas a reseñas incluidas por periodo de 30 días
            según el plan.
          </p>
        </div>
      </section>

      <section
        className="nvFaqSection"
        id="preguntas"
        aria-labelledby="faq-title"
      >
        <div className="nvContainer nvFaqGrid">
          <div className="nvFaqIntro">
            <Eyebrow>ANTES DE EMPEZAR</Eyebrow>
            <h2 id="faq-title">
              Dudas comunes,
              <br />
              <em>respuestas claras.</em>
            </h2>
            <p>Si no encuentras lo que buscas, escríbeme.</p>
            <a
              className="nvTextLink"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Pregúntame por WhatsApp <LandingIcon name="arrow" />
            </a>
          </div>
          <div className="nvFaqList">
            <details>
              <summary>¿Mis clientes necesitan una app?</summary>
              <p>
                No. Abren su tarjeta digital desde el navegador de su celular.
              </p>
            </details>
            <details>
              <summary>¿Abrir la tarjeta suma un punto?</summary>
              <p>No. El punto lo registra tu equipo al confirmar la visita.</p>
            </details>
            <details>
              <summary>¿Puedo elegir la recompensa?</summary>
              <p>Sí. Configuras la meta y el premio de tu programa.</p>
            </details>
            <details>
              <summary>¿Qué incluyen las tarjetas NFC + QR?</summary>
              <p>
                Los tres planes incluyen 10 tarjetas NFC + QR que dirigen a tu
                ficha de reseñas.
              </p>
            </details>
            <details>
              <summary>¿Cuándo responden mis reseñas?</summary>
              <p>
                El plazo está por confirmar y se definirá antes de activar el
                servicio.
              </p>
            </details>
            <details>
              <summary>¿Cómo puedo elegir un plan?</summary>
              <p>Escríbeme y revisamos qué plan encaja con tu negocio.</p>
            </details>
          </div>
        </div>
        <div className="nvClosing">
          <div className="nvClosingPattern" aria-hidden="true" />
          <div className="nvContainer nvClosingInner">
            <div>
              <Eyebrow>PARA TU PRÓXIMA VISITA</Eyebrow>
              <h2>
                Que tengan ganas
                <br />
                de <em>regresar.</em>
              </h2>
            </div>
            <a
              className="nvButton nvButtonLime"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Cotizar por WhatsApp <LandingIcon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      <footer className="nvFooter" id="contacto">
        <div className="nvContainer">
          <div className="nvFooterTop">
            <div className="nvFooterBrand">
              <NivalMark />
              <span>Puntos y reseñas para negocios locales.</span>
            </div>
            <nav aria-label="Enlaces del pie">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#resenas">Reseñas</a>
              <a href="#planes">Planes</a>
              <a href="#preguntas">Preguntas</a>
              <a href="#contacto">Contacto</a>
            </nav>
            <div className="nvFooterContact">
              <b>Hablemos de tu negocio</b>
              <a href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp <LandingIcon name="arrow" />
              </a>
              <small>Correo de contacto por confirmar.</small>
            </div>
          </div>
          <div className="nvFooterBottom">
            <small>© 2026 Nival Tech · México</small>
            <nav aria-label="Información legal">
              <a href="/privacidad">Privacidad · pendiente de revisión legal</a>
              <a href="/terminos">Términos · pendiente de revisión legal</a>
            </nav>
            <small>
              Imágenes ilustrativas. Espacios de imagen por completar.
            </small>
          </div>
        </div>
      </footer>
    </main>
  );
}
