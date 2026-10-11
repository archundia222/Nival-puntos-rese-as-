import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('card editor keeps edits in a local draft until explicit publish',()=>{
 const editor=read('lib/points/program-editor.tsx');
 assert.ok(editor.includes('Guardar y publicar'));
 assert.ok(editor.includes('Hay cambios sin publicar.'));
 assert.ok(!editor.includes('Guardar ahora'));
 assert.ok(!editor.includes('automáticamente'));
 assert.ok(editor.includes('cardEnabled'));
 assert.ok(editor.includes('rewardName')&&editor.includes('rewardCost'));
 assert.ok(editor.includes('QR personal · muestra')&&editor.includes('Código:'));
});

test('phone recovery is Turnstile verified and rate limited per IP and phone',()=>{
 const actions=read('lib/foundation/actions.ts'),page=read('app/b/[slug]/page.tsx'),sql=read('database/card-publish-recovery-v1.sql');
 const recovery=actions.slice(actions.indexOf('export async function recoverCustomerByPhone'),actions.indexOf('export async function consentCard'));
 assert.ok(recovery.includes('verifyTurnstile'));
 assert.ok(recovery.includes('card-recovery-ip:')&&recovery.includes('card-recovery-phone:'));
 assert.ok(recovery.includes('recover_customer_by_phone'));
 assert.ok(page.includes('action={recoverCustomerByPhone}'));
 assert.ok(page.indexOf('{c ? (')<page.indexOf(') : !b.active ? ('),'existing cards remain viewable when the business is paused');
 assert.ok(page.includes('Programa no disponible')&&page.includes('Recuperar mi tarjeta'));
 assert.ok(sql.includes('unique_violation')&&sql.includes('device_token_hash=h'));
 assert.ok(sql.includes('card_active_guard'));
});
