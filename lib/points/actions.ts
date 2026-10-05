"use server";
import { revalidatePath } from "next/cache";
import { query, authScope } from "../foundation/db";
import { requireRole, requireBusiness } from "../foundation/session";
import { hashPin } from "../foundation/security.mjs";
import { uuid, message } from "./security";
import type { Result } from "../foundation/actions";
const val = (f: FormData, k: string) => String(f.get(k) || "").trim();
export async function manageStaff(_: Result, f: FormData): Promise<Result> {
  const actor = await requireRole("owner");
  const b = val(f, "businessId"),
    id = val(f, "staffId"),
    name = val(f, "name");
  if (!uuid(b) || (id && !uuid(id)))
    return { error: "Identificador inválido." };
  try {
    await requireBusiness(actor, b);
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
  const actor = await requireRole("owner");
  const b = val(f, "businessId"),
    d = val(f, "redemptionId"),
    op = val(f, "operation");
  if (!uuid(b) || !uuid(d) || !["approve", "reverse"].includes(op))
    return { error: "Canje inválido." };
  try {
    await requireBusiness(actor, b);
    await query(
      authScope(actor.id),
      "select nival_pr_private.review_redemption($1,$2,$3)",
      [b, d, op],
    );
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
  const actor = await requireRole("owner"),
    b = val(f, "businessId"),
    id = val(f, "rewardId"),
    name = val(f, "name"),
    cost = Number(val(f, "cost")),
    position = Number(val(f, "position")),
    active = f.get("active") === "on";
  if (
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
    await requireBusiness(actor, b);
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
      "update nival_pr.rewards r set name=$3,points_cost=$4,position=$5,active=$6 from nival_pr.programs p where r.id=$1 and p.id=r.program_id and p.business_id=$2 returning r.id",
      [id, b, name, cost, position, active],
    );
    if (!r) return { error: "No se encontró este premio." };
    revalidatePath("/panel/puntos");
    return { success: "Premio actualizado." };
  } catch (e) {
    return { error: message(e) };
  }
}
