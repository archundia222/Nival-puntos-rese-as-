"use server";
import {requireTool} from './require-tool';
import { kickWalletJobs } from "../wallet/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHmac, randomUUID } from "node:crypto";
import { query, transaction, authScope, systemQuery } from "./db";
import {
  requireRole,
  requireBusiness,
  secret,
  cookieOptions,
  staffCookie,
  routeCookie,
  adminCookie,
} from "./session";
import { randomToken, sha256, signedHint } from "./security.mjs";
import { mexicoPhone } from "../points/security";
import {guardAction,guardPublicAction} from "./action-guard";
import { getAuth } from "../backend/auth";
import {validateRegistration, businessSlug, legalVersion} from "./registration.mjs";
import {verifyTurnstile} from "../security/turnstile.mjs";
import {trustedClientIp} from "../security/client-ip";
export type Result = { error?: string; success?: string; link?: string; copyText?:string;copyLabel?:string };
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
export async function logout() {
  const actor=await guardAction(["superadmin","owner","staff"]);
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
  jar.delete(adminCookie);
  await getAuth().signOut();
  redirect(actor.role==="superadmin"?"/acceso-administrador":"/acceso");
}
export async function registerBusiness(
  _: Result,
  f: FormData,
): Promise<Result> {
  const actor = await guardAction(["owner"],f);
  if (!val(f, "slug")) f.set("slug", businessSlug(val(f, "name"), randomUUID()));
  const {data,error}=validateRegistration(f);
  if(error)return {error};
  try {
    const [registered]=await query(authScope(actor.id),
      "select nival_pr_private.register_business_plan_complete($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) id",
      [data.slug,data.name,data.giro,data.owner_name,data.phone,data.email,data.google_maps_url,true,legalVersion,Number(val(f,"plan_price")||399)]);
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
  const actor = await guardAction(["owner"],f);
  const b = val(f, "businessId"),
    name = val(f, "name"),
    phone = mexicoPhone(val(f, "phone"));
  if (!uuid(b) || !name || name.length > 100 || !phone)
    return { error: "Revisa nombre y teléfono mexicano (10 dígitos)." };
  try {
    await requireTool(actor, b);
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
  const actor = await guardAction(["owner", "staff"],f);
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
    await requireTool(actor, b);
    const statement =
      kind === "visit"
        ? {
            text: "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) select $1,$2,'visit',case when p.rules->>'double_points_weekday'=extract(dow from (now() at time zone 'America/Mexico_City'))::integer::text then p.points_per_visit*2 else p.points_per_visit end,$3 from nival_pr.programs p where p.business_id=$1 returning id",
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
  const actor = await guardAction(["owner"],f);
  const b = val(f, "businessId"),
    name = val(f, "name"),
    mode = val(f, "mode"),
    points = Number(val(f, "points")),
    hours = 0,
    max = 2147483647,
    doublePointsDay=val(f,"doublePointsDay");
  const color = val(f, "color");
  const logo = val(f, "logo");
  const rewardName = val(f, "rewardName"), rewardCost = Number(val(f, "rewardCost"));
  const primaryRewardId = val(f, "primaryRewardId");
  let rewardOrder: string[] = [];
  try { const parsed=JSON.parse(val(f,"rewardOrder")||"[]"); if(!Array.isArray(parsed)||parsed.length>100||parsed.some(id=>typeof id!=="string"||!uuid(id))||new Set(parsed).size!==parsed.length)throw new Error(); rewardOrder=parsed; } catch { return {error:"Revisa el orden de los premios."}; }
  const cardEnabled = val(f, "cardEnabled") === "on";
  let cardDesign: Record<string, unknown> = {};
  let campaignRules: { strategy: "manual" | "random"; targets: Record<string, string[]>; assignmentScope: "all" | "segments"; segmentModes: Record<string, "sequence" | "surprise" | "choose"> };
  try {
    const parsed = JSON.parse(val(f, "campaignRules") || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !["manual", "random"].includes(parsed.strategy)) throw new Error();
    const targets = parsed.targets || {};
    const keys = ["all", "new", "frequent", "at_risk", "lost", "absent"];
    if (!targets || typeof targets !== "object" || Array.isArray(targets) || Object.keys(targets).some((key) => !keys.includes(key))) throw new Error();
    const clean: Record<string, string[]> = {};
    for (const key of keys) {
      const ids = targets[key] ?? [];
      if (!Array.isArray(ids) || ids.length > 10 || ids.some((id: unknown) => typeof id !== "string" || !uuid(id))) throw new Error();
      clean[key] = [...new Set(ids)];
    }
    const segmentModes: Record<string, "sequence" | "surprise" | "choose"> = {};
    if(parsed.segmentModes && (typeof parsed.segmentModes!=="object"||Array.isArray(parsed.segmentModes)||Object.keys(parsed.segmentModes).some((key:string)=>!keys.includes(key)||!["sequence","surprise","choose"].includes(parsed.segmentModes[key]))))throw new Error();
    for(const key of keys)if(key!=="all")segmentModes[key]=parsed.segmentModes?.[key]||"sequence";
    campaignRules = { strategy: parsed.strategy, targets: clean, assignmentScope:parsed.assignmentScope==="segments"?"segments":"all", segmentModes };
  } catch { return { error: "Revisa la selección de premios por grupo." }; }
  try {
    const parsed = JSON.parse(val(f, "cardDesign") || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      cardDesign = {
        theme: ["minimal", "nival", "botanico", "noche"].includes(parsed.theme) ? parsed.theme : "minimal",
        headline: String(parsed.headline || "Cliente de ejemplo").slice(0, 60),
        footer: String(parsed.footer || "").slice(0, 80),
        secondaryColor: /^#[a-f0-9]{6}$/i.test(String(parsed.secondaryColor||"")) ? String(parsed.secondaryColor) : "#cfe87a",
        textColor: /^#[a-f0-9]{6}$/i.test(String(parsed.textColor||"")) ? String(parsed.textColor) : "#ffffff",
        pointIcon: ["nival","star","heart","coffee"].includes(parsed.pointIcon) ? parsed.pointIcon : "nival",
        pointActive: /^#[a-f0-9]{6}$/i.test(String(parsed.pointActive||"")) ? String(parsed.pointActive) : "#cfe87a",
        pointInactive: /^#[a-f0-9]{6}$/i.test(String(parsed.pointInactive||"")) ? String(parsed.pointInactive) : "#dbe4dc",
        pointView: parsed.pointView === "bar" ? "bar" : "grid",
        expiryMonths: parsed.expiryMonths === "" || parsed.expiryMonths == null ? "" : String(Math.max(1,Math.min(60,Number(parsed.expiryMonths)||6))),
        rewardExpiryMode: ["none","same_visit","duration"].includes(parsed.rewardExpiryMode) ? parsed.rewardExpiryMode : "none",
        rewardExpiryValue: String(Math.max(1,Math.min(365,Math.trunc(Number(parsed.rewardExpiryValue)||1)))),
        rewardExpiryUnit: ["days","weeks","months"].includes(parsed.rewardExpiryUnit) ? parsed.rewardExpiryUnit : "months",
        askBirthday: parsed.askBirthday === true,
        terms: String(parsed.terms || "").slice(0, 2000),
        whatsapp: String(parsed.whatsapp || "").replace(/\D/g, "").slice(0, 15),
        address: String(parsed.address || "").slice(0, 240),
        instagram: String(parsed.instagram || "").slice(0, 100),
        facebook: String(parsed.facebook || "").slice(0, 150),
        ...(typeof parsed.squareLogo === "string" && parsed.squareLogo.length <= 400000 && (/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(parsed.squareLogo)) ? { squareLogo: parsed.squareLogo } : {}),
        ...(Number.isInteger(parsed.backgroundX) ? { backgroundX: Math.max(0,Math.min(100,parsed.backgroundX)) } : {}),
        ...(Number.isInteger(parsed.backgroundY) ? { backgroundY: Math.max(0,Math.min(100,parsed.backgroundY)) } : {}),
        ...(Number.isInteger(parsed.logoX) ? { logoX: Math.max(0,Math.min(100,parsed.logoX)) } : {}),
        ...(Number.isInteger(parsed.logoY) ? { logoY: Math.max(0,Math.min(100,parsed.logoY)) } : {}),
        ...(typeof parsed.background === "string" && parsed.background.length <= 400000 && /^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(parsed.background) ? { background: parsed.background } : {}),
      };
    }
  } catch { return { error: "No se pudo guardar el diseño de la tarjeta." }; }
  if (JSON.stringify(cardDesign).length > 420000) return { error: "La imagen de fondo es demasiado grande." };
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
    !["single", "choose", "sequence", "surprise"].includes(mode) ||
    !Number.isInteger(points) ||
    points < 1 ||
    points > 1000 ||
    !Number.isFinite(hours) ||
    hours < 0 ||
    hours > 720 ||
    !Number.isInteger(max) ||
    max < 1 ||
    max > 2147483647 ||
    (doublePointsDay!==''&&(!/^\d$/.test(doublePointsDay)||Number(doublePointsDay)>6))||
    !/^#[a-f0-9]{6}$/i.test(color) ||
    !uuid(primaryRewardId) || !rewardName || rewardName.length > 150 || !Number.isInteger(rewardCost) || rewardCost < 1 || rewardCost > 100000
  )
    return { error: "Revisa las reglas del programa." };
  try {
    await requireTool(actor, b);
    const [selectedReward] = await query(actor, "select r.id from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.id=$2 and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0)", [b, primaryRewardId]);
    if (!selectedReward) return { error: "Elige una promoción activa de tu catálogo. Si aún no tienes, créala en Tarjetas → Premios y recompensas." };
    const promotionIds = [...new Set(Object.values(campaignRules.targets).flat())];
    const validPromotions = await query(actor, "select r.id from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active and (r.expires_at is null or r.expires_at>now()) and (r.stock is null or r.stock>0) and r.id=any($2::uuid[])", [b, promotionIds]);
    if (validPromotions.length !== promotionIds.length) return { error: "Una promoción seleccionada ya no está activa. Actualiza la selección y vuelve a publicar." };
    const activeReward = await query(actor,"select r.id from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active order by r.position,r.id limit 1",[b]);
    let rewardPositions:number[]=[];
    let rewardPositionOffset=0;
    if(rewardOrder.length){
      const existing=await query(actor,"select r.id,r.position from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1 and r.active and r.id=any($2::uuid[]) order by r.position,r.id",[b,rewardOrder]);
      if(existing.length!==rewardOrder.length)return {error:"La lista de premios cambió. Actualiza la página e inténtalo de nuevo."};
      rewardPositions=existing.map((row:any)=>Number(row.position));
      const [maximum]=await query(actor,"select coalesce(max(r.position),-1)::int max_position from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where p.business_id=$1",[b]);
      rewardPositionOffset=Number(maximum?.max_position??-1);
      if(rewardPositionOffset+rewardOrder.length>2147483647)return {error:"No se pudo reordenar la lista porque alcanzó su límite. Ajusta el orden de los premios e inténtalo de nuevo."};
    }
    if (activeReward.length && !campaignRules.targets.all.length) return { error: "Asigna al menos un premio a Todos. Los demás grupos son opcionales." };
    await transaction(actor, [
      { text: "insert into nival_pr.programs(business_id,name,mode,points_per_visit,color,rules,logo_url,card_enabled,redemption_mode,reward_validity_days) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10) on conflict(business_id) do update set name=excluded.name,mode=excluded.mode,points_per_visit=excluded.points_per_visit,color=excluded.color,rules=(coalesce(programs.rules, '{}'::jsonb)-'catalog_only') || excluded.rules,logo_url=excluded.logo_url,card_enabled=excluded.card_enabled,redemption_mode=excluded.redemption_mode,reward_validity_days=excluded.reward_validity_days", values: [
        b,
        name,
        mode,
        points,
        color,
        JSON.stringify({
          min_hours_between_visits: hours,
          max_visits_per_day: max,
          double_points_weekday:doublePointsDay===''?null:Number(doublePointsDay),
          bonus_multiplier:2,
          card_design: cardDesign,
          campaign_rules: campaignRules,
        }),
        logo || null,
        cardEnabled,
        cardDesign.rewardExpiryMode === "duration" ? "validity" : "immediate",
        Math.min(365, Math.max(1, Number(cardDesign.rewardExpiryValue || 7) * (cardDesign.rewardExpiryUnit === "days" ? 1 : cardDesign.rewardExpiryUnit === "weeks" ? 7 : 30))),
      ] },
      ...(rewardOrder.length?[
        {text:"update nival_pr.rewards r set position=$3::int+ordered.ordinality::int from unnest($2::uuid[]) with ordinality ordered(id,ordinality),nival_pr.programs p where p.business_id=$1 and r.program_id=p.id and r.id=ordered.id",values:[b,rewardOrder,rewardPositionOffset]},
        {text:"update nival_pr.rewards r set position=ordered.position from unnest($2::uuid[],$3::int[]) ordered(id,position),nival_pr.programs p where p.business_id=$1 and r.program_id=p.id and r.id=ordered.id",values:[b,rewardOrder,rewardPositions]},
      ]:[]),
    ]);
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");revalidatePath("/panel/puntos");
  kickWalletJobs();
  return { success: "Tarjeta publicada. Los clientes ya ven estos cambios." };
}
export async function setCardEnabled(_:Result,f:FormData):Promise<Result>{
  const actor=await guardAction(["owner"],f),businessId=val(f,"businessId"),enabled=val(f,"enabled")==="true";
  if(!uuid(businessId))return {error:"Negocio inválido."};
  try{await requireTool(actor,businessId);const [row]=await query(actor,"update nival_pr.programs set card_enabled=$2 where business_id=$1 returning id",[businessId,enabled]);if(!row)return {error:"Primero configura la tarjeta de puntos."};revalidatePath("/panel/puntos");revalidatePath("/b");kickWalletJobs();return {success:enabled?"Tarjeta activada. El personal ya puede registrar puntos.":"Tarjeta desactivada. Los saldos e historiales se conservan."};}catch(e){return failure(e);}
}
export async function addReward(_: Result, f: FormData): Promise<Result> {
  const actor = await guardAction(["owner"],f);
  const b = val(f, "businessId"),
    name = val(f, "name"),
    photoUrl=val(f,"photoUrl"),
    cost = Number(val(f, "cost")),
    position = Number(val(f, "position")),
    rewardType=val(f,'rewardType')||'product',
    valueRaw=val(f,'valueMxn'),
    valueMxn=valueRaw===''?null:Number(valueRaw);
  if (
    !uuid(b) ||
    !name ||
    name.length > 150 ||
    (photoUrl.length>300000||photoUrl&&!(/^https:\/\//.test(photoUrl)||/^data:image\/jpeg;base64,/.test(photoUrl)))||
    !['discount','product'].includes(rewardType)||
    (valueMxn!==null&&(!Number.isFinite(valueMxn)||valueMxn<0||valueMxn>1000000))||
    !Number.isInteger(cost) ||
    cost < 1 || cost > 100000 ||
    !Number.isInteger(position) ||
    position < 0
  )
    return { error: "Revisa el premio, su costo y su posición." };
  try {
    await requireTool(actor, b);
    const results=await transaction(actor,[
      {text:"insert into nival_pr.programs(business_id,name,mode,points_per_visit,color,rules,card_enabled) values($1,'Programa de puntos','single',1,'#f4f4f0','{\"min_hours_between_visits\":0,\"max_visits_per_day\":2147483647,\"catalog_only\":true}',false) on conflict(business_id) do nothing",values:[b]},
      {text:"insert into nival_pr.rewards(program_id,name,points_cost,position,photo_url,reward_type,value_mxn) select id,$2,$3,$4,nullif($5,''),$6,$7 from nival_pr.programs where business_id=$1 returning id",values:[b,name,cost,position,photoUrl,rewardType,valueMxn]},
    ]);
    const [row]=results[1]||[];
    if (!row) return { error: "Configura y guarda tu tarjeta en «Mis tarjetas» antes de agregar otro premio." };
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/panel");revalidatePath("/panel/puntos");
  return { success: "Promoción publicada en tu catálogo. Ya puedes elegirla al configurar la tarjeta." };
}
export async function customerLink(_: Result, f: FormData): Promise<Result> {
  const actor = await guardAction(["owner", "superadmin"],f);
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
  const actor = await guardAction(["superadmin"],f);
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
  const actor = await guardAction(["superadmin"],f);
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
  const actor = await guardAction(["superadmin"],f);
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
  await guardPublicAction();
  const hdr = await headers();
  const ip = trustedClientIp(hdr);
  if(!await verifyTurnstile(val(f,"cf-turnstile-response"),ip).catch(()=>false))return {error:"Confirma que no eres un robot."};
  const slug = val(f, "slug"),
    name = val(f, "name"),
    phone = mexicoPhone(val(f, "phone")),
    birthDate=val(f,"birthDate");
  if (
    !/^[a-z0-9-]{1,100}$/.test(slug) ||
    !name ||
    name.length > 100 ||
    !phone ||
    f.get("consent") !== "on"
  )
    return { error: "Completa tus datos y acepta el registro para continuar." };
  try {

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
    if(!b.data.program?.id)return {error:"El negocio está preparando su programa. Inténtalo más tarde."};
    const [programSettings]=await systemQuery("select p.rules->'card_design'->>'askBirthday' as ask_birthday from nival_pr.programs p where p.business_id=$1",[b.data.id]);
    const askBirthday=programSettings?.ask_birthday==='true'||b.data.program?.rules?.card_design?.askBirthday===true;
    const parsedBirthday=birthDate?new Date(birthDate+"T00:00:00.000Z"):null;
    if(birthDate&&(!askBirthday||!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)||!parsedBirthday||Number.isNaN(parsedBirthday.getTime())||parsedBirthday.toISOString().slice(0,10)!==birthDate||birthDate>new Date().toISOString().slice(0,10)))return {error:"Revisa el cumpleaños opcional."};
    await query(authScope(),askBirthday
      ? "select nival_pr_private.enroll_customer_with_birthday($1,$2,$3,$4,$5,$6)"
      : "select nival_pr_private.enroll_customer_legal($1,$2,$3,$4,$5)",
      askBirthday?[slug,name,phone,sha256(token),f.get("marketing_consent")==="on",birthDate||null]:[slug,name,phone,sha256(token),f.get("marketing_consent")==="on"]);
    (await cookies()).set("nival_customer_" + b.data.id, token, {
      ...cookieOptions,
      maxAge: 365 * 86400,
    });
  } catch (e) {
    return {
      error: /Program not ready/.test(String((e as Error).message))
        ? "El negocio está preparando sus premios. Pídele que termine la configuración antes de crear tu tarjeta."
        : "No se pudo registrar tu tarjeta. Inténtalo de nuevo.",
    };
  }
  redirect("/b/" + slug);
}

export async function recoverCustomerByPhone(_: Result, f: FormData): Promise<Result> {
  await guardPublicAction();
  const hdr=await headers(),ip=trustedClientIp(hdr),slug=val(f,"slug"),phone=mexicoPhone(val(f,"phone"));
  if(!/^[a-z0-9-]{1,100}$/.test(slug)||!phone)return {error:"Escribe el teléfono registrado con el negocio."};
  if(!await verifyTurnstile(val(f,"cf-turnstile-response"),ip).catch(()=>false))return {error:"Confirma que no eres un robot."};
  try {
    const hash=(v:string)=>createHmac("sha256",secret()).update(v).digest("hex"),limits=await transaction(authScope(),[
      {text:"select nival_pr_private.claim_pin_attempt($1) accepted",values:[hash("card-recovery-ip:"+ip)]},
      {text:"select nival_pr_private.claim_pin_attempt($1) accepted",values:[hash("card-recovery-phone:"+slug+":"+phone)]},
    ]);
    if(limits.some(x=>!x[0]?.accepted))return {error:"Demasiados intentos. Inténtalo en 15 minutos."};
    const [b]=await query(authScope(),"select nival_pr_private.public_business($1) data",[slug]);
    if(!b?.data?.id)return {error:"No encontramos una tarjeta con ese teléfono en este negocio."};
    const token=randomToken(),[row]=await query(authScope(),"select nival_pr_private.recover_customer_by_phone($1,$2,$3) id",[slug,phone,sha256(token)]);
    if(!row?.id)return {error:"No encontramos una tarjeta con ese teléfono en este negocio."};
    (await cookies()).set("nival_customer_"+b.data.id,token,{...cookieOptions,maxAge:365*86400});
  } catch { return {error:"No se pudo recuperar la tarjeta. Inténtalo de nuevo."}; }
  redirect("/b/"+slug);
}

export async function consentCard(_: Result, f: FormData): Promise<Result> {
  await guardPublicAction();
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
      "select nival_pr_private.consent_customer_legal($1,$2,$3)",
      [row.data.id, sha256(token), f.get("marketing_consent")==="on"],
    );
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/b/" + slug);
  return { success: "Registro aceptado." };
}

export async function chooseGoal(_: Result, f: FormData): Promise<Result> {
  await guardPublicAction();
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
