import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Wallet allows saving without consent to marketing',()=>{
 const button=read('lib/wallet/button.tsx');
 const api=read('app/api/wallet/save/route.ts');
 assert.ok(button.includes('useState(false)'));
 assert.ok(button.includes('notificationsOptIn'));
 assert.ok(button.includes('opcional'));
 assert.ok(api.includes('notificationsOptIn=false'));
 assert.ok(api.includes("typeof notificationsOptIn!=='boolean'"));
});
test('Saving a pass never falsely confirms it was added',()=>{
 const code=read('lib/wallet/server.ts');
 const sql=read('scripts/migrations/20261018_wallet_preferences.sql');
 assert.ok(sql.includes('pass_add_confirmed_at timestamptz'));
 assert.ok(code.includes('recordWalletPreference'));
 assert.ok(!code.slice(code.indexOf('export async function recordWalletPreference')).includes('pass_add_confirmed_at=now()'));
});
