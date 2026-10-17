import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {manageReviewCard} from './actions';
import {Icon} from './icons';
import {useState} from 'react';

export function ReviewCardManager({businessId,branchId,branchName,cards,googleUrl,cardLimit=3,demo=false}:{businessId:string;branchId?:string;branchName:string;cards:Record<string,any>[];googleUrl?:string|null;cardLimit?:number;demo?:boolean}){
 const [adding,setAdding]=useState(false),[demoCards,setDemoCards]=useState<string[]>([]);
 const active=cards.filter(c=>c.active).length+demoCards.length,visible=cards.filter(c=>!branchId||c.branch_id===branchId);
 const canCreate=active<cardLimit&&(demo||Boolean(googleUrl&&branchId));
 function addDemoCard(){if(demo&&active<cardLimit){const label=`Tarjeta ${active+1}`;setDemoCards(current=>[...current,label]);}}
 return <div className="reviewCardManager">
  <header className="reviewCardHeading">
   <div className="reviewCardHeadingActions">{canCreate&&(demo?<button type="button" className="workspacePrimary reviewAddButton" onClick={addDemoCard}>Agregar QR <span aria-hidden="true">+</span></button>:<button type="button" className="workspacePrimary reviewAddButton" aria-expanded={adding} onClick={()=>setAdding(value=>!value)}>{adding?'Cancelar':'Agregar QR'} {adding&&<Icon name="close" size={16}/>}</button>)}</div>
  </header>
  {!googleUrl&&!demo?<article className="ownerCard reviewConnectCard">
   <span className="reviewConnectIcon"><Icon name="google" size={34}/></span>
   <h3>Google</h3><a className="workspacePrimary" href="#google">Conectar ficha <Icon name="arrow" size={17}/></a>
  </article>:null}
  {canCreate&&adding&&!demo&&<article className="ownerCard reviewCreateCard">
   <div className="reviewQrArt" aria-hidden="true"><Icon name="compartir" size={86}/></div>
   <div className="reviewCreateContent"><div className="reviewPhysicalCard"><small>NIVAL · GOOGLE</small><strong>{branchName}</strong><span>Tu QR para reseñas</span></div>
    <ActionForm action={manageReviewCard} label="Crear QR"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><label className="reviewNameField"><span>Nombre del QR</span><input name="label" required maxLength={80} placeholder="Mostrador"/></label></ActionForm>
   </div>
  </article>}
  {active>=cardLimit&&<p className="ownerEmpty">Llegaste al límite de tarjetas de tu plan ({cardLimit}).</p>}
  {demoCards.map(label=><article className="ownerCard reviewCardItem reviewDemoCard" key={label}><div className="reviewPhysicalCard"><small>NIVAL · RESEÑAS · EJEMPLO</small><strong>{label}</strong><span>Lista para configurar</span><i className="reviewCardMockMark"><Icon name="compartir" size={28}/></i></div><p>Tarjeta ilustrativa. La demo no guarda cambios.</p></article>)}
  {visible.map(card=><article className="ownerCard reviewCardItem" key={card.code}>
   {demo?<><div className="reviewPhysicalCard"><small>NIVAL · RESEÑAS · EJEMPLO</small><strong>{card.label}</strong><span>Activa · muestra</span><i className="reviewCardMockMark"><Icon name="compartir" size={28}/></i></div><p>Diseño de muestra. El QR no abre una ficha real.</p></>:<>
   <div className="reviewPhysicalCard"><small>NIVAL · GOOGLE</small><strong>{card.label}</strong><span>{card.active?'Activo':'Pausado'}</span>{card.active&&<img className="reviewCardInlineQr" src={'/api/reviews/qr?code='+encodeURIComponent(card.code)} alt={'QR de reseñas de Google de '+card.label}/>}</div>
   <div className="reviewCardActions">{card.active&&<><a className="workspacePrimary" href={'/api/reviews/qr?code='+card.code+'&download=1'} download><Icon name="download" size={17}/> Descargar</a><a className="workspaceSecondary" href={'/r/'+card.code} target="_blank" rel="noreferrer">Probar</a></>}
    {(card.active||active<cardLimit)&&<ActionForm action={manageReviewCard} label={card.active?'Guardar':'Reactivar'}><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={card.code}/><label className="reviewNameField"><span>Nombre</span><input name="label" defaultValue={card.label} required maxLength={80}/></label><Hidden name="active" value="true"/></ActionForm>}
    {card.active&&<ActionForm action={manageReviewCard} label="Pausar"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={card.code}/><Hidden name="label" value={card.label}/><Hidden name="active" value="false"/></ActionForm>}
   </div></>}
  </article>)}
 </div>;
}
