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
 const [editing,setEditing]=useState(false),[choosing,setChoosing]=useState(false),[selected,setSelected]=useState<null|"points"|"gift">(null);
 const activeRewards=rewards.filter(r=>r.active!==false&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.stock==null||Number(r.stock)>0)),pointsActive=!!program&&program.card_enabled!==false;
 function editPoints(){setSelected('points');setEditing(true);}
 return <div className="cardCatalog">
  <header className="cardCatalogHeading"><div><h2>Mis tarjetas</h2></div><button className="workspacePrimary cardCatalogAddButton" type="button" aria-expanded={choosing} aria-controls="card-type-chooser" onClick={()=>setChoosing(v=>!v)}>{choosing?"Cerrar":"Agregar tarjeta"}<span aria-hidden="true">{choosing?"×":"+"}</span></button></header>
  {choosing&&<section className="cardTypeChooser" id="card-type-chooser" aria-label="Elige qué tarjeta configurar"><div className="cardTypeOptions"><button type="button" onClick={()=>{setChoosing(false);editPoints()}}><Icon name="points" size={19}/><span><strong>Puntos</strong></span><Icon name="arrow" size={15}/></button><a href="#gift-card" onClick={()=>setChoosing(false)}><Icon name="gift" size={19}/><span><strong>Regalo</strong></span><Icon name="arrow" size={15}/></a><button type="button" disabled={nfcLimit===0} className={nfcLimit>0?"":"isUnavailable"} onClick={()=>{if(nfcLimit>0){setChoosing(false);document.getElementById('review-cards')?.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector<HTMLButtonElement>('.reviewAddButton')?.focus()}}}><Icon name="compartir" size={19}/><span><strong>Reseñas NFC y QR</strong></span><Icon name="arrow" size={15}/></button><a href="#nival-pay" onClick={()=>setChoosing(false)}><Icon name="gift" size={19}/><span><strong>Nival Pay</strong></span><Icon name="arrow" size={15}/></a><a href="/panel/puntos?view=equipo" onClick={()=>setChoosing(false)}><Icon name="clientes" size={19}/><span><strong>Personal</strong></span><Icon name="arrow" size={15}/></a></div></section>}
  {!selected&&<div className="cardCatalogGrid">
   <button type="button" id="points-card" className="ownerCard cardSystemTile" onClick={()=>{setSelected("points");setEditing(false)}} aria-label="Abrir tarjeta de puntos" style={{textAlign:"left",cursor:"pointer",width:"100%"}}>
    <div className="cardSystemTop"><span className={pointsActive?"cardSystemStatus isOn":"cardSystemStatus"}>{pointsActive?"Activa":"Por configurar"}</span></div>
    <div className="cardCatalogMock pointsCatalogMock" style={{background:program?.color||'#173f32'}}><small>NIVAL · PUNTOS</small><strong>{business}</strong><span>{activeRewards[0]?.name||'Premio por configurar'}</span><i aria-hidden="true"><Icon name="points" size={23}/></i></div>
    </button>
   <button type="button" id="gift-card" className="ownerCard cardSystemTile giftCardSystemTile" onClick={()=>setSelected("gift")} aria-label="Abrir tarjeta de regalo" style={{textAlign:"left",cursor:"pointer",width:"100%"}}>
    <div className="cardSystemTop"><span className={giftCardUrl?"cardSystemStatus isOn":"cardSystemStatus"}>{giftCardUrl?"Activa":"Disponible"}</span></div>
    <div className="cardCatalogMock giftCatalogMock"><small>NIVAL · REGALO</small><strong>{business}</strong><span>Un detalle para compartir</span><i aria-hidden="true"><Icon name="gift" size={22}/></i></div>
    </button>
  </div>
  {selected==="points"&&!editing&&<section className="ownerCard cardCatalogDetail"><button type="button" className="workspaceSecondary" onClick={()=>setSelected(null)}>← Mis tarjetas</button><h2>Compartir sistema de puntos</h2><ShareTools slug={slug} name={business} demo={demo}/><button type="button" className="workspacePrimary" onClick={editPoints}>Editar</button></section>}
  {selected==="gift"&&<section className="ownerCard cardCatalogDetail"><button type="button" className="workspaceSecondary" onClick={()=>setSelected(null)}>← Mis tarjetas</button><h2>Tarjeta de regalo</h2><a className="workspacePrimary" href="#nival-pay">{giftCardUrl?"Abrir tarjeta":"Configurar"}</a></section>}
  {demo&&<p className="cardCatalogDemoNote">Datos de ejemplo · los cambios no se guardan.</p>}
  {!selected&&nfcLimit>0&&choosing&&<section id="review-cards" className="cardCatalogNfc" aria-label="Tarjetas QR y NFC"><header className="cardCatalogNfcHeader"><div><span className="workspaceEyebrow">RESEÑAS</span><h2>Tarjetas NFC y QR</h2><p>Agrega una por ubicación: cada tarjeta abre el enlace para dejar una reseña.</p></div><span className="cardCatalogNfcLimit">{reviewCards.filter(c=>c.active).length}/{nfcLimit} activas</span></header><ReviewCardManager businessId={businessId} branchId={branchId} branchName={branchName} cards={reviewCards} googleUrl={googleUrl} cardLimit={nfcLimit} demo={demo}/></section>}
  {selected==="points"&&editing&&<section id="point-card-editor" className="cardCatalogEditor" tabIndex={-1}><header><h3>Editar tarjeta de puntos</h3><button type="button" className="workspaceSecondary" onClick={()=>setEditing(false)}>Salir</button></header>
   {demo?<div className="cardCatalogNotice"><h4>Editar tarjeta de puntos</h4><p>Esta vista de muestra no guarda cambios. En tu negocio real podrás elegir las promociones, definir el diseño y publicar la tarjeta.</p></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards} setupState={setupState}/>}
  </section>}
 </div>;
}
