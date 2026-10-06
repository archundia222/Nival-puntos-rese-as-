export function parseDsn(value:string):{endpoint:string,key:string}|null;
export function captureServerError(error:unknown,context?:{route?:string,url?:string},env?:Record<string,string|undefined>,fetcher?:typeof fetch):Promise<boolean>;
