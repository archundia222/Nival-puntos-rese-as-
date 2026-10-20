"use client";
import {compressPhoto} from "./compress-photo";
import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
export function Scanner({ businessId }: { businessId: string }) {
  const video = useRef<HTMLVideoElement>(null),
    controls = useRef<IScannerControls | null>(null),
    mounted = useRef(true),
    busyRef = useRef(false),
    cameraGeneration = useRef(0),
    operation = useRef<string|null>(null);
  const [camera, setCamera] = useState(false),
    [busy, setBusy] = useState(false),
    [code, setCode] = useState(""),
    [customer, setCustomer] = useState<any>(null),
    [ticketValue,setTicketValue]=useState(''),
    [redemptionValue,setRedemptionValue]=useState(''),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [photo, setPhoto] = useState<File | null>(null),
    [photoPreview, setPhotoPreview] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [visitRegistered,setVisitRegistered]=useState(false),[completed,setCompleted]=useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controls.current?.stop();
    };
  }, []);
  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const preview = URL.createObjectURL(photo);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [photo]);
  useEffect(()=>{
    if(!completed)return;
    const timer=window.setTimeout(()=>{setCustomer(null);setVisitRegistered(false);setCompleted(false);setSuccess('');setCode('');setPhoto(null);setRedemptionValue('');operation.current=null;},3200);
    return ()=>window.clearTimeout(timer);
  },[completed]);
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
    setSuccess("");setVisitRegistered(false);setCompleted(false);
    setCustomer(null);
    operation.current=null;
    setPhoto(null);
    setConfirmed(false);
    try {
      const r = await fetch("/api/staff/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, code, customerId: id }),
      });
      if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Tu sesión venció. Vuelve a entrar para continuar.');
      const d = await r.json();
      if (!r.ok) throw Error(d.error||'No pudimos completar la operación. Inténtalo de nuevo.');
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
        "No se pudo abrir la cámara. Permite su uso en el navegador o escribe el código de 8 dígitos.",
      );
    }
  }
  async function move(type: string) {
    if (!customer || completed || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData();
    f.set("businessId", businessId);
    f.set("customerId", customer.id);
    f.set("type", type);
    if(type==='visit')f.set('ticketValue',ticketValue);
    if(type==='redeem')f.set('redemptionValue',redemptionValue);
    if(!operation.current)operation.current=crypto.randomUUID();
    f.set("operationId",operation.current);

    if (confirmed) f.set("confirm", "yes");
    try {
      if(type==="redeem"&&photo)f.set("photo",await compressPhoto(photo));
      const r = await fetch("/api/staff/movement", { method: "POST", body: f });
      if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Tu sesión venció. Vuelve a entrar para continuar.');
      const d = await r.json();
      if (!r.ok) throw Error(d.error||'No pudimos completar la operación. Inténtalo de nuevo.');
      setCustomer(d.customer);
      setTicketValue('');
      operation.current=null;
      setPhoto(null);
      setConfirmed(false);
      if(type==='visit'){
        const eligible=Boolean(d.customer.reward)&&Number(d.customer.balance)>=Number(d.customer.reward.points_cost);
        setVisitRegistered(eligible);
        setCompleted(!eligible);
      }else setCompleted(true);
      const earned = Number(d.customer.balance) - Number(customer.balance);
      const pointFeedback = type === "visit" && earned > 0 ? ` · +${earned} puntos sumados` : ` · saldo ${d.customer.balance} puntos`;
      setSuccess(d.success + " · " + d.customer.name + pointFeedback);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  return (
    <section className="scannerWorkspace nivalStaffFlow" aria-labelledby="staff-scanner-heading">
      <div className="scannerIntro">
        <small>ATENCIÓN AL CLIENTE</small>
        <h2 id="staff-scanner-heading">Registrar visita</h2>
        <p>Apunta la cámara al QR del cliente para encontrar su tarjeta.</p>
        <button
          className="scanButton"
          disabled={busy}
          onClick={camera ? stop : start}
        >
          {camera ? "Cerrar cámara" : "⌗  Escanear QR"}
        </button>
      </div>
      <div hidden={!camera} className="cameraFrame">
        <video ref={video} muted playsInline />
        <span>Alinea el QR dentro de la cámara</span>
      </div>
      <details className="manualLookup">
        <summary>¿No puedes escanear? Usa el código de 8 dígitos</summary>
        <form
          className="phoneSearch"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
        >
          <label>
            Código de tarjeta
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Escribe los 8 dígitos"
              pattern="[0-9]{8}"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g,'').slice(0,8))}
              required
            />
          </label>
          <button disabled={busy||code.length!==8}>
            {busy ? "Buscando…" : "Consultar tarjeta"}
          </button>
        </form>
      </details>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {customer && (
        <article className="scannedCustomer">
          <small>CLIENTE IDENTIFICADO</small>
          <h2>{customer.name}</h2>
          <p>
            <strong>{customer.balance}</strong> puntos actuales
          </p>
          {customer.reward ? <div className="staffRewardPreview" aria-live="polite">
            <small>PRÓXIMO PREMIO</small>
            <strong>{customer.reward.name}</strong>
            <p>{Math.max(Number(customer.reward.points_cost) - Number(customer.balance), 0) > 0
              ? `Le faltan ${Math.max(Number(customer.reward.points_cost) - Number(customer.balance), 0)} puntos`
              : "Ya reúne los puntos de este premio"}</p>
          </div> : <p className="staffRewardPreview"><small>PRÓXIMO PREMIO</small>El cliente aún no tiene un premio elegido o configurado.</p>}
          {!visitRegistered&&!completed&&<label className="ticketValueField">Total del ticket (MXN)<input type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" required value={ticketValue} onChange={e=>setTicketValue(e.target.value)} placeholder="Ej. 185.00"/></label>}
          {!visitRegistered&&!completed&&<button
            className="primary"
            disabled={busy||ticketValue===''||!Number.isFinite(Number(ticketValue))||Number(ticketValue)<=0||Number(ticketValue)>1000000}
            onClick={() => move("visit")}
          >
            {busy?"Registrando…":"Registrar visita"}
          </button>}
          {visitRegistered&&!completed&&<div className="redeemBox">
            <small className="staffStepLabel">VISITA REGISTRADA</small>
            {success&&<p className="staffVisitResult" role="status">{success}</p>}
            <p>Saldo actualizado: <strong>{customer.balance} puntos</strong></p>
            <h3>{customer.reward?.name || "Premio por elegir"}</h3>
            <p>
              {customer.reward
                ? Number(customer.balance) >= customer.reward.points_cost
                  ? "Premio disponible para entregar"
                  : `${Math.max(customer.reward.points_cost - Number(customer.balance), 0)} puntos para el premio`
                : "El cliente aún no tiene un premio seleccionado."}
            </p>
            {customer.reward &&
              Number(customer.balance) >= customer.reward.points_cost && (
                <>
                  <label>
                    Valor del producto entregado (MXN)
                    <input type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" required value={redemptionValue} onChange={e=>setRedemptionValue(e.target.value)} placeholder="Ej. 65.00"/>
                  </label>
                  <label>
                    Foto de evidencia · obligatoria
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      aria-describedby="redemption-photo-help"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    />
                    <small id="redemption-photo-help">Toma la foto del ticket o elige una imagen clara.</small>
                  </label>
                  {photo && photoPreview && <figure className="evidencePreview"><img src={photoPreview} alt="Vista previa del ticket seleccionado"/><figcaption>Revisa la foto antes de confirmar el canje.</figcaption></figure>}
                  <label className="consentLabel">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span>Confirmo que entregué este premio al cliente.</span>
                  </label>
                  <button
                    disabled={busy || !photo || !confirmed || redemptionValue==='' || !Number.isFinite(Number(redemptionValue)) || Number(redemptionValue)<=0 || Number(redemptionValue)>1000000}
                    onClick={() => move("redeem")}
                  >
                    {busy ? "Registrando…" : "Confirmar entrega del premio"}
                  </button>
                </>
              )}
          </div>}
          {completed&&<p className="staffVisitResult" role="status">{success||"Visita registrada. La pantalla volverá al escáner en un momento."}</p>}
        </article>
      )}
      {!customer&&<p className="notice">El total del ticket es obligatorio para registrar la visita.</p>}
    </section>
  );
}
