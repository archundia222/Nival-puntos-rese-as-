"use server";
import {requireTool} from '../foundation/require-tool';
import { kickWalletJobs } from "../wallet/server";
import { revalidatePath } from "next/cache";
import { query, authScope } from "../foundation/db";
import { requireBusiness } from "../foundation/session";
import { guardAction } from "../foundation/action-guard";
import { hashPin } from "../foundation/security.mjs";
import { uuid, message } from "./security";
import type { Result } from "../foundation/actions";
const val = (f: FormData, k: string) => String(f.get(k) || "").trim();
export async function manageStaff(_: Result, f: FormData): Promise<Result> {
  const actor = await guardAction(["owner"], f);
  const b = val(f, "businessId"),
    id = val(f, "staffId"),
    name = val(f, "name");
  if (!uuid(b) || (id && !uuid(id)))
    return { error: "Identificador inválido." };
  try {
    await requireTool(actor, b);
    const hash = id ? null : await hashPin(val(f, "pin"));
    const [r] = await query(
      authScope(actor.id),
      "select nival_pr_private.manage_staff($1,$2,$3,$4,$5) id",
      [b, id || null, name, hash, f.get("active") === "true"],
    );
    revalidatePath("/panel/puntos");
    return {
      success: id
        ? "Acceso actualizado al instante."
        : "Mesero creado. Identificador: " + r.id,
    };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function reviewRedemption(
  _: Result,
  f: FormData,
): Promise<Result> {
  const actor = await guardAction(["owner"], f);
  const b = val(f, "businessId"),
    d = val(f, "redemptionId"),
    op = val(f, "operation");
  if (!uuid(b) || !uuid(d) || !["approve", "reverse"].includes(op))
    return { error: "Canje inválido." };
  try {
    await requireTool(actor, b);
    await query(
      authScope(actor.id),
      "select nival_pr_private.review_redemption($1,$2,$3)",
      [b, d, op],
    );
    kickWalletJobs();
    revalidatePath("/panel/puntos");
    return {
      success:
        op === "approve"
          ? "Canje aprobado."
          : "Canje revertido. Se restituyeron los puntos mediante un ajuste.",
    };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function editReward(_: Result, f: FormData): Promise<Result> {
  const actor = await guardAction(["owner"], f),
    b = val(f, "businessId"),
    id = val(f, "rewardId"),
    name = val(f, "name"),
    cost = Number(val(f, "cost")),
    position = Number(val(f, "position")),
    active = f.get("active") === "on",
    expiry = val(f,"expiry"),stock = val(f,"stock")?Number(val(f,"stock")):null,
    weight = Number(val(f,"weight")||1);
  if (
    (stock!==null&&(!Number.isSafeInteger(stock)||stock<0||stock>100000))||(expiry&&!/^\d{4}-\d{2}-\d{2}$/.test(expiry))||
    !Number.isInteger(weight)||weight<1||weight>100||
    !uuid(b) ||
    !uuid(id) ||
    !name ||
    name.length > 150 ||
    !Number.isInteger(cost) ||
    cost < 1 ||
    cost > 100000 ||
    !Number.isInteger(position) ||
    position < 0
  )
    return { error: "Revisa el nombre, los puntos y el orden." };
  try {
    await requireTool(actor, b);
    const [locked] = await query(
      actor,
      "select g.customer_id from nival_pr.customer_goals g join nival_pr.customers c on c.id=g.customer_id where g.reward_id=$1 and c.business_id=$2 and g.locked limit 1",
      [id, b],
    );
    if (locked)
      return {
        error:
          "Este premio tiene metas bloqueadas. Podrás editarlo cuando esos clientes lo canjeen.",
      };
    const [r] = await query(
      actor,
      "update nival_pr.rewards r set name=$3,points_cost=$4,position=$5,active=$6,weight=$7,expires_at=case when $8='' then null else (($8::date+1)::timestamp at time zone 'America/Mexico_City') end,stock=$9 from nival_pr.programs p where r.id=$1 and p.id=r.program_id and p.business_id=$2 returning r.id",
      [id, b, name, cost, position, active,weight,expiry,stock],
    );
    if (!r) return { error: "No se encontró este premio." };
    revalidatePath("/panel/puntos");
    return { success: "Premio actualizado." };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function adjustPoints(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),b=val(f,'businessId'),c=val(f,'customerId'),delta=Number(val(f,'points')),reason=val(f,'reason');
 if(!uuid(b)||!uuid(c)||!Number.isInteger(delta)||!delta||Math.abs(delta)>100000||reason.length<5||reason.length>500)return {error:'Indica los puntos a sumar o restar y explica el motivo (5 a 500 caracteres).'};
 try{await requireTool(actor,b);await query(authScope(actor.id),'select nival_pr_private.manual_adjustment($1,$2,$3,$4,$5)',[b,c,delta,reason,crypto.randomUUID()]);kickWalletJobs();revalidatePath('/panel');return {success:'Ajuste registrado en el historial. El saldo anterior no fue editado.'};}catch(e){return {error:message(e)};}
}
export async function removeReward(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],f),b=val(f,'businessId'),id=val(f,'rewardId');
 if(!uuid(b)||!uuid(id)||f.get('confirmed')!=='on')return {error:'Confirma que quieres retirar este premio.'};
 try{await requireTool(actor,b);const [r]=await query(actor,"update nival_pr.rewards r set active=false from nival_pr.programs p where r.id=$1 and p.id=r.program_id and p.business_id=$2 returning r.id",[id,b]);if(!r)return {error:'Premio no encontrado.'};revalidatePath('/panel/puntos');return {success:'Premio retirado. Su historial de canjes se conserva.'};}catch{return {error:'No se puede retirar un premio con metas pendientes. Conserva el premio hasta entregar esas metas.'};}
}
