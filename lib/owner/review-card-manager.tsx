import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageReviewCard} from './actions';

export function ReviewCardManager({businessId,branchId,branchName,cards,googleUrl,cardLimit=3}:{businessId:string;branchId?:string;branchName:string;cards:Record<string,any>[];googleUrl?:string|null;cardLimit?:number}){
 const active=cards.filter(c=>c.active).length,visible=cards.filter(c=>!branchId||c.branch_id===branchId);
 return <div className="reviewCardManager">
  <p>{active} de {cardLimit} tarjetas NFC incluidas activas. Las tarjetas de {branchName} abren la ficha de Google de esta sucursal.</p>
  {!googleUrl&&<p className="ownerEmpty">Primero agrega el enlace de tu ficha de Google en Configuración.</p>}
  {googleUrl&&branchId&&active<cardLimit&&<ActionForm action={manageReviewCard} label="Crear tarjeta NFC + QR"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||""}/><Field name="label" label="Nombre de la tarjeta"/></ActionForm>}
  {visible.map(card=><article className="ownerCard reviewCardItem" key={card.code}>
   <div className="reviewPhysicalCard"><small>NIVAL · RESEÑAS</small><strong>{card.label}</strong><span>{card.active?'NFC activa':'Pausada'} · QR listo</span></div>
   <div><h3>{card.label}</h3><small>{card.active?'Activa':'Pausada'} · /r/{card.code}</small></div>
   {card.active&&<div className="reviewCardQr"><img src={'/api/reviews/qr?code='+card.code} width="180" height="180" alt={'Código QR de '+card.label}/><a className="workspaceSecondary" href={'/api/reviews/qr?code='+card.code+'&download=1'} download>Descargar QR</a><a className="workspaceSecondary" href={'/r/'+card.code} target="_blank" rel="noreferrer">Probar enlace</a></div>}
   {(card.active||active<cardLimit)&&<ActionForm action={manageReviewCard} label={card.active?'Guardar nombre':'Reactivar tarjeta'}><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||""}/><Hidden name="code" value={card.code}/><Field name="label" label="Nombre" value={card.label}/><Hidden name="active" value="true"/></ActionForm>}
   {card.active&&<ActionForm action={manageReviewCard} label="Pausar tarjeta"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||""}/><Hidden name="code" value={card.code}/><Hidden name="label" value={card.label}/><Hidden name="active" value="false"/></ActionForm>}
  </article>)}
 </div>;
}
