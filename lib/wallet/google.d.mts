export type Config={issuer:string;email:string;key:string};
export function configuration(env:Record<string,string|undefined>):Config;
export function signedJwt(payload:unknown,key:string):string;
export function resources(config:Config,business:any,customer:any,origin:string):any;
export function saveUrl(config:Config,pass:any,origin:string):string;
export function googleClient(config:Config,fetcher?:typeof fetch):{sync:(pass:any)=>Promise<void>};
