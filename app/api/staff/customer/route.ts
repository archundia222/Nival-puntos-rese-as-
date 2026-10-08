import {requireTool} from '../../../../lib/foundation/require-tool';
import { NextResponse } from "next/server";
import {
  requireRole,
  requireBusiness,
} from "../../../../lib/foundation/session";
import { query, authScope } from "../../../../lib/foundation/db";
import {
  uuid,
  mexicoPhone,
  assertSameOrigin,
  message,
} from "../../../../lib/points/security";
export async function POST(req: Request) {
  try {
    await assertSameOrigin();
    const actor = await requireRole("staff", "owner");
    const data = await req.json(),
      b = actor.role === "staff" ? actor.businessId : data.businessId;
    if (!b || !uuid(b)) throw Error("Invalid business");
    await requireBusiness(actor, b);
    await requireTool(actor,b);
    let id = data.customerId;
    const raw = String(id || "");
    if (raw.startsWith("NIVAL:")) id = raw.slice(6);
    if (id && !uuid(id))
      return NextResponse.json(
        { error: "Este QR no es una tarjeta de Nival." },
        { status: 400 },
      );
    const manual=String(data.phone||'').replace(/\s/g,'');
    if(!id && /^\d{8}$/.test(manual)){
      const [r]=await query(authScope(actor.id),'select nival_pr_private.staff_customer_code($1,$2) data',[b,manual]);
      return NextResponse.json(r?.data?{customer:r.data}:{error:'Código no encontrado en este negocio.'},{status:r?.data?200:404,headers:{'Cache-Control':'private, no-store'}});
    }
    const phone = mexicoPhone(String(data.phone || ""));
    if (!id && !phone)
      return NextResponse.json(
        { error: "Escribe 10 dígitos o escanea el QR personal." },
        { status: 400 },
      );
    const [r] = await query(
      authScope(actor.id),
      "select nival_pr_private.staff_customer($1,$2,$3) data",
      [b, phone, id || null],
    );
    return NextResponse.json(
      r?.data
        ? { customer: r.data }
        : { error: "No se encontró al cliente en este negocio." },
      {
        status: r?.data ? 200 : 404,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (e) {
    return NextResponse.json({ error: message(e) }, { status: 403 });
  }
}
