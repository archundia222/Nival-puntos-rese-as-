import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {ownerFixture} from './owner-fixture.mjs';
test('surprise stays fixed across refresh, assigned rewards resist edits, same-day visits and request IDs are safe',async()=>{
 const {db,owner,b}=await ownerFixture();try{
 await db.exec(readFileSync('database/lealtad-v6.sql','utf8'));
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 const {rows:[p]}=await db.query("insert into nival_pr.programs(business_id,name,mode,rules) values($1,'Test','surprise','{\"min_hours_between_visits\":0,\"max_visits_per_day\":100}') returning id",[b]);
 const {rows:[rw]}=await db.query("insert into nival_pr.rewards(program_id,name,points_cost,position) values($1,'Café',1,0) returning id",[p.id]);
 const {rows:[c]}=await db.query('select id,manual_code,device_token_hash from nival_pr.customers where business_id=$1 order by name limit 1',[b]);
 await db.query('update nival_pr.customers set consent_at=now() where id=$1',[c.id]);
 const first=(await db.query('select nival_pr_private.next_reward($1) r',[c.id])).rows[0].r;
 assert.equal(first,rw.id);assert.equal((await db.query('select nival_pr_private.next_reward($1) r',[c.id])).rows[0].r,first);
 await assert.rejects(db.query('update nival_pr.rewards set points_cost=5 where id=$1',[rw.id]),/Respeta/);
 await assert.rejects(db.query("update nival_pr.programs set mode='choose' where id=$1",[p.id]),/premios asignados/);
 await db.exec('set role npr_v2_auth');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 assert.equal((await db.query('select nival_pr_private.staff_customer_code($1,$2) data',[b,c.manual_code])).rows[0].data.id,c.id);
 await db.exec('set role npr_v2_owner');
 const op='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,operation_id) values($1,$2,'visit',1,$3,$4)",[b,c.id,owner,op]);
 await assert.rejects(db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,operation_id) values($1,$2,'visit',1,$3,$4)",[b,c.id,owner,op]),/unique|duplicate/);
 await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,operation_id) values($1,$2,'visit',1,$3,'dddddddd-dddd-4ddd-8ddd-dddddddddddd')",[b,c.id,owner]);
 await db.exec('reset role');await db.query("update nival_pr.businesses set paid_until=now()-interval '1 day' where id=$1",[b]);
 const {rows:[card]}=await db.query('select nival_pr_private.customer_card($1,$2) data',[b,c.device_token_hash]);assert.ok(card.data);assert.equal(card.data.manual_code,c.manual_code);
 await db.exec('set role npr_v2_owner');await assert.rejects(db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",[b,c.id,owner]),/Servicio no activo/);
 }finally{await db.close();}
});
