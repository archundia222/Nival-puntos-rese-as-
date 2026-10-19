/** Enforce one recipient's notification limit across a rolling 24-hour window. */
export const MAX_WALLET_NOTIFICATIONS=3;
export const WALLET_WINDOW_MS=24*60*60*1000;
export function canNotifyPass({optedIn,passConfirmed,timestamps,now=Date.now()}){
 if(optedIn!==true||passConfirmed!==true)return false;
 return timestamps.filter(date=>{const age=now-new Date(date).getTime();return age>=0&&age<WALLET_WINDOW_MS;}).length<MAX_WALLET_NOTIFICATIONS;
}
export function walletCampaignEligiblePlan(price){return Number(price)>=399;}
