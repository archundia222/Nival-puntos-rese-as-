import { NextResponse } from "next/server";
import {
  requireRole,
  requireBusiness,
} from "../../../../lib/foundation/session";
import { query, authScope } from "../../../../lib/foundation/db";
import { randomToken, sha256 } from "../../../../lib/foundation/security.mjs";
import {
  uuid,
  assertSameOrigin,
  message,
} from "../../../../lib/points/security";
export async function POST(req: Request) {
  try {
    await assertSameOrigin();
    const actor = await requireRole("staff", "owner");
    const data = await req.json(),
      b = actor.role === "staff" ? actor.businessId : data.businessId,
      c = data.customerId;
    if (!b || !uuid(b) || !uuid(c) || data.confirm !== true)
      throw Error("Invalid recovery");
    await requireBusiness(actor, b);
    const [r] = await query(
      authScope(actor.id),
      "select nival_pr_private.staff_customer($1,null,$2) data",
      [b, c],
    );
    const [business] = await query(
      actor,
      "select slug from nival_pr.businesses where id=$1",
      [b],
    );
    if (!r?.data || !business) throw Error("Not found");
    const token = randomToken();
    await query(
      authScope(actor.id),
      "select nival_pr_private.issue_recovery($1,$2,$3)",
      [b, c, sha256(token)],
    );
    const link = new URL(
      "/b/" + business.slug + "/recuperar?token=" + token,
      process.env.VERCEL_ENV === "preview"
        ? req.url
        : process.env.APP_URL || req.url,
    ).href;
    const text =
      "Hola " +
      r.data.name +
      ", aquí puedes recuperar tu tarjeta de " +
      business.slug +
      ": " +
      link +
      "\nEste enlace es personal, de un solo uso y vence en 15 minutos.";
    return NextResponse.json(
      {
        whatsapp:
          "https://wa.me/" + r.data.phone + "?text=" + encodeURIComponent(text),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return NextResponse.json({ error: message(e) }, { status: 400 });
  }
}
