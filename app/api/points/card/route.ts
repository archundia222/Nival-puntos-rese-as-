import { NextResponse } from "next/server";
import { card, publicBusiness } from "../../../../lib/points/security";
import { kickWalletJobs } from "../../../../lib/wallet/server";
export async function GET(req: Request) {
  const b = await publicBusiness(
    new URL(req.url).searchParams.get("slug") || "",
  );
  const c = b?.active ? await card(b.id) : null;
  if(c)kickWalletJobs();
  return NextResponse.json(
    c ? { card: c } : { error: "Tarjeta no disponible" },
    {
      status: c ? 200 : 404,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
