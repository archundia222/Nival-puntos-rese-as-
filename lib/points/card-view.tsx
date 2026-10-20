"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { WalletButton } from "../wallet/button";
import { ActionForm } from "../foundation/forms";
import { Hidden } from "../foundation/fields";
import {cardColor,readableCardText} from "./card-color";
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
  const visibleDots=Math.min(goal||10,20),filledDots=Math.min(Math.round((points/Math.max(goal,1))*visibleDots),visibleDots),progressPct=goal>0?Math.min(100,Math.round(points/goal*100)):0;
  const baseCardColor=design.theme==="minimal"?"#ffffff":design.theme==="noche"?"#17352f":design.theme==="botanico"?"#315641":cardColor(business.program?.color);
  const configuredStyle={"--card-color":baseCardColor,"--card-text":design.theme==="minimal"?(design.textColor||"#17352f"):readableCardText(design.textColor,baseCardColor),"--card-accent":design.secondaryColor||"#cfe87a","--point-active":design.pointActive||design.secondaryColor||"#cfe87a","--point-idle":design.pointInactive||"#ffffff35"} as React.CSSProperties;
  const manualCode=card.manual_code||String(card.id).slice(-8).toUpperCase();
  const availableRewards=card.available_rewards||[], redeemedRewards=card.redeemed_rewards||[];
  const validityMode=(business.program?.redemption_mode|| (design.rewardExpiryMode==="duration"?"validity":"immediate"))==="validity";
  const rewardInventory=(
    <section className="customerRewardInventory" aria-labelledby="rewards-inventory-heading">
      <header className="customerInventoryHeading">
        <div>
          <p className="customerSectionEyebrow">TU ACTIVIDAD</p>
          <h2 id="rewards-inventory-heading">Historial de canjes</h2>
        </div>
      </header>
      <div className="rewardInventoryTabs">
        {validityMode&&<section aria-labelledby="available-rewards-heading">
          <h3 id="available-rewards-heading">Premios disponibles <span>{availableRewards.length}</span></h3>
          {availableRewards.length?availableRewards.map((r:any)=>(
            <article key={r.id} className="rewardInventoryRow">
              {r.photo_url?<img src={r.photo_url} alt=""/>:<span className="rewardInventoryIcon" aria-hidden="true">✦</span>}
              <span><b>{r.name}</b><small>Vence {new Date(r.expires_at).toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"})}</small></span>
              <i>Disponible</i>
            </article>
          )):<p className="rewardInventoryEmpty"><span aria-hidden="true">✓</span><span>No tienes premios pendientes.</span></p>}
        </section>}
        <section aria-labelledby="redeemed-rewards-heading">
          <h3 id="redeemed-rewards-heading">Canjes <span>{redeemedRewards.length}</span></h3>
          {redeemedRewards.length?redeemedRewards.map((r:any,i:number)=>(
            <article key={r.id||i} className="rewardInventoryRow">
              {r.photo_url?<img src={r.photo_url} alt=""/>:<span className="rewardInventoryIcon isRedeemed" aria-hidden="true">✓</span>}
              <span><b>{r.name}</b><small>{r.status==="pendiente"?"Por canjear":"Canjeado"} · {new Date(r.created_at).toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"})}{r.branch_name?" · "+r.branch_name:""}</small></span>
              <i className={r.status==="pendiente"?"":"isRedeemed"}>{r.status==="pendiente"?"Por canjear":"Canjeado"}</i>
            </article>
          )):<p className="rewardInventoryEmpty"><span aria-hidden="true">↗</span><span>Aún no tienes canjes.</span></p>}
        </section>
      </div>
    </section>
  );
  return (
    <div className="nivalCustomerFlow">
      <article
        className={"loyaltyCard nivalConfiguredCard " + (pulse ? "cardPulse" : "")}
        data-theme={design.theme||"nival"}
        style={
          {
            ...configuredStyle,
            "--card-color": baseCardColor,
            backgroundImage: business.program?.rules?.card_design?.background ? "linear-gradient(120deg, rgba(15,45,35,.15), rgba(15,45,35,.08)), url('" + business.program.rules.card_design.background + "')" : undefined,
            backgroundSize: "cover",
            backgroundPosition: `${business.program?.rules?.card_design?.backgroundX??50}% ${business.program?.rules?.card_design?.backgroundY??50}%`,
          } as React.CSSProperties
        }
      >
        <div className="cardTop">
          <div className="customerBrand">
            {design.squareLogo||business.program?.logo_url ? (
              <img className="cardLogo" src={design.squareLogo||business.program.logo_url} alt="" />
            ) : (
              <span className="cardMonogram" aria-hidden="true">{business.name.slice(0,1).toUpperCase()}</span>
            )}
            <span className="customerBrandName"><small>TARJETA DE</small><strong>{business.name}</strong></span>
          </div>
          <span className="cardExpiry">{design.expiryMonths?`Puntos válidos ${design.expiryMonths} meses`:"Los puntos no caducan"}</span>
        </div>
        <p className="cardMemberName">{card.name}</p>
        <div className="cardPointGrid" aria-label={points + " de " + goal + " puntos acumulados"}>{Array.from({length:visibleDots},(_,i)=><i key={i} className={i<filledDots?"isFilled":""}>{i<filledDots?(design.pointFilledIcon==="image"&&design.stampImage?<img src={design.stampImage} alt=""/>:design.pointFilledIcon==="star"?"★":"✓"):(design.pointIcon==="star"?"☆":design.pointIcon==="heart"?"♡":design.pointIcon==="coffee"?"☕":"○")}</i>)}</div>
        <div className="cardQrInside"><img src={qr} alt="QR para sumar visitas y canjear premios"/><div><span>Tu código</span><span className="cardManualCode">{manualCode}</span></div></div>
        <footer><span>{business.program?.rules?.card_design?.footer || "Un lugar al que vale la pena volver."}</span></footer>
        {pointMessage&&<span className="pointCongrats" role="status" aria-live="polite">{pointMessage}</span>}
        {confetti && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: ((i * 37) % 100) + "%",
                  animationDelay: (i % 5) * 0.08 + "s",
                  background: ["#cfe87a", "#fff", "#9cd9b2"][i % 3],
                }}
              />
            ))}
          </div>
        )}
      </article>
      {walletAvailable&&<WalletButton slug={business.slug} />}
      <section className="customerRewardSummary" aria-labelledby="next-reward-heading">
        <div className="customerRewardHeading">
          <p className="customerSectionEyebrow">SIGUIENTE META</p>
          <h2 id="next-reward-heading">Tu próximo premio</h2>
        </div>
        <div className="customerRewardFeature">
          {card.reward?.photo_url?<img className="customerRewardPhoto" src={card.reward.photo_url} alt={`Premio: ${card.reward.name}`}/>:<span className="customerRewardIcon" aria-hidden="true">✦</span>}
          <div className="customerRewardGoal" aria-label={card.reward?`${card.reward.name}, ${Math.max(goal-points,0)} puntos restantes`:"Premio por definir"}>
            <b>{card.reward?.name||"Premio por definir"}</b>
            <span>{ready?"Tu premio está disponible para canjear":card.reward?points>=goal?"Los puntos están completos, pero este premio ya no está vigente":`Te faltan ${Math.max(goal-points,0)} puntos para este premio`:"Meta pendiente de configuración"}</span>
          </div>
        </div>
        {goal>0&&<div className="customerGoalProgress" aria-label={`${points} de ${goal} puntos`}>
          <div><span>{Math.min(points,goal)}/{goal} pts</span><b>{progressPct}%</b></div>
          <progress max={goal} value={Math.min(points,goal)} aria-label={`${progressPct}% del progreso al premio`}/>
        </div>}
      </section>
      {rewardInventory}
      {(design.terms||design.whatsapp||design.address||design.instagram||design.facebook)&&<section className="customerCardDetails"><h2>Información del programa</h2>{design.terms&&<details><summary>Términos y condiciones</summary><p>{design.terms}</p></details>}{design.whatsapp&&<p>WhatsApp: <a href={`https://wa.me/${String(design.whatsapp).replace(/\D/g,"")}`} target="_blank" rel="noreferrer">{design.whatsapp}</a></p>}{design.address&&<p>Dirección: {design.address}</p>}{design.instagram&&<p>Instagram: {design.instagram}</p>}{design.facebook&&<p>Facebook: {design.facebook}</p>}</section>}
      {business.active && policyMode === "choose" && !card.reward && (
        <section className="reviewBox">
          <h2>¿Cuál será tu próximo premio?</h2>
          <p>Tu elección queda bloqueada hasta canjearla.</p>
          <ActionForm action={chooseGoal} label="Elegir y bloquear mi premio">
            <Hidden name="slug" value={business.slug} />
            <label>
              Premio
              <select required name="rewardId">
                {eligibleRewards.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.points_cost} puntos
                  </option>
                ))}
              </select>
            </label>
          </ActionForm>
        </section>
      )}
      {policyMode === "choose" && card.reward && (
        <p className="lockedGoal">
          🔒 Elegiste {card.reward.name}. Podrás cambiarlo después de canjear.
        </p>
      )}
      <details className="cardHelp"><summary>¿Cómo guardo o recupero mi tarjeta?</summary><p>Tu tarjeta queda guardada automáticamente en este navegador durante un año. Cuando vuelvas a abrir el enlace del negocio desde este dispositivo, verás tus puntos sin registrarte de nuevo. Si cambias de celular, borras los datos o usas otro navegador, recupérala con el teléfono registrado. Tus puntos e historial se conservan.</p><p>El saldo se actualiza automáticamente. El mismo QR y código sirven para registrar visitas y entregar premios.</p></details>
      <section className="cardHistory" aria-labelledby="customer-history-heading">
        <p className="customerEyebrow">TU AVANCE</p>
        <h2 id="customer-history-heading">Historial de puntos</h2>
        {!card.history.length ? (
          <div className="customerHistoryEmpty"><span aria-hidden="true">✦</span><div><strong>Tu historia comienza aquí</strong><p>Cuando el negocio registre tu primera visita, aquí verás tus puntos y canjes.</p></div></div>
        ) : (
          <ol className="customerHistoryTimeline">
            {card.history.map((m: any, i: number) => (
              <li key={i} className={m.type==="redeem"?"isRedeemed":""}>
                <span className="customerHistoryIcon" aria-hidden="true">{m.type==="visit"?"＋":m.type==="redeem"?"✓":"↗"}</span>
                <div><strong>{m.type==="visit"?"Visita registrada":m.type==="redeem"?"Premio canjeado":"Ajuste de puntos"}</strong>
                  <small>{new Date(m.created_at).toLocaleString("es-MX",{timeZone:"America/Mexico_City",dateStyle:"medium",timeStyle:"short"})}</small>
                </div>
                <b>{m.points>0?"+":""}{m.points} pts</b>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
