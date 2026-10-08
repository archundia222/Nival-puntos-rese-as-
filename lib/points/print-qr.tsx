"use client";
import { useEffect, useState } from "react";
import { customerEntryUrl } from "./entry.mjs";
export function PrintQr({
  name,
  slug,
  logo,
}: {
  name: string;
  slug: string;
  logo?: string;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const entry = origin ? customerEntryUrl(origin, slug) : "";
  return (
    <section className="qrPrintSection">
      <div className="qrPrintable">
        <img
          src={"/api/points/qr?slug=" + slug}
          width="280"
          height="280"
          alt={"QR de " + name}
        />
        {logo && (
          <img className="printLogo" src={logo} alt={"Logo de " + name} />
        )}
        <h2>{name}</h2>
        <p>
          Escanea para crear tu tarjeta gratis.
          <br />
          Compra, muestra tu tarjeta y acumula puntos.
        </p>
        <small>
          {entry}
        </small>
      </div>
      <div className="actions">
        <a href={"/api/points/qr?slug=" + slug + "&download=1"} download>
          Descargar QR SVG
        </a>
        <button type="button" onClick={() => window.print()}>
          Imprimir cartel o guardar PDF
        </button>
      </div>
    </section>
  );
}
