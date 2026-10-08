import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('registration supports all three plans and rejects invalid prices without leaving a business',async()=>{
 const db=new PGlite(),owner='11111111-1111-4111-8111-111111111111';
 try{
 await db.exec('create schema neon_auth;create table neon_auth."user"(id uuid primary key)');
 for(const name of ['foundation-neon','registration-pilot','reputation-v6','points-only-plan-v1','activation-plan-v2'])await db.exec(readFileSync('database/'+name+'.sql','utf8'));
 await db.query('insert into neon_auth."user" values($1)',[owner]);
 await db.query("insert into nival_pr.profiles(id,role,full_name) values($1,'owner','Ana')",[owner]);
 await db.exec('set role npr_v2_auth');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 for(const price of [299,399,499]){
 const {rows:[r]}=await db.query('select nival_pr_private.register_business_plan_complete($1,$2,$3,$4,$5,$6,$7,true,$8,$9) id',['negocio-'+price,'Negocio '+price,'Otro','Ana','525512345678','ana@example.com','https://maps.app.goo.gl/example','piloto-borrador-2026-10-05',price]);
 await db.exec('reset role');assert.equal((await db.query('select p.price_mxn::int price_mxn from nival_pr.businesses b join nival_pr.plans p on p.id=b.plan_id where b.id=$1',[r.id])).rows[0].price_mxn,price);await db.exec('set role npr_v2_auth');
 }
 await assert.rejects(db.query('select nival_pr_private.register_business_plan_complete($1,$2,$3,$4,$5,$6,$7,true,$8,$9)',['invalid','Invalid','Otro','Ana','525512345678','ana@example.com','https://maps.app.goo.gl/example','piloto-borrador-2026-10-05',99]),/Plan inválido/);
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from nival_pr.businesses')).rows[0].n,3);
 }finally{await db.close();}
});
