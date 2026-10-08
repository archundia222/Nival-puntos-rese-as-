import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {entitlements} from '../lib/foundation/entitlements.mjs';import {ownerFixture} from './owner-fixture.mjs';
test('permissions matrix keeps history across all plans and inactive states',()=>{
 for(const [price,limit] of [[299,0],[399,30],[499,100]])for(const status of ['registrado','cotizando','pago_pendiente','activo','por_vencer','pausado','cancelado']){
 const e=entitlements({status,paid_until:'2027-01-01',features:{points_only:price===299,review_limit:limit}},Date.parse('2026-10-07'));
 assert.equal(e.history,true);assert.equal(e.points,['activo','por_vencer'].includes(status));assert.equal(e.reviews,e.points&&limit>0);
 }
 assert.equal(entitlements({status:'activo',paid_until:'2020-01-01',features:{review_limit:30}}).points,false);
});
test('database keeps history after plan changes and expiration, blocks writes and protects reports',async()=>{
 const {db,owner,other,b,bb}=await ownerFixture();try{
 for(const name of ['reputation-v6','points-only-plan-v1','entitlements-v2'])await db.exec(readFileSync('database/'+name+'.sql','utf8'));
 await db.query("update nival_pr.profiles set role='superadmin' where id=$1",[other]);
 await db.query("update nival_pr.businesses set plan_id=(select id from nival_pr.plans where price_mxn=399 limit 1),status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 await db.query("insert into nival_pr.generated_reports(business_id,kind,period_start,period_end,analysis,status,approved_at,created_by) values($1,'month','2026-09-01','2026-10-01','{\"strengths\":[\"Servicio\"]}','approved',now(),$2)",[b,other]);
 for(const price of [299,399,499,299])await db.query('update nival_pr.businesses set plan_id=(select id from nival_pr.plans where price_mxn=$2 limit 1) where id=$1',[b,price]);
 await db.query("update nival_pr.businesses set paid_until=now()-interval '1 day' where id=$1",[b]);
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 assert.equal((await db.query('select * from nival_pr.generated_reports')).rows.length,1);
 assert.equal((await db.query('select * from nival_pr.plan_history')).rows.length,5);
 assert.ok((await db.query('select * from nival_pr.point_ledger')).rows.length>0);
 assert.equal((await db.query('select * from nival_pr.businesses where id=$1',[bb])).rows.length,0);
 await assert.rejects(db.query("insert into nival_pr.programs(business_id,name) values($1,'Blocked')",[b]),/Servicio no activo/);
 await db.exec('reset role');await db.query("select set_config('npr.user_id',$1,false)",[other]);
 await db.query("update nival_pr.businesses set plan_id=(select id from nival_pr.plans where price_mxn=399 limit 1),paid_until=now()+interval '30 days' where id=$1",[b]);
 await assert.rejects(db.query("update nival_pr.generated_reports set analysis='{}' where business_id=$1",[b]),/snapshot histórico/);
 assert.equal((await db.query('select count(*)::int n from nival_pr.generated_reports')).rows[0].n,1);
 }finally{await db.close();}
});
