import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {validateRegistration,quoteUrl,legalVersion,businessSlug} from '../lib/foundation/registration.mjs';
const values={name:'Café & Sol',slug:'cafe-sol',giro:'Cafetería / restaurante',owner_name:'Ana Pérez',phone:'+52 55 1234 5678',email:'ana@example.com',google_maps_url:'https://maps.app.goo.gl/abcd',accept_legal:'on'};
const form=(v=values)=>{const f=new FormData();for(const [k,x] of Object.entries(v))f.set(k,x);return f;};
test('registration validates every field and mandatory legal consent',()=>{
 assert.equal(validateRegistration(form()).error,'');
 assert.equal(validateRegistration(form()).data.phone,'525512345678');
 for(const k of Object.keys(values))assert.ok(validateRegistration(form({...values,[k]:''})).error,k);
 for(const url of ['http://maps.app.goo.gl/abc','https://maps.app.goo.gl.evil.com/abc','https://evil.com/maps','https://user@maps.app.goo.gl/abc'])assert.ok(validateRegistration(form({...values,google_maps_url:url})).error);
 assert.ok(validateRegistration(form({...values,giro:'inventado'})).error);
 assert.ok(validateRegistration(form({...values,phone:'123'})).error);
 assert.ok(validateRegistration(form({...values,email:'sin-correo'})).error);
});
test('WhatsApp quote decodes every business field, ID and assigned plan',()=>{
 const b={...validateRegistration(form()).data,id:'business-unique-123',plan_name:'Nival Tech completo'};
 const u=new URL(quoteUrl(b));assert.equal(u.origin+u.pathname,'https://wa.me/525539044788');
 const message=u.searchParams.get('text');for(const k of ['name','giro','owner_name','phone','email','google_maps_url','id','plan_name'])assert.ok(message.includes(b[k]),k);
 assert.ok(new URL(quoteUrl(b,{name:'Plan actualizado'})).searchParams.get('text').includes('Plan actualizado'));
});
test('complete database registration saves all fields, membership, plan and immutable acceptance atomically',async()=>{
 const db=new PGlite();const u='00000000-0000-4000-8000-000000000001';
 try{
 await db.exec('create schema neon_auth;create table neon_auth."user"(id uuid primary key)');
 await db.exec(readFileSync('database/foundation-neon.sql','utf8'));
 await db.exec(readFileSync('database/registration-pilot.sql','utf8'));
 await db.exec(`insert into neon_auth."user" values('${u}');insert into nival_pr.profiles(id,role,full_name) values('${u}','owner','Ana');set role npr_v2_auth;select set_config('npr.user_id','${u}',false)`);
 const d=validateRegistration(form()).data;
 const args=[d.slug,d.name,d.giro,d.owner_name,d.phone,d.email,d.google_maps_url,true,legalVersion];
 const sql='select nival_pr_private.register_business_complete($1,$2,$3,$4,$5,$6,$7,$8,$9) as id';
 const {rows:[r]}=await db.query(sql,args);
 await assert.rejects(db.query(sql,[...args.slice(0,7),false,legalVersion]));
 await assert.rejects(db.query("select nival_pr_private.register_business('bypass','Bypass','Otro')"));
 await db.exec('reset role');
 const {rows:[b]}=await db.query('select * from nival_pr.businesses where id=$1',[r.id]);
 for(const k of Object.keys(d))assert.equal(b[k],d[k],k);assert.ok(b.plan_id);
 assert.equal((await db.query('select count(*)::int n from nival_pr.memberships where business_id=$1 and user_id=$2',[r.id,u])).rows[0].n,1);
 const {rows:[audit]}=await db.query('select data from nival_pr.audit_log where business_id=$1',[r.id]);assert.equal(audit.data.version,legalVersion);assert.ok(audit.data.accepted_at);
 assert.equal((await db.query('select count(*)::int n from nival_pr.businesses')).rows[0].n,1);
 }finally{await db.close();}
});

test('automatic business links handle accents, punctuation, long names and duplicate names',()=>{
 const id='00000000-0000-4000-8000-000000000001';
 for(const name of ['Tacos Demo','Café & Sol','Árbol Ñandú','🍕','a'.repeat(150)]){
  const slug=businessSlug(name,id);
  assert.match(slug,/^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(slug.length<=100);
  assert.equal(validateRegistration(form({...values,slug})).error,'');
 }
 assert.equal(businessSlug('Tacos Demo',id),'tacos-demo-'+id);
 assert.notEqual(businessSlug('Tacos Demo',id),businessSlug('Tacos Demo','00000000-0000-4000-8000-000000000002'));
});
