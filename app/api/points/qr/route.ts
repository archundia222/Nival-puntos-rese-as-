import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { publicBusiness } from "../../../../lib/points/security";
export async function GET(req: Request) {
  const url = new URL(req.url),
    b = await publicBusiness(url.searchParams.get("slug") || "");
  if (!b) return new NextResponse(null, { status: 404 });
  const origin =
    process.env.APP_URL && process.env.VERCEL_ENV !== "preview"
      ? new URL(process.env.APP_URL).origin
      : url.origin;
  const svg = await QRCode.toString(origin + "/b/" + b.slug, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 4,
    width: 900,
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition":
        (url.searchParams.has("download") ? "attachment" : "inline") +
        '; filename="qr-' +
        b.slug +
        '.svg"',
      "Cache-Control": "no-store",
    },
  });
}
