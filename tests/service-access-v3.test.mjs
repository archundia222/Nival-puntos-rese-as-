import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerFixture} from './owner-fixture.mjs';
import {entitlements} from '../lib/foundation/entitlements.mjs';
const load=name=>readFileSync('database/'+name+'.sql','utf8');
test('499 → 399 → 299 → expired → 499 keeps history and enforces each capability in PostgreSQL',async()=>{
 const {db,owner,other,b}=await ownerFixture();try{
 for(const name of ['reputation-v6','lealtad-v6','points-only-plan-v1','activation-plan-v2','entitlements-v2','owner-tools-v2','service-access-v3'])await db.exec(load(name));
 await db.query("update nival_pr.profiles set role='superadmin' where id=$1",[other]);
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 const initial=(await db.query('select count(*)::int n from nival_pr.point_ledger where business_id=$1',[b])).rows[0].n;
 const capability=async tool=>(await db.query('select nival_pr_private.tool_enabled($1,$2) enabled',[b,tool])).rows[0].enabled;
 await db.query("select set_config('npr.user_id',$1,false)",[other]);
 for(const [price,reviews,replies] of [[499,true,true],[399,true,false],[299,false,false],[499,true,true]]){
  await db.query('update nival_pr.businesses set plan_id=(select id from nival_pr.plans where price_mxn=$2 limit 1) where id=$1',[b,price]);
  assert.equal(await capability('points'),true);assert.equal(await capability('reviews'),reviews);assert.equal(await capability('replies'),replies);
  const row=(await db.query('select b.*,p.features from nival_pr.businesses b join nival_pr.plans p on p.id=b.plan_id where b.id=$1',[b])).rows[0];
  const e=entitlements(row);assert.equal(e.reviews,reviews);assert.equal(e.replies,replies);assert.equal(e.historyVisible,true);
  if(reviews)await db.query("insert into nival_pr.generated_reports(business_id,kind,period_start,period_end,analysis,created_by) values($1,'month','2026-09-01','2026-10-01','{}',$2)",[b,other]);
  else {await assert.rejects(db.query("insert into nival_pr.generated_reports(business_id,kind,period_start,period_end,analysis,created_by) values($1,'month','2026-10-01','2026-11-01','{}',$2)",[b,other]),/Servicio no activo/);await assert.rejects(db.query("insert into nival_pr.tasks(business_id,title) values($1,'Diagnóstico nuevo')",[b]),/Servicio de reseñas no activo/);}
 }
 await db.query("update nival_pr.businesses set status='por_vencer' where id=$1",[b]);assert.equal(await capability('points'),true);
 assert.equal((await db.query("select nival_pr_private.public_business('example') data")).rows[0].data.active,true);
 await db.query("update nival_pr.businesses set paid_until=now()-interval '1 second' where id=$1",[b]);
 for(const tool of ['points','reviews','replies'])assert.equal(await capability(tool),false);
 await assert.rejects(db.query("insert into nival_pr.tasks(business_id,title) values($1,'Puntos · revisar programa')",[b]),/Servicio de reseñas no activo/);
 await db.query("insert into nival_pr.tasks(business_id,title) values($1,'Cobrar mensualidad')",[b]);
 assert.equal((await db.query('select count(*)::int n from nival_pr.point_ledger where business_id=$1',[b])).rows[0].n,initial);
 assert.equal((await db.query('select count(*)::int n from nival_pr.generated_reports where business_id=$1',[b])).rows[0].n,3);
 const row=(await db.query('select * from nival_pr.businesses where id=$1',[b])).rows[0];assert.equal(entitlements(row).historyVisible,false);
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 assert.equal(await capability('reviews'),true);assert.equal((await db.query('select count(*)::int n from nival_pr.generated_reports where business_id=$1',[b])).rows[0].n,3);
 }finally{await db.close();}
});
test('service task reconciliation is idempotent and points-only removes reputation work from new agenda',async()=>{
 const {db,other,b}=await ownerFixture();try{
 for(const name of ['reputation-v6','lealtad-v6','points-only-plan-v1','entitlements-v2','owner-tools-v2','service-access-v3'])await db.exec(load(name));
 await db.query("update nival_pr.profiles set role='superadmin' where id=$1",[other]);await db.query("select set_config('npr.user_id',$1,false)",[other]);
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days',plan_id=(select id from nival_pr.plans where price_mxn=299 limit 1) where id=$1",[b]);
 const source=readFileSync('lib/admin/service-tasks.ts','utf8'),sql=source.match(/text:`([\s\S]*?)`/)[1];
 await db.query(sql);await db.query(sql);
 const tasks=(await db.query('select title from nival_pr.tasks where business_id=$1',[b])).rows;
 assert.equal(tasks.length,2);assert.ok(tasks.some(t=>t.title==='Cobrar mensualidad'));assert.ok(tasks.some(t=>t.title.startsWith('Puntos ·')));
 await db.query('update nival_pr.businesses set plan_id=(select id from nival_pr.plans where price_mxn=499 limit 1) where id=$1',[b]);await db.query(sql);await db.query(sql);
 assert.equal((await db.query('select count(*)::int n from nival_pr.tasks where business_id=$1',[b])).rows[0].n,5);
 }finally{await db.close();}
});
test('administration dashboard metric query executes with live subscriptions',async()=>{
 const {db,other,b}=await ownerFixture();try{
 for(const name of ['reputation-v6','points-only-plan-v1','entitlements-v2','owner-tools-v2','service-access-v3'])await db.exec(load(name));
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '5 days',plan_id=(select id from nival_pr.plans where price_mxn=499 limit 1) where id=$1",[b]);
 const source=readFileSync('app/admin/page.tsx','utf8'),sql=source.match(/const \[metric\]=await query\(actor,`([\s\S]*?)`\)/)[1];
 const m=(await db.query(sql)).rows[0];assert.equal(m.active,1);assert.equal(m.expiring,1);assert.equal(Number(m.mrr),499);
 }finally{await db.close();}
});
