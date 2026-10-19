import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('campaign send history is tenant-isolated and never auto-dispatches',()=>{
 const migration=read('scripts/migrations/20261018_campaign_sends.sql');
 const actions=read('lib/owner/actions.ts');
 for(const rule of ['ENABLE ROW LEVEL SECURITY','campaign_owner','nival_pr.has_business(business_id)','channel text NOT NULL','customer_ids uuid[]','created_by uuid NOT NULL'])assert.ok(migration.includes(rule),rule);
 assert.ok(actions.includes("channel!=='manual'"));
 assert.ok(actions.includes("await requireTool(actor,businessId)"));
 assert.ok(actions.includes('customer_ids,created_by'),'recipient identity is saved at send time');
});
test('near-reward audience is computed from real points ledger, and results use 14-day recorded visits',()=>{
 const actions=read('lib/owner/actions.ts'),data=read('lib/owner/data.ts');
 assert.ok(actions.includes('nival_pr.customer_segments($1,CURRENT_DATE)'));
 assert.ok(actions.includes('nival_pr.point_ledger l where l.customer_id=s.id'),'near-reward targeting requires actual current balance');
 assert.ok(data.includes("l.type='visit'"));
 assert.ok(data.includes("interval '14 days'"));
 assert.ok(data.includes('s.customer_ids'),'campaign result denominator is the original recipient list');
 assert.ok(!data.includes('campaign_conversion_lift'),'do not infer causal uplift');
});
