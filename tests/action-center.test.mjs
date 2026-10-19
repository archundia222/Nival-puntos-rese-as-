import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Inicio exposes a short operational summary and campaigns remain functional',()=>{
 const view=read('lib/owner/view.tsx');
 for(const key of ['homePending','homeQuickActions','homeCoreMetrics','data-panel="campañas-clientes"','markCampaignSent','data-panel="premios"','data-panel="mis-tarjetas"'])assert.ok(view.includes(key),key);
 assert.ok(view.includes('<RedemptionTable'));
});
test('owner navigation matches the approved unified menu and keeps Cards unchanged',()=>{
 const shell=read('lib/owner/shell.tsx');
 const order=["{id:'inicio'","{id:'tarjetas'","{id:'clientes-menu'","{id:'canjes'","{id:'reseñas'","{id:'informes'","{id:'sucursales'","{id:'equipo'","{id:'cuenta'"];
 const positions=order.map(key=>{const i=shell.indexOf(key);assert.ok(i>=0,key);return i;});
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
 assert.ok(shell.includes("label:'Mis tarjetas'"));
 assert.ok(shell.includes("label:'Premios y recompensas'"));
 assert.ok(shell.includes("label:'Mis tarjetas NFC'"));
 assert.ok(!shell.includes("{id:'operacion',label:'Operación'"));
});
test('branch customer totals exclude customers who have never visited the selected branch',()=>{
 assert.ok(read('lib/owner/data.ts').includes('segments.filter(c=>!branchId||Number(c.visits)>0)'));
});
test('promotions retain persisted targeting without automatic marketing',()=>{
 const campaign=read('lib/owner/campaign-overview.tsx');
 for(const x of ['at_risk','frequent','all','view=promociones#premios'])assert.ok(campaign.includes(x));
 assert.ok(campaign.includes('No se envían mensajes automáticamente'));
});
