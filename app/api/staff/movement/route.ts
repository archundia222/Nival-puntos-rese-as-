import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  requireRole,
  requireBusiness,
} from "../../../../lib/foundation/session";
import { query, authScope } from "../../../../lib/foundation/db";
import {
  uuid,
  assertSameOrigin,
  message,
} from "../../../../lib/points/security";
import { validatePhoto } from "../../../../lib/points/storage";
export async function POST(req: Request) {
  let uploaded: string | null = null;
  try {
    await assertSameOrigin();
    const actor = await requireRole("staff", "owner");
    const f = await req.formData(),
      b =
        actor.role === "staff"
          ? actor.businessId
          : String(f.get("businessId") || ""),
      c = String(f.get("customerId") || ""),
      type = f.get("type");
    if (
      !b ||
      !uuid(b) ||
      !uuid(c) ||
      !["visit", "redeem"].includes(String(type))
    )
      throw Error("Invalid input");
    await requireBusiness(actor, b);
    const [r] = await query(
      authScope(actor.id),
      "select nival_pr_private.staff_customer($1,null,$2) data",
      [b, c],
    );
    if (!r?.data) throw Error("Invalid customer");
    const customer = r.data;
    if (type === "redeem") {
      if (f.get("confirm") !== "yes")
        return NextResponse.json(
          { error: "Confirma la entrega del premio." },
          { status: 400 },
        );
      const file = f.get("photo");
      if (!(file instanceof File) || !file.size)
        return NextResponse.json(
          { error: "Toma o adjunta una foto antes de canjear." },
          { status: 400 },
        );
      if (
        !customer.reward ||
        Number(customer.balance) < customer.reward.points_cost
      )
        return NextResponse.json(
          { error: "El premio todavía no está disponible." },
          { status: 400 },
        );
      const { bytes, ext, type: mime } = await validatePhoto(file);
      const path = b + "/" + c + "/" + randomUUID() + "." + ext;
      await query(
        authScope(actor.id),
        "select nival_pr_private.store_photo($1,$2,$3,$4,$5)",
        [b, c, path, bytes.toString("base64"), mime],
      );
      uploaded = path;
    }
    const text =
      type === "visit"
        ? "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) select $1,$2,'visit',points_per_visit,$3 from nival_pr.programs where business_id=$1 returning id"
        : "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reward_id,evidence_path) select $1,$2,'redeem',-r.points_cost,$3,r.id,$5 from nival_pr.rewards r join nival_pr.programs p on p.id=r.program_id where r.id=$4 and p.business_id=$1 and r.active returning id";
    const [movement] = await query(
      actor,
      text,
      type === "visit"
        ? [b, c, actor.id]
        : [b, c, actor.id, customer.reward.id, uploaded],
    );
    if (!movement) throw Error("Programa no configurado");
    const [updated] = await query(
      authScope(actor.id),
      "select nival_pr_private.staff_customer($1,null,$2) data",
      [b, c],
    );
    return NextResponse.json({
      success:
        type === "visit"
          ? "Visita registrada"
          : "Premio entregado. Canje pendiente de revisión.",
      customer: updated.data,
    });
  } catch (e) {
    /* Never retry an uncertain insert or delete a possibly referenced evidence file. */ return NextResponse.json(
      { error: message(e), refresh: true },
      { status: 400 },
    );
  }
}
