"use client";
import {useState} from "react";
import {ProgramEditor} from "./program-editor";

type Reward={id:string;name:string;points_cost:number;active?:boolean;expires_at?:string|null;stock?:number|null};
type Program={name?:string;color?:string;card_enabled?:boolean;points_per_visit?:number;mode?:string;rules?:Record<string,any>;logo_url?:string|null};
type SetupState={steps:{done:boolean;label:string}[];complete:boolean;completed:number};
export function CardCatalog({businessId,business,program,rewards,demo=false,setupState}:{businessId:string;business:string;program?:Program;rewards:Reward[];demo?:boolean;nfcLimit?:number;payCardActive?:boolean;payCardUrl?:string;setupState?:SetupState}){
 const [editing,setEditing]=useState(false);
 const activeRewards=rewards.filter(r=>r.active!==false&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.stock==null||Number(r.stock)>0)),pointsActive=!!program&&program.card_enabled!==false;
 function editPoints(){setEditing(true);requestAnimationFrame(()=>document.getElementById('point-card-editor')?.scrollIntoView({behavior:'smooth',block:'start'}));}
 return <div className="cardCatalog">
  <div className="cardCatalogGrid">
   <article className="ownerCard cardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon">✳</span><span className={pointsActive?"cardSystemStatus isOn":"cardSystemStatus"}>{pointsActive?"Activa":"Inactiva"}</span></div>
   <div className="cardCatalogMock" style={{background:program?.color||'#173f32'}}><small>NIVAL · PUNTOS</small><strong>{business}</strong><span>{activeRewards[0]?.name||'Premio por configurar'}</span><i>•••• •••• ••••</i></div>
    <div><h3>Tarjeta de puntos</h3></div>
    <button className="workspacePrimary" type="button" onClick={editPoints}>Configurar tarjeta y reglas</button>
   </article>
  </div>
  {demo&&<p className="cardCatalogDemoNote">Vista de muestra: en una cuenta activa podrás editar y publicar cada tarjeta.</p>}
  {editing&&<section id="point-card-editor" className="cardCatalogEditor" tabIndex={-1}><header><div><small>EDITOR DE TARJETA</small><h3>Tarjeta de puntos y reglas</h3><p>Define los puntos por visita, los límites de registro, los premios y el diseño que ven tus clientes.</p></div><button type="button" className="workspaceSecondary" onClick={()=>setEditing(false)}>Volver a mis tarjetas</button></header>
   {demo?<div className="cardCatalogNotice"><h4>Editar tarjeta de puntos</h4><p>Esta vista de muestra no guarda cambios. En tu negocio real podrás elegir las promociones, definir el diseño y publicar la tarjeta.</p></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards} setupState={setupState}/>}
  </section>}
 </div>;
}
