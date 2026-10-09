import {encodeReviewInsights,decodeReviewInsights} from '../lib/owner/review-insights.mjs';
import {ownerFixture} from './owner-fixture.mjs';
import {ownerStatements} from '../lib/owner/queries.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {periodRange,generateAdvice,validateGoogle,inclusivePeriodEnd,formatPeriodDate,formatCustomerVisitDate} from '../lib/owner/domain.mjs';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',b='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',bb='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
test('20 customers: manual SQL has correct five segments, editable thresholds and RLS isolation',async()=>{
 const {db}=await ownerFixture();try{
 await db.query("insert into nival_pr.review_reports(business_id,period,period_kind,rating,total_reviews,new_reviews,answered,distribution,profile_checklist,notes,created_by,answered_scope) values($1,'2026-10-01','month',4.5,10,3,2,'{\"1\":1,\"2\":0,\"3\":0,\"4\":2,\"5\":7}','{\"fotos\":true}','Consejo manual',$2,'period')",[b,owner]);
 await db.query("insert into nival_pr.changelog(business_id,description) values($1,'Actualizamos horarios')",[b]);
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 const {rows:[counts]}=await db.query(readFileSync('database/owner-segments-check.sql','utf8'));
 assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,Number(v)])),{total:20,nuevos:4,frecuentes:4,riesgo:4,perdidos:4,no_este_mes:12});
 console.log('Manual SQL 20 customers:',counts);
 const statements=ownerStatements(b,periodRange('month','2026-10',new Date('2026-10-05T12:00:00Z')));
 const result=[];for(const st of statements)result.push((await db.query(st.text,st.values)).rows);
 const current=result[2].find(r=>r.period==='current'),prev=result[2].find(r=>r.period==='previous');
 assert.equal(current.visits,8);assert.equal(current.new_customers,4);assert.equal(current.points,8);assert.equal(prev.visits,11);assert.equal(prev.new_customers,6);
 assert.equal(result[4][0].notes,'Consejo manual');assert.equal(result[5][0].description,'Actualizamos horarios');
 const {rows:templates}=await db.query('select segment,text from nival_pr.advice_templates');
 for(const k of ['new','frequent','risk','lost','absent'])assert.equal(templates.filter(x=>x.segment===k).length,3);
 assert.ok((await generateAdvice('risk',{templates,count:4,variant:1})).includes('4 clientes'));
 const {rows:[report]}=await db.query('select * from nival_pr.review_reports where business_id=$1',[b]);assert.equal(report.notes,'Consejo manual');assert.equal(Number(report.rating),4.5);assert.equal(report.profile_checklist.fotos,true);
 await db.query('insert into nival_pr.segment_settings(business_id,new_days) values($1,2)',[b]);
 assert.equal((await db.query("select count(*)::int n from nival_pr.customer_segments($1,'2026-10-05') where is_new",[b])).rows[0].n,1);
 await assert.rejects(db.query('insert into nival_pr.segment_settings(business_id) values($1)',[bb]),/row-level security/);
 await assert.rejects(db.query("update nival_pr.review_reports set notes='Owner edit' where business_id=$1",[b]),/permission denied/);
 await db.query("select set_config('npr.user_id',$1,false)",[other]);
 assert.equal((await db.query("select * from nival_pr.customer_segments($1,'2026-10-05')",[b])).rows.length,0);
 for(const table of ['review_reports','changelog','segment_settings'])assert.equal((await db.query('select * from nival_pr.'+table+' where business_id=$1',[b])).rows.length,0);
 }finally{await db.close();}
});
test('periods use Mexico dates and previous calendar periods including leap days',()=>{
 const now=new Date('2026-10-01T02:00:00Z');assert.equal(periodRange('day','',now).key,'2026-09-30');
 assert.deepEqual(periodRange('month','2024-03').previous,'2024-02-01');assert.equal(periodRange('month','2024-02').end,'2024-03-01');
 assert.equal(periodRange('day','2024-02-29').end,'2024-03-01');assert.equal(periodRange('year','2026').previous,'2025-01-01');
 assert.equal(periodRange('day','2026-02-31',now).key,'2026-09-30');
});
test('customer visit dates preserve their calendar day across Mexico timezone rendering',()=>{
 assert.equal(formatCustomerVisitDate('2026-09-04T00:00:00.000Z'),'4 sep 2026');
 assert.equal(formatCustomerVisitDate('2026-08-06'),'6 ago 2026');
 assert.equal(formatCustomerVisitDate(null),'—');
 const explorer=readFileSync('lib/owner/customer-explorer.tsx','utf8');
 const clients=readFileSync('lib/owner/clients.tsx','utf8');
 assert.ok(explorer.includes('formatCustomerVisitDate(c.last_visit)'));
 assert.ok(clients.includes('formatCustomerVisitDate(c.last_visit)'));
});
test('period captions display inclusive Spanish dates without database terminology',()=>{
 assert.equal(formatPeriodDate('2024-02-29'),'29 de febrero de 2024');
 assert.equal(formatPeriodDate(inclusivePeriodEnd(periodRange('month','2024-02').end)),'29 de febrero de 2024');
 const ownerView=readFileSync('lib/owner/view.tsx','utf8');
 assert.ok(ownerView.includes('formatPeriodDate(inclusivePeriodEnd(range.end))'));
 assert.ok(!ownerView.includes('(fin excluido)'));
});
test('Google rejects invented distribution and response totals; advice preserves count and variants',async()=>{
 const valid={rating:4.5,total:10,fresh:3,answered:2,distribution:{1:1,2:0,3:0,4:2,5:7}};
 assert.equal(validateGoogle(valid),null);assert.ok(validateGoogle({...valid,answered:4}));assert.ok(validateGoogle({...valid,total:11}));
 const templates=[{segment:'new',text:'Tienes {n} nuevos.'},{segment:'new',text:'Revisa {n} tarjetas.'}];
 assert.equal(await generateAdvice('new',{templates,count:20,variant:1}),'Revisa 20 tarjetas.');
});

