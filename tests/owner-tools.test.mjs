import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {ownerFixture} from './owner-fixture.mjs';import {messageFor} from '../lib/owner/messages.mjs';
test('WhatsApp variables produce individual messages without touching unknown placeholders',()=>{
 assert.equal(messageFor('risk',{name:'Ana',balance:3,reward_name:'Café'},'Sol',[{segment:'risk',body:'{nombre} · {puntos} · {premio} · {negocio} · {otro}'}]),'Ana · 3 · Café · Sol · {otro}');
 assert.match(messageFor('new',{name:'Ana'},'Sol'),/gracias por visitar Sol/);
});
test('manual balance correction is append-only, reasoned, scoped and rejects negative balances',async()=>{
 const {db,owner,other,b,bb}=await ownerFixture();try{
 for(const name of ['reputation-v6','lealtad-v6','points-only-plan-v1','entitlements-v2','owner-tools-v2'])await db.exec(readFileSync('database/'+name+'.sql','utf8'));
 await db.query("update nival_pr.businesses set status='activo',paid_until=now()+interval '30 days' where id=$1",[b]);
 await db.query("insert into nival_pr.programs(business_id,name) values($1,'Test')",[b]);
 const c=(await db.query('select id from nival_pr.customers where business_id=$1 limit 1',[b])).rows[0].id;
 await db.exec('set role npr_v2_auth');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 const operation=crypto.randomUUID();await db.query('select nival_pr_private.manual_adjustment($1,$2,5,$3,$4)',[b,c,'Corrección por ticket',operation]);
 await assert.rejects(db.query('select nival_pr_private.manual_adjustment($1,$2,5,$3,$4)',[b,c,'x',crypto.randomUUID()]),/Ajuste inválido/);
 await assert.rejects(db.query('select nival_pr_private.manual_adjustment($1,$2,-100,$3,$4)',[b,c,'Saldo incorrecto',crypto.randomUUID()]),/Saldo insuficiente/);
 await assert.rejects(db.query('select nival_pr_private.manual_adjustment($1,$2,5,$3,$4)',[bb,c,'Otro negocio',crypto.randomUUID()]),/Owner required/);
 await assert.rejects(db.query('select nival_pr_private.manual_adjustment($1,$2,5,$3,$4)',[b,c,'Corrección por ticket',operation]),/unique/);
 await db.exec('reset role');assert.equal((await db.query("select count(*)::int n from nival_pr.point_ledger where type='adjust'")).rows[0].n,1);assert.equal((await db.query("select count(*)::int n from nival_pr.audit_log where action='points.adjusted'")).rows[0].n,1);
 }finally{await db.close();}
});
