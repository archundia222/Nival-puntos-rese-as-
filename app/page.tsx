import {foundationEnabled,systemQuery} from '../lib/foundation/db';

const defaults={price:'$399 MXN/mes',whatsapp:'5539044788'};
export const revalidate=0;
export default async function Home(){
 let values:{[key:string]:string}={...defaults};
 if(foundationEnabled()){try{const rows=await systemQuery("select key,value_published from nival_pr.site_content where value_published is not null");for(const row of rows)if(row.key in values)values[row.key]=String(row.value_published?.text??values[row.key]);}catch{}}
 const phone=values.whatsapp.replace(/\D/g,'')||defaults.whatsapp;
 const wa=`https://wa.me/52${phone}?text=${encodeURIComponent('Hola, quiero conocer Nival para tu negocio para mi negocio.')}`;
 return <main className="millionSite clearSite">
  <nav className="millionNav"><a className="millionBrand" href="/"><span>N</span><b>NIVAL</b></a><div className="millionNavLinks"><a href="#conseguir">Conseguir clientes</a><a href="#fidelizar">Hacer que regresen</a><a href="/demo">Ver cómo funciona</a><a href="/acceso">Entrar</a><a className="millionNavCta" href="/registro">Empezar <i>↗</i></a></div><details className="mobileMenu"><summary aria-label="Abrir menú"><span/><span/></summary><div><a href="#conseguir">Conseguir clientes</a><a href="#fidelizar">Hacer que regresen</a><a href="/demo">Ver cómo funciona</a><a href="/acceso">Entrar a mi cuenta</a><a className="mobileStart" href="/registro">Empezar con Nival →</a></div></details></nav>

  <section className="millionHero clearHero">
   <div className="millionGlow glowOne"/><div className="millionGlow glowTwo"/>
   <div className="millionHeroCopy"><div className="millionKicker"><i/> NIVAL TECH PARA NEGOCIOS LOCALES</div><h1>Más clientes.<br/><em>Más veces.</em></h1><p className="heroExplain">Nival hace dos cosas muy simples: <b>te ayuda a conseguir clientes nuevos con una mejor presencia en Google</b> y <b>hace que los que ya te visitaron quieran regresar con puntos y premios.</b></p><div className="heroChoice"><a href="#conseguir"><span>01</span><div><small>QUIERO</small><b>Conseguir clientes</b></div><i>↓</i></a><a href="#fidelizar"><span>02</span><div><small>QUIERO</small><b>Que regresen</b></div><i>↓</i></a></div><div className="millionActions"><a className="millionPrimary" href="/registro">Empezar con Nival <span>↗</span></a><a className="millionDemo" href="/demo"><i>▶</i><span><small>MIRA CÓMO FUNCIONA</small>Ver cómo funciona</span></a></div><div className="millionProof"><span>Sin instalar nada</span><i/> <span>Toca la tarjeta o escanea el QR</span><i/> <span>Para cualquier negocio</span></div></div>
   <div className="millionStage clearStage" aria-label="Así ve Nival un cliente"><div className="stageLabel">ASÍ LO VE TU CLIENTE <i>↘</i></div><div className="stageHalo"/><div className="millionPhone"><div className="phoneChrome"><span>9:41</span><i>● ● ▰</i></div><div className="loyaltyBrand"><div>N</div><span>CAFÉ<br/><b>NIVAL</b></span></div><div className="loyaltyCenter"><small>MIS PUNTOS</small><strong>06</strong><p>Te faltan 2 visitas para ganar tu café.</p></div><div className="luxProgress"><i/><i/><i/><i/><i/><i/><i className="empty"/><i className="empty"/></div><div className="phoneReward"><span>TU PREMIO</span><b>Café gratis al llegar a 8</b></div></div><div className="luxToast"><span>✓</span><div><small>LISTO</small><b>Ganaste 1 punto</b></div></div><div className="luxMetric"><small>NEGOCIO</small><strong>+31%</strong><span>clientes que regresan</span></div></div>
  </section>

  <section className="signalBand"><span>TE ENCUENTRAN</span><i>→</i><span>TE ELIGEN</span><i>→</i><span>REGRESAN</span></section>

  <section className="realStory" id="conseguir">
  <div className="realStoryHead"><span>01 — TE ENCUENTRAN</span><h2>Tu negocio,<br/><em>bien presentado.</em></h2></div>
  <div className="realScene googleScene">
    <div className="sceneBackdrop"><div className="storeSign">CAFÉ NIVAL</div><div className="storeWindow"></div><div className="storeDoor"></div></div>
    <div className="handPhone">
      <div className="realPhone"><div className="realPhoneTop"></div><div className="phoneSearch">cafetería cerca de mí</div><div className="placePhoto">N</div><h3>Café Nival</h3><div className="placeRating">4.8 ★★★★★</div><p>Café · Abierto · A 350 m</p><button>Cómo llegar</button></div>
    </div>
    <div className="sceneCaption"><b>01</b><span>Te buscan.</span><strong>Que te elijan.</strong></div>
  </div>
</section>

<section className="realStory reputationStory" id="google-detalle">
  <div className="realStoryHead"><span>02 — CONFIAN</span><h2>Tu ficha habla<br/><em>antes que tú.</em></h2></div>
  <div className="realScene reviewScene">
    <div className="counterScene"><div className="coffeeCup"></div><div className="counterCard">N</div></div>
    <div className="floatingProfile"><small>CAFÉ NIVAL</small><h3>4.8 <span>★★★★★</span></h3><p>186 reseñas</p><hr/><div className="reviewLine"><b>★★★★★</b><span>“Excelente atención.”</span></div><div className="reviewLine"><b>★★★★★</b><span>“Volvería sin pensarlo.”</span></div></div>
    <div className="sceneCaption light"><b>02</b><span>Ven tu ficha.</span><strong>Sienten confianza.</strong></div>
  </div>
</section>

<section className="visualBridge"><span>TE VISITARON</span><i>→</i><strong>AHORA HAZ QUE VUELVAN</strong></section>\n\n  <section id="como-funciona" className="storyDemo"><div className="storyHead"><span>03 — PUNTOS</span><h2>Toca.<br/><em>Suma. Vuelve.</em></h2></div><div className="storyScenes">
   <article className="scene sceneTap"><div className="sceneCopy"><b>01</b><h3>Toca.</h3><p>Tarjeta o QR.</p></div><div className="tapVisual"><div className="nfcCard"><span>N</span><b>ACERCA<br/>TU CELULAR</b><small>NIVAL PUNTOS</small></div><div className="tapPhone"><span>◉</span><i>)))</i></div></div></article>
   <article className="scene scenePoints"><div className="sceneCopy"><b>02</b><h3>Suma.</h3><p>Sus puntos aparecen.</p></div><div className="miniCustomerCard"><header><span>CAFÉ NIVAL</span><small>MI TARJETA</small></header><strong>6</strong><p>puntos</p><div><i/><i/><i/><i/><i/><i/><i className="off"/><i className="off"/></div><b>Te faltan 2 para tu café gratis</b></div></article>
   <article className="scene sceneReward"><div className="sceneCopy"><b>03</b><h3>Vuelve.</h3><p>Su premio lo espera.</p></div><div className="rewardTicket"><small>PREMIO DESBLOQUEADO</small><div className="rewardSymbol">★</div><h4>Café de la casa</h4><p>¡Lo lograste!</p><span>CANJEAR PREMIO</span></div></article>
  </div></section>

  <section id="producto" className="ownerReveal"><div className="ownerRevealHead"><span>04 — TU NEGOCIO</span><h2>Todo claro.<br/><em>De un vistazo.</em></h2></div><div className="ownerProductFrame"><div className="browserBar"><i/><i/><i/><span>panel.nival.mx</span></div><div className="ownerUi"><aside><div className="sideBrand">N</div><b>Resumen</b><span>Clientes</span><span>Premios</span><span>Reseñas</span><span>Mi negocio</span></aside><div className="ownerUiMain"><header><div><small>BUENAS TARDES</small><h3>Café Nival</h3></div><button>Esta semana⌄</button></header><div className="ownerKpis"><article><small>VISITAS</small><strong>184</strong><span>↗ 18% vs. mes pasado</span></article><article><small>CLIENTES QUE REGRESAN</small><strong>62</strong><span>34% de tus clientes</span></article><article><small>RESEÑAS</small><strong>4.8 ★</strong><span>+12 nuevas</span></article></div><div className="ownerLower"><article className="returnChart"><header><b>Clientes que regresan</b><small>Últimas 7 semanas</small></header><div><i style={{height:'32%'}}/><i style={{height:'43%'}}/><i style={{height:'40%'}}/><i style={{height:'55%'}}/><i style={{height:'61%'}}/><i style={{height:'74%'}}/><i style={{height:'88%'}}/></div></article><article className="smartList"><b>Hoy</b><div><span>●</span><p><strong>María volvió</strong><small>7 visitas · a 1 de su premio</small></p></div><div><span>★</span><p><strong>Nueva reseña de 5 estrellas</strong><small>Hace 18 min</small></p></div><div><span>↻</span><p><strong>8 clientes por volver</strong><small>Oportunidad de esta semana</small></p></div></article></div></div></div></div>
   </section>

  <section className="millionDemoBand clearerDemo"><div className="demoAura"/><div className="demoCopy"><span>05 — PRUÉBALO</span><h2>Míralo funcionar.</h2><p>Úsalo como si ya fuera tu negocio.</p><a className="millionPrimary inverted" href="/demo">Ver cómo funciona <b>↗</b></a><small className="demoNoRisk">No necesitas registrarte para verla.</small></div><div className="demoDeviceStack"><div className="dashboardGlass"><div className="dashTop"><div><small>TU NEGOCIO</small><b>Café Nival</b></div><span>● EN VIVO</span></div><div className="dashHero"><small>VISITAS ESTE MES</small><strong>184</strong><span>↗ 18.4%</span></div><div className="dashGrid"><article><small>Regresan</small><b>62</b></article><article><small>Por volver</small><b>18</b></article><article><small>Reseñas</small><b>4.8 ★</b></article></div><div className="dashActivity"><i/><div><b>María volvió hoy</b><small>7 visitas · a 1 de su premio</small></div><span>AHORA</span></div></div><div className="demoTag">ESTO ES LO QUE TÚ VERÍAS <i>↖</i></div></div></section>

  <section className="millionClose clearerClose"><div className="closeMark">N</div><span>06 — NIVAL</span><h2>Que te encuentren.<br/>Que regresen.</h2><p><b>Mejor ficha en Google + reseñas cuidadas + tarjeta digital de puntos.</b><br/>Nival te ayuda a atraer nuevos clientes y a convertir una primera visita en muchas más.</p><div className="closeActions"><a className="millionPrimary" href="/registro">Registrar mi negocio <b>↗</b></a><a href={wa} target="_blank" rel="noreferrer">Tengo una pregunta</a></div><small>{values.price} · Configuración sencilla · Sin app para tus clientes</small></section>

  <footer className="millionFooter"><div><a className="millionBrand" href="/"><span>N</span><b>NIVAL</b></a><p>Haz que vuelvan.</p></div><div><b>ENTIENDE NIVAL</b><a href="#conseguir">Conseguir clientes</a><a href="#fidelizar">Hacer que regresen</a><a href="/demo">Demo</a></div><div><b>CUENTA</b><a href="/registro">Registro</a><a href="/acceso">Entrar</a><a href="/staff/acceso">Personal</a></div><div><b>LEGAL</b><a href="/terminos">Términos</a><a href="/privacidad">Privacidad</a></div><small>© 2026 Nival Tech · México</small></footer>
 </main>
}