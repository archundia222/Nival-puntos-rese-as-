import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {manageReviewCard} from './actions';
import {Icon} from './icons';
import {useEffect,useState} from 'react';

type ReviewCard=Record<string,any>;
type Props={businessId:string;branchId?:string;branchName:string;cards:ReviewCard[];googleUrl?:string|null;cardLimit?:number;demo?:boolean;hideAddButton?:boolean;addRequested?:boolean;onAddHandled?:()=>void};

export function ReviewCardManager({businessId,branchId,branchName,cards,googleUrl,cardLimit=3,demo=false,hideAddButton=false,addRequested=false,onAddHandled}:Props){
 const [adding,setAdding]=useState(false),[demoCards,setDemoCards]=useState<string[]>([]),[selectedCode,setSelectedCode]=useState<string|null>(null),[editing,setEditing]=useState(false);
 useEffect(()=>{if(addRequested){setAdding(true);setSelectedCode(null);setEditing(false);onAddHandled?.()}},[addRequested,onAddHandled]);
 const active=cards.filter(c=>c.active).length+demoCards.length,visible=cards.filter(c=>!branchId||c.branch_id===branchId),selected=visible.find(c=>c.code===selectedCode);
 const canCreate=active<cardLimit&&(demo||Boolean(googleUrl&&branchId));
 function addDemoCard(){if(demo&&active<cardLimit){const label=`Tarjeta ${active+1}`;setDemoCards(current=>[...current,label]);}}
 const preview=(label:string,code?:string,activeState=true)=> <div className="cardCatalogMock reviewCatalogMock" aria-label={`Tarjeta de reseñas: ${label}`}><small>TARJETA DE RESEÑAS</small><strong>{label}</strong><span>{activeState?'Google · '+branchName:'Pausada'}</span>{code&&activeState?<img className="reviewCardInlineQr" src={'/api/reviews/qr?code='+encodeURIComponent(code)} alt="QR de reseñas"/>:<i aria-hidden="true"><Icon name="compartir" size={23}/></i>}</div>;
 const back=()=>{if(editing)setEditing(false);else{setSelectedCode(null);setAdding(false)}};
 if(selected&&editing)return <section className="reviewCardFlow"><button type="button" className="workspaceSecondary cardReturnButton" onClick={back}><span aria-hidden="true">←</span> Regresar</button><h2>Editar tarjeta de reseñas</h2>{preview(selected.label,selected.code,selected.active)}<ActionForm action={manageReviewCard} label="Guardar cambios"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={selected.code}/><label className="reviewNameField"><span>Nombre de la tarjeta</span><input name="label" defaultValue={selected.label} required maxLength={80}/></label><Hidden name="active" value="true"/></ActionForm>{selected.active&&<ActionForm action={manageReviewCard} label="Pausar tarjeta"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><Hidden name="code" value={selected.code}/><Hidden name="label" value={selected.label}/><Hidden name="active" value="false"/></ActionForm>}</section>;
 if(selected)return <section className="reviewCardFlow"><button type="button" className="workspaceSecondary cardReturnButton" onClick={back}><span aria-hidden="true">←</span> Regresar</button><h2>Tarjeta de reseñas</h2>{preview(selected.label,selected.code,selected.active)}<button type="button" className="workspacePrimary cardEditButton" onClick={()=>setEditing(true)}><Icon name="edit" size={17}/> Editar tarjeta</button>{selected.active&&<a className="workspaceSecondary reviewTryLink" href={'/r/'+selected.code} target="_blank" rel="noreferrer">Probar tarjeta</a>}</section>;
 if(adding&&!demo)return <section className="reviewCardFlow"><button type="button" className="workspaceSecondary cardReturnButton" onClick={back}><span aria-hidden="true">←</span> Regresar</button><h2>Nueva tarjeta de reseñas</h2><div className="cardCatalogMock reviewCatalogMock"><small>TARJETA DE RESEÑAS</small><strong>{branchName}</strong><span>Google · comparte tu opinión</span><i aria-hidden="true"><Icon name="compartir" size={23}/></i></div><p>El QR abre la ficha de Google de esta sucursal.</p><ActionForm action={manageReviewCard} label="Crear tarjeta"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId||''}/><label className="reviewNameField"><span>Nombre de la tarjeta</span><input name="label" required maxLength={80} placeholder="Reseñas"/></label></ActionForm></section>;
 return <div className="reviewCardManager reviewCatalogGrid">
  {!hideAddButton&&canCreate&&(demo?<button type="button" className="workspacePrimary reviewAddButton" onClick={addDemoCard}>Agregar tarjeta <span aria-hidden="true">+</span></button>:<button type="button" className="workspacePrimary reviewAddButton" onClick={()=>setAdding(true)}>Agregar tarjeta <span aria-hidden="true">+</span></button>)}
  {!googleUrl&&!demo?<article className="ownerCard reviewConnectCard"><span className="reviewConnectIcon"><Icon name="google" size={34}/></span><h3>Conecta Google</h3><a className="workspacePrimary" href="#google">Conectar ficha <Icon name="arrow" size={17}/></a></article>:null}
  {active>=cardLimit&&<p className="ownerEmpty">Llegaste al límite de tarjetas de tu plan ({cardLimit}).</p>}
  {demoCards.map(label=><button type="button" className="ownerCard cardSystemTile reviewCatalogTile" key={label} onClick={()=>setSelectedCode('demo:'+label)}>{preview(label)}</button>)}
  {visible.map(card=><button type="button" className="ownerCard cardSystemTile reviewCatalogTile" key={card.code} onClick={()=>{setSelectedCode(card.code);setEditing(false)}}>{preview(card.label,card.code,card.active)}</button>)}
 </div>;
}
