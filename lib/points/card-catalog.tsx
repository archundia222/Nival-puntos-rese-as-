"use client";
import {useState} from "react";
import {ProgramEditor} from "./program-editor";
import {ReviewCardManager} from "../owner/review-card-manager";
import {ShareTools} from "../owner/share-tools";
import {Icon} from "../owner/icons";

type Reward={id:string;name:string;points_cost:number;active?:boolean;expires_at?:string|null;stock?:number|null};
type Program={name?:string;color?:string;card_enabled?:boolean;points_per_visit?:number;mode?:string;rules?:Record<string,any>;logo_url?:string|null};
type SetupState={steps:{done:boolean;label:string}[];complete:boolean;completed:number};
export function CardCatalog({businessId,business,slug,program,rewards,demo=false,setupState,nfcLimit=0,branchId,branchName,reviewCards=[],googleUrl,giftCardUrl}:{businessId:string;business:string;slug:string;program?:Program;rewards:Reward[];demo?:boolean;nfcLimit?:number;branchId?:string;branchName:string;reviewCards?:Record<string,any>[];googleUrl?:string|null;giftCardUrl?:string|null;setupState?:SetupState}){
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
   <article className="ownerCard cardSystemTile giftCardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon"><Icon name="gift" size={22}/></span><span className={giftCardUrl?"cardSystemStatus isOn":"cardSystemStatus"}>{giftCardUrl?"Activa":"Disponible"}</span></div>
    <div className="cardCatalogMock giftCatalogMock"><small>NIVAL · REGALO</small><strong>{business}</strong><span>Un detalle para compartir</span><i aria-hidden="true"><Icon name="gift" size={22}/></i></div>
    <div><h3>Tarjeta de regalo</h3></div>
    <a className="workspacePrimary" href="#nival-pay">{giftCardUrl?"Ver y compartir":"Configurar tarjeta de regalo"}</a>
   </article>
  </div>
  {demo&&<p className="cardCatalogDemoNote">Vista de muestra: en una cuenta activa podrás editar y publicar cada tarjeta.</p>}
  {nfcLimit>0&&<section className="cardCatalogNfc" aria-label="Tarjetas QR y NFC"><h2>Tarjetas QR y NFC</h2><p>Configura las tarjetas para que tus clientes dejen una reseña. Incluidas según tu plan.</p><ReviewCardManager businessId={businessId} branchId={branchId} branchName={branchName} cards={reviewCards} googleUrl={googleUrl} cardLimit={nfcLimit} demo={demo}/></section>}
  {editing&&<section id="point-card-editor" className="cardCatalogEditor" tabIndex={-1}><header><div><small>EDITOR DE TARJETA</small><h3>Tarjeta de puntos y reglas</h3><p>Define los puntos por visita, los límites de registro, los premios y el diseño que ven tus clientes.</p></div><button type="button" className="workspaceSecondary" onClick={()=>setEditing(false)}>Volver a mis tarjetas</button></header>
   <div className="cardCatalogShare"><h3>Compartir esta tarjeta</h3><p>Usa el enlace o el QR para que tus clientes creen su tarjeta.</p><ShareTools slug={slug} name={business} demo={demo}/></div>
   {demo?<div className="cardCatalogNotice"><h4>Editar tarjeta de puntos</h4><p>Esta vista de muestra no guarda cambios. En tu negocio real podrás elegir las promociones, definir el diseño y publicar la tarjeta.</p></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards} setupState={setupState}/>}
  </section>}
 </div>;
}
