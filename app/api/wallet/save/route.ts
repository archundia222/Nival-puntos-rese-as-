import { NextResponse } from 'next/server';
import { assertSameOrigin, card, publicBusiness } from '../../../../lib/points/security';
import { customerSaveUrl, walletReady } from '../../../../lib/wallet/server';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(req:Request) {
 const headers={'Cache-Control':'private, no-store'};
 try {
  await assertSameOrigin();
  const {slug}=await req.json();
  if(typeof slug!=='string')return NextResponse.json({error:'Tarjeta no disponible.'},{status:400,headers});
  const b=await publicBusiness(slug),c=b?.active?await card(b.id):null;
  if(!c)return NextResponse.json({error:'Abre tu tarjeta en este dispositivo para continuar.'},{status:401,headers});
  if(!walletReady())return NextResponse.json({error:'Google Wallet estará disponible cuando el negocio active la conexión.'},{status:503,headers});
  return NextResponse.json({url:await customerSaveUrl(b,c)},{headers});
 }catch{
  return NextResponse.json({error:'No pudimos preparar tu tarjeta en Google Wallet. Tus puntos están guardados; inténtalo de nuevo.'},{status:503,headers});
 }
}
