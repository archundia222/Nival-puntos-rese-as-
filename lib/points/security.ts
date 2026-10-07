import "server-only";
import { headers, cookies } from "next/headers";
import { query, authScope } from "../foundation/db";
import { sha256 } from "../foundation/security.mjs";
export const uuid = (s: string) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
export function mexicoPhone(input: string) {
  const p = input.replace(/\D/g, "");
  return /^\d{10}$/.test(p) ? "52" + p : /^52\d{10}$/.test(p) ? p : null;
}
export async function publicBusiness(slug: string) {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const [r] = await query(
    authScope(),
    "select nival_pr_private.public_business($1) data",
    [slug],
  );
  return r?.data || null;
}
export async function card(b: string) {
  const t = (await cookies()).get("nival_customer_" + b)?.value;
  if (!t || !/^[A-Za-z0-9_-]{43}$/.test(t)) return null;
  const [r] = await query(
    authScope(),
    "select nival_pr_private.customer_card($1,$2) data",
    [b, sha256(t)],
  );
  return r?.data || null;
}
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") || h.get("host");
  const site = h.get("sec-fetch-site");
  if (!origin) {
    if (site === "same-origin" || site === "same-site") return;
    throw Error("Solicitud no autorizada.");
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw Error("Solicitud no autorizada.");
  }
  if (!host || originHost !== host) throw Error("Solicitud no autorizada.");
}
export function message(e: unknown) {
  const s = String((e as Error).message);
  for (const [pattern, m] of [
    [
      /Telefono ambiguo/,
      "Hay dos tarjetas con ese teléfono. Escanea el QR personal para elegir la correcta.",
    ],
    [
      /Visita demasiado reciente/,
      "Esta visita es demasiado reciente. Espera el intervalo configurado por el negocio.",
    ],
    [/Limite diario/, "Este cliente ya alcanzó el máximo de visitas de hoy."],
    [
      /Saldo insuficiente/,
      "Todavía no tiene puntos suficientes para este premio.",
    ],
    [
      /Foto obligatoria|Evidencia no verificada/,
      "El canje requiere una foto de evidencia válida.",
    ],
    [/Servicio no activo/, "El programa está suspendido o vencido."],
    [
      /Premio fuera|Selecciona tu meta/,
      "Ese premio no corresponde a la meta actual del cliente.",
    ],
    [/mas reciente/, "Primero revierte el canje más reciente de este cliente."],
    [/ya revertido/, "Este canje ya fue revertido."],
  ] as const) {
    if (pattern.test(s)) return m;
  }
  return "No se pudo completar. Revisa el acceso y vuelve a intentar.";
}
