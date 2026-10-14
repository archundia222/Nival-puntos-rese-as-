import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('action center and campaign management are wired to the existing panel',()=>{const view=read('lib/owner/view.tsx');assert.ok(view.includes('<NextActions'));assert.ok(view.includes('<CampaignOverview'));assert.ok(view.includes('<SegmentCard'));});
test('the navigation includes the customer directory and Google reviews',()=>{const shell=read('lib/owner/shell.tsx');assert.ok(shell.includes("{id:'clientes',label:'Todos los clientes'}"));assert.ok(shell.includes("{id:'google',label:'Google y reseñas',icon:'google'}"));});
test('branch customer totals exclude customers who have never visited the selected branch',()=>{assert.ok(read('lib/owner/data.ts').includes('segments.filter(c=>!branchId||Number(c.visits)>0)'));});
test('campaigns show persisted targeting and do not claim automatic sending',()=>{const campaign=read('lib/owner/campaign-overview.tsx');for(const x of ['at_risk','frequent','all','view=promociones#premios'])assert.ok(campaign.includes(x));assert.ok(campaign.includes('No se envían mensajes automáticamente'));});
