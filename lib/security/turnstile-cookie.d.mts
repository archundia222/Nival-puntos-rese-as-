export function issueTurnstileCookie(secret:string,now?:number):string;
export function verifyTurnstileCookie(value:unknown,secret:string,now?:number):boolean;
export const turnstileCookieMaxAge:number;
