"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { WalletButton } from "../wallet/button";
import { ActionForm } from "../foundation/forms";
import { Hidden } from "../foundation/fields";
import {cardColor} from "./card-color";
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
    [confetti, setConfetti] = useState(false),[syncMessage,setSyncMessage]=useState(''),[checking,setChecking]=useState(false);
  const manualRefresh=useRef<(manual?:boolean)=>Promise<void>>(async()=>{});
  const router = useRouter();
  const previous = useRef(initial);
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const refresh = async (manual=false) => {
      if (document.hidden || busy) return;
      busy = true;if(manual){setChecking(true);setSyncMessage('');}
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
        setCard(d.card);if(manual)setSyncMessage('Tarjeta actualizada.');
      } catch {if(manual)setSyncMessage('No pudimos actualizar ahora. Tu último saldo se conserva; vuelve a intentar.');
      } finally {
        busy = false;if(manual)setChecking(false);
      }
    };
    manualRefresh.current=refresh;const automatic=()=>void refresh();
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
  const goal = card.reward?.points_cost || 0,
    points = Number(card.balance),
    ready = goal > 0 && points >= goal;
  return (
    <>
      <p className="cardWelcome">Tu tarjeta está lista. Muéstrala después de tu compra para sumar puntos.</p>
      <article
        className={"loyaltyCard " + (pulse ? "cardPulse" : "")}
        style={
          {
            "--card-color": business.program?.rules?.card_design?.theme === "noche" ? "#17352f" : business.program?.rules?.card_design?.theme === "botanico" ? "#315641" : cardColor(business.program?.color),
            backgroundImage: business.program?.rules?.card_design?.background ? "linear-gradient(120deg, rgba(15,45,35,.84), rgba(15,45,35,.48)), url('" + business.program.rules.card_design.background + "')" : undefined,
            backgroundSize: "cover",
          } as React.CSSProperties
        }
      >
        <div className="cardTop">
          <div>
            {business.program?.logo_url ? (
              <img
                className="cardLogo"
                src={business.program.logo_url}
                alt={"Logo de " + business.name}
              />
            ) : (
              <span className="cardMonogram">{business.name.slice(0, 1)}</span>
            )}
            <small>{business.name}</small>
          </div>
          <span className="cardSerial">
            NIVAL PUNTOS
            <br />
            MEMBRESÍA DIGITAL
          </span>
        </div>
        <p className="cardProgram">
          {business.program?.name || "Tus recompensas"}
        </p>
        <h1>{card.name}</h1>
        <div className="cardNumbers">
          <strong aria-live="polite">{points}</strong>
          <span>
            puntos
            <br />
            acumulados
          </span>
          <span className="cardSeal">✦</span>
        </div>
        <div
          className="cardProgress"
          role="progressbar"
          aria-label="Progreso hacia tu premio"
          aria-valuenow={Math.min(points, goal)}
          aria-valuemin={0}
          aria-valuemax={goal || 1}
        >
          <i
            style={{
              width: (goal ? Math.min(points / goal, 1) * 100 : 0) + "%",
            }}
          />
        </div>
        <div className="cardGoal">
          <span>
            {ready
              ? "Tu premio está listo"
              : card.reward
                ? `${Math.max(goal - points, 0)} puntos para tu premio`
                : "Elige tu siguiente premio"}
          </span>
          <b>{card.reward?.name || "Tu próxima recompensa"}</b>
        </div>
        <footer>
          <span>{business.program?.rules?.card_design?.footer || "Un lugar al que vale la pena volver."}</span>
          <small>•••• {card.id.slice(-4).toUpperCase()}</small>
        </footer>
        {confetti && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: ((i * 37) % 100) + "%",
                  animationDelay: (i % 5) * 0.08 + "s",
                  background: ["#f2d29b", "#fff", "#9cd9b2"][i % 3],
                }}
              />
            ))}
          </div>
        )}
      </article>
      {walletAvailable&&<WalletButton slug={business.slug} />}
      <section className="personalQr">
        <div>
          <small>TU QR PERSONAL</small>
          <h2>Muéstralo al personal</h2>
          <p>Para registrar tu visita o recibir tu premio.</p>
        </div>
        <img
          src={qr}
          alt="QR personal para registrar visitas"
          width="210"
          height="210"
        />
        <small>
          Si no pueden escanearlo, dicta tu código manual.
        </small>
        <p className="manualCardCode">Código manual: <strong>{card.manual_code||card.id}</strong></p>
        <button type="button" disabled={checking} onClick={()=>void manualRefresh.current(true)}>{checking?'Actualizando…':'Actualizar mis puntos'}</button>{syncMessage&&<p role="status">{syncMessage}</p>}
      </section>
      {business.active && business.program?.mode === "choose" && !card.reward && (
        <section className="reviewBox">
          <h2>¿Cuál será tu próximo premio?</h2>
          <p>Tu elección queda bloqueada hasta canjearla.</p>
          <ActionForm action={chooseGoal} label="Elegir y bloquear mi premio">
            <Hidden name="slug" value={business.slug} />
            <label>
              Premio
              <select required name="rewardId">
                {business.rewards.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.points_cost} puntos
                  </option>
                ))}
              </select>
            </label>
          </ActionForm>
        </section>
      )}
      {business.program?.mode === "choose" && card.reward && (
        <p className="lockedGoal">
          🔒 Elegiste {card.reward.name}. Podrás cambiarlo después de canjear.
        </p>
      )}
      <details className="cardHelp"><summary>¿Cómo guardo o recupero mi tarjeta?</summary><p>Guarda esta página en los favoritos de este navegador. En Android también puedes usar “Agregar a pantalla de inicio”. Si cambias de celular o borras los datos del navegador, pide al personal que reenvíe tu acceso al teléfono registrado. Tus puntos siguen guardados.</p><p>Los puntos se suman por compras registradas por el negocio. Al entregar un premio se descuentan los puntos indicados; puedes revisar cada movimiento aquí.</p></details>
      <section className="cardHistory">
        <h2>Tus últimos movimientos</h2>
        {!card.history.length ? (
          <p>Tu historia aquí empieza con tu primera visita.</p>
        ) : (
          card.history.map((m: any, i: number) => (
            <div key={i}>
              <span>
                {m.type === "visit"
                  ? "Visita registrada"
                  : m.type === "redeem"
                    ? "Premio canjeado"
                    : "Ajuste de puntos"}
                <small>
                  {new Date(m.created_at).toLocaleString("es-MX", {
                    timeZone: "America/Mexico_City",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </small>
              </span>
              <b>
                {m.points > 0 ? "+" : ""}
                {m.points}
              </b>
            </div>
          ))
        )}
      </section>
    </>
  );
}
