import {createClient} from '@supabase/supabase-js';
import {notFound} from 'next/navigation';
import {supabaseConfig,supabaseConfigured} from '../../../lib/supabase/config';
import {googleReviewUrl} from '../../../lib/review-link';

export const dynamic='force-dynamic';
export const metadata={title:'Comparte tu experiencia | Nival',robots:{index:false,follow:false}};
export default async function ReviewPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))notFound();
 if(!supabaseConfigured())return <main className="dashboard"><h1>Enlace pendiente de activación</h1><p>El negocio todavía no tiene habilitada esta página. Inténtalo más tarde.</p></main>;
 const {url,key}=supabaseConfig();
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await client.from('npr_review_links').select('display_name,google_url').eq('id',id).maybeSingle();
 if(error)return <main className="dashboard"><h1>No pudimos cargar el enlace</h1><p role="alert">Inténtalo nuevamente en unos minutos.</p></main>;
 if(!data)notFound();
 const destination=googleReviewUrl(data.google_url);if(!destination)notFound();
 return <main className="dashboard publicReview"><small>NIVAL · RESEÑAS</small><h1>{data.display_name}</h1><section className="reviewBox"><h2>¿Cómo fue tu experiencia?</h2><p>Comparte tu opinión en Google. Tu reseña ayuda a otras personas a conocer el negocio.</p><a className="reviewCta" href={destination} target="_blank" rel="noopener noreferrer">Escribir una reseña en Google</a><p>Se abrirá Google, donde podrás elegir tu calificación y publicar tu comentario.</p></section></main>;
}
