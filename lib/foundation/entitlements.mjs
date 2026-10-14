export const plans = Object.freeze([
 {price:299,name:'Básico',reviewLimit:10,branches:1,nfcCards:3},
 {price:399,name:'Esencial',reviewLimit:30,branches:5,nfcCards:6},
 {price:549,name:'Plus',reviewLimit:100,branches:10,nfcCards:12},
]);
export function planLimits(b){
 const price=Number(b?.price_mxn||0),features=b?.features||{};
 const plan=plans.find(p=>p.price===price);
 return {reviewLimit:Number(plan?.reviewLimit??features.review_limit??0),branches:Number(plan?.branches??features.branch_limit??1),nfcCards:Number(plan?.nfcCards??features.nfc_card_limit??3)};
}
/** Business data remains readable independently of the currently subscribed tools. */
export function entitlements(b,now=Date.now()) {
 const until=Math.max(Date.parse(b?.paid_until||'')||0,Date.parse(b?.trial_ends_at||'')||0);
 const active=['activo','por_vencer'].includes(b?.status)&&until>Number(now);
 const reviewLimit=planLimits(b).reviewLimit;
 const reviews=reviewLimit>0;
 return {history:true,historyVisible:active,active,points:active,reviews:active&&reviews,replies:active&&reviews&&reviewLimit>0,
  reviewLimit:reviews?reviewLimit:0,
  reason:active?'Esta herramienta no está incluida en tu plan.':'Tu historial sigue disponible. Renueva para usar las herramientas.'};
}
