import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the employee QR opens a direct session using the matching active staff identity',()=>{
 const access=read('lib/points/staff-access.tsx');
 const route=read('app/staff/entrar/route.ts');
 assert.ok(access.includes("'/staff/entrar?negocio='"));
 assert.ok(access.includes('No hace falta escribir el PIN'));
 assert.ok(route.includes('pin_identity($1,$2)'));
 assert.ok(route.includes('issue_staff_session($1,$2,$3)'));
 assert.ok(route.includes("signedHint('staff', secret())"));
 assert.ok(route.includes("new URL('/staff', request.url)"));
 assert.ok(route.includes("'Cache-Control', 'no-store, private'"));
});

test('staff access is only available through an individual QR or link',()=>{
 const page=read('app/staff/acceso/page.tsx');
 const businessLogin=read('app/acceso/form.tsx');
 const staffAction=read('lib/foundation/actions.ts');
 assert.ok(page.includes('únicamente desde el QR o enlace individual'));
 assert.ok(page.includes('Ese enlace ya no es válido'));
 assert.ok(!page.includes('name="pin"'));
 assert.ok(!businessLogin.includes('/staff/acceso'));
 assert.ok(!staffAction.includes('export async function loginStaff'));
});

test('owner activity tab survives reload and remains separate from staff panel',()=>{
 const page=read('app/panel/page.tsx');
 const team=read('lib/owner/team-unified.tsx');
 const staff=read('app/staff/page.tsx');
 assert.ok(page.includes("teamTab={params.teamTab==='actividad'?'actividad':'personal'}"));
 assert.ok(team.includes("url.searchParams.set('teamTab',next)"));
 assert.ok(team.includes('initialTab'));
 assert.ok(staff.includes('NIVAL · PERSONAL'));
});

test('customer card persists in this browser and optional birthday reads saved card settings',()=>{
 const page=read('app/b/[slug]/page.tsx');
 const actions=read('lib/foundation/actions.ts');
 const view=read('lib/points/card-view.tsx');
 assert.ok(page.includes("p.rules->'card_design'->>'askBirthday'"));
 assert.ok(page.includes('Fecha de nacimiento (opcional)'));
 assert.ok(actions.includes('enroll_customer_with_birthday'));
 assert.ok(view.includes('durante un año'));
});
