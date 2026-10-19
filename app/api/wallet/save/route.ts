import { NextResponse } from 'next/server';
import { assertSameOrigin, card, publicBusiness } from '../../../../lib/points/security';
import { customerSaveUrl, walletReady, recordWalletPreference } from '../../../../lib/wallet/server';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(req:Request) {
 const headers={'Cache-Control':'private, no-store'};
 try {
  await assertSameOrigin();
  const {slug,notificationsOptIn=false}=await req.json();
  if(typeof notificationsOptIn!=='boolean')return NextResponse.json({error:'Consentimiento inválido.'},{status:400,headers});
  if(typeof slug!=='string')return NextResponse.json({error:'Tarjeta no disponible.'},{status:400,headers});
  const b=await publicBusiness(slug),c=b?.active?await card(b.id):null;
  if(!c)return NextResponse.json({error:'Abre tu tarjeta en este dispositivo para continuar.'},{status:401,headers});
  if(!walletReady())return NextResponse.json({error:'Google Wallet estará disponible cuando el negocio active la conexión.'},{status:503,headers});
  const url=await customerSaveUrl(b,c);
  await recordWalletPreference(c,b,notificationsOptIn);
  return NextResponse.json({url},{headers});
 }catch{
  return NextResponse.json({error:'No pudimos preparar tu tarjeta en Google Wallet. Tus puntos están guardados; inténtalo de nuevo.'},{status:503,headers});
 }
}
