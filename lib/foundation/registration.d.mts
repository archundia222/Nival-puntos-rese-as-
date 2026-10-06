export const giros:string[];
export const legalVersion:string;
export type RegistrationData={name:string;slug:string;giro:string;owner_name:string;phone:string;email:string;google_maps_url:string};
export function validateRegistration(form:FormData):{data:RegistrationData;error:string};
export function quoteUrl(b:Record<string,any>,plan?:{name?:string}|null):string;

export function businessSlug(name:string,uniqueId:string):string;
