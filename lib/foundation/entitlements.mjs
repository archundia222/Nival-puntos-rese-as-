export const plans = Object.freeze([
 {price:299,name:'Nival Puntos',reviewLimit:0},
 {price:399,name:'Esencial',reviewLimit:30},
 {price:499,name:'Plus',reviewLimit:100},
]);
/** Business data remains readable independently of the currently subscribed tools. */
export function entitlements(b,now=Date.now()) {
 const until=Math.max(Date.parse(b?.paid_until||'')||0,Date.parse(b?.trial_ends_at||'')||0);
 const active=['activo','por_vencer'].includes(b?.status)&&until>Number(now);
 const reviewLimit=Number(b?.features?.review_limit||0);
 const reviews=b?.features?.points_only!==true&&(b?.features?.reviews_enabled===true||reviewLimit>0);
 return {history:true,historyVisible:active,active,points:active,reviews:active&&reviews,replies:active&&reviews&&reviewLimit>0,
  reviewLimit:reviews?reviewLimit:0,
  reason:active?'Esta herramienta no está incluida en tu plan.':'Tu historial sigue disponible. Renueva para usar las herramientas.'};
}
