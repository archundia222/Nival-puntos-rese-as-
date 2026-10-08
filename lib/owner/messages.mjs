export const defaultMessages={
 new:'Hola {nombre}, gracias por visitar {negocio}. Tienes {puntos} puntos; puedes consultar tu progreso en tu tarjeta. ¡Te esperamos!',
 active:'Hola {nombre}, soy de {negocio}. ¿Cómo estuvo tu última visita? Nos gustaría saber cómo podemos atenderte mejor.',
 frequent:'Hola {nombre}, gracias por seguir eligiendo {negocio}. Tienes {puntos} puntos y tu siguiente premio es {premio}.',
 risk:'Hola {nombre}, somos de {negocio}. Hace un tiempo que no te vemos. ¿Hay algo que podamos mejorar en tu próxima visita?',
 lost:'Hola {nombre}, te saludamos de {negocio}. Si te apetece volver, estaremos encantados de recibirte.',
 near_reward:'Hola {nombre}, de parte de {negocio}: estás cerca de {premio}. Tienes {puntos} puntos. Consulta tu tarjeta para ver cuánto te falta.',
};
export function messageFor(segment,customer,business,templates=[]){
 const key=segment==='absent'?'lost':segment;const body=templates.find(t=>t.segment===key)?.body||defaultMessages[key]||defaultMessages.active;
 return body.replace(/\{(nombre|puntos|premio|negocio)\}/g,(_,name)=>String({nombre:customer.name,puntos:customer.balance??0,premio:customer.reward_name||'tu próximo premio',negocio:business}[name]));
}
