import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync,verify } from 'node:crypto';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import { ownerFixture } from './owner-fixture.mjs';
import {configuration,resources,signedJwt,saveUrl,googleClient} from '../lib/wallet/google.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const config={issuer:'3388000000023196757',email:'test@example.iam.gserviceaccount.com',key:privateKey.export({type:'pkcs8',format:'pem'}).toString()};
const b={id:'business-1',slug:'example',name:'Café',active:true,program:{name:'Tus premios',color:'#164d3b'}};
const c={id:'customer-1',name:'Cliente',balance:'12'};
test('server JWT signature, old split env and JSON config; pass contains ledger balance and static scanner QR',()=>{
 assert.equal(configuration({GOOGLE_WALLET_ISSUER_ID:config.issuer,GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL:config.email,GOOGLE_WALLET_PRIVATE_KEY:config.key.replace(/\n/g,'\\n')}).key,config.key);
 assert.equal(configuration({GOOGLE_WALLET_ISSUER_ID:config.issuer,GOOGLE_WALLET_SERVICE_ACCOUNT_JSON:JSON.stringify({client_email:config.email,private_key:config.key})}).email,config.email);
 assert.throws(()=>configuration({}));
 const pass=resources(config,b,c,'https://example.com');
 assert.equal(pass.loyaltyObject.barcode.value,'NIVAL:'+c.id);assert.equal(pass.loyaltyObject.loyaltyPoints.balance.string,'12');assert.equal(pass.loyaltyClass.hexBackgroundColor,b.program.color);
 assert.notEqual(pass.classId,resources(config,{...b,id:'business-2'},c,'https://example.com').classId);
 const jwt=saveUrl(config,pass,'https://example.com').split('/').at(-1),parts=jwt.split('.');
 assert.ok(verify('RSA-SHA256',Buffer.from(parts.slice(0,2).join('.')),publicKey,Buffer.from(parts[2],'base64url')));
 const payload=JSON.parse(Buffer.from(parts[1],'base64url'));assert.deepEqual(payload.origins,['https://example.com']);assert.equal(payload.payload.loyaltyObjects[0].id,pass.objectId);assert.ok(!jwt.includes(config.key));
});
test('Google REST creates missing resources, resolves concurrent insert, uses OAuth and reports failure without leaking response',async()=>{
 const calls=[];let objectPatch=0;
 const fetcher=async(url,options)=>{
  calls.push({url,...options});
  if(url.includes('oauth2'))return Response.json({access_token:'test-token',expires_in:3600});
  if(url.includes('loyaltyClass/')&&options.method==='PATCH')return new Response(null,{status:404});
  if(url.includes('loyaltyObject/')&&options.method==='PATCH'&&objectPatch++===0)return new Response(null,{status:404});
  if(url.endsWith('/loyaltyObject'))return new Response(null,{status:409});
  return Response.json({});
 };
 await googleClient(config,fetcher).sync(resources(config,b,c,'https://example.com'));
 assert.equal(calls.filter(x=>x.url.includes('oauth2')).length,1);assert.ok(calls.some(x=>x.url.endsWith('/loyaltyClass')&&x.method==='POST'));assert.equal(objectPatch,2);
 await assert.rejects(googleClient(config,async url=>url.includes('oauth2')?Response.json({access_token:'x'}):new Response('private Google error details',{status:403})).sync(resources(config,b,c,'https://example.com')),/^Error: Wallet loyaltyClass 403$/);
});
test('durable Neon queue: actual worker retries, preserves concurrent revisions, isolates owner and never rolls back visits',async()=>{
 const {db,b,owner,other}=await ownerFixture();
 try {
  await db.exec(readFileSync('database/google-wallet.sql','utf8'));
  await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
  await db.query("insert into nival_pr.programs(business_id,name,rules) values($1,'Premios','{\"min_hours_between_visits\":0,\"max_visits_per_day\":100}')",[b]);
  const {rows:[customer]}=await db.query('select id from nival_pr.customers where business_id=$1 order by name limit 1',[b]);
  await db.query('insert into nival_pr_private.wallet_sync(customer_id,business_id) values($1,$2)',[customer.id,b]);
  const visit=()=>db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",[b,customer.id,owner]);
  await visit();
  let fail=true,change=false;
  const src=ts.transpileModule(readFileSync('lib/wallet/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  const dependencies={'server-only':{},'next/server':{after:()=>{}},'node:crypto':await import('node:crypto'),'../foundation/db':{systemQuery:async(text,values)=>(await db.query(text,values)).rows},'../points/security':{publicBusiness:async()=>b&&{id:b,slug:'example',name:'Example',active:true,program:{name:'Rewards',color:'#123456'}}},'./google.mjs':{configuration:()=>config,resources,saveUrl,googleClient:()=>({sync:async()=>{if(fail)throw Error('Wallet loyaltyObject 503');if(change){change=false;await visit();}}})}};
  new Function('require','exports',src)(key=>{assert.ok(key in dependencies,key);return dependencies[key];},exports);
  const old=process.env.GOOGLE_WALLET_PUBLIC_ORIGIN;process.env.GOOGLE_WALLET_PUBLIC_ORIGIN='https://example.com';
  try {
   assert.equal((await exports.runWalletJobs(1)).failed,1);
   let {rows:[job]}=await db.query('select * from nival_pr_private.wallet_sync');assert.equal(job.attempts,1);assert.equal(job.last_error,'Wallet loyaltyObject 503');assert.equal(job.synced_revision,0);
   assert.equal((await exports.runWalletJobs(1)).processed,0);
   await visit();fail=false;change=true;
   assert.equal((await exports.runWalletJobs(1)).processed,1);
   ({rows:[job]}=await db.query('select * from nival_pr_private.wallet_sync'));assert.ok(job.revision>job.synced_revision);
   assert.equal((await exports.runWalletJobs(1)).processed,1);
   ({rows:[job]}=await db.query('select * from nival_pr_private.wallet_sync'));assert.equal(job.revision,job.synced_revision);
   await db.query("update nival_pr.programs set color='#234567' where business_id=$1",[b]);
   ({rows:[job]}=await db.query('select * from nival_pr_private.wallet_sync'));assert.ok(job.revision>job.synced_revision);
   await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[other]);
   await assert.rejects(db.query('select * from nival_pr_private.wallet_sync'),/permission denied/);
  }finally {if(old===undefined)delete process.env.GOOGLE_WALLET_PUBLIC_ORIGIN;else process.env.GOOGLE_WALLET_PUBLIC_ORIGIN=old;}
 }finally{await db.close();}
});
