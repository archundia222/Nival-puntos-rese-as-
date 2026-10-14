"use client";
import {useState} from "react";
import {ProgramEditor} from "./program-editor";

type Reward={id:string;name:string;points_cost:number;active?:boolean;expires_at?:string|null;stock?:number|null};
type Program={name?:string;color?:string;card_enabled?:boolean;points_per_visit?:number;mode?:string;rules?:Record<string,any>;logo_url?:string|null};
export function CardCatalog({businessId,business,program,rewards}:{businessId:string;business:string;program?:Program;rewards:Reward[]}){
 const [editing,setEditing]=useState(false),[giftHelp,setGiftHelp]=useState(false);
 const activeRewards=rewards.filter(r=>r.active!==false&&(!r.expires_at||new Date(r.expires_at).getTime()>Date.now())&&(r.stock==null||Number(r.stock)>0)),pointsActive=!!program&&program.card_enabled!==false;
 function editPoints(){if(pointsActive&&!window.confirm("¿Quieres editar esta tarjeta de puntos?"))return;setEditing(true);setGiftHelp(false);}
 return <div className="cardCatalog">
  <div className="cardCatalogGrid">
   <article className="ownerCard cardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon">✳</span><span className={pointsActive?"cardSystemStatus isOn":"cardSystemStatus"}>{pointsActive?"Activa":"Inactiva"}</span></div>
    <div><small>SISTEMA 01</small><h3>Tarjeta de puntos</h3><p>Premia las visitas y anima a tus clientes a volver.</p></div>
    <button className="workspacePrimary" type="button" onClick={editPoints}>Editar</button>
   </article>
   <article className="ownerCard cardSystemTile">
    <div className="cardSystemTop"><span className="cardSystemIcon">◇</span><span className="cardSystemStatus">Inactiva</span></div>
    <div><small>SISTEMA 02</small><h3>Tarjeta de regalo</h3><p>Configura una tarjeta digital de regalo para tu negocio.</p></div>
    <button className="workspaceSecondary" type="button" onClick={()=>{setEditing(false);setGiftHelp(true);}}>Editar</button>
   </article>
  </div>
  {editing&&<section className="cardCatalogEditor"><header><div><small>EDITOR DE TARJETA</small><h3>Tarjeta de puntos</h3></div><button type="button" className="workspaceSecondary" onClick={()=>setEditing(false)}>Volver a mis tarjetas</button></header>
   {activeRewards.length===0?<div className="cardCatalogNotice"><h4>Primero activa una promoción</h4><p>La tarjeta necesita al menos una promoción activa antes de publicarse.</p><a className="workspacePrimary" href="#promociones">Ir a Campañas y promociones</a></div>:<ProgramEditor businessId={businessId} business={business} program={program} reward={activeRewards[0]} promotions={activeRewards}/>}
  </section>}
  {giftHelp&&<section className="cardCatalogNotice giftCardNotice"><header><div><small>SISTEMA 02 · INACTIVO</small><h3>Editar tarjeta de regalo</h3></div><button type="button" className="workspaceSecondary" onClick={()=>setGiftHelp(false)}>Volver a mis tarjetas</button></header><p>La tarjeta de regalo seguirá inactiva hasta definir cómo se carga y canjea. Así evitamos publicar una tarjeta que no pueda usarse correctamente.</p><p>Cuando definamos ese funcionamiento, su editor tendrá los mismos pasos: reglas, diseño y publicación.</p></section>}
 </div>;
}
