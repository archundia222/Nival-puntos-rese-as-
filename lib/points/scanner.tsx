"use client";
import {compressPhoto} from "./compress-photo";
import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
export function Scanner({ businessId,mode="visit" }: { businessId: string;mode?:"visit"|"redeem" }) {
  const video = useRef<HTMLVideoElement>(null),
    controls = useRef<IScannerControls | null>(null),
    mounted = useRef(true),
    busyRef = useRef(false),
    cameraGeneration = useRef(0),
    operation = useRef<string|null>(null);
  const [camera, setCamera] = useState(false),
    [busy, setBusy] = useState(false),
    [phone, setPhone] = useState(""),
    [customer, setCustomer] = useState<any>(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [photo, setPhoto] = useState<File | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [whatsapp, setWhatsapp] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controls.current?.stop();
    };
  }, []);
  function stop() {
    cameraGeneration.current++;
    controls.current?.stop();
    controls.current = null;
    setCamera(false);
  }
  async function lookup(id?: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    stop();
    setBusy(true);
    setError("");
    setSuccess("");
    setCustomer(null);
    operation.current=null;
    setWhatsapp("");
    setPhoto(null);
    setConfirmed(false);
    try {
      const r = await fetch("/api/staff/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, phone, customerId: id }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setCustomer(d.customer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function start() {
    const generation = ++cameraGeneration.current;
    setError("");
    setCamera(true);
    try {
      const reader = new BrowserQRCodeReader();
      await new Promise((r) => setTimeout(r, 0));
      if (!video.current || !mounted.current) return;
      const control = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        video.current,
        (result, _error, c) => {
          if (result && generation === cameraGeneration.current) {
            c.stop();
            void lookup(result.getText());
          }
        },
      );
      if (!mounted.current || generation !== cameraGeneration.current) {
        control.stop();
        return;
      }
      controls.current = control;
    } catch {
      setCamera(false);
      setError(
        "No se pudo abrir la cámara. Permite su uso en el navegador o usa el código manual o teléfono.",
      );
    }
  }
  async function move(type: string) {
    if (!customer || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData();
    f.set("businessId", businessId);
    f.set("customerId", customer.id);
    f.set("type", type);
    if(!operation.current)operation.current=crypto.randomUUID();
    f.set("operationId",operation.current);

    if (confirmed) f.set("confirm", "yes");
    try {
      if(type==="redeem"&&photo)f.set("photo",await compressPhoto(photo));
      const r = await fetch("/api/staff/movement", { method: "POST", body: f });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setCustomer(d.customer);
      operation.current=null;
      setPhoto(null);
      setConfirmed(false);
      setSuccess(
        d.success +
          " · " +
          d.customer.name +
          " · " +
          d.customer.balance +
          " puntos",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function recover() {
    if (
      !customer ||
      !confirm(
        "¿Verificaste que estás atendiendo al titular de esta tarjeta? Envíala únicamente al teléfono registrado.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/staff/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          customerId: customer.id,
          confirm: true,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setWhatsapp(d.whatsapp);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="scannerWorkspace">
      <div className="scannerIntro">
        <small>UNA VISITA, UN PASO MÁS</small>
        <h2>{mode==='visit'?'Sumar puntos':'Canjear premios'}</h2>
        <p>Escanea el QR personal de la tarjeta del cliente.</p>
        <button
          className="scanButton"
          disabled={busy}
          onClick={camera ? stop : start}
        >
          {camera ? "Cerrar cámara" : "Abrir escáner"}
        </button>
      </div>
      <div hidden={!camera} className="cameraFrame">
        <video ref={video} muted playsInline />
        <span>Alinea el QR dentro de la cámara</span>
      </div>
      <form
        className="phoneSearch"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
        }}
      >
        <label>
          O usa el código manual o teléfono (+52)
          <input
            type="tel"
            autoComplete="off"
            placeholder="55 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <button disabled={busy}>
          {busy ? "Consultando…" : "Buscar cliente"}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="scanSuccess" role="status">
          {success}
        </p>
      )}
      {customer && (
        <article className="scannedCustomer">
          <small>CLIENTE IDENTIFICADO</small>
          <h2>{customer.name}</h2>
          <p>
            <strong>{customer.balance}</strong> puntos actuales
          </p>
          {mode==='visit'&&<button
            className="primary"
            disabled={busy}
            onClick={() => move("visit")}
          >
            Sumar puntos por esta visita
          </button>}
          {mode==='redeem'&&<div className="redeemBox">
            <h3>{customer.reward?.name || "Premio por elegir"}</h3>
            <p>
              {customer.reward
                ? Number(customer.balance) >= customer.reward.points_cost
                  ? "Premio disponible para entregar"
                  : `${Math.max(customer.reward.points_cost - Number(customer.balance), 0)} puntos para el premio`
                : "El cliente debe elegir su premio desde su tarjeta."}
            </p>
            {customer.reward &&
              Number(customer.balance) >= customer.reward.points_cost && (
                <>
                  <label>
                    Foto de evidencia · obligatoria
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    />
                  </label>
                  <label className="consentLabel">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span>Confirmo que entregué este premio al cliente.</span>
                  </label>
                  <button
                    disabled={busy || !photo || !confirmed}
                    onClick={() => move("redeem")}
                  >
                    {busy ? "Registrando…" : "Canjear premio"}
                  </button>
                </>
              )}
          </div>}
          <button disabled={busy} onClick={recover}>
            Reenviar tarjeta por WhatsApp
          </button>
          {whatsapp && (
            <a
              className="primary"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp con su tarjeta
            </a>
          )}
        </article>
      )}
      <p className="notice">
        Los movimientos quedan registrados con tu identidad. Una segunda visita
        se valida contra las reglas del negocio.
      </p>
    </section>
  );
}
