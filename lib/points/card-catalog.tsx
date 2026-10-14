"use client";
import {useState} from "react";
import {ProgramEditor} from "./program-editor";

type Reward={id:string;name:string;points_cost:number;active?:boolean;expires_at?:string|null;stock?:number|null};
type Program={name?:string;color?:string;card_enabled?:boolean;points_per_visit?:number;mode?:string;rules?:Record<string,any>;logo_url?:string|null};
export function CardCatalog({businessId,business,program,rewards,demo=false,nfcLimit=3,payCardActive=false}:{businessId:string;business:string;program?:Program;rewards:Reward[];demo?:boolean;nfcLimit?:number;payCardActive?:boolean}){
 const [editing,setEditing]=useState(false),[giftHelp,setGiftHelp]=useState(false);
 const activeRewards=rewards.filter(r=>r.active!==false&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.stock==null||Number(r.stock)>0)),pointsActive=!!program&&program.card_enabled!==false;
 function editPoints(){if(demo){setEditing(true);setGiftHelp(false);return;}if(pointsActive&&!window.confirm("¿Quieres editar esta tarjeta de puntos?"))return;setEditing(true);setGiftHelp(false);}
 return <div className="cardCatalog">
  <div className="cardCatalogGrid">
   <article className="ownerCard cardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon">✳</span><span className={pointsActive?"cardSystemStatus isOn":"cardSystemStatus"}>{pointsActive?"Activa":"Inactiva"}</span></div>
   <div className="cardCatalogMock" style={{background:program?.color||'#173f32'}}><small>NIVAL · PUNTOS</small><strong>{business}</strong><span>{activeRewards[0]?.name||'Premio por configurar'}</span><i>•••• •••• ••••</i></div>
    <div><small>SISTEMA 01</small><h3>Tarjeta de puntos</h3><p>Premia las visitas y anima a tus clientes a volver.</p></div>
    <button className="workspacePrimary" type="button" onClick={editPoints}>Editar</button>
   </article>
   <article className="ownerCard cardSystemTile">
   <div className="cardSystemTop"><span className="cardSystemIcon">◇</span><span className={payCardActive?"cardSystemStatus isOn":"cardSystemStatus"}>{payCardActive?"Activa":"Pendiente"}</span></div>
   <div className="cardCatalogMock giftMock"><small>NIVAL · REGALO</small><strong>{business}</strong><span>Tarjeta NFC · {nfcLimit} incluidas</span><i>•••• •••• ••••</i></div>
    <div><small>SISTEMA 02 · {nfcLimit} TARJETAS NFC INCLUIDAS</small><h3>Tarjeta de regalo</h3><p>Nival prepara y activa estas tarjetas desde administración.</p></div>
    <button className="workspaceSecondary" type="button" onClick={()=>{setEditing(false);setGiftHelp(true);}}>Editar</button>
   </article>
  </div>
  {demo&&<p className="cardCatalogDemoNote">Vista de muestra: en una cuenta activa podrás editar y publicar cada tarjeta.</p>}
  {editing&&<section className="cardCatalogEditor"><header><div><small>EDITOR DE TARJETA</small><h3>Tarjeta de puntos</h3></div><button type="button" className="workspaceSecondary" onClick={()=>setEditing(false)}>Volver a mis tarjetas</button></header>
   {demo?<div className="cardCatalogNotice"><h4>Editar tarjeta de puntos</h4><p>Esta vista de muestra no guarda cambios. En tu negocio real podrás elegir las promociones, definir el diseño y publicar la tarjeta.</p></div>:activeRewards.length===0?<div className="cardCatalogNotice"><h4>Primero activa una promoción</h4><p>La tarjeta necesita al menos una promoción activa antes de publicarse.</p><a className="workspacePrimary" href="#promociones">Ir a Campañas y promociones</a></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards}/>}
  </section>}
  {giftHelp&&<section className="cardCatalogNotice giftCardNotice"><header><div><small>SISTEMA 02 · {payCardActive?'ACTIVO':'CONFIGURADO POR NIVAL'}</small><h3>Tarjeta de regalo</h3></div><button type="button" className="workspaceSecondary" onClick={()=>setGiftHelp(false)}>Volver a mis tarjetas</button></header><p>{demo?"En una cuenta activa podrás consultar la tarjeta de regalo y sus enlaces desde el complemento Nival Pay.":"Nival configura la tarjeta y asigna el enlace desde administración. Cuando se active, el QR y el enlace aparecerán en Nival Pay."}</p></section>}
 </div>;
}