test('actual admin save action persists complete Google data; owner reads it and invalid totals are rejected',async()=>{
 const {db}=await ownerFixture();try{
 const ts=await import('typescript');
 const source=readFileSync('lib/admin/actions.ts','utf8'),a=source.indexOf('export async function saveGoogleReport'),z=source.indexOf('export async function createReviewTask',a);
 const compiled=ts.transpileModule(source.slice(a,z).replace('export async','async'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const {checklistLabels}=await import('../lib/owner/domain.mjs');
 const actor={id:owner,role:'superadmin'};
 const action=new Function('encodeReviewInsights','guardAction','val','uuid','periodRange','validateGoogle','checklistLabels','transaction','audit','revalidatePath','cleanError',compiled+';return saveGoogleReport;')(
 encodeReviewInsights,async roles=>{if(!roles.includes(actor.role))throw Error('Forbidden');return actor;},(f,k)=>String(f.get(k)||'').trim(),s=>/^[a-f0-9-]{36}$/.test(s),periodRange,validateGoogle,checklistLabels,
 async(_actor,statements)=>{await db.exec('set role npr_v2_admin');await db.query("select set_config('npr.user_id',$1,false)",[owner]);await db.exec('begin');try{for(const st of statements)await db.query(st.text,st.values);await db.exec('commit');}catch(e){await db.exec('rollback');throw e;}},async()=>{},()=>{},e=>e.message);
 const f=new FormData();for(const [k,v] of Object.entries({businessId:b,periodKind:'month',period:'2026-10',rating:'4.5',total:'10',new:'3',answered:'2',star1:'1',star2:'0',star3:'0',star4:'2',star5:'7',notes:'Mejora la descripción',changes:'Nival actualizó los horarios',changeDate:'2026-10-03',check_fotos:'on',check_horarios:'on',check_categoria:'on',check_menu:'on',check_reservas:'on'}))f.set(k,v);
 assert.ok((await action({},f)).success);
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 const {rows:[report]}=await db.query('select * from nival_pr.review_reports where business_id=$1',[b]);
 assert.equal(report.notes,'Mejora la descripción');assert.equal(report.answered_scope,'period');assert.equal(Number(report.rating),4.5);assert.equal(report.new_reviews,3);assert.equal(report.answered,2);assert.equal(report.distribution[5],7);assert.equal(report.profile_checklist.reservas,true);
 assert.equal((await db.query('select description from nival_pr.changelog where business_id=$1',[b])).rows[0].description,'Nival actualizó los horarios');
 f.set('analyzed','5');f.set('positiveTheme0','Atención amable');f.set('positiveCount0','3');f.set('negativeTheme0','Espera');f.set('negativeCount0','2');f.set('improve','Revisar tiempos');f.set('keep','Mantener el saludo');
 assert.ok((await action({},f)).success);
 await db.exec('set role npr_v2_owner');
 const saved=(await db.query('select notes from nival_pr.review_reports where business_id=$1',[b])).rows[0].notes;
 assert.equal(decodeReviewInsights(saved).analysis.positive[0].count,3);assert.equal(decodeReviewInsights(saved).analysis.improve,'Revisar tiempos');
 f.set('positiveCount0','6');assert.ok((await action({},f)).error);f.set('positiveCount0','3');
 f.set('star5','8');assert.ok((await action({},f)).error);f.set('star5','7');f.set('answered','4');assert.ok((await action({},f)).error);
 f.set('answered','2');f.set('periodKind','day');f.set('period','2026-10-01');assert.ok((await action({},f)).success);
 await db.exec('set role npr_v2_owner');assert.equal((await db.query('select * from nival_pr.review_reports where business_id=$1',[b])).rows.length,2);
 }finally{await db.close();}
});

test('Google selects only filtered periods with Date or string dates and does not double count granularities',async()=>{
 const {googleSelection}=await import('../lib/owner/domain.mjs');
 const reports=[{period:new Date('2026-09-01T00:00:00Z'),period_kind:'month',new_reviews:12,answered:10,answered_scope:'period'}, {period:'2026-10-01',period_kind:'month',new_reviews:10,answered:7,answered_scope:'period'},{period:'2026-10-02',period_kind:'day',new_reviews:2,answered:1,answered_scope:'period'}];
 const selected=googleSelection(reports,periodRange('month','2026-10'));assert.deepEqual(selected.google,{fresh:10,answered:7,resolution:'month'});assert.equal(selected.reports.length,2);
 assert.equal(googleSelection(reports,periodRange('year','2026')).google.fresh,22);
 assert.equal(googleSelection(reports,periodRange('day','2026-10-02')).google.fresh,2);
 assert.equal(googleSelection(reports,periodRange('day','2026-10-03')).google,null);
 assert.equal(googleSelection([{...reports[1],answered_scope:'legacy_total'}],periodRange('month','2026-10')).google.answered,null);
});
