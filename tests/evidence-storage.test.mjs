import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import {S3Client} from '@aws-sdk/client-s3';
import {evidenceStorage,objectKey,digest,saveEvidence,migrateEvidence,authorizedPhoto,storageConfig} from '../lib/storage/evidence.mjs';
import {ownerFixture} from './owner-fixture.mjs';
const path='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc/dddddddd-dddd-4ddd-8ddd-dddddddddddd.jpg';
const config={region:'auto',endpoint:'https://'+'a'.repeat(32)+'.r2.cloudflarestorage.com',bucket:'private-evidence',credentials:{accessKeyId:'test-only-key',secretAccessKey:'test-only-secret'}};
test('private S3-compatible reads are signed for 60 seconds and invalid paths/config fail closed',async()=>{
 assert.throws(()=>storageConfig({}));assert.throws(()=>objectKey('../secret'));const storage=evidenceStorage(config,new S3Client(config));const u=new URL(await storage.sign(objectKey(path),'image/jpeg'));
 assert.equal(u.searchParams.get('X-Amz-Expires'),'60');assert.ok(u.searchParams.get('X-Amz-Signature'));assert.equal(u.searchParams.get('response-cache-control'),'private, no-store');assert.ok(!u.href.includes(config.credentials.secretAccessKey));
 let lookups=0;for(const role of ['staff','customer','anonymous'])await assert.rejects(authorizedPhoto({id:'id',actor:{role},lookup:async()=>{lookups++;},storage}));assert.equal(lookups,0);
 await assert.rejects(authorizedPhoto({id:'id',actor:{role:'owner'},lookup:async()=>null,storage}));
 for(const role of ['owner','superadmin'])assert.ok((await authorizedPhoto({id:'id',actor:{role},lookup:async()=>({object_key:objectKey(path),mime:'image/jpeg'}),storage})).includes('X-Amz-Signature'));
});
test('upload registers metadata after storage success; failures never manufacture verified evidence',async()=>{
 const bytes=Buffer.from('image bytes');let registered=0;
 await assert.rejects(saveEvidence({path,bytes,mime:'image/jpeg',storage:{put:async()=>{throw Error('outage');}},register:async()=>{registered++;}}));assert.equal(registered,0);
 await saveEvidence({path,bytes,mime:'image/jpeg',storage:{put:async()=>objectKey(path)},register:async(row)=>{registered++;assert.equal(row.hash,digest(bytes));assert.equal(row.size,bytes.length);}});assert.equal(registered,1);
 await assert.rejects(saveEvidence({path,bytes,mime:'image/jpeg',storage:{put:async()=>objectKey(path)},register:async()=>{throw Error('uncertain DB result');}}));
});
test('migration removes the original only after downloading and verifying the exact copy',async()=>{
 const bytes=Buffer.from('original image');const row={path,photo:bytes.toString('base64'),mime:'image/jpeg'};let commits=0;
 const storage={put:async()=>objectKey(path),read:async()=>Buffer.from('corrupted copy')};await assert.rejects(migrateEvidence({row,storage,commit:async()=>{commits++;}}));assert.equal(commits,0);
 storage.read=async()=>bytes;await migrateEvidence({row,storage,commit:async(meta)=>{commits++;assert.equal(meta.hash,digest(bytes));}});assert.equal(commits,1);
});
test('server rejects false image headers, MIME mismatch and oversized photos; accepts decoded JPEG/PNG/WebP',async()=>{
 const mod={exports:{}};new Function('require','module','exports',ts.transpile(readFileSync('lib/points/storage.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}))(id=>id==='sharp'?sharp:{},mod,mod.exports);
 for(const mime of ['jpeg','png','webp']){const bytes=await sharp({create:{width:10,height:10,channels:3,background:'#123456'}}).toFormat(mime).toBuffer();const result=await mod.exports.validatePhoto(new File([bytes],'photo',{type:'image/'+mime}));assert.equal(result.type,'image/'+mime);}
 await assert.rejects(mod.exports.validatePhoto(new File([Buffer.from([255,216,255,...Array(20).fill(0)])],'fake.jpg',{type:'image/jpeg'})));
 const valid=await sharp({create:{width:10,height:10,channels:3,background:'#fff'}}).png().toBuffer();await assert.rejects(mod.exports.validatePhoto(new File([valid],'fake.jpg',{type:'image/jpeg'})));
 await assert.rejects(mod.exports.validatePhoto(new File([Buffer.alloc(3*1024*1024+1)],'big.jpg',{type:'image/jpeg'})));
});
test('database metadata is private, creates no binary photo and only same-business owner/admin can read',async()=>{
 const {db,b,bb,owner,other}=await ownerFixture();const hash='f'.repeat(64);
 try{
 await db.exec(readFileSync('database/evidence-object-storage.sql','utf8'));
 const {rows:[c]}=await db.query('select id from nival_pr.customers where business_id=$1 limit 1',[b]);const p=b+'/'+c.id+'/dddddddd-dddd-4ddd-8ddd-dddddddddddd.jpg';
 await db.exec('set role npr_v2_auth');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 await db.query('select nival_pr_private.store_photo_object($1,$2,$3,$4,$5,$6,$7)',[b,c.id,p,objectKey(p),'image/jpeg',100,hash]);
 await assert.rejects(db.query('select nival_pr_private.store_photo($1,$2,$3,$4,$5)',[b,c.id,p,'fake','image/jpeg']));
 await assert.rejects(db.query('select * from nival_pr_private.evidence_objects'));
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from nival_pr_private.evidence_photos')).rows[0].n,0);
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 const program=(await db.query("insert into nival_pr.programs(business_id,name,rules) values($1,'Test','{\"min_hours_between_visits\":0,\"max_visits_per_day\":100}') on conflict(business_id) do update set name=excluded.name returning id",[b])).rows[0];
 const rw=(await db.query("insert into nival_pr.rewards(program_id,name,points_cost,position) values($1,'Premio',1,0) returning id",[program.id])).rows[0];
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",[b,c.id,owner]);
 const ledger=(await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reward_id,evidence_path) values($1,$2,'redeem',-1,$3,$4,$5) returning id",[b,c.id,owner,rw.id,p])).rows[0];
 const rd=(await db.query('select id from nival_pr.redemptions where ledger_id=$1',[ledger.id])).rows[0];
 await db.exec('set role npr_v2_auth');await db.query("select set_config('npr.user_id',$1,false)",[other]);await assert.rejects(db.query('select * from nival_pr_private.read_photo_object($1)',[rd.id]));
 await db.query("select set_config('npr.user_id',$1,false)",[owner]);assert.equal((await db.query('select * from nival_pr_private.read_photo_object($1)',[rd.id])).rows[0].object_key,objectKey(p));
 await db.exec('reset role');
 const admin='33333333-3333-4333-8333-333333333333',staff='44444444-4444-4444-8444-444444444444';
 await db.query('insert into neon_auth."user" values($1),($2)',[admin,staff]);
 await db.query("insert into nival_pr.profiles(id,role,full_name) values($1,'superadmin','Admin'),($2,'staff','Staff')",[admin,staff]);
 await db.query("insert into nival_pr.memberships(user_id,business_id,role,pin_hash) values($1,$2,'staff','hash')",[staff,b]);
 await db.exec('set role npr_v2_auth');
 for(const uid of [staff,'']){await db.query("select set_config('npr.user_id',$1,false)",[uid]);await assert.rejects(db.query('select * from nival_pr_private.read_photo_object($1)',[rd.id]));}
 await db.query("select set_config('npr.user_id',$1,false)",[admin]);assert.equal((await db.query('select * from nival_pr_private.read_photo_object($1)',[rd.id])).rows[0].object_key,objectKey(p));

 }finally{await db.close();}
});
test('client compression resizes to 1600 pixels and uploads JPEG without carrying the original file',async()=>{
 const mod={exports:{}};new Function('module','exports',ts.transpile(readFileSync('lib/points/compress-photo.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(mod,mod.exports);
 const oldBitmap=globalThis.createImageBitmap,oldDocument=globalThis.document;let closed=false,type,quality;
 const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(){}}),toBlob(cb,t,q){type=t;quality=q;cb(new Blob(['jpeg data'],{type:t}));}};
 globalThis.createImageBitmap=async()=>({width:4000,height:2000,close(){closed=true;}});globalThis.document={createElement:()=>canvas};
 try{const result=await mod.exports.compressPhoto(new File(['png original'],'input.png',{type:'image/png'}));assert.equal(canvas.width,1600);assert.equal(canvas.height,800);assert.equal(type,'image/jpeg');assert.equal(quality,0.8);assert.equal(result.type,'image/jpeg');assert.equal(result.name,'canje.jpg');assert.equal(closed,true);await assert.rejects(mod.exports.compressPhoto(new File(['x'],'bad.svg',{type:'image/svg+xml'})));}finally{globalThis.createImageBitmap=oldBitmap;globalThis.document=oldDocument;}
});
