import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('card editor keeps edits in a local draft until explicit publish',()=>{
 const editor=read('lib/points/program-editor.tsx');
 assert.ok(editor.includes('Guardar tarjeta'));
 assert.ok(editor.includes('Borrador actualizado. Publícalo cuando esté listo.'));
 assert.ok(!editor.includes('Guardar ahora'));
 assert.ok(!editor.includes('automáticamente'));
 assert.ok(editor.includes('cardEnabled'));
 assert.ok(editor.includes('rewardName')&&editor.includes('rewardCost'));
 assert.ok(editor.includes('QR PERSONAL')&&editor.includes('00000000'));
 assert.ok(editor.includes('Promociones')&&editor.includes('Diseño')&&editor.includes('Detalles'));
 assert.ok(editor.includes('campaignRules')&&editor.includes('at_risk')&&editor.includes('Elegir al azar'));
 assert.ok(editor.includes('secondaryColor')&&editor.includes('askBirthday')&&editor.includes('squareLogo'));
});

test('points and review QR cards share the Cards workspace with plan limits',()=>{
 const workspace=read('lib/points/card-workspace.tsx'),page=read('app/panel/puntos/page.tsx'),exportRoute=read('app/api/points/export/route.ts'),qrRoute=read('app/api/points/qr/route.ts');
 const owner=read('lib/owner/view.tsx');
 const catalog=read('lib/points/card-catalog.tsx');
 for(const label of ['Tus tarjetas','Actividad del programa','Registros recientes','Editar tarjeta','Exportar clientes','Exportar movimientos'])assert.ok(workspace.includes(label),label);
 assert.ok(!workspace.includes('Tarjetas QR de reseñas'));
 assert.ok(page.includes('CardWorkspace')&&!page.includes('list_branch_review_cards'));
 assert.ok(owner.includes('data-panel="mis-tarjetas"')&&owner.includes('reviewCards={data.reviewCards||[]}'));assert.ok(catalog.includes('<ReviewCardManager')&&catalog.includes('cardLimit={nfcLimit}'));assert.ok(catalog.includes('Compartir esta tarjeta'));
 const manager=read('lib/owner/review-card-manager.tsx');assert.ok(manager.includes('className="reviewCardInlineQr"'));assert.ok(manager.includes("/api/reviews/qr?code='+encodeURIComponent(card.code)"));
 assert.ok(!catalog.includes('giftMock')&&!catalog.includes('Tarjeta de regalo'));
 assert.ok(owner.includes('data-panel="nival-pay"'));
 assert.ok(exportRoute.includes('requireRole("owner")')&&exportRoute.includes('requireBusiness'));
 assert.ok(qrRoute.includes('format==="png"')&&qrRoute.includes('format==="pdf"'));
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

test('personal QR, staff lookup, live point feedback and customer animation stay connected',()=>{
 const page=read('app/b/[slug]/page.tsx'),card=read('lib/points/card-view.tsx'),staff=read('app/api/staff/customer/route.ts'),css=read('app/globals.css');
 assert.ok(page.includes('QRCode.toDataURL("NIVAL:" + c.id'));
 assert.ok(staff.includes('raw.startsWith("NIVAL:")')&&staff.includes('staff_customer_code')&&staff.includes('staff_customer($1,$2,$3)'));
 assert.ok(card.includes('Obtuviste un punto')&&card.includes('cardPulse')&&card.includes('setConfetti(true)'));
 assert.ok(css.includes('.pointCongrats')&&css.includes('@keyframes pointCongrats'));
});
