"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { saveProgram } from "../foundation/actions";

type Program = {
  name?: string;
  color?: string;
  mode?: string;
  points_per_visit?: number;
  rules?: { min_hours_between_visits?: number; max_visits_per_day?: number };
  logo_url?: string | null;
};
type Reward = { name?: string; points_cost?: number };
type SaveState = { kind: "idle" | "saving" | "saved" | "error"; message: string };

export function ProgramEditor({
  businessId,
  business,
  program,
  reward,
}: {
  businessId: string;
  business: string;
  program?: Program;
  reward?: Reward;
}) {
  const [draft, setDraft] = useState({
    name: program?.name || "Mis recompensas",
    color: program?.color || "#164d3b",
    mode: program?.mode || "single",
    points: String(program?.points_per_visit || 1),
    hours: String(program?.rules?.min_hours_between_visits ?? 0.0166666667),
    max: String(program?.rules?.max_visits_per_day ?? 100),
  });
  const [logo, setLogo] = useState(program?.logo_url || "");
  const [logoError, setLogoError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    message: "Los cambios se guardan automáticamente.",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);
  const revision = useRef(0);
  const saving = useRef(false);
  const queued = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistAgain = useRef<() => void>(() => {});

  const persist = useCallback(async () => {
    if (!formRef.current) return;
    if (saving.current) {
      queued.current = true;
      return;
    }
    saving.current = true;
    queued.current = false;
    const submittedRevision = revision.current;
    setSaveState({ kind: "saving", message: "Guardando cambios…" });
    try {
      const result = await saveProgram({}, new FormData(formRef.current));
      if (revision.current !== submittedRevision || queued.current) {
        queued.current = false;
        timer.current = setTimeout(() => persistAgain.current(), 350);
      } else if (result.error) {
        setSaveState({ kind: "error", message: result.error });
      } else {
        setSaveState({ kind: "saved", message: "Todos los cambios están guardados." });
      }
    } catch {
      if (revision.current !== submittedRevision || queued.current) {
        queued.current = false;
        timer.current = setTimeout(() => persistAgain.current(), 350);
      } else {
        setSaveState({
          kind: "error",
          message: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.",
        });
      }
    } finally {
      saving.current = false;
      if (queued.current) {
        queued.current = false;
        timer.current = setTimeout(() => void persist(), 350);
      }
    }
  }, []);
  persistAgain.current = () => void persist();

  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, logo, persist]);

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    dirty.current = true;
    revision.current += 1;
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveState({ kind: "idle", message: "Cambios pendientes de guardar." });
  }

  function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLogoError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 250000) {
      setLogoError("Usa un logo PNG, JPEG o WebP de menos de 250 KB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dirty.current = true;
      revision.current += 1;
      setLogo(String(reader.result || ""));
      setSaveState({ kind: "idle", message: "Cambios pendientes de guardar." });
    };
    reader.onerror = () => setLogoError("No se pudo leer la imagen. Intenta con otro archivo.");
    reader.readAsDataURL(file);
  }

  const progress = reward?.points_cost ? Math.min(3 / reward.points_cost, 1) * 100 : 30;
  return (
    <div
      className="cardEditorGrid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: 24,
        alignItems: "start",
      }}
    >
      <form
        ref={formRef}
        className="configGrid"
        onSubmit={(event) => {
          event.preventDefault();
          void persist();
        }}
      >
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="logo" value={logo} />
        <label>
          Nombre de la tarjeta
          <input
            name="name"
            value={draft.name}
            maxLength={150}
            required
            onChange={(event) => update("name", event.target.value)}
          />
        </label>
        <label>
          Color principal
          <input
            name="color"
            type="color"
            value={draft.color}
            onChange={(event) => update("color", event.target.value)}
            style={{ minHeight: 48, padding: 5 }}
          />
        </label>
        <label className="wide">
          Logo del negocio
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseLogo} />
        </label>
        {logo && (
          <div className="wide" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt={"Logo de " + business} width={64} height={64} style={{ objectFit: "cover", borderRadius: 12 }} />
            <button
              type="button"
              onClick={() => {
                dirty.current = true;
                revision.current += 1;
                setLogo("");
                setSaveState({ kind: "idle", message: "Cambios pendientes de guardar." });
              }}
            >
              Quitar logo
            </button>
          </div>
        )}
        {logoError && <p className="error wide" role="alert">{logoError}</p>}
        <label className="wide">
          Tipo de recompensas
          <select name="mode" value={draft.mode} onChange={(event) => update("mode", event.target.value)}>
            <option value="single">Un premio para todos</option>
            <option value="choose">Premios a elegir</option>
            <option value="sequence">Premios por etapas</option>
            <option value="surprise">Premio sorpresa</option>
          </select>
        </label>
        <label>
          Puntos por visita
          <input name="points" type="number" min={1} max={1000} step={1} value={draft.points} onChange={(event) => update("points", event.target.value)} required />
        </label>
        <label>
          Horas mínimas entre visitas
          <input name="hours" type="number" min={0} max={720} step="any" value={draft.hours} onChange={(event) => update("hours", event.target.value)} required />
        </label>
        <label className="wide">
          Máximo de visitas por día
          <input name="max" type="number" min={1} max={100} step={1} value={draft.max} onChange={(event) => update("max", event.target.value)} required />
        </label>
        <div className="wide" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void persist()} disabled={saveState.kind === "saving"}>
            {saveState.kind === "saving" ? "Guardando…" : "Guardar ahora"}
          </button>
          <p role="status" aria-live="polite" style={{ margin: 0, color: saveState.kind === "error" ? "#a52c25" : "#526b5a" }}>
            {saveState.message}
          </p>
        </div>
      </form>

      <aside className="liveCardPreview" aria-label="Vista previa en vivo de la tarjeta" style={{ position: "sticky", top: 28 }}>
        <small style={{ letterSpacing: ".12em", fontWeight: 700, color: "#5f7567" }}>VISTA PREVIA EN VIVO</small>
        <p style={{ margin: "6px 0 14px", color: "#65746a" }}>Así se verá la tarjeta de tus clientes.</p>
        <article
          className="loyaltyCard"
          style={{ "--card-color": draft.color } as CSSProperties}
        >
          <div className="cardTop">
            <div>
              {logo ? (
                <img className="cardLogo" src={logo} alt={"Logo de " + business} />
              ) : (
                <span className="cardMonogram">{business.slice(0, 1).toUpperCase()}</span>
              )}
              <small>{business}</small>
            </div>
            <span className="cardSerial">NIVAL PUNTOS<br />MEMBRESÍA DIGITAL</span>
          </div>
          <p className="cardProgram">{draft.name || "Nombre de tu tarjeta"}</p>
          <h2>Cliente de ejemplo</h2>
          <div className="cardNumbers">
            <strong>3</strong>
            <span>puntos<br />acumulados</span>
            <span className="cardSeal">✦</span>
          </div>
          <div className="cardProgress" role="progressbar" aria-label="Progreso de ejemplo" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: progress + "%" }} />
          </div>
          <div className="cardGoal">
            <span>{reward ? Math.max(Number(reward.points_cost || 0) - 3, 0) + " puntos para tu premio" : "Agrega un premio para mostrar la meta"}</span>
            <b>{reward?.name || "Tu próxima recompensa"}</b>
          </div>
          <footer><span>Un lugar al que vale la pena volver.</span><small>•••• 2026</small></footer>
        </article>
        <small style={{ display: "block", marginTop: 10, color: "#718075" }}>La vista previa usa datos ficticios y no altera saldos ni tarjetas de clientes.</small>
      </aside>
    </div>
  );
}
