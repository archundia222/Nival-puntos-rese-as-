import {cardColor} from '../../../lib/points/card-color';

export default function DemoCustomerCard() {
  const points = 6;
  const goal = 10;

  return (
    <main className="loyaltyShell">
      <header className="loyaltyHeader">
        <a href="/demo/panel">Nival · Café Nube</a>
        <span>Vista de ejemplo</span>
      </header>

      <p className="demoNotice" role="note">
        Esta tarjeta es una muestra. No crea una cuenta ni guarda visitas o puntos.
      </p>

      <p className="cardWelcome">Así se vería la tarjeta de un cliente en su celular.</p>
      <article
        className="loyaltyCard"
        style={{'--card-color': cardColor('#174f3b')} as React.CSSProperties}
      >
        <div className="cardTop">
          <div>
            <span className="cardMonogram" aria-hidden="true">C</span>
            <small>Café Nube · EJEMPLO</small>
          </div>
          <span className="cardSerial">NIVAL PUNTOS<br />MEMBRESÍA DIGITAL</span>
        </div>
        <p className="cardProgram">CADA VISITA SUMA</p>
        <h1>Lucía Rivera</h1>
        <div className="cardNumbers">
          <strong aria-label={points + ' puntos'}>{points}</strong>
          <span>puntos<br />acumulados</span>
          <span className="cardSeal" aria-hidden="true">✦</span>
        </div>
        <div className="cardProgress" role="progressbar" aria-label="Progreso de ejemplo hacia el premio" aria-valuenow={points} aria-valuemin={0} aria-valuemax={goal}>
          <i style={{width: (points / goal * 100) + '%'}} />
        </div>
        <div className="cardGoal">
          <span>4 puntos para tu premio</span>
          <b>Café gratis</b>
        </div>
        <footer>
          <span>Un lugar al que vale la pena volver.</span>
          <small>•••• 0042</small>
        </footer>
      </article>

      <section className="personalQr" aria-labelledby="demo-card-note">
        <div>
          <small>EN TU NEGOCIO</small>
          <h2 id="demo-card-note">Cada cliente tiene su propio QR</h2>
          <p>El personal lo escanea después de una compra para sumar puntos. Este QR de ejemplo no se puede escanear para registrar visitas.</p>
        </div>
      </section>

      <a className="reviewCta" href="/demo/panel">Volver al panel de ejemplo</a>
      <footer className="loyaltyFooter">
        <span>Hecho con Nival Tech</span>
      </footer>
    </main>
  );
}
