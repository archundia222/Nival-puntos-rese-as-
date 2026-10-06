import { createPrivateKey, sign } from 'node:crypto';
// This module is imported exclusively through server.ts (server-only).
export function configuration(env) {
 const json=env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON ? JSON.parse(env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON) : {};
 const issuer=env.GOOGLE_WALLET_ISSUER_ID;
 const email=json.client_email||env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
 const key=(json.private_key||env.GOOGLE_WALLET_PRIVATE_KEY||'').replace(/\\n/g,'\n');
 if(!/^\d+$/.test(issuer||'')||!email||!key)throw Error('Wallet configuration missing');
 createPrivateKey(key);
 return {issuer,email,key};
}
export function signedJwt(payload,key) {
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const data=encode({alg:'RS256',typ:'JWT'})+'.'+encode(payload);
 return data+'.'+sign('RSA-SHA256',Buffer.from(data),key).toString('base64url');
}
export function resources(config, business, customer, origin) {
 const classId=config.issuer+'.puntos_business_'+business.id;
 const objectId=config.issuer+'.puntos_customer_'+customer.id;
 return {
  classId,objectId,
  loyaltyClass:{id:classId,issuerName:business.name,programName:business.program.name,programLogo:{sourceUri:{uri:origin+'/api/wallet/logo/'+business.slug},contentDescription:{defaultValue:{language:'es-MX',value:'Logo de '+business.name}}},hexBackgroundColor:business.program.color,countryCode:'MX',accountNameLabel:'Cliente',accountIdLabel:'Tarjeta',reviewStatus:'underReview'},
  loyaltyObject:{id:objectId,classId,state:business.active?'ACTIVE':'INACTIVE',accountName:customer.name,accountId:customer.id.slice(-8).toUpperCase(),barcode:{type:'QR_CODE',value:'NIVAL:'+customer.id},loyaltyPoints:{label:'Puntos',balance:{string:String(customer.balance)}}}
 };
}
export function saveUrl(config,pass,origin) {
 const now=Math.floor(Date.now()/1000);
 const jwt=signedJwt({iss:config.email,aud:'google',typ:'savetowallet',iat:now,exp:now+3600,origins:[origin],payload:{loyaltyObjects:[{id:pass.objectId,classId:pass.classId}]}},config.key);
 return 'https://pay.google.com/gp/v/save/'+jwt;
}
export function googleClient(config,fetcher=fetch) {
 let token=null,expires=0;
 async function auth(){
  if(token&&Date.now()<expires)return token;
  const now=Math.floor(Date.now()/1000);
  const assertion=signedJwt({iss:config.email,scope:'https://www.googleapis.com/auth/wallet_object.issuer',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600},config.key);
  const r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(7000)});
  if(!r.ok)throw Error('Wallet OAuth '+r.status);
  const d=await r.json();if(!d.access_token)throw Error('Wallet OAuth invalid');
  token=d.access_token;expires=Date.now()+Math.max(0,Number(d.expires_in||3600)-60)*1000;return token;
 }
 async function call(path,method,body){
  const r=await fetcher('https://walletobjects.googleapis.com/walletobjects/v1/'+path,{method,headers:{Authorization:'Bearer '+await auth(),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(7000)});
  if(r.status===401){token=null;expires=0;}
  return r;
 }
 async function upsert(kind,id,body){
  let r=await call(kind+'/'+encodeURIComponent(id),'PATCH',body);
  if(r.status===404){r=await call(kind,'POST',body);if(r.status===409)r=await call(kind+'/'+encodeURIComponent(id),'PATCH',body);}
  if(!r.ok)throw Error('Wallet '+kind+' '+r.status);
 }
 return {sync:async pass=>{await upsert('loyaltyClass',pass.classId,pass.loyaltyClass);await upsert('loyaltyObject',pass.objectId,pass.loyaltyObject);}};
}
