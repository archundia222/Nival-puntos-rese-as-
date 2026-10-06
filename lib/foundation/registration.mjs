export const giros=['Cafetería / restaurante','Barbería / estética','Lavandería','Veterinaria','Gimnasio','Otro'];
export const legalVersion='piloto-borrador-2026-10-05';
export function businessSlug(name,uniqueId){
 const base=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60).replace(/-$/,'')||'negocio';
 return base+'-'+uniqueId;
}
export function validateRegistration(form){
 const get=k=>String(form.get(k)||'').trim();
 const data=Object.fromEntries(['name','slug','giro','owner_name','phone','email','google_maps_url'].map(k=>[k,get(k)]));
 data.slug=data.slug.toLowerCase();data.phone=data.phone.replace(/[\s()+-]/g,'');
 if(/^\d{10}$/.test(data.phone))data.phone='52'+data.phone;
 const errors=[];
 if(data.name.length<2||data.name.length>150)errors.push('Nombre del negocio: entre 2 y 150 caracteres.');
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)||data.slug.length>100)errors.push('Enlace: usa letras, números y guiones.');
 if(!giros.includes(data.giro))errors.push('Selecciona un giro de la lista.');
 if(data.owner_name.length<2||data.owner_name.length>150)errors.push('Nombre del dueño o administrador: entre 2 y 150 caracteres.');
 if(!/^52\d{10}$/.test(data.phone))errors.push('Teléfono: escribe +52 y 10 dígitos.');
 if(data.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))errors.push('Escribe un correo válido.');
 try{const u=new URL(data.google_maps_url);if(u.protocol!=='https:'||u.username||u.password||data.google_maps_url.length>2048||!((['google.com','www.google.com','google.com.mx','www.google.com.mx'].includes(u.hostname)&&/^\/maps(?:\/|$)/.test(u.pathname))||u.hostname==='maps.google.com'||u.hostname==='maps.app.goo.gl'||(u.hostname==='goo.gl'&&u.pathname.startsWith('/maps/'))))throw Error();}catch{errors.push('Usa un enlace HTTPS de Google Maps.');}
 if(get('accept_legal')!=='on')errors.push('Debes aceptar los Términos y el Aviso de Privacidad.');
 return {data,error:errors.join(' ')};
}
export function quoteUrl(b,plan){
 const message=`Hola, quiero cotizar o activar Nival Puntos + Reseñas.\n\nNegocio: ${b.name}\nGiro: ${b.giro||'Sin registrar'}\nDueño: ${b.owner_name||'Sin registrar'}\nTeléfono: ${b.phone||'Sin registrar'}\nCorreo: ${b.email||'Sin registrar'}\nGoogle Maps: ${b.google_maps_url||'Sin registrar'}\nID del negocio: ${b.id}\nPlan: ${plan?.name||b.plan_name||'Sin plan asignado'}`;
 return 'https://wa.me/525539044788?text='+encodeURIComponent(message);
}
