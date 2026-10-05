"use server";
import { kickWalletJobs } from "../wallet/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHmac, randomUUID } from "node:crypto";
import { query, transaction, authScope } from "./db";
import {
  requireRole,
  requireBusiness,
  secret,
  cookieOptions,
  staffCookie,
  routeCookie,
} from "./session";
import { randomToken, sha256, verifyPin, signedHint } from "./security.mjs";
import { mexicoPhone } from "../points/security";
import { getAuth } from "../backend/auth";
import {validateRegistration, legalVersion} from "./registration.mjs";
export type Result = { error?: string; success?: string; link?: string };
const val = (f: FormData, k: string) => String(f.get(k) || "").trim();
const uuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
function failure(error: unknown): Result {
  const message = String((error as { message?: string }).message || "");
  return {
    error: /Visita demasiado reciente/.test(message)
      ? "Esta visita es demasiado reciente."
      : /Limite diario/.test(message)
        ? "Este cliente alcanzó el límite de visitas del día."
        : /Saldo insuficiente/.test(message)
          ? "El cliente todavía no tiene puntos suficientes."
          : /Servicio no activo/.test(message)
            ? "Activa el servicio y registra su vigencia antes de sumar puntos."
            : /unique|duplicate/.test(message)
              ? "Ese teléfono o identificador ya está registrado."
              : "No se pudo completar la operación. Revisa tus datos y permisos.",
  };
}
export async function loginStaff(_: Result, f: FormData): Promise<Result> {
  const slug = val(f, "slug"),
    id = val(f, "staffId"),
    pin = val(f, "pin");
  if (!uuid(id) || !/^\d{6,8}$/.test(pin) || !/^[a-z0-9-]{1,100}$/.test(slug))
    return { error: "Revisa el negocio, tu identificador y el PIN." };
  try {
    const h = await headers();
    const ip = process.env.VERCEL
      ? h.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    const hash = (v: string) =>
      createHmac("sha256", secret()).update(v).digest("hex");
    const limits = await transaction(authScope(), [
      {
        text: "select nival_pr_private.claim_pin_attempt($1) as accepted",
        values: [hash("account:" + slug + ":" + id)],
      },
      {
        text: "select nival_pr_private.claim_pin_attempt($1) as accepted",
        values: [hash("ip:" + ip)],
      },
    ]);
    if (limits.some((rows) => !rows[0]?.accepted))
      return { error: "Demasiados intentos. Espera 15 minutos." };
    const [staff] = await query(
      authScope(),
      "select * from nival_pr_private.pin_identity($1,$2)",
      [slug, id],
    );
    if (!staff || !(await verifyPin(pin, staff.pin_hash)))
      return { error: "No se pudo entrar con esos datos." };
    const token = randomToken();
    await query(
      authScope(),
      "select nival_pr_private.issue_staff_session($1,$2,$3)",
      [staff.user_id, staff.business_id, sha256(token)],
    );
    const jar = await cookies();
    jar.set(staffCookie, token, cookieOptions);
    jar.set(routeCookie, signedHint("staff", secret()), cookieOptions);
  } catch (error) {
    return failure(error);
  }
  redirect("/staff");
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get(staffCookie)?.value;
  if (token)
    await query(
      authScope(),
      "select nival_pr_private.revoke_staff_session($1)",
      [sha256(token)],
    );
  jar.delete(staffCookie);
  jar.delete(routeCookie);
  await getAuth().signOut();
  redirect("/acceso");
}
export async function registerBusiness(
  _: Result,
  f: FormData,
): Promise<Result> {
  const actor = await requireRole("owner");
  const {data,error}=validateRegistration(f);
  if(error)return {error};
  try {
    await query(authScope(actor.id),
      "select nival_pr_private.register_business_complete($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [data.slug,data.name,data.giro,data.owner_name,data.phone,data.email,data.google_maps_url,true,legalVersion]);
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");
  return {
    success:
      "Negocio registrado. Nival confirmará el pago y activará tu servicio.",
  };
}
export async function addCustomer(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("owner");
  const b = val(f, "businessId"),
    name = val(f, "name"),
    phone = mexicoPhone(val(f, "phone"));
  if (!uuid(b) || !name || name.length > 100 || !phone)
    return { error: "Revisa nombre y teléfono mexicano (10 dígitos)." };
  try {
    await requireBusiness(actor, b);
    await query(
      actor,
      "insert into nival_pr.customers(id,business_id,name,phone) values($1,$2,$3,$4)",
      [randomUUID(), b, name, phone],
    );
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");
  return {
    success:
      "Cliente registrado. Su consentimiento se solicita al abrir la tarjeta.",
  };
}
export async function movement(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("owner", "staff");
  const b = val(f, "businessId"),
    c = val(f, "customerId"),
    kind = val(f, "type"),
    reward = val(f, "rewardId");
  if (kind === "redeem")
    return { error: "Usa el escáner y adjunta una foto para canjear." };
  if (
    !uuid(b) ||
    !uuid(c) ||
    !["visit", "redeem"].includes(kind) ||
    (kind === "redeem" && !uuid(reward))
  )
    return { error: "Movimiento inválido." };
  try {
    await requireBusiness(actor, b);
    const statement =
      kind === "visit"
        ? {
            text: "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) select $1,$2,'visit',p.points_per_visit,$3 from nival_pr.programs p where p.business_id=$1 returning id",
            values: [b, c, actor.id],
          }
        : {
            text: "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reward_id) select $1,$2,'redeem',-r.points_cost,$3,r.id from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where r.id=$4 and p.business_id=$1 and r.active returning id",
            values: [b, c, actor.id, reward],
          };
    const [row] = await query(actor, statement.text, statement.values);
    if (!row)
      return { error: "Configura primero un programa y un premio válido." };
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");
  kickWalletJobs();
  revalidatePath("/staff");
  return {
    success:
      kind === "visit"
        ? "Visita registrada."
        : "Canje registrado para revisión.",
  };
}
export async function saveProgram(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("owner");
  const b = val(f, "businessId"),
    name = val(f, "name"),
    mode = val(f, "mode"),
    points = Number(val(f, "points")),
    hours = Number(val(f, "hours")),
    max = Number(val(f, "max"));
  const color = val(f, "color");
  const logo = val(f, "logo");
  if (
    logo &&
    !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo) &&
    !/^https:\/\//.test(logo)
  )
    return { error: "Usa un logo PNG, JPEG, WebP o una URL HTTPS." };
  if (logo.length > 400000) return { error: "El logo es demasiado grande." };
  if (
    !uuid(b) ||
    !name ||
    name.length > 150 ||
    !["single", "choose", "sequence"].includes(mode) ||
    !Number.isInteger(points) ||
    points < 1 ||
    points > 1000 ||
    !Number.isFinite(hours) ||
    hours < 0 ||
    hours > 720 ||
    !Number.isInteger(max) ||
    max < 1 ||
    max > 100 ||
    !/^#[a-f0-9]{6}$/i.test(color)
  )
    return { error: "Revisa las reglas del programa." };
  try {
    await requireBusiness(actor, b);
    await query(
      actor,
      "insert into nival_pr.programs(business_id,name,mode,points_per_visit,color,rules,logo_url) values($1,$2,$3,$4,$5,$6::jsonb,$7) on conflict(business_id) do update set name=excluded.name,mode=excluded.mode,points_per_visit=excluded.points_per_visit,color=excluded.color,rules=excluded.rules,logo_url=excluded.logo_url",
      [
        b,
        name,
        mode,
        points,
        color,
        JSON.stringify({
          min_hours_between_visits: hours,
          max_visits_per_day: max,
        }),
        logo || null,
      ],
    );
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");
  kickWalletJobs();
  return { success: "Programa guardado." };
}
export async function addReward(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("owner");
  const b = val(f, "businessId"),
    name = val(f, "name"),
    cost = Number(val(f, "cost")),
    position = Number(val(f, "position"));
  if (
    !uuid(b) ||
    !name ||
    name.length > 150 ||
    !Number.isInteger(cost) ||
    cost < 1 ||
    !Number.isInteger(position) ||
    position < 0
  )
    return { error: "Revisa el premio, su costo y su posición." };
  try {
    await requireBusiness(actor, b);
    const [row] = await query(
      actor,
      "insert into nival_pr.rewards(program_id,name,points_cost,position) select id,$2,$3,$4 from nival_pr.programs where business_id=$1 returning id",
      [b, name, cost, position],
    );
    if (!row) return { error: "Primero guarda el programa." };
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");
  return { success: "Premio agregado." };
}
export async function customerLink(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("owner", "superadmin");
  const b = val(f, "businessId"),
    c = val(f, "customerId"),
    op = val(f, "operation");
  if (!uuid(b) || !uuid(c) || !["rotate", "disable"].includes(op))
    return { error: "Tarjeta inválida." };
  try {
    await requireBusiness(actor, b);
    const [business] = await query(
      actor,
      "select slug from nival_pr.businesses where id=$1",
      [b],
    );
    if (!business) throw Error("Not found");
    const token = op === "rotate" ? randomToken() : null;
    await query(
      authScope(actor.id),
      "select nival_pr_private.rotate_customer_token($1,$2,$3)",
      [b, c, token ? sha256(token) : null],
    );
    return {
      success: token
        ? "Enlace nuevo creado. El anterior dejó de funcionar."
        : "Tarjeta desactivada.",
      link: token ? `/b/${business.slug}/acceso?token=${token}` : undefined,
    };
  } catch (e) {
    return failure(e);
  }
}
export async function setBusinessStatus(
  _: Result,
  f: FormData,
): Promise<Result> {
  const actor = await requireRole("superadmin");
  const b = val(f, "businessId"),
    status = val(f, "status");
  if (
    !uuid(b) ||
    ![
      "registrado",
      "cotizando",
      "pago_pendiente",
      "activo",
      "por_vencer",
      "pausado",
      "cancelado",
    ].includes(status)
  )
    return { error: "Estado inválido." };
  try {
    const [row] = await query(
      actor,
      "update nival_pr.businesses set status=$2 where id=$1 returning id",
      [b, status],
    );
    if (!row) return { error: "Negocio no encontrado." };
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/admin");
  return { success: "Estado actualizado y auditado." };
}
export async function registerPayment(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("superadmin");
  const b = val(f, "businessId"),
    amount = Number(val(f, "amount")),
    method = val(f, "method"),
    start = val(f, "start"),
    end = val(f, "end"),
    reference = val(f, "reference");
  if (
    !uuid(b) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1000000 ||
    !["efectivo", "transferencia", "mercado_pago", "otro"].includes(method) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    end < start
  )
    return { error: "Revisa importe, método y período." };
  try {
    await transaction(actor, [
      {
        text: "insert into nival_pr.payments(business_id,amount,method,reference,period_start,period_end,registered_by) values($1,$2,$3,$4,$5,$6,$7)",
        values: [b, amount, method, reference, start, end, actor.id],
      },
      {
        text: "update nival_pr.businesses set status='activo',paid_until=greatest(coalesce(paid_until,'-infinity'),(($2::date+1)::timestamp at time zone 'America/Mexico_City')) where id=$1",
        values: [b, end],
      },
    ]);
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/admin");
  return { success: "Pago registrado y vigencia actualizada." };
}
export async function report(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("superadmin");
  const b = val(f, "businessId"),
    period = val(f, "period"),
    rating = Number(val(f, "rating")),
    total = Number(val(f, "total")),
    fresh = Number(val(f, "new")),
    answered = Number(val(f, "answered")),
    notes = val(f, "notes");
  if (
    !uuid(b) ||
    !/^\d{4}-\d{2}$/.test(period) ||
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5 ||
    [total, fresh, answered].some((n) => !Number.isInteger(n) || n < 0) ||
    fresh > total ||
    answered > total ||
    notes.length > 5000
  )
    return { error: "Revisa las métricas del reporte." };
  try {
    await query(
      actor,
      "insert into nival_pr.review_reports(business_id,period,rating,total_reviews,new_reviews,answered,notes,created_by) values($1,($2||'-01')::date,$3,$4,$5,$6,$7,$8) on conflict(business_id,period,period_kind) do update set rating=excluded.rating,total_reviews=excluded.total_reviews,new_reviews=excluded.new_reviews,answered=excluded.answered,notes=excluded.notes,created_by=excluded.created_by",
      [b, period, rating, total, fresh, answered, notes, actor.id],
    );
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/admin");
  revalidatePath("/panel");
  return { success: "Reporte mensual guardado." };
}
export async function enroll(_: Result, f: FormData): Promise<Result> {
  const slug = val(f, "slug"),
    name = val(f, "name"),
    phone = mexicoPhone(val(f, "phone"));
  if (
    !/^[a-z0-9-]{1,100}$/.test(slug) ||
    !name ||
    name.length > 100 ||
    !phone ||
    f.get("consent") !== "on"
  )
    return { error: "Completa tus datos y acepta el registro para continuar." };
  try {
    const hdr = await headers();
    const ip = process.env.VERCEL
      ? hdr.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    const key = createHmac("sha256", secret())
      .update("enroll:" + ip)
      .digest("hex");
    const [limit] = await query(
      authScope(),
      "select nival_pr_private.claim_pin_attempt($1) as accepted",
      [key],
    );
    if (!limit?.accepted)
      return { error: "Demasiados registros. Inténtalo en 15 minutos." };
    const token = randomToken();
    const [b] = await query(
      authScope(),
      "select nival_pr_private.public_business($1) as data",
      [slug],
    );
    if (!b?.data?.active) return { error: "Este programa no está disponible." };
    await query(
      authScope(),
      "select nival_pr_private.enroll_customer($1,$2,$3,$4)",
      [slug, name, phone, sha256(token)],
    );
    (await cookies()).set("nival_customer_" + b.data.id, token, {
      ...cookieOptions,
      maxAge: 365 * 86400,
    });
  } catch (e) {
    return {
      error: /unique|duplicate/.test(String((e as Error).message))
        ? "Ese teléfono ya está registrado. Pide al negocio que te entregue un nuevo acceso; escribir el teléfono no permite recuperar una tarjeta."
        : "No se pudo registrar tu tarjeta. Inténtalo de nuevo.",
    };
  }
  redirect("/b/" + slug);
}

export async function consentCard(_: Result, f: FormData): Promise<Result> {
  const slug = val(f, "slug");
  if (f.get("consent") !== "on")
    return { error: "Acepta el registro para consultar tus puntos." };
  try {
    const [row] = await query(
      authScope(),
      "select nival_pr_private.public_business($1) as data",
      [slug],
    );
    if (!row?.data?.id) throw Error("Not found");
    const token = (await cookies()).get("nival_customer_" + row.data.id)?.value;
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw Error("Invalid token");
    await query(
      authScope(),
      "select nival_pr_private.consent_customer($1,$2)",
      [row.data.id, sha256(token)],
    );
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/b/" + slug);
  return { success: "Registro aceptado." };
}

export async function chooseGoal(_: Result, f: FormData): Promise<Result> {
  const slug = val(f, "slug"),
    reward = val(f, "rewardId");
  if (!uuid(reward)) return { error: "Premio inválido." };
  try {
    const [row] = await query(
      authScope(),
      "select nival_pr_private.public_business($1) as data",
      [slug],
    );
    if (!row?.data?.id) throw Error("Not found");
    const token = (await cookies()).get("nival_customer_" + row.data.id)?.value;
    if (!token) throw Error("Invalid token");
    await query(authScope(), "select nival_pr_private.choose_goal($1,$2,$3)", [
      row.data.id,
      sha256(token),
      reward,
    ]);
  } catch (e) {
    return {
      error: /Goal locked/.test(String((e as Error).message))
        ? "Tu meta ya está elegida. Podrás elegir otra después de canjearla."
        : "No se pudo elegir ese premio.",
    };
  }
  revalidatePath("/b/" + slug);
  return { success: "Meta elegida." };
}
