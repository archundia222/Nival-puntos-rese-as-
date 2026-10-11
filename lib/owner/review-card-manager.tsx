import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {manageReviewCard} from './actions';

export function ReviewCardManager({businessId,cards,googleUrl}:{businessId:string;cards:Record<string,any>[];googleUrl?:string|null}){
 const active=cards.filter(c=>c.active).length;
 return <div className="reviewCardManager">
  <p>{active} de 10 tarjetas QR activas. Cada tarjeta abre el enlace público de reseñas de Google del negocio.</p>
  {!googleUrl&&<p className="ownerEmpty">Primero agrega el enlace de tu ficha de Google en Configuración.</p>}
  {googleUrl&&active<10&&<ActionForm action={manageReviewCard} label="Crear tarjeta QR"><Hidden name="businessId" value={businessId}/><Field name="label" label="Nombre de la tarjeta"/></ActionForm>}
  {cards.map(card=><article className="ownerCard reviewCardItem" key={card.code}>
   <div><h3>{card.label}</h3><small>{card.active?'Activa':'Pausada'} · /r/{card.code}</small></div>
   {card.active&&<div className="reviewCardQr"><img src={'/api/reviews/qr?code='+card.code} width="180" height="180" alt={'Código QR de '+card.label}/><a className="workspaceSecondary" href={'/api/reviews/qr?code='+card.code+'&download=1'} download>Descargar QR</a><a className="workspaceSecondary" href={'/r/'+card.code} target="_blank" rel="noreferrer">Probar enlace</a></div>}
   <ActionForm action={manageReviewCard} label={card.active?'Guardar nombre':'Reactivar tarjeta'}><Hidden name="businessId" value={businessId}/><Hidden name="code" value={card.code}/><Field name="label" label="Nombre" value={card.label}/><Hidden name="active" value="true"/></ActionForm>
   {card.active&&<ActionForm action={manageReviewCard} label="Pausar tarjeta"><Hidden name="businessId" value={businessId}/><Hidden name="code" value={card.code}/><Hidden name="label" value={card.label}/><Hidden name="active" value="false"/></ActionForm>}
  </article>)}
 </div>;
}
