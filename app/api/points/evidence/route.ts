import { NextResponse } from "next/server";
import { requireRole } from "../../../../lib/foundation/session";
import { query, authScope } from "../../../../lib/foundation/db";
import { uuid } from "../../../../lib/points/security";
export async function GET(req: Request) {
  const actor = await requireRole("owner");
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!uuid(id)) return new NextResponse(null, { status: 404 });
  try {
    const [r] = await query(
      authScope(actor.id),
      "select * from nival_pr_private.read_photo($1)",
      [id],
    );
    if (!r) return new NextResponse(null, { status: 404 });
    return new NextResponse(Buffer.from(r.photo, "base64"), {
      headers: {
        "Content-Type": r.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
