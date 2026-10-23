"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { WalletButton } from "../wallet/button";
import { ActionForm } from "../foundation/forms";
import { Hidden } from "../foundation/fields";
import {readableCardText} from "./card-color";
import { chooseGoal } from "../foundation/actions";
export function CardView({
  business,
  initial,
  qr,
  walletAvailable=false,
}: {
  business: any;
  initial: any;
  qr: string;walletAvailable?:boolean;
}) {
  const [card, setCard] = useState(initial),
    [pulse, setPulse] = useState(false),
    [confetti, setConfetti] = useState(false),[pointMessage,setPointMessage]=useState('');
  const router = useRouter();
  const [activityTab,setActivityTab]=useState<"points"|"redemptions"|"rewards">("points");
  const [copyStatus,setCopyStatus]=useState("");
  const [redeemNotice,setRedeemNotice]=useState(false);
  const previous = useRef(initial);
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const refresh = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const r = await fetch("/api/points/card?slug=" + business.slug, {
          cache: "no-store",
        });
        const d = await r.json();
        if (stopped) return;
        if (!r.ok) {
          router.refresh();
          return;
        }
        const prev = previous.current;
        if (Number(d.card.balance) > Number(prev.balance)) {
          const pointsEarned=Number(d.card.balance)-Number(prev.balance);
          setPointMessage(pointsEarned===1?"Obtuviste un punto":`Obtuviste ${pointsEarned} puntos`);
          setTimeout(()=>setPointMessage(''),2600);
          setPulse(true);
          setTimeout(() => setPulse(false), 1000);
          if (
            d.card.reward &&
            Number(prev.balance) < d.card.reward.points_cost &&
            Number(d.card.balance) >= d.card.reward.points_cost
          ) {
            setConfetti(true);
            setTimeout(() => setConfetti(false), 2400);
          }
        }
        previous.current = d.card;
        setCard(d.card);
      } catch {
      } finally {
        busy = false;
      }
    };
    const automatic=()=>void refresh();
    const timer = setInterval(automatic, 6000);
    document.addEventListener("visibilitychange", automatic);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", automatic);
    };
  }, [business.slug, router]);
  useEffect(() => {
    previous.current = initial;
    setCard(initial);
  }, [initial]);
  const policy=card.reward_policy||{}, policyMode=policy.scope==="segments"?policy.mode:business.program?.mode;
  const eligibleRewards=policy.scope==="segments"&&Array.isArray(policy.ids)?business.rewards.filter((reward:any)=>policy.ids.includes(reward.id)):business.rewards;
  const design=business.program?.rules?.card_design||{},
    goal = card.reward?.points_cost || 0,
    points = Number(card.balance),
    ready = goal > 0 && points >= goal && card.reward_redeemable !== false;
  const visibleDots=Math.min(goal||10,10);
  const filledDots=goal>0?Math.min(Math.floor(points*visibleDots/goal),visibleDots):0;
  const progressPct=goal>0?Math.min(100,Math.round(points/goal*100)):0;
  const baseCardColor=/^#[0-9a-f]{6}$/i.test(business.program?.color||"")?business.program.color:"#164d3b";
  const effectiveTextColor=readableCardText(design.textColor,baseCardColor);
  const configuredStyle={
    "--card-color":baseCardColor,
    "--card-text":effectiveTextColor,
    "--card-accent":design.secondaryColor||"#cfe87a",
    "--point-active":design.pointActive||design.secondaryColor||"#cfe87a",
    "--point-idle":design.pointInactive||"#ffffff35",
    "--card-background-image":design.background
      ? "linear-gradient(120deg, rgba(15,45,35,.15), rgba(15,45,35,.08)), url('" + design.background + "')"
      : "none",
    backgroundSize:"cover",
    backgroundPosition:(design.backgroundX??50)+"% "+(design.backgroundY??50)+"%",
  } as React.CSSProperties;
  const manualCode=card.manual_code||String(card.id).slice(-8).toUpperCase();
  const availableRewards=card.available_rewards||[];
  const redeemedRewards=card.redeemed_rewards||[];
  const hasQr=design.showQr!==false&&Boolean(qr);
  const complete=goal>0&&points>=goal;
  const copyCode=async()=>{
    try{
      await navigator.clipboard.writeText(manualCode);
      setCopyStatus("Código copiado");
    }catch{
      setCopyStatus("No se pudo copiar. Mantén pulsado el código.");
    }
    window.setTimeout(()=>setCopyStatus(""),2200);
  };
  const goToRedeem=()=>{
    setRedeemNotice(true);
    document.getElementById("customer-card-qr")?.scrollIntoView({behavior:"smooth",block:"center"});
  };
  return (
    <div className="nivalCustomerFlow">
      {!card&&<p className="customerLoading" role="status">Cargando tu tarjeta…</p>}
      {card&&<article
        className={"loyaltyCard nivalConfiguredCard customerLoyaltyCard "+(pulse?"cardPulse":"")}
        data-theme={design.theme||"nival"}
        style={configuredStyle}
      >
        <div className="cardTop">
          <div className="customerBrand">
            {design.squareLogo||business.program?.logo_url
              ? <img className="cardLogo" src={design.squareLogo||business.program.logo_url} alt={"Logo de "+business.name}/>
              : <span className="cardMonogram" aria-hidden="true">{business.name.slice(0,1).toUpperCase()}</span>}
            <span className="customerBrandName"><small>PROGRAMA DE PUNTOS</small><strong>{business.name}</strong></span>
          </div>
          <span className="cardExpiry">{design.expiryMonths?("Puntos válidos "+design.expiryMonths+" meses"):"Los puntos no caducan"}</span>
        </div>

        {card.name&&<p className="cardMemberName">{card.name}</p>}

        {design.pointView==="bar"&&<section className="customerProgressBlock" aria-labelledby="customer-progress-heading">
          <div className="customerProgressHeader">
            <div>
              <p id="customer-progress-heading" className="customerCardEyebrow">TU PROGRESO</p>
              {goal>0
                ? <strong className="customerProgressCount">{Math.min(points,goal)}<span> / {goal}</span></strong>
                : <strong className="customerProgressPending">Meta pendiente</strong>}
            </div>
            {goal>0&&<span className="customerProgressPercent">{progressPct}%</span>}
          </div>
          {goal>0&&<progress className="customerProgressBar" max={goal} value={Math.min(points,goal)} aria-label={Math.min(points,goal)+" de "+goal+" puntos"} />}
          <p className="customerNextRewardText">
            {!card.reward?"Premio pendiente de configuración"
              :ready?"Premio disponible: "+card.reward.name
              :complete?"Meta alcanzada; este premio ya no está vigente"
              :"Te faltan "+Math.max(goal-points,0)+" para "+card.reward.name}
          </p>
          {ready&&<button className="customerRedeemButton" type="button" onClick={goToRedeem}>Canjear</button>}
          {redeemNotice&&<p className="customerRedeemNotice" role="status">Muestra tu QR o código al personal para completar el canje.</p>}
        </section>}

        {design.pointView!=="bar"&&goal>0&&<section className="customerStampProgress" aria-label="Tu progreso con sellos">
          <div className="cardPointGrid customerStampGrid" aria-label={filledDots+" de "+visibleDots+" indicadores visuales; "+Math.min(points,goal)+" de "+goal+" puntos reales"}>
            {Array.from({length:visibleDots},(_,i)=><i key={i} className={i<filledDots?"isFilled":""}>
              {i<filledDots
                ? design.pointFilledIcon==="image"&&design.stampImage?<img src={design.stampImage} alt=""/>:design.pointFilledIcon==="star"?"★":"✓"
                : design.pointIcon==="star"?"☆":design.pointIcon==="heart"?"♡":design.pointIcon==="coffee"?"☕":"○"}
            </i>)}
          </div>
          <p className="customerStampLegend">
            {ready?"Premio disponible: "+card.reward.name
              :complete?"Meta alcanzada; este premio ya no está vigente"
              :"Te faltan "+Math.max(goal-points,0)+" puntos para: "+(card.reward?.name||"tu premio")}
          </p>
          {ready&&<button className="customerRedeemButton" type="button" onClick={goToRedeem}>Canjear</button>}
          {redeemNotice&&<p className="customerRedeemNotice" role="status">Muestra tu QR o código al personal para completar el canje.</p>}
        </section>}

        {goal===0&&design.pointView!=="bar"&&<section className="customerProgressBlock" aria-label="Progreso pendiente">
          <strong className="customerProgressPending">Meta pendiente</strong>
        </section>}


        {(hasQr||manualCode)&&<section className="customerQrPanel" id="customer-card-qr" aria-label="Tu código de cliente">
          {hasQr&&<img src={qr} alt="QR para sumar visitas y canjear premios"/>}
          <div className="customerQrCode">
            <span>{hasQr?"Tu código":"Código de cliente"}</span>
            <strong>{manualCode}</strong>
            <button type="button" onClick={copyCode}>Copiar</button>
            {copyStatus&&<small role="status" aria-live="polite">{copyStatus}</small>}
          </div>
        </section>}

        <footer className="customerCardFooter"><span>{design.footer||"Un lugar al que vale la pena volver."}</span></footer>
        {pointMessage&&<span className="pointCongrats" role="status" aria-live="polite">{pointMessage}</span>}
        {confetti&&<div className="confetti" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{left:((i*37)%100)+"%",animationDelay:(i%5)*.08+"s",background:["#cfe87a","#fff","#9cd9b2"][i%3]}}/>)}</div>}
      </article>}

      {walletAvailable&&<WalletButton slug={business.slug}/>}

      <section className="cardHistory customerActivityPanel" aria-labelledby="customer-history-heading">
        <header className="customerActivityHeading">
          <div><p className="customerSectionEyebrow">TU ACTIVIDAD</p><h2 id="customer-history-heading">Historial</h2></div>
        </header>
        <div className="customerActivityTabs" role="tablist" aria-label="Filtrar historial">
          <button type="button" role="tab" aria-selected={activityTab==="points"} onClick={()=>setActivityTab("points")}>Puntos <span>{card.history.filter((m:any)=>m.type!=="redeem").length}</span></button>
          <button type="button" role="tab" aria-selected={activityTab==="redemptions"} onClick={()=>setActivityTab("redemptions")}>Canjes <span>{redeemedRewards.length}</span></button>
          <button type="button" role="tab" aria-selected={activityTab==="rewards"} onClick={()=>setActivityTab("rewards")}>Premios <span>{availableRewards.length}</span></button>
        </div>

        {activityTab==="points"&&<div role="tabpanel" className="customerActivityContent">
          {card.history.filter((m:any)=>m.type!=="redeem").length===0
            ? <div className="customerHistoryEmpty"><span aria-hidden="true">＋</span><strong>Aún no hay movimientos de puntos.</strong></div>
            : <ol className="customerHistoryTimeline">{card.history.filter((m:any)=>m.type!=="redeem").map((m:any,i:number)=><li key={i}>
                <span className="customerHistoryIcon" aria-hidden="true">{m.type==="visit"?"＋":"↗"}</span>
                <div><strong>{m.type==="visit"?"Visita registrada":"Ajuste de puntos"}</strong><small>{new Date(m.created_at).toLocaleString("es-MX",{timeZone:"America/Mexico_City",dateStyle:"medium",timeStyle:"short"})}</small></div>
                <b>{m.points>0?"+":""}{m.points} pts</b>
              </li>)}</ol>}
        </div>}

        {activityTab==="redemptions"&&<div role="tabpanel" className="customerActivityContent">
          {redeemedRewards.length===0
            ? <div className="customerHistoryEmpty"><span aria-hidden="true">✓</span><strong>Aún no hay canjes.</strong></div>
            : <div className="customerActivityList">{redeemedRewards.map((r:any,i:number)=><article key={r.id||i} className="customerActivityItem">
                {r.photo_url?<img src={r.photo_url} alt=""/>:<span aria-hidden="true">✓</span>}
                <div><strong>{r.name}</strong><small>{r.status==="pendiente"?"Por canjear":"Canjeado"} · {new Date(r.created_at).toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"})}{r.branch_name?" · "+r.branch_name:""}</small></div>
                <b>{r.status==="pendiente"?"Pendiente":"Canjeado"}</b>
              </article>)}</div>}
        </div>}

        {activityTab==="rewards"&&<div role="tabpanel" className="customerActivityContent">
          {availableRewards.length===0&&!ready
            ? <div className="customerHistoryEmpty"><span aria-hidden="true">✦</span><strong>No tienes premios disponibles por ahora.</strong></div>
            : <div className="customerActivityList">
                {ready&&<article className="customerActivityItem isAvailable">
                  {card.reward?.photo_url?<img src={card.reward.photo_url} alt=""/>:<span aria-hidden="true">✦</span>}
                  <div><strong>{card.reward.name}</strong><small>Meta completada · muestra tu código al personal</small></div>
                  <button type="button" onClick={goToRedeem}>Canjear</button>
                </article>}
                {availableRewards.map((r:any)=><article key={r.id} className="customerActivityItem isAvailable">
                  {r.photo_url?<img src={r.photo_url} alt=""/>:<span aria-hidden="true">✦</span>}
                  <div><strong>{r.name}</strong><small>{r.expires_at?"Vence "+new Date(r.expires_at).toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"}):"Premio disponible"}</small></div>
                  <b>Disponible</b>
                </article>)}
              </div>}
        </div>}
      </section>

      {(design.terms||design.whatsapp||design.address||design.instagram||design.facebook)&&<section className="customerCardDetails"><h2>Información del programa</h2>{design.terms&&<details><summary>Términos y condiciones</summary><p>{design.terms}</p></details>}{design.whatsapp&&<p>WhatsApp: <a href={"https://wa.me/"+String(design.whatsapp).replace(/\D/g,"")} target="_blank" rel="noreferrer">{design.whatsapp}</a></p>}{design.address&&<p>Dirección: {design.address}</p>}{design.instagram&&<p>Instagram: {design.instagram}</p>}{design.facebook&&<p>Facebook: {design.facebook}</p>}</section>}

      {business.active&&policyMode==="choose"&&!card.reward&&<section className="reviewBox">
        <h2>¿Cuál será tu próximo premio?</h2><p>Tu elección queda bloqueada hasta canjearla.</p>
        <ActionForm action={chooseGoal} label="Elegir y bloquear mi premio"><Hidden name="slug" value={business.slug}/><label>Premio<select required name="rewardId">{eligibleRewards.map((r:any)=><option key={r.id} value={r.id}>{r.name} · {r.points_cost} puntos</option>)}</select></label></ActionForm>
      </section>}
      {policyMode==="choose"&&card.reward&&<p className="lockedGoal">🔒 Elegiste {card.reward.name}. Podrás cambiarlo después de canjear.</p>}

      <details className="cardHelp"><summary>¿Cómo guardo o recupero mi tarjeta?</summary><p>Tu tarjeta queda guardada automáticamente en este navegador durante un año. Cuando vuelvas a abrir el enlace del negocio desde este dispositivo, verás tus puntos sin registrarte de nuevo. Si cambias de celular, borras los datos o usas otro navegador, recupérala con el teléfono registrado. Tus puntos e historial se conservan.</p><p>El saldo se actualiza automáticamente. El mismo QR y código sirven para registrar visitas y entregar premios.</p></details>
    </div>
  );
}
