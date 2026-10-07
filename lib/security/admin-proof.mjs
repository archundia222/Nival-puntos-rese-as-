import {createHmac,timingSafeEqual} from 'node:crypto';
export function signAdminProof(userId,sessionId,secret,now=Date.now()){
  if(!userId||!sessionId||!secret||secret.length<32)throw Error('Invalid administrator session');
  const payload=Buffer.from(JSON.stringify({userId,sessionId,exp:now+8*3600*1000})).toString('base64url');
  return payload+'.'+createHmac('sha256',secret).update('private-admin:'+payload).digest('base64url');
}
export function validAdminProof(value,userId,sessionId,secret,now=Date.now()){
  try{
    if(!value||!userId||!sessionId||!secret||secret.length<32)return false;
    const [payload,signature,...extra]=value.split('.');if(extra.length||!signature)return false;
    const expected=createHmac('sha256',secret).update('private-admin:'+payload).digest();const actual=Buffer.from(signature,'base64url');
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;
    const claim=JSON.parse(Buffer.from(payload,'base64url').toString());
    return claim.userId===userId&&claim.sessionId===sessionId&&Number.isFinite(claim.exp)&&claim.exp>now;
  }catch{return false;}
}
