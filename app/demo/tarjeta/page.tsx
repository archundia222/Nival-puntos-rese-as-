import QRCode from 'qrcode';
import {cardColor} from '../../../lib/points/card-color';

export default async function DemoCustomerCard() {
  const points = 6;
  const goal = 10;
  const qr = await QRCode.toDataURL('NIVAL:DEMO-NO-REGISTRABLE', {width:320,margin:2});

  return (
    <main className="loyaltyShell nivalCustomerFlow">
      <p className="demoNotice" role="note">
        Muestra de diseño. Este QR no registra visitas ni canjes.
      </p>
      <article
        className="loyaltyCard nivalConfiguredCard"
        data-theme="nival"
        style={{'--card-color': cardColor('#174f3b'),'--card-text':'#fff','--card-accent':'#d8ef78'} as React.CSSProperties}
      >
        <div className="cardTop">
          <div><span className="cardMonogram" aria-label="Café Nube">C</span></div>
          <span className="cardExpiry">Los puntos no caducan</span>
        </div>
        <p className="cardMemberName">Lucía Rivera</p>
        <div className="cardNumbers compact">
          <strong aria-label={points + ' puntos'}>{points}</strong>
          <span>de {goal} puntos</span>
        </div>
        <div className="cardProgress" role="progressbar" aria-label="Progreso de ejemplo hacia el premio" aria-valuenow={points} aria-valuemin={0} aria-valuemax={goal}>
          <i style={{width: (points / goal * 100) + '%'}} />
        </div>
        <div className="cardQrInside"><img src={qr} alt="QR ilustrativo, no registrable"/><div><small>UN SOLO CÓDIGO PARA PUNTOS Y PREMIOS</small><span>El personal escanea este QR para registrar una visita o entregar un premio.</span><b>00000000</b></div></div>
      </article>

      <section className="customerRewardSummary" aria-labelledby="demo-next-reward">
        <p className="customerSectionEyebrow">SIGUIENTE META</p>
        <h2 id="demo-next-reward">Tu próximo premio</h2>
        <div className="customerRewardGoal"><span>Te faltan 4 puntos para este premio</span><b>Café gratis</b></div>
        <div className="customerGoalProgress" role="progressbar" aria-label="Avance de ejemplo hacia tu próximo premio" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={points}><i style={{width:`${points/goal*100}%`}}/></div>
        <div className="customerGoalMeta"><strong>{points} <span>de {goal} puntos</span></strong><small>4 puntos restantes</small></div>
      </section>

      <section className="customerRewardInventory" aria-labelledby="demo-rewards-heading">
        <header className="customerInventoryHeading"><div><p className="customerSectionEyebrow">TUS PREMIOS</p><h2 id="demo-rewards-heading">Recompensas</h2></div><span>1 en total</span></header>
        <div className="rewardInventoryTabs">
          <section aria-labelledby="demo-to-redeem"><h3 id="demo-to-redeem">Por canjear <span>0</span></h3><p className="rewardInventoryEmpty">El café se desbloquea al llegar a 10 puntos.</p></section>
          <section aria-labelledby="demo-redeemed"><h3 id="demo-redeemed">Canjeados <span>1</span></h3><article className="rewardInventoryRow"><span className="rewardInventoryIcon isRedeemed" aria-hidden="true">✓</span><span><b>Galleta de la casa</b><small>Entregado · 12 oct 2026</small></span><i className="isRedeemed">Entregado</i></article></section>
        </div>
      </section>

      <a className="reviewCta" href="/demo/panel">Volver al panel de ejemplo</a>
      <footer className="loyaltyFooter"><span>Hecho con Nival Tech</span></footer>
    </main>
  );
}
