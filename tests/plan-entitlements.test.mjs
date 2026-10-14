import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerFixture} from './owner-fixture.mjs';
import {ownerStatements} from '../lib/owner/queries.mjs';
import {periodRange} from '../lib/owner/domain.mjs';

test('plan limits, branch reads, and the Nival Pay link migration work without rewriting the points ledger',async()=>{
 const {db,owner,b}=await ownerFixture();
 try{
  await db.query("insert into nival_pr.plans(name,price_mxn,interval) values('Nival Básico',299,'month')");
  await db.query("insert into nival_pr.plans(name,price_mxn,interval) values('Nival Plus',549,'month')");
  for(const file of ['branches-v1.sql','review-cards-v1.sql','plan-entitlements-v10.sql'])await db.exec(readFileSync('database/'+file,'utf8'));
  const plans=(await db.query("select price_mxn,features->>'review_limit' review_limit,features->>'branch_limit' branch_limit,features->>'nfc_card_limit' nfc_card_limit from nival_pr.plans order by price_mxn")).rows;
  assert.deepEqual(plans.map(p=>[Number(p.price_mxn),Number(p.review_limit),Number(p.branch_limit),Number(p.nfc_card_limit)]),[[299,10,1,3],[399,30,5,6],[549,100,10,12]]);
  const {rows:[branch]}=await db.query('select id from nival_pr.branches where business_id=$1 and is_primary',[b]);
  await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
  const segments=await db.query('select * from nival_pr.customer_segments_for_branch($1,$2::date,$3)',[b,'2026-10-05',branch.id]);
  assert.equal(segments.rows.length,20);
  const statements=ownerStatements(b,periodRange('month','2026-10',new Date('2026-10-05T12:00:00Z')),branch.id);
  const scoped=await db.query(statements[2].text,statements[2].values);
  assert.equal(scoped.rows.find(r=>r.period==='current').visits,8);
  await db.exec('reset role');await db.exec('set role npr_v2_auth');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
  await assert.rejects(db.query("select nival_pr_private.manage_branch($1,null,'Segunda',true)",[b]),/permite hasta 1/);
  await db.exec('reset role');
  await db.query('update nival_pr.businesses set pay_business_ref=$2,pay_card_label=$3,pay_card_url=$4 where id=$1',[b,'NP-238','Tarjeta Café','https://pay.nival.test/cafe']);
  const {rows:[linked]}=await db.query('select pay_business_ref,pay_card_label,pay_card_url from nival_pr.businesses where id=$1',[b]);
  assert.equal(linked.pay_business_ref,'NP-238');assert.equal(linked.pay_card_url,'https://pay.nival.test/cafe');
  const {rows:[ledger]}=await db.query('select branch_id from nival_pr.point_ledger where business_id=$1 limit 1',[b]);
  assert.equal(ledger.branch_id,null,'historical immutable rows remain untouched');
 }finally{await db.close();}
});
