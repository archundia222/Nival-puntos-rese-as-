import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('card editor keeps edits in a local draft until explicit publish',()=>{
 const editor=read('lib/points/program-editor.tsx');
 assert.ok(editor.includes('tab===3&&<button type="submit"')&&editor.includes('Publicar tarjeta'));
 assert.ok(editor.includes('if(tab!==3||!formRef.current)return;'),'publishing is blocked before the final step');
 assert.ok(editor.includes('Completa cada paso; podrás publicar al final.'));
 assert.ok(editor.includes('primaryRewardId'),'a saved catalog reward is selected');
 assert.ok(!editor.includes('Guardar ahora'));
 assert.doesNotMatch(editor,/tarjeta se publica automáticamente|publicar automáticamente|publicación automática/i,'publication must require owner confirmation');
 assert.ok(editor.includes('cardEnabled'));
 for(const field of ['name','points','rewardName'])assert.ok(editor.includes('type="hidden" name="'+field+'"'),'all tab values remain part of submit: '+field);
 assert.ok(editor.includes('rewardName')&&editor.includes('rewardCost'));
 assert.ok(editor.includes('rewardOrder')&&editor.includes('setRewardOrder(next)'),'ordering stays a draft until publish');
 assert.ok(editor.includes('QR PERSONAL')&&editor.includes('00000000'));
 for(const word of ['Premios y promociones','Diseño','Detalles','campaignRules','at_risk','Al azar para cada cliente','secondaryColor','askBirthday','squareLogo','autoWelcome','autoMissYou'])assert.ok(editor.includes(word),word);
 assert.ok(editor.includes('accept="image/*"')&&editor.includes('optimizeCardImage'));
 assert.ok(editor.includes('Un punto por visita completada')&&!editor.includes('Horas mínimas entre visitas')&&!editor.includes('Máximo de visitas por día'));
 assert.ok(editor.includes('tab===1&&<aside className="liveCardPreview">'),'live preview stays in design step');
 const optimizer=read('lib/points/image-optimizer.ts');
 assert.ok(optimizer.includes('12 * 1024 * 1024')&&optimizer.includes('canvasBlob'));
});

test('promotion catalog is available before the card and saved promotions can be selected later',()=>{
 const page=read('app/panel/puntos/page.tsx'),actions=read('lib/foundation/actions.ts'),workspace=read('lib/points/card-workspace.tsx');
 assert.ok(page.includes("{view==='premios'&&<><section className=\"reviewBox extraRewards\">"),'catalog does not require an existing points program');
 assert.ok(actions.includes('catalog_only\\":true'),'first promotion creates a catalog-only program');
 assert.ok(actions.includes('primaryRewardId')&&actions.includes('select r.id from nival_pr.rewards'),'card saves an existing business promotion');
 assert.ok(workspace.includes('program?.rules?.catalog_only')&&workspace.includes('Aún sin tarjeta'),'catalog-only program is not shown as a published card');
 const guide=read('lib/owner/start-guide.tsx');
 assert.ok(guide.includes("label:'Crear tu primera promoción'")&&guide.includes("view=premios#premios"),'the first setup step opens promotion creation');
 assert.ok(guide.includes("label:'Configurar y publicar tu tarjeta'")&&guide.includes("view=programa")&&guide.includes("href:base+'&edit=1#card-editor'"),'the next setup step opens the complete card flow');
});

test('points and review QR cards share the Cards workspace with plan limits',()=>{
 const workspace=read('lib/points/card-workspace.tsx'),page=read('app/panel/puntos/page.tsx'),exportRoute=read('app/api/points/export/route.ts'),qrRoute=read('app/api/points/qr/route.ts');
 const owner=read('lib/owner/view.tsx');
 const catalog=read('lib/points/card-catalog.tsx');
 for(const label of ['Tus tarjetas','Actividad del programa','Registros recientes','Editar tarjeta','Exportar clientes','Exportar movimientos'])assert.ok(workspace.includes(label),label);
 assert.ok(!workspace.includes('Tarjetas QR de reseñas'));
 assert.ok(page.includes('CardWorkspace')&&!page.includes('list_branch_review_cards'));
 assert.ok(owner.includes('data-panel="mis-tarjetas"')&&owner.includes('reviewCards={data.reviewCards||[]}'));assert.ok(catalog.includes('<ReviewCardManager')&&catalog.includes('cardLimit={nfcLimit}'));assert.ok(catalog.includes('Compartir sistema de puntos')&&catalog.includes('<ShareTools'),'the single share panel keeps QR and link');
 const manager=read('lib/owner/review-card-manager.tsx');assert.ok(!manager.includes('className="reviewCardInlineQr"'),'review QR must be hidden in the list');assert.ok(manager.includes('className="reviewCardShareQr"')&&manager.includes('/api/reviews/qr?code='),'review QR appears on opening the card');
 assert.ok(!catalog.includes('giftCardSystemTile')&&!catalog.includes('Tarjeta de regalo'),'gift card must be absent while points and review QR remain');
 assert.ok(!owner.includes('data-panel="nival-pay"'),'retired gift page must not appear');
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
