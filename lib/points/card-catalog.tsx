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
 const [editing,setEditing]=useState(false),[choosing,setChoosing]=useState(false);
 const activeRewards=rewards.filter(r=>r.active!==false&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.stock==null||Number(r.stock)>0)),pointsActive=!!program&&program.card_enabled!==false;
 function editPoints(){setEditing(true);requestAnimationFrame(()=>document.getElementById('point-card-editor')?.scrollIntoView({behavior:'smooth',block:'start'}));}
 return <div className="cardCatalog">
  <header className="cardCatalogHeading"><div><span className="workspaceEyebrow">TU NEGOCIO</span><h2>Tarjetas activas</h2><p>Configura cómo tus clientes suman puntos o comparten una tarjeta.</p></div><button className="workspacePrimary cardCatalogAddButton" type="button" aria-expanded={choosing} aria-controls="card-type-chooser" onClick={()=>setChoosing(v=>!v)}>{choosing?"Cerrar":"Agregar tarjeta"}<span aria-hidden="true">{choosing?"×":"+"}</span></button></header>
  {choosing&&<section className="cardTypeChooser" id="card-type-chooser" aria-label="Elige qué tarjeta configurar"><h3>¿Qué quieres agregar o configurar?</h3><div className="cardTypeOptions"><button type="button" onClick={()=>{setChoosing(false);editPoints()}}><Icon name="points" size={19}/><span><strong>Puntos</strong><small>Visitas y recompensas</small></span><Icon name="arrow" size={15}/></button><a href="#gift-card" onClick={()=>setChoosing(false)}><Icon name="gift" size={19}/><span><strong>Regalo</strong><small>Tarjeta de regalo</small></span><Icon name="arrow" size={15}/></a><button type="button" disabled={nfcLimit===0} className={nfcLimit>0?"":"isUnavailable"} onClick={()=>{if(nfcLimit>0){setChoosing(false);document.getElementById('review-cards')?.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector<HTMLButtonElement>('.reviewAddButton')?.focus()}}}><Icon name="compartir" size={19}/><span><strong>Reseñas NFC y QR</strong><small>{nfcLimit>0?`${reviewCards.filter(c=>c.active).length}/${nfcLimit} activas`:'No disponible en este plan'}</small></span><Icon name="arrow" size={15}/></button><a href="#nival-pay" onClick={()=>setChoosing(false)}><Icon name="gift" size={19}/><span><strong>Nival Pay</strong><small>Pagos y tarjetas de regalo</small></span><Icon name="arrow" size={15}/></a></div></section>}
  <div className="cardCatalogGrid">
   <article id="points-card" className="ownerCard cardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon"><Icon name="points" size={21}/></span><span className={pointsActive?"cardSystemStatus isOn":"cardSystemStatus"}>{pointsActive?"Activa":"Por configurar"}</span></div>
    <div className="cardCatalogMock pointsCatalogMock" style={{background:program?.color||'#173f32'}}><small>NIVAL · PUNTOS</small><strong>{business}</strong><span>{activeRewards[0]?.name||'Premio por configurar'}</span><i aria-hidden="true"><Icon name="points" size={23}/></i></div>
    <div className="cardSystemCopy"><h3>Puntos</h3><p>La tarjeta que registra las visitas y el saldo de tus clientes.</p></div>
    <button className="workspacePrimary" type="button" onClick={editPoints}>Configurar puntos <Icon name="arrow" size={15}/></button>
   </article>
   <article id="gift-card" className="ownerCard cardSystemTile giftCardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon"><Icon name="gift" size={22}/></span><span className={giftCardUrl?"cardSystemStatus isOn":"cardSystemStatus"}>{giftCardUrl?"Activa":"Disponible"}</span></div>
    <div className="cardCatalogMock giftCatalogMock"><small>NIVAL · REGALO</small><strong>{business}</strong><span>Un detalle para compartir</span><i aria-hidden="true"><Icon name="gift" size={22}/></i></div>
    <div className="cardSystemCopy"><h3>Tarjeta de regalo</h3><p>Nival Pay · comparte una tarjeta de regalo con tus clientes.</p></div>
    <a className="workspacePrimary" href="#nival-pay">{giftCardUrl?"Abrir Nival Pay":"Configurar regalo"} <Icon name="arrow" size={15}/></a>
   </article>
  </div>
  {demo&&<p className="cardCatalogDemoNote">Datos de ejemplo · los cambios no se guardan.</p>}
  {nfcLimit>0&&<section id="review-cards" className="cardCatalogNfc" aria-label="Tarjetas QR y NFC"><header className="cardCatalogNfcHeader"><div><span className="workspaceEyebrow">RESEÑAS</span><h2>Tarjetas NFC y QR</h2><p>Agrega una por ubicación: cada tarjeta abre el enlace para dejar una reseña.</p></div><span className="cardCatalogNfcLimit">{reviewCards.filter(c=>c.active).length}/{nfcLimit} activas</span></header><ReviewCardManager businessId={businessId} branchId={branchId} branchName={branchName} cards={reviewCards} googleUrl={googleUrl} cardLimit={nfcLimit} demo={demo}/></section>}
  {editing&&<section id="point-card-editor" className="cardCatalogEditor" tabIndex={-1}><header><div><small>EDITOR DE TARJETA</small><h3>Tarjeta de puntos y reglas</h3><p>Define los puntos por visita, los límites de registro, los premios y el diseño que ven tus clientes.</p></div><button type="button" className="workspaceSecondary" onClick={()=>setEditing(false)}>Volver a mis tarjetas</button></header>
   <div className="cardCatalogShare"><h3>Compartir esta tarjeta</h3><p>Usa el enlace o el QR para que tus clientes creen su tarjeta.</p><ShareTools slug={slug} name={business} demo={demo}/></div>
   {demo?<div className="cardCatalogNotice"><h4>Editar tarjeta de puntos</h4><p>Esta vista de muestra no guarda cambios. En tu negocio real podrás elegir las promociones, definir el diseño y publicar la tarjeta.</p></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards} setupState={setupState}/>}
  </section>}
 </div>;
}
