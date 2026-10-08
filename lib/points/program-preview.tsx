import {cardColor} from "./card-color";
export function ProgramPreview({business,program,reward}:{business:string;program?:{name?:string;color?:string;logo_url?:string|null};reward?:Record<string, any>}){
 const color=cardColor(program?.color),name=program?.name||'Mis recompensas';
 return <section className="reviewBox" aria-label="Vista previa de tarjeta">
  <small>VISTA PREVIA · ASÍ LA VERÁ TU CLIENTE</small>
  <div style={{background:color,color:'#fff',borderRadius:24,padding:24,marginTop:12,maxWidth:420,minHeight:220,display:'grid',gap:12}}>
   <div style={{display:'flex',alignItems:'center',gap:12}}>
    {program?.logo_url?<img src={program.logo_url} alt="" width="56" height="56" style={{borderRadius:14,objectFit:'cover',background:'#fff'}}/>:<div style={{width:56,height:56,borderRadius:14,background:'rgba(255,255,255,.18)',display:'grid',placeItems:'center',fontSize:28,fontWeight:800}}>{business.slice(0,1).toUpperCase()}</div>}
    <div><small>{business}</small><h2 style={{margin:0}}>{name}</h2></div>
   </div>
   <div><strong style={{fontSize:34}}>0 puntos</strong><p style={{margin:'4px 0 0'}}>{reward?reward.points_cost+' puntos → '+reward.name:'Agrega tu primer premio para mostrar la meta.'}</p></div>
   <small>La tarjeta usa la identidad del negocio. Los colores claros se oscurecen para mantener los puntos legibles.</small>
  </div>
 </section>;
}
