export const plans:ReadonlyArray<{price:number;name:string;reviewLimit:number;branches:number;nfcCards:number}>;
export function planLimits(b:Record<string,any>):{reviewLimit:number;branches:number;nfcCards:number};
export function entitlements(b:Record<string,any>,now?:number):{history:boolean;historyVisible:boolean;replies:boolean;active:boolean;points:boolean;reviews:boolean;reviewLimit:number;reason:string};
