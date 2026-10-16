import {Icon} from './icons';
export function NextActions({riskCount,frequentCount,newCount,activePromotions,pendingReviews,reviewLimit,branchName}:{riskCount:number;frequentCount:number;newCount:number;activePromotions:number;pendingReviews:number|null;reviewLimit:number;branchName:string}){
 const actions=[
 {href:riskCount?'#clientes-risk':'#clientes-frequent',icon:'clientes',eyebrow:riskCount?'CLIENTES EN RIESGO':'CLIENTES FRECUENTES',value:riskCount||frequentCount,label:riskCount?'pueden volver':'con visitas recientes',action:riskCount?'Ver y recuperar':'Ver clientes'},
 {href:'#promociones',icon:'gift',eyebrow:'PREMIOS ACTIVOS',value:activePromotions,label:activePromotions?'en tu tarjeta':'por crear',action:activePromotions?'Administrar premios':'Crear un premio'},
 {href:reviewLimit?'#inicio':'#clientes-new',icon:reviewLimit?'google':'clientes',eyebrow:reviewLimit?'RESEÑAS PENDIENTES':'CLIENTES NUEVOS',value:reviewLimit?(pendingReviews??0):newCount,label:reviewLimit?(pendingReviews===0?'todo al día':'por responder'):'este periodo',action:reviewLimit?'Ver resumen en Inicio':'Ver clientes'}
 ];
 return <section className="ownerCard ownerActionCenter" aria-labelledby="next-actions-title"><header><span className="workspaceEyebrow">SIGUIENTE PASO · {branchName}</span><h2 id="next-actions-title">Haz que vuelvan</h2></header><div className="ownerActionGrid">{actions.map(action=><a className="ownerActionLink" href={action.href} key={action.href}><span className="ownerActionIcon"><Icon name={action.icon} size={21}/></span><span className="ownerActionCopy"><small>{action.eyebrow}</small><strong>{action.value}</strong><span>{action.label}</span><b>{action.action}<Icon name="arrow" size={15}/></b></span></a>)}</div></section>;
}
