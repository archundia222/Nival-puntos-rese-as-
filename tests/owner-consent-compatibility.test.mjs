import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerFixture} from './owner-fixture.mjs';
import {customerPermissions} from '../lib/owner/consent.mjs';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',business='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('owner loads customers before consent migration, defaults to no marketing and retains RLS isolation',async()=>{
 const {db}=await ownerFixture();
 const query=async(text,values)=>(await db.query(text,values)).rows;
 try{
  await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
  const rows=await customerPermissions(query,business);
  assert.equal(rows.length,20);assert.ok(rows.every(row=>row.marketing_consent===false));
  assert.ok(rows.every(row=>Object.keys(row).sort().join(',')==='id,marketing_consent'));
  await db.query("select set_config('npr.user_id',$1,false)",[other]);
  assert.deepEqual(await customerPermissions(query,business),[]);
  await db.exec('reset role');await db.exec('alter table nival_pr.customers add column marketing_consent boolean not null default false;grant select(marketing_consent) on nival_pr.customers to npr_v2_owner');
  await db.query('update nival_pr.customers set marketing_consent=true where id=$1',[rows[0].id]);
  await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
  const updated=await customerPermissions(query,business);
  assert.equal(updated.filter(row=>row.marketing_consent===true).length,1);
  await db.query("select set_config('npr.user_id',$1,false)",[other]);assert.deepEqual(await customerPermissions(query,business),[]);
 }finally{await db.close();}
});
test('database outages, permissions and unrelated schema errors are not hidden',async()=>{
 for(const error of [{code:'42501',message:'permission denied'},{code:'42703',message:'column other does not exist'},{code:'ECONNRESET',message:'network disconnected'}]){
  let calls=0;await assert.rejects(customerPermissions(async()=>{calls++;throw error;},business),e=>e===error);assert.equal(calls,1);
 }
});
