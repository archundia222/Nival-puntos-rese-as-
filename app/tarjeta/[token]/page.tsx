import {notFound} from 'next/navigation';
import {cardTokenValid} from '../../../lib/customer-card';
import {customerCardsConfigured,readCustomerCard} from '../../../lib/supabase/customer-card';
export const dynamic='force-dynamic';
export const metadata={title:'Tu tarjeta de puntos | Nival',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function CustomerCard({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!cardTokenValid(token))notFound();
 if(!customerCardsConfigured())return <main className="dashboard publicReview"><h1>Tarjeta pendiente de activación</h1><p>El negocio todavía no tiene habilitada la consulta de puntos.</p></main>;
 let card;try{card=await readCustomerCard(token);}catch{return <main className="dashboard publicReview"><h1>No pudimos consultar tus puntos</h1><p role="alert">Inténtalo en unos minutos. Tu saldo no se ha modificado.</p></main>;}
 if(!card)notFound();
 return <main className="dashboard publicReview"><small>NIVAL · TU TARJETA</small><h1>{card.businessName}</h1><section className="reviewBox pointCard"><h2>Tu saldo</h2><p className="pointBalance">{card.balance}<span> puntos</span></p><label htmlFor="pointsProgress">{Math.min(card.balance,card.goal)} de {card.goal} puntos para tu próximo premio</label><progress id="pointsProgress" max={card.goal} value={Math.min(card.balance,card.goal)}/><h2>{card.rewardName}</h2><p>{card.ready?'Ya puedes pedir tu premio en el negocio.':`Te faltan ${card.remaining} puntos.`}</p><p>El negocio registra tus visitas y entrega el premio. Abrir esta página no suma ni descuenta puntos.</p></section><p>Conserva este enlace para consultar tu saldo. Quien lo tenga podrá ver tus puntos.</p></main>;
}
