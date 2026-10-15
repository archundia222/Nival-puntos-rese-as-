import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('campaign setup supports every customer segment with manual or random selection',()=>{
 const editor=read('lib/points/program-editor.tsx');
 const action=read('lib/foundation/actions.ts');
 const branchAction=read('lib/owner/actions.ts');
 const campaign=read('lib/owner/campaign-overview.tsx');
 const audiences=['all','new','frequent','at_risk','lost','absent'];
 for(const key of audiences){assert.ok(editor.includes(`"${key}"`));assert.ok(action.includes(`"${key}"`));assert.ok(branchAction.includes(`'${key}'`));assert.ok(campaign.includes(`'${key}'`));}
 for(const file of [editor,action,branchAction,campaign]){assert.ok(file.includes('random'));assert.ok(file.includes('manual'));}
 assert.ok(campaign.includes("r.id===active[0]?.id"),'the first active reward is assigned to Todos by default');
});

test('database campaign selector supports all segments and falls back to Todos',()=>{
 const sql=read('database/campaign-audiences-v2.sql');
 for(const key of ['all','new','frequent','at_risk','lost','absent'])assert.ok(sql.includes(`'${key}'`));
 assert.match(sql,/candidates=rules#>array\['targets',audience\]/);
 assert.match(sql,/candidates=rules#>'\{targets,all\}'/);
 assert.match(sql,/order by case when rules->>'strategy'='random' then random\(\) else 0 end,rw\.position/);
});
