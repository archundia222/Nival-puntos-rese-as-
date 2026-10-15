import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageReviewCard} from './actions';

export function ReviewCardManager({businessId,branchId,branchName,cards,googleUrl,cardLimit=3}:{businessId:string;branchId?:string;branchName:string;cards:Record<string,any>[];googleUrl?:string|null;cardLimit?:number}){
 const active=cards.filter(c=>c.active).length,visible=cards.filter(c=>!branchId||c.branch_id===branchId);
 const canCreate=Boolean(googleUrl&&branchId&&active<cardLimit);
 return <div className="reviewCardManager">
  <header className="reviewCardHeading">
   <div><span className="workspaceEyebrow">PIDE RESEÑAS EN GOOGLE</span><h3>Tarjetas QR de reseñas</h3><p>Cada QR abre la ficha de Google de {branchName}.</p></div>
   <span className="reviewCardCount">{active} de {cardLimit} activas</span>
  </header>
  {!googleUrl?<article className="ownerCard reviewCardGuide">
   <span className="reviewCardStep">1</span><div><h3>Conecta tu ficha de Google</h3><p>Necesitas el enlace de tu ficha para crear los códigos QR.</p><a className="workspacePrimary" href="#google">Configurar enlace de Google</a></div>
  </article>:null}
  {canCreate&&visible.length===0?<article className="ownerCard reviewCardGuide">
   <span className="reviewCardStep">1</span><div><h3>Crea tu primer QR</h3><p>Ponle un nombre para reconocer dónde lo usarás, por ejemplo: mostrador.</p>
    <ActionForm action={manageReviewCard} label="Crear tarjeta QR"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Field name="label" label="Nombre (ej. Mostrador)"/></ActionForm>
   </div>
  </article>:null}
  {googleUrl&&active>=cardLimit&&visible.length===0&&<p className="ownerEmpty">Ya llegaste al límite de {cardLimit} tarjetas incluidas.</p>}
  {visible.map(card=><article className="ownerCard reviewCardItem" key={card.code}>
   <div className="reviewPhysicalCard"><small>NIVAL · RESEÑAS</small><strong>{card.label}</strong><span>{card.active?'Activa':'Pausada'} · QR listo</span></div>
   <div><h3>{card.label}</h3><small>{card.active?'Activa':'Pausada'} · /r/{card.code}</small></div>
   {card.active&&<div className="reviewCardQr"><img src={'/api/reviews/qr?code='+card.code} width="180" height="180" alt={'Código QR de '+card.label}/><a className="workspaceSecondary" href={'/api/reviews/qr?code='+card.code+'&download=1'} download>Descargar QR</a><a className="workspaceSecondary" href={'/r/'+card.code} target="_blank" rel="noreferrer">Probar QR</a></div>}
   {(card.active||active<cardLimit)&&<ActionForm action={manageReviewCard} label={card.active?'Guardar nombre':'Reactivar QR'}><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={card.code}/><Field name="label" label="Nombre" value={card.label}/><Hidden name="active" value="true"/></ActionForm>}
   {card.active&&<ActionForm action={manageReviewCard} label="Pausar QR"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={card.code}/><Hidden name="label" value={card.label}/><Hidden name="active" value="false"/></ActionForm>}
  </article>)}
 </div>;
}
