import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerFixture} from './owner-fixture.mjs';
import {validateReview,replyDraft,analyzeReviews,serviceWindow} from '../lib/reputation/engine.mjs';
test('review validation rejects malformed dates and duplicates normalize whitespace',()=>{
 const r={reviewer:'Ana',stars:5,body:'Buen servicio',reviewed_on:'2026-10-01'};
 assert.equal(validateReview(r).fingerprint,validateReview({...r,body:'Buen  servicio'}).fingerprint);
 assert.throws(()=>validateReview({...r,reviewed_on:'2026-02-30'}));assert.throws(()=>validateReview({...r,stars:0}));
});
test('analysis is evidence-backed and distinguishes small samples and global rating',()=>{
 const r={id:'1',reviewer:'Ana',stars:1,body:'Esperé mucho; servicio lento',reviewed_on:'2026-10-01'};
 const a=analyzeReviews([r]);assert.equal(a.review_count,1);assert.match(a.warning,/pocas/);assert.equal(a.themes.find(t=>t.theme==='Tiempos de espera').negative,1);assert.equal(a.themes[0].evidence[0].id,'1');assert.equal(a.rating,undefined);assert.match(replyDraft(r,'Café'),/lamentamos/);
});
test('early renewal does not restart the 30 day quota',()=>{
 const b={service_started_at:'2026-10-01T00:00:00Z',paid_until:'2026-11-30T00:00:00Z'};
 assert.deepEqual(serviceWindow(b,new Date('2026-10-15T00:00:00Z')),{start:'2026-10-01T00:00:00.000Z',end:'2026-10-31T00:00:00.000Z'});
});
test('reputation RLS hides drafts and other businesses; publishing respects quota',async()=>{
 const {db,owner,other,b,bb}=await ownerFixture();
 try{
 await db.exec(readFileSync('database/reputation-v6.sql','utf8'));
 await db.query("update nival_pr.profiles set role='superadmin' where id=$1",[other]);
 const {rows:[plan]}=await db.query("insert into nival_pr.plans(name,price_mxn,features) values('Test',399,'{\"review_limit\":1}') returning id");
 await db.query("update nival_pr.businesses set plan_id=$2,status='activo',paid_until=now()+interval '30 days',service_started_at=now() where id=$1",[b,plan.id]);
 await db.query("insert into nival_pr.generated_reports(business_id,kind,period_start,period_end,analysis,created_by) values($1,'week','2026-10-01','2026-10-08','{}',$2),($3,'month','2026-10-01','2026-11-01','{}',$2)",[b,other,bb]);
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 assert.equal((await db.query('select * from nival_pr.generated_reports')).rows.length,0);
 await db.exec('reset role');await db.query("update nival_pr.generated_reports set status='approved',approved_at=now()");
 await db.exec('set role npr_v2_owner');assert.equal((await db.query('select * from nival_pr.generated_reports')).rows.length,1);
 await assert.rejects(db.query("update nival_pr.generated_reports set status='draft'"),/permission/);
 await db.exec('reset role');
 const {rows}=await db.query("insert into nival_pr.reviews(business_id,reviewer,stars,reviewed_on,fingerprint) values($1,'A',5,current_date,'a'),($1,'B',1,current_date,'b'),($2,'Other',3,current_date,'c') returning id",[b,bb]);
 await db.exec('set role npr_v2_owner');assert.equal((await db.query('select * from nival_pr.reviews')).rows.length,2);
 await assert.rejects(db.query('select nival_pr.publish_review($1,$2)',[rows[0].id,'Gracias']),/permission/);
 await db.exec('reset role;set role npr_v2_admin');await db.query("select set_config('npr.user_id',$1,false)",[other]);
 await db.query('select nival_pr.publish_review($1,$2)',[rows[0].id,'Gracias']);
 await assert.rejects(db.query('select nival_pr.publish_review($1,$2)',[rows[0].id,'Gracias']),/ya respondida/);
 await assert.rejects(db.query('select nival_pr.publish_review($1,$2)',[rows[1].id,'Gracias']),/Cupo agotado/);
 }finally{await db.close();}
});
