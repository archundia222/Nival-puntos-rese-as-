import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {legalDefaults,draftNotice,publishedLegal,validateLegalDraft,marketingConsent} from '../lib/foundation/legal.mjs';
import {ownerFixture} from './owner-fixture.mjs';
test('all legal drafts include review notice, generic scope, identities, rights and service conditions',()=>{
 for(const [key,text] of Object.entries(legalDefaults)){assert.ok(text.startsWith(draftNotice),key);assert.ok(text.length<20000);assert.ok(!/\b(platillo|mesero|mesa)\b/.test(text));assert.ok(validateLegalDraft(key,text));assert.ok(!validateLegalDraft(key,'Documento sin advertencia'));}
 for(const x of ['domicilio','responsable','encargado','ARCO','20 días hábiles','15 días hábiles','Cookies','Transferencias','secundarias'])assert.ok(legalDefaults.legal_privacy.toLowerCase().includes(x.toLowerCase()),x);
 for(const text of [legalDefaults.legal_terms,legalDefaults.legal_privacy])for(const field of ['[RAZÓN SOCIAL]','[RFC]','[DOMICILIO]','[CORREO]'])assert.ok(text.includes(field),field);
 for(const x of ['Nival Solo Puntos, $299 MXN','Esencial, $399 MXN','Plus, $499 MXN','30 respuestas manuales','100 respuestas manuales','tarjeta NFC física se cotiza por separado','30 días','7 días','solo lectura','exportación','incentivos','no filtra','México'])assert.ok(legalDefaults.legal_terms.toLowerCase().includes(x.toLowerCase()),x);
 assert.ok(marketingConsent.includes('Opcional'));assert.ok(marketingConsent.includes('BAJA'));
 assert.equal(publishedLegal('legal_terms',{value_draft:{text:'secreto'}}),legalDefaults.legal_terms);
 assert.equal(publishedLegal('legal_terms',{value_published:{text:'Versión publicada'}}),'Versión publicada');
});
test('real admin actions keep drafts private, publish to public reader and reject owner edits',async()=>{
 const {db,owner}=await ownerFixture();
 try{
 const admin='33333333-3333-4333-8333-333333333333';await db.query('insert into neon_auth."user" values($1)',[admin]);await db.query("insert into nival_pr.profiles(id,role,full_name) values($1,'superadmin','Admin')",[admin]);
 let actor={id:admin,role:'superadmin'};const invalidations=[];
 const query=async(a,sql,values=[])=>{await db.exec('reset role');await db.query("select set_config('npr.user_id',$1,false)",[a.id]);await db.exec('set role '+(a.role==='superadmin'?'npr_v2_admin':'npr_v2_owner'));return (await db.query(sql,values)).rows;};
 const mod={exports:{}};
 const code=ts.transpile(readFileSync('lib/admin/actions.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
 new Function('require','module','exports',code)(id=>id.includes('legal.mjs')?{validateLegalDraft}:id==='next/cache'?{revalidatePath:p=>invalidations.push(p)}:id.includes('/action-guard')?{guardAction:async(roles)=>{if(!roles.includes(actor.role))throw Error('Forbidden');return actor;}}:id.includes('/session')?{requireRole:async(role)=>{if(actor.role!==role)throw Error('Forbidden');return actor;}}:id.includes('/db')?{query}:id==='node:crypto'?{}:{},mod,mod.exports);
 const f=new FormData();f.set('key','legal_terms');f.set('value',draftNotice+'\nPrueba publicada');
 const saved=await mod.exports.saveContentDraft({},f);assert.ok(saved.success,JSON.stringify(saved));
 await db.exec('reset role');let row=(await db.query("select * from nival_pr.site_content where key='legal_terms'")).rows[0];assert.equal(publishedLegal('legal_terms',row),legalDefaults.legal_terms);
 assert.ok((await mod.exports.publishContent({},f)).success);await db.exec('reset role');row=(await db.query("select * from nival_pr.site_content where key='legal_terms'")).rows[0];assert.equal(publishedLegal('legal_terms',row),f.get('value'));assert.ok(invalidations.includes('/terminos'));assert.ok(invalidations.includes('/privacidad'));
 actor={id:owner,role:'owner'};await assert.rejects(mod.exports.saveContentDraft({},f));
 await db.exec('reset role');assert.equal((await db.query("select count(*)::int n from nival_pr.audit_log where action like 'site_content.%'")).rows[0].n,2);
 }finally{await db.close();}
});
test('customer marketing is optional, persisted separately and isolated from another business',async()=>{
 const {db,b,bb,owner,other}=await ownerFixture();
 try{
 await db.exec(readFileSync('database/legal-pilot.sql','utf8'));
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 await db.exec("set role npr_v2_auth;select set_config('npr.user_id','',false)");
 const h='f'.repeat(64);const {rows:[c]}=await db.query("select nival_pr_private.enroll_customer_legal('example','Nuevo','525599999999',$1,false) id",[h]);
 await db.exec('reset role');let row=(await db.query('select * from nival_pr.customers where id=$1',[c.id])).rows[0];assert.equal(row.marketing_consent,false);assert.equal(row.marketing_consent_at,null);assert.equal(row.consent_version,'piloto-v2-2026-10-05');assert.ok(row.consent_at);
 await db.exec('set role npr_v2_auth');await assert.rejects(db.query('select nival_pr_private.consent_customer_legal($1,$2,true)',[bb,h]));await db.exec('reset role');assert.equal((await db.query('select marketing_consent from nival_pr.customers where id=$1',[c.id])).rows[0].marketing_consent,false);
 await db.exec('set role npr_v2_auth');await db.query('select nival_pr_private.consent_customer_legal($1,$2,true)',[b,h]);await db.exec('reset role');row=(await db.query('select * from nival_pr.customers where id=$1',[c.id])).rows[0];assert.equal(row.marketing_consent,true);assert.ok(row.marketing_consent_at);
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[other]);assert.equal((await db.query('select id,marketing_consent from nival_pr.customers where id=$1',[c.id])).rows.length,0);
 await db.query("select set_config('npr.user_id',$1,false)",[owner]);assert.equal((await db.query('select marketing_consent from nival_pr.customers where id=$1',[c.id])).rows[0].marketing_consent,true);
 }finally{await db.close();}
});
