export const signedPhotoSeconds:number;
export function storageConfig(env?:NodeJS.ProcessEnv):any;
export function objectKey(path:string):string;
export function digest(bytes:Uint8Array):string;
export function evidenceStorage(config?:any,client?:any):{put:(path:string,bytes:Uint8Array,mime:string)=>Promise<string>;sign:(key:string,mime:string)=>Promise<string>;read:(key:string)=>Promise<Buffer>};
export function saveEvidence(options:any):Promise<string>;
export function authorizedPhoto(options:any):Promise<string>;
export function migrateEvidence(options:any):Promise<string>;
