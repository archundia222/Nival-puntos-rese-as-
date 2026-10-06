import {createHmac,timingSafeEqual} from 'node:crypto';
const ttl=300;
function key(secret){if(typeof secret!=='string'||secret.length<32)throw Error('SESSION_SECRET no configurado.');return secret}
function sig(payload,secret){return createHmac('sha256',key(secret)).update(payload).digest('base64url')}
export function issueTurnstileCookie(secret,now=Date.now()){const exp=Math.floor(now/1000)+ttl,payload='v1.'+exp;return payload+'.'+sig(payload,secret)}
export function verifyTurnstileCookie(value,secret,now=Date.now()){
 try{
  if(typeof value!=='string')return false;const parts=value.split('.');if(parts.length!==3||parts[0]!=='v1'||!/^[0-9]+$/.test(parts[1]))return false;
  const exp=Number(parts[1]);if(!Number.isSafeInteger(exp)||exp<Math.floor(now/1000))return false;
  const payload=parts[0]+'.'+parts[1],expected=Buffer.from(sig(payload,secret)),actual=Buffer.from(parts[2]);
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
 }catch{return false}
}
export const turnstileCookieMaxAge=ttl;
