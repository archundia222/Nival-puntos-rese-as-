'use server';
import {revalidatePath} from 'next/cache';
import {randomUUID} from 'node:crypto';
import {guardAction} from '../foundation/action-guard';
import {query} from '../foundation/db';
import type {Result} from '../foundation/actions';
export async function saveTestimonial(_:Result,f:FormData):Promise<Result>{
 const actor=await guardAction(['superadmin'],f),name=String(f.get('businessName')||'').trim(),quote=String(f.get('quote')||'').trim(),author=String(f.get('author')||'').trim(),file=f.get('photo');
 if(!name||name.length>100||!quote||quote.length>600||!author||author.length>120||f.get('permission')!=='on')return {error:'Completa el local, experiencia y autorización.'};
 if(!(file instanceof File)||file.size>4*1024*1024||!file.size||!['image/jpeg','image/png','image/webp'].includes(file.type))return {error:'Usa una fotografía JPG, PNG o WebP de hasta 4 MB.'};
 try{const sharp=(await import('sharp')).default;const bytes=await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:20000000}).resize(1200,900,{fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();
 await query(actor,"insert into nival_pr.site_content(key,value_draft) values($1,$2::jsonb)",['testimonial_'+randomUUID().replaceAll('-',''),JSON.stringify({businessName:name,quote,author,photo:'data:image/webp;base64,'+bytes.toString('base64'),permission:true})]);revalidatePath('/admin');return {success:'Caso de éxito guardado para revisión.'};}catch{return {error:'No se pudo guardar. Verifica la fotografía y vuelve a intentar.'};}
}
