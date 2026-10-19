import {quoteUrl} from '../foundation/registration.mjs';
export function PlanChoices({b}:{b:Record<string,any>}){
 const plans=[
  {price:299,name:'Básico',review:10,branches:1,nfc:3,wallet:false,zone:false},
  {price:399,name:'Esencial',review:30,branches:5,nfc:6,wallet:true,zone:false},
  {price:549,name:'Plus',review:100,branches:10,nfc:12,wallet:true,zone:true}
 ];
 return <section className="ownerCard"><h3>Planes</h3><div className="planChoices">
  {plans.map(p=><article key={p.price}><h4>{p.name} · ${p.price} MXN</h4>
   <p>{p.review} respuestas · {p.branches} {p.branches===1?'sucursal':'sucursales'} · {p.nfc} tarjetas NFC</p>
   <p>Campañas y notificaciones por Wallet: {p.wallet?'Incluidas':'Disponible en Esencial'}</p>
   <p>Comparación con tu zona: {p.zone?'Incluida':'Disponible en Plus'}</p>
   <a className="workspaceSecondary" target="_blank" rel="noreferrer" href={quoteUrl(b,{name:p.name+' · $'+p.price})}>Elegir {p.name}</a>
  </article>)}
 </div></section>;
}
