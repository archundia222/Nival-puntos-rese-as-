'use client';
import {useState,useActionState} from 'react';
import {updateCard,type ActionResult} from './actions';
import {CustomerCardControls} from './customer-card-controls';
import {ReviewLinkForm} from './review-link-form';

type CardRecord={id:string;name:string;phone:string|null;balance:number;visits:number;lastVisit:string|null;cardToken?:string;cardEnabled?:boolean};
type Tab='editor'|'records'|'reviews';

export function CardWorkspace({businessName,goal,reward,customers,enabledCount,visits,redemptions,reviewLink,reviewLinkError,cardControlsAvailable}:{businessName:string;goal:number;reward:string;customers:CardRecord[];enabledCount:number;visits:number;redemptions:number;reviewLink:{id:string;display_name:string;google_url:string;active:boolean}|null;reviewLinkError:boolean;cardControlsAvailable:boolean}){
 const[tab,setTab]=useState<Tab>('editor');const[goalValue,setGoal]=useState(goal);const[rewardValue,setReward]=useState(reward);const[state,action,pending]=useActionState(updateCard,{} as ActionResult);
 const tabs:[Tab,string][]=[['editor','Tarjeta de puntos'],['records','Registros'],['reviews','Tarjetas de reseñas']];
 return <div className="cardWorkspace">
  <div className="cardTabs" role="tablist" aria-label="Secciones de Tarjetas">{tabs.map(([key,label])=><button type="button" role="tab" aria-selected={tab===key} className={tab===key?'selected':''} key={key} onClick={()=>setTab(key)}>{label}</button>)}</div>
  {tab==='editor'&&<>
   <section className="cardEditorPanel"><div className="cardEditorFields"><span className="eyebrow">EDITOR DE TARJETA</span><h2>Meta y premio</h2><form className="configGrid" action={action}><label>Puntos para el premio<input name="goal" type="number" min="1" max="100000" step="1" value={goalValue} onChange={event=>setGoal(Number(event.target.value))} required/></label><label>Nombre del premio<input name="reward" maxLength={150} value={rewardValue} onChange={event=>setReward(event.target.value)} required/></label><button disabled={pending}>{pending?'Guardando…':'Guardar tarjeta'}</button><p role="status" className={state.error?'error':''}>{state.error||state.success}</p></form><p className="fieldHint">Un solo premio que vuelve a empezar después de cada canje.</p></div>
    <div className="cardPreviewArea"><span className="eyebrow">VISTA PREVIA EN VIVO</span><article className="loyaltyPreview"><header><span className="nivalLogo">nival</span><span>Tarjeta de puntos</span></header><div><small>{businessName}</small><strong>{Math.min(2,goalValue)}<span> / {goalValue||0} puntos</span></strong><progress max={Math.max(1,goalValue)} value={Math.min(2,Math.max(0,goalValue))}/></div><footer><span>Tu premio</span><b>{rewardValue||'Escribe el nombre del premio'}</b></footer></article><p>El cliente ve su saldo, la meta y el premio.</p></div>
   </section>
   <section className="cardMetrics"><article><span>Tarjetas activas</span><b>{enabledCount}</b><small>de {customers.length} clientes</small></article><article><span>Visitas</span><b>{visits}</b><small>últimos 30 días</small></article><article><span>Canjes</span><b>{redemptions}</b><small>últimos 30 días</small></article></section>
   <section className="counterQrSoon"><span className="comingSoon">Próximamente</span><div><h2>QR/NFC del mostrador</h2><p>El registro compartido de clientes aún no está conectado al panel.</p></div></section>
  </>}
  {tab==='records'&&<section className="cardRecords"><header><div><span className="eyebrow">REGISTROS POR TARJETA</span><h2>Tarjetas de tus clientes</h2></div><span>{customers.length} clientes</span></header>{!customers.length?<p className="empty">Cuando registres clientes, sus tarjetas aparecerán aquí.</p>:!cardControlsAvailable?<p className="panelState" role="status">No se pudo consultar la activación de las tarjetas. Prueba más tarde.</p>:customers.map(customer=><article className="cardRecord" key={customer.id}><div className="cardRecordMain"><div><h3>{customer.name}</h3><p>{customer.phone||'Sin teléfono'}</p></div><span className={customer.cardEnabled?'cardActive':'cardInactive'}>{customer.cardEnabled?'Activa':'Inactiva'}</span></div><div className="cardRecordMetrics"><span><b>{customer.balance}</b> puntos</span><span>{customer.visits} visitas</span><span>{customer.lastVisit?`Última ${customer.lastVisit}`:'Sin visitas'}</span></div>{customer.cardToken&&<CustomerCardControls key={customer.cardToken+String(customer.cardEnabled)} id={customer.id} token={customer.cardToken} enabled={!!customer.cardEnabled}/>}</article>)}</section>}
  {tab==='reviews'&&<><ReviewLinkForm name={businessName} link={reviewLink} error={reviewLinkError}/></>}
 </div>;
}
