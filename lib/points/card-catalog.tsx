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
 const [editing,setEditing]=useState(false),[choosing,setChoosing]=useState(false),[selected,setSelected]=useState<null|"points"|"reviews"|"pay">(null);
 const activeRewards=rewards.filter(r=>r.active!==false&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.stock==null||Number(r.stock)>0)),pointsActive=!!program&&program.card_enabled!==false;
 function editPoints(){setSelected('points');setEditing(true);}
 return <div className="cardCatalog">
  {!selected&&<header className="cardCatalogHeading"><div><small>CONFIGURA Y ADMINISTRA</small><h2>Mis tarjetas</h2><p>Tarjetas digitales y QR de tu negocio, en un mismo lugar.</p></div><button className="workspacePrimary cardCatalogAddButton" type="button" aria-expanded={choosing} aria-controls="card-type-chooser" onClick={()=>setChoosing(v=>!v)}>{choosing?"Cerrar":"Agregar tarjeta"}<span aria-hidden="true">{choosing?"×":"+"}</span></button></header>}
  {choosing&&!selected&&<section className="cardTypeChooser" id="card-type-chooser" aria-label="Elige qué tarjeta configurar"><header><span className="workspaceEyebrow">NUEVA CONFIGURACIÓN</span><h3>¿Qué quieres crear?</h3><p>Elige un formato. Tus QR y tarjetas se administran aquí.</p></header><div className="cardTypeOptions"><button type="button" className="cardTypeOption" onClick={()=>{setChoosing(false);setSelected("points");setEditing(true)}}><span className="cardTypeOptionIcon"><Icon name="points" size={21}/></span><span className="cardTypeOptionCopy"><strong>Tarjeta de puntos</strong><small>Premia visitas y compras de tus clientes.</small></span><span className="cardTypeOptionArrow"><Icon name="arrow" size={15}/></span></button><button type="button" disabled={nfcLimit===0} className="cardTypeOption" onClick={()=>{if(nfcLimit>0){setChoosing(false);setSelected('reviews')}}}><span className="cardTypeOptionIcon reviews"><Icon name="google" size={21}/></span><span className="cardTypeOptionCopy"><strong>Reseñas NFC y QR</strong><small>Crea QR y enlaces para compartir tu ficha de Google.</small></span><span className="cardTypeOptionArrow">{nfcLimit>0?<Icon name="arrow" size={15}/>:"No incluido"}</span></button><button type="button" className="cardTypeOption isComingSoon" disabled><span className="cardTypeOptionIcon pay"><Icon name="gift" size={21}/></span><span className="cardTypeOptionCopy"><strong>Nival Pay</strong><small>Comparte tus datos de pago con una tarjeta digital.</small></span><span className="cardTypeComingSoon">Próximamente</span></button></div></section>}
  {!selected&&<div className="cardCatalogGrid">
   <button type="button" id="points-card" className="ownerCard cardSystemTile" onClick={()=>{setSelected("points");setEditing(false)}} aria-label="Abrir tarjeta de puntos" style={{textAlign:"left",cursor:"pointer",width:"100%"}}>
    <div className="cardSystemTop"><span className={pointsActive?"cardSystemStatus isOn":"cardSystemStatus"}>{pointsActive?"Activa":"Por configurar"}</span></div>
    <div className="cardCatalogMock pointsCatalogMock" style={{background:program?.color||'#173f32'}}><small>NIVAL · PUNTOS</small><strong>{business}</strong><span>{activeRewards[0]?.name||'Premio por configurar'}</span><i aria-hidden="true"><Icon name="points" size={23}/></i></div>
    </button>

  </div>}
  {selected==="points"&&!editing&&<section className="ownerCard cardCatalogDetail"><button type="button" className="workspaceSecondary cardReturnButton" onClick={()=>setSelected(null)}><span aria-hidden="true">←</span> Regresar</button><h2>Compartir sistema de puntos</h2><ShareTools slug={slug} name={business} demo={demo}/><button type="button" className="workspacePrimary cardEditButton" onClick={editPoints}><Icon name="edit" size={17}/> Editar tarjeta</button></section>}

  {selected==="pay"&&<section className="ownerCard"><button type="button" className="workspaceSecondary cardReturnButton" onClick={()=>setSelected(null)}><span aria-hidden="true">←</span> Regresar</button><h2>Nival Pay</h2><p>Configura Nival Pay desde tu cuenta.</p></section>}
  {demo&&<p className="cardCatalogDemoNote">Datos de ejemplo · los cambios no se guardan.</p>}
  {selected==="reviews"&&nfcLimit>0&&<section id="review-cards" className="cardCatalogNfc" aria-label="Tarjetas QR y NFC"><header className="cardCatalogNfcHeader"><div><button type="button" className="workspaceSecondary cardReturnButton" onClick={()=>setSelected(null)}><span aria-hidden="true">←</span> Regresar</button><h2>Reseñas</h2></div></header><ReviewCardManager businessId={businessId} branchId={branchId} branchName={branchName} cards={reviewCards} googleUrl={googleUrl} cardLimit={nfcLimit} demo={demo}/></section>}
  {selected==="points"&&editing&&<section id="point-card-editor" className="cardCatalogEditor" tabIndex={-1}><header><h3>Editar tarjeta de puntos</h3><button type="button" className="workspaceSecondary" onClick={()=>{if(window.confirm("Salir sin guardar los cambios?"))setEditing(false)}}>Salir</button></header>
   {demo?<div className="cardCatalogNotice"><h4>Editar tarjeta de puntos</h4><p>Esta vista de muestra no guarda cambios. En tu negocio real podrás elegir las promociones, definir el diseño y publicar la tarjeta.</p></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards} setupState={setupState} onSaved={()=>{setEditing(false);setSelected(null)}}/>}
  </section>}
 </div>;
}
