import {redirect} from 'next/navigation';
/** Backwards-compatible deep links. Authentication and business access stay in /panel. */
export function redirectToPanel(section:'clientes'|'promociones'|'mis-tarjetas'|'google',search:Record<string,string|string[]|undefined>):never{
 const params=new URLSearchParams();
 for(const key of ['business','branch','kind','period'] as const){const value=search[key];if(typeof value==='string'&&value.length<=150)params.set(key,value);}
 redirect('/panel'+(params.size?'?'+params.toString():'')+'#'+section);
}
