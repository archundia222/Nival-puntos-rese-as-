import {createHash,createHmac,randomBytes,scrypt as rawScrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(rawScrypt);
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const randomToken=()=>randomBytes(32).toString('base64url');
export async function hashPin(pin){if(!/^\d{6,8}$/.test(pin))throw Error('El PIN debe tener de 6 a 8 dígitos.');const salt=randomBytes(16).toString('hex');const hash=await scrypt(pin,salt,64);return `scrypt$${salt}$${hash.toString('hex')}`;}
export async function verifyPin(pin,encoded){const [scheme,salt,hex]=String(encoded||'').split('$');if(scheme!=='scrypt'||!/^\d{6,8}$/.test(pin)||!salt||!hex||hex.length!==128)return false;const actual=await scrypt(pin,salt,64);return timingSafeEqual(actual,Buffer.from(hex,'hex'));}
export function signedHint(role,secret){if(!secret||secret.length<32)throw Error('Configura SESSION_SECRET de al menos 32 caracteres.');const payload=Buffer.from(JSON.stringify({role,exp:Date.now()+8*3600000})).toString('base64url');return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');}
export function hintRole(value,secret){try{if(!value||!secret||secret.length<32)return null;const [payload,signature,...extra]=value.split('.');if(extra.length||!payload||!signature)return null;const expected=createHmac('sha256',secret).update(payload).digest('base64url');if(!signature||signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const parsed=JSON.parse(Buffer.from(payload,'base64url').toString());return parsed.exp>Date.now()&&['superadmin','owner','staff'].includes(parsed.role)?parsed.role:null;}catch{return null;}}
export const roleHome=role=>role==='superadmin'?'/admin':role==='staff'?'/staff':'/panel';
