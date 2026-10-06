import {NextResponse} from "next/server";
import {verifyTurnstile} from "../../../../lib/security/turnstile.mjs";
import {issueTurnstileCookie,turnstileCookieMaxAge} from "../../../../lib/security/turnstile-cookie.mjs";
import {secret} from "../../../../lib/foundation/session";
import {assertSameOrigin} from "../../../../lib/points/security";
export async function POST(req:Request){
 try{
  await assertSameOrigin();
  const body=await req.json();const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  if(!await verifyTurnstile(String(body?.token||""),ip))return NextResponse.json({ok:false},{status:400});
  const r=NextResponse.json({ok:true});
  r.cookies.set("nival_turnstile",issueTurnstileCookie(secret()),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/api/auth",maxAge:turnstileCookieMaxAge});
  return r;
 }catch{return NextResponse.json({ok:false},{status:400});}
}
