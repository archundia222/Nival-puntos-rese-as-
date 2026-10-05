const {test}=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');
const compiled=ts.transpileModule(fs.readFileSync('lib/auth-confirm.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m={exports:{}};new Function('exports','module',compiled)(m.exports,m);const {confirmEmail}=m.exports;
function fake(error=null){const calls=[];return {calls,verifyOtp:async params=>{calls.push(['otp',params]);return {error};},exchangeCodeForSession:async code=>{calls.push(['pkce',code]);return {error};}};}
test('signup and recovery verify their own token types and use fixed destinations',async()=>{
 const auth=fake();assert.equal(await confirmEmail(auth,new URLSearchParams('token_hash=abc&type=signup&next=https://evil.example')),'/panel');
 assert.equal(await confirmEmail(auth,new URLSearchParams('token_hash=def&type=recovery&next=//evil.example')),'/restablecer');
 assert.deepEqual(auth.calls,[['otp',{token_hash:'abc',type:'signup'}],['otp',{token_hash:'def',type:'recovery'}]]);
});
test('expired, unsupported and missing email tokens never create a success redirect',async()=>{
 assert.equal(await confirmEmail(fake({message:'expired'}),new URLSearchParams('token_hash=abc&type=recovery')),'/acceso?recuperacion=error');
 const auth=fake();for(const query of ['','token_hash=abc&type=invite','token_hash=abc&type=email_change','token_hash=abc'])assert.equal(await confirmEmail(auth,new URLSearchParams(query)),'/acceso?confirmacion=error');
 assert.equal(auth.calls.length,0);
 const offline={verifyOtp:async()=>{throw Error('network');}};assert.equal(await confirmEmail(offline,new URLSearchParams('token_hash=abc&type=signup')),'/acceso?confirmacion=error');
});
test('PKCE recovery exchanges the code before changing password, failed exchanges remain recoverable',async()=>{
 const auth=fake();assert.equal(await confirmEmail(auth,new URLSearchParams('code=verified&flow=recovery')),'/restablecer');assert.deepEqual(auth.calls,[['pkce','verified']]);
 assert.equal(await confirmEmail(fake({message:'invalid code'}),new URLSearchParams('code=bad&flow=recovery')),'/acceso?recuperacion=error');
});
