"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { WalletButton } from "../wallet/button";
import { ActionForm } from "../foundation/forms";
import { Hidden } from "../foundation/fields";
import { chooseGoal } from "../foundation/actions";
export function CardView({
  business,
  initial,
  qr,
}: {
  business: any;
  initial: any;
  qr: string;
}) {
  const [card, setCard] = useState(initial),
    [pulse, setPulse] = useState(false),
    [confetti, setConfetti] = useState(false);
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
    const timer = setInterval(refresh, 6000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
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
      <article
        className={"loyaltyCard " + (pulse ? "cardPulse" : "")}
        style={
          {
            "--card-color": business.program?.color || "#164d3b",
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
          <span>Un lugar al que vale la pena volver.</span>
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
      <WalletButton slug={business.slug} />
      <section className="personalQr">
        <div>
          <small>TU QR PERSONAL</small>
          <h2>Muéstralo al mesero</h2>
          <p>Para registrar tu visita o recibir tu premio.</p>
        </div>
        <img
          src={qr}
          alt="QR personal para registrar visitas"
          width="210"
          height="210"
        />
        <small>
          Este QR identifica tu tarjeta. No concede acceso a tus datos.
        </small>
      </section>
      {business.program?.mode === "choose" && !card.reward && (
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
      <section className="cardHistory">
        <h2>Tus últimas visitas</h2>
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
                    : "Canje revertido"}
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
