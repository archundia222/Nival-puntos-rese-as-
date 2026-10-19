import QRCode from "qrcode";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { publicBusiness } from "../../../../lib/points/security";
export const runtime="nodejs";
export async function GET(req: Request) {
  const url = new URL(req.url),
    b = await publicBusiness(url.searchParams.get("slug") || "");
  if (!b) return new NextResponse(null, { status: 404 });
  const origin =
    process.env.APP_URL && process.env.VERCEL_ENV !== "preview"
      ? new URL(process.env.APP_URL).origin
      : url.origin;
  const target=origin + "/b/" + b.slug;
  const format=url.searchParams.get("format");
  if(format==="png"){
    const png=await QRCode.toBuffer(target,{type:"png",errorCorrectionLevel:"H",margin:4,width:900});
    return new NextResponse(new Uint8Array(png),{headers:{"Content-Type":"image/png","Content-Disposition":'attachment; filename="qr-'+b.slug+'.png"',"Cache-Control":"no-store"}});
  }
  if(format==="pdf"){
    const png=await QRCode.toBuffer(target,{type:"png",errorCorrectionLevel:"H",margin:4,width:900});
    const document=new PDFDocument({size:"A4",margin:54}),chunks:Buffer[]=[];
    const output=new Promise<Buffer>((resolve,reject)=>{document.on("data",chunk=>chunks.push(Buffer.from(chunk)));document.on("end",()=>resolve(Buffer.concat(chunks)));document.on("error",reject);});
    if(url.searchParams.get("minimal")==="1"){
      document.fontSize(18).fillColor("#173a2c").text(b.name,{align:"center"});
      document.image(png,(document.page.width-310)/2,210,{width:310,height:310});
      document.end();
      return new NextResponse(new Uint8Array(await output),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="qr-'+b.slug+'.pdf"',"Cache-Control":"no-store"}});
    }
    document.fontSize(10).fillColor("#557063").text("NIVAL · REGISTRO DE CLIENTES",{align:"center",characterSpacing:1.5});
    document.moveDown(1.5).fontSize(25).fillColor("#173a2c").text(b.name,{align:"center"});
    document.moveDown(.5).fontSize(14).fillColor("#40574a").text("Escanea para crear tu tarjeta de puntos",{align:"center"});
    document.image(png,(document.page.width-250)/2,220,{width:250,height:250});
    document.fontSize(11).fillColor("#52665a").text(target,60,500,{width:document.page.width-120,align:"center",link:target});
    document.fontSize(9).fillColor("#718174").text("Muestra este código en el mostrador. Hecho con Nival Tech.",60,550,{width:document.page.width-120,align:"center"});
    document.end();
    return new NextResponse(new Uint8Array(await output),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="registro-'+b.slug+'.pdf"',"Cache-Control":"no-store"}});
  }
  const svg = await QRCode.toString(target, {
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
