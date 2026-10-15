import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {manageReviewCard} from './actions';
import {Icon} from './icons';

export function ReviewCardManager({businessId,branchId,branchName,cards,googleUrl,cardLimit=3}:{businessId:string;branchId?:string;branchName:string;cards:Record<string,any>[];googleUrl?:string|null;cardLimit?:number}){
 const active=cards.filter(c=>c.active).length,visible=cards.filter(c=>!branchId||c.branch_id===branchId);
 const canCreate=Boolean(googleUrl&&branchId&&active<cardLimit);
 return <div className="reviewCardManager">
  <header className="reviewCardHeading">
   <div><span className="workspaceEyebrow">GOOGLE</span><h3>QR de reseñas</h3></div>
   <div className="reviewCardQuota" aria-label={active+' de '+cardLimit+' tarjetas usadas'}>{Array.from({length:cardLimit},(_,i)=><i key={i} className={i<active?'isActive':''}/>)}<span>{active}/{cardLimit}</span></div>
  </header>
  {!googleUrl?<article className="ownerCard reviewConnectCard">
   <span className="reviewConnectIcon"><Icon name="google" size={34}/></span>
   <h3>Google</h3><a className="workspacePrimary" href="#google">Conectar ficha <Icon name="arrow" size={17}/></a>
  </article>:null}
  {canCreate&&visible.length===0?<article className="ownerCard reviewCreateCard">
   <div className="reviewQrArt" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/><span/></div>
   <div className="reviewCreateContent"><div className="reviewPhysicalCard"><small>NIVAL · GOOGLE</small><strong>{branchName}</strong><span>Tu QR para reseñas</span></div>
    <ActionForm action={manageReviewCard} label="Crear QR"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><label className="reviewNameField"><span>Nombre del QR</span><input name="label" required maxLength={80} placeholder="Mostrador"/></label></ActionForm>
   </div>
  </article>:null}
  {googleUrl&&active>=cardLimit&&visible.length===0&&<p className="ownerEmpty">Límite alcanzado</p>}
  {visible.map(card=><article className="ownerCard reviewCardItem" key={card.code}>
   <div className="reviewPhysicalCard"><small>NIVAL · GOOGLE</small><strong>{card.label}</strong><span>{card.active?'Activo':'Pausado'}</span></div>
   <div className="reviewCardActions">{card.active&&<><a className="workspacePrimary" href={'/api/reviews/qr?code='+card.code+'&download=1'} download><Icon name="download" size={17}/> Descargar</a><a className="workspaceSecondary" href={'/r/'+card.code} target="_blank" rel="noreferrer">Probar</a></>}
    {(card.active||active<cardLimit)&&<ActionForm action={manageReviewCard} label={card.active?'Guardar':'Reactivar'}><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={card.code}/><label className="reviewNameField"><span>Nombre</span><input name="label" defaultValue={card.label} required maxLength={80}/></label><Hidden name="active" value="true"/></ActionForm>}
    {card.active&&<ActionForm action={manageReviewCard} label="Pausar"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={card.code}/><Hidden name="label" value={card.label}/><Hidden name="active" value="false"/></ActionForm>}
   </div>
  </article>)}
 </div>;
}
