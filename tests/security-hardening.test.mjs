import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {verifyTurnstile} from '../lib/security/turnstile.mjs';import {parseDsn,captureServerError} from '../lib/monitoring/sentry.mjs';
test('Turnstile verification fails closed and sends secret only to Cloudflare',async()=>{
 await assert.rejects(verifyTurnstile('token','1.2.3.4',{},async()=>Response.json({success:true})),/TURNSTILE_NOT_CONFIGURED/);
 let sent;assert.equal(await verifyTurnstile('token','1.2.3.4',{TURNSTILE_SECRET_KEY:'server-secret'},async(url,o)=>{sent={url,o};return Response.json({success:true});}),true);
 assert.equal(sent.url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.ok(String(sent.o.body).includes('secret=server-secret'));
});
test('Sentry DSN remains server-only and monitoring fails safely when unconfigured',async()=>{
 assert.equal(parseDsn('bad'),null);assert.equal(await captureServerError(Error('x'),{}, {},async()=>{throw Error('must not call')}),false);
 const d=parseDsn('https://publickey@o1.ingest.sentry.io/123');assert.equal(d.endpoint,'https://o1.ingest.sentry.io/api/123/envelope/');
});
test('global security headers include CSP anti-framing MIME and permissions protections',()=>{
 const s=readFileSync('next.config.ts','utf8');for(const h of ['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options','Permissions-Policy','Referrer-Policy'])assert.ok(s.includes(h));
 assert.ok(s.includes("frame-ancestors 'none'"));assert.ok(s.includes('challenges.cloudflare.com'));
});
test('session cookies and auth protections are server-side secure defaults',()=>{
 const s=readFileSync('lib/foundation/session.ts','utf8');assert.ok(/httpOnly:true/.test(s));assert.ok(/sameSite:'lax'/.test(s));assert.ok(/secure:process\.env\.NODE_ENV==='production'/.test(s));assert.ok(/maxAge:8\*3600/.test(s));
 const p=readFileSync('lib/points/security.ts','utf8');assert.ok(p.includes('assertSameOrigin'));
});

test('owner/admin email login is rate limited and business signup consumes a verified anti-bot gate',()=>{
 const s=readFileSync('app/api/auth/[...path]/route.ts','utf8');
 assert.ok(s.includes("endsWith('/sign-in/email')"));assert.ok(s.includes('claim_pin_attempt'));assert.ok(s.includes("'auth-ip:'"));assert.ok(s.includes("'auth-email:'"));assert.ok(s.includes('status:429'));
 assert.ok(s.includes("endsWith('/sign-up/email')"));assert.ok(s.includes("nival_turnstile"));assert.ok(s.includes('status:403'));
});
test('public customer enrollment verifies Turnstile before database enrollment',()=>{
 const a=readFileSync('lib/foundation/actions.ts','utf8'),p=readFileSync('app/b/[slug]/page.tsx','utf8');
 assert.ok(a.indexOf('verifyTurnstile(val(f,"cf-turnstile-response")')<a.indexOf('enroll_customer_legal'));assert.ok(p.includes('<TurnstileWidget/>'));
});
test('Wallet resources are namespaced away from other Nival products',()=>{
 const s=readFileSync('lib/wallet/google.mjs','utf8');assert.ok(s.includes(".puntos_business_"));assert.ok(s.includes(".puntos_customer_"));assert.ok(!s.includes(".npr_business_"));
});

import {issueTurnstileCookie,verifyTurnstileCookie} from '../lib/security/turnstile-cookie.mjs';
test('Turnstile gate cookie is HMAC signed, expires, and rejects forgery',()=>{
 const secret='0123456789abcdef0123456789abcdef',now=1_800_000_000_000;
 const cookie=issueTurnstileCookie(secret,now);
 assert.equal(verifyTurnstileCookie(cookie,secret,now+299_000),true);
 assert.equal(verifyTurnstileCookie(cookie,secret,now+301_000),false);
 const forged=cookie.replace(/.$/,cookie.endsWith('A')?'B':'A');
 assert.equal(verifyTurnstileCookie(forged,secret,now),false);
 assert.equal(verifyTurnstileCookie(cookie,'abcdef0123456789abcdef0123456789',now),false);
});

test('all exported server mutations use the common action guard',()=>{
 const groups=[
  ['lib/foundation/actions.ts',['loginStaff','logout','registerBusiness','addCustomer','movement','saveProgram','addReward','customerLink','setBusinessStatus','registerPayment','report','enroll','consentCard','chooseGoal']],
  ['lib/admin/actions.ts',['changeBusinessStatus','setBusinessPlan','saveBusinessNotes','registerPayment30','generateActivationCode','redeemActivationCode','createTask','moveTask','saveContentDraft','publishContent','saveGoogleReport','createReviewTask','markReviewResponded','upsertShortLink']],
  ['lib/owner/actions.ts',['saveSegments']],
  ['lib/points/actions.ts',['manageStaff','reviewRedemption','editReward']],
  ['app/panel/actions.ts',['createBusiness','addCustomer','recordMovement','updateReward','logout','saveReviewLink','manageCustomerCard']],
  ['app/panel/nival/actions.ts',['captureReview','confirmResponse','captureDiagnostic']],
 ];
 for(const [file,names] of groups){
  const source=readFileSync(file,'utf8');
  for(const name of names){
   const start=source.indexOf('export async function '+name);
   assert.ok(start>=0,file+' must export '+name);
   const next=source.indexOf('export async function ',start+22);
   const body=source.slice(start,next<0?source.length:next);
   assert.match(body,/guard(?:Action|PublicAction|LegacyOwnerAction|LegacyOperatorAction)\(/,file+':'+name+' must invoke a common action guard');
  }
 }
});
