export function sha256(value:string):string;
export function randomToken():string;
export function hashPin(pin:string):Promise<string>;
export function verifyPin(pin:string,hash:string):Promise<boolean>;
export function signedHint(role:string,secret:string):string;
export function hintRole(value:string|undefined,secret:string|undefined):'superadmin'|'owner'|'staff'|null;
export function roleHome(role:string):string;
