import DemoNotice from './components/demo-notice';

const wa = "https://wa.me/525539044788?text=Hola%2C%20quiero%20informaci%C3%B3n%20de%20Nival%20Puntos%20%2B%20Rese%C3%B1as";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h11M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="landing">
      <DemoNotice />

      <nav className="landingNav">
        <b className="landingWordmark"><span aria-hidden="true">N</span>NIVAL</b>
        <span className="landingProduct">Puntos + Reseñas</span>
        <a className="primary landingButton landingButton--nav" href="/acceso">
          Acceso a mi negocio <ArrowIcon />
        </a>
      </nav>

      <section className="hero landingHero">
        <div className="landingHeroCopy">
          <div className="pill landingEyebrow"><span aria-hidden="true" />Programa de lealtad + reputación</div>
          <h1>Haz que tus clientes <em>regresen</em> y además te <em>recomienden.</em></h1>
          <p>Nival Puntos + Reseñas ayuda a negocios locales a premiar visitas frecuentes y conseguir más reseñas de Google con un proceso simple.</p>
          <a className="primary landingButton landingButton--hero" href={wa}>
            Quiero una demostración <ArrowIcon />
          </a>
          <div className="landingHeroMeta" aria-hidden="true">
            <span><b>02</b> objetivos</span>
            <i />
            <span><b>01</b> sistema</span>
          </div>
        </div>

        <div className="landingHeroVisual" aria-hidden="true">
          <div className="landingOrb landingOrb--one" />
          <div className="landingOrb landingOrb--two" />
          <div className="landingVisualLabel">Puntos + Reseñas</div>
          <div className="landingPhone">
            <div className="landingPhoneTop"><span /><i /></div>
            <div className="landingPhoneBrand"><span>N</span><b>NIVAL</b><i>•••</i></div>
            <div className="landingLoyaltyCard">
              <div className="landingLoyaltyCardTop"><span>Tarjeta de puntos</span><b>N</b></div>
              <strong>Tu próxima visita cuenta.</strong>
              <div className="landingStamps">
                <span className="isFilled">✓</span><span className="isFilled">✓</span><span className="isFilled">✓</span><span className="isFilled">✓</span>
                <span /><span /><span /><span />
              </div>
              <div className="landingProgress"><i /></div>
              <div className="landingReward"><span>Premio</span><b>••••••••</b></div>
            </div>
            <div className="landingPhoneBottom"><i /><i /><i /></div>
          </div>
          <div className="landingReviewCard">
            <span className="landingReviewIcon">G</span>
            <div><b>Reseñas de Google</b><span className="landingStars">★★★★★</span></div>
            <span className="landingReviewArrow">↗</span>
          </div>
          <div className="landingFloatCard"><span>Visitas</span><b>••••</b><i><span /></i></div>
        </div>
      </section>

      <div className="landingProof" aria-hidden="true">
        <span><b>01</b> PUNTOS</span><i />
        <span><b>02</b> RESEÑAS</span><i />
        <span><b>03</b> CLIENTES QUE VUELVEN</span>
      </div>

      <section className="landingGoals">
        <div className="landingSectionHeading">
          <div className="landingSectionEyebrow">NIVAL · PUNTOS + RESEÑAS</div>
          <h2>Dos objetivos. <span>Un solo sistema.</span></h2>
        </div>
        <div className="grid landingGoalGrid">
          <article className="landingGoalCard landingGoalCard--points">
            <div className="landingMiniCard landingMiniCard--points" aria-hidden="true">
              <div className="landingMiniCardTop"><span>N</span><i>•••</i></div>
              <div className="landingMiniStamps"><i /><i /><i /><i /><i /><i /></div>
              <div className="landingMiniLine" />
            </div>
            <strong>01 · PUNTOS</strong>
            <h3>Premia a quien vuelve</h3>
            <p>Registra manualmente las visitas o compras del cliente y suma puntos. Define premios claros para incentivar la siguiente visita.</p>
            <span className="landingCardArrow" aria-hidden="true"><ArrowIcon /></span>
          </article>
          <article className="landingGoalCard landingGoalCard--reviews">
            <div className="landingMiniCard landingMiniCard--reviews" aria-hidden="true">
              <div className="landingReviewPreview"><span>G</span><b>★★★★★</b></div>
              <div className="landingReviewLines"><i /><i /><i /></div>
              <div className="landingReviewBadge">N</div>
            </div>
            <strong>02 · RESEÑAS</strong>
            <h3>Convierte una buena experiencia en una reseña</h3>
            <p>Facilita el acceso a la ficha de Google del negocio para que el cliente pueda dejar su opinión sin buscarla manualmente.</p>
            <span className="landingCardArrow" aria-hidden="true"><ArrowIcon /></span>
          </article>
        </div>
      </section>

      <section className="steps landingSteps">
        <div className="landingSectionHeading">
          <div className="landingSectionEyebrow">SENCILLO EN EL MOSTRADOR</div>
          <h2>Así funciona <span>la primera versión</span></h2>
        </div>
        <div className="grid three landingStepGrid">
          <article className="landingStepCard">
            <div className="landingStepTop"><b>1</b><span className="landingStepVisual landingStepVisual--account" aria-hidden="true"><i /><i /><i /></span></div>
            <h3>Crea tu cuenta</h3>
            <p>En la prueba, el dueño configura su negocio y configura su programa de puntos directamente desde la web.</p>
          </article>
          <article className="landingStepCard">
            <div className="landingStepTop"><b>2</b><span className="landingStepVisual landingStepVisual--counter" aria-hidden="true"><i /><i /><i /><i /></span></div>
            <h3>Uso en mostrador</h3>
            <p>El negocio registra al cliente y sus puntos desde un panel sencillo.</p>
          </article>
          <article className="landingStepCard">
            <div className="landingStepTop"><b>3</b><span className="landingStepVisual landingStepVisual--follow" aria-hidden="true"><i /><i /><i /></span></div>
            <h3>Seguimiento Nival</h3>
            <p>Nival revisa manualmente la ficha de Google y carga los resultados para generar el resumen mensual del negocio.</p>
          </article>
        </div>
      </section>

      <section className="cta landingCta">
        <div className="landingCtaCard">
          <div className="landingCtaSpark" aria-hidden="true">N</div>
          <div className="landingSectionEyebrow">NIVAL · PUNTOS + RESEÑAS</div>
          <h2>Empieza simple. <span>Automatiza cuando tenga sentido.</span></h2>
          <p>La primera versión está diseñada para validar el servicio con negocios reales sin depender de integraciones externas.</p>
          <a className="primary landingButton landingButton--cta" href={wa}>
            Hablar por WhatsApp <ArrowIcon />
          </a>
        </div>
      </section>

      <footer className="landingFooter"><b>NIVAL</b><span>Nival Tech · Puntos + Reseñas</span></footer>
    </main>
  );
}
