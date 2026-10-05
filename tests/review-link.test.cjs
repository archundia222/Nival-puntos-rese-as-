const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const compiled=ts.transpileModule(fs.readFileSync('lib/review-link.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleValue={exports:{}};new Function('exports','module',compiled)(moduleValue.exports,moduleValue);
const {googleReviewUrl}=moduleValue.exports;
test('Google review destinations accept supported links and reject disguised or unsafe URLs',()=>{
 for(const value of ['https://g.page/r/abc_123/review','https://maps.app.goo.gl/Abc123','https://search.google.com/local/writereview?placeid=ChIJ_123'])assert.equal(googleReviewUrl(value),value);
 for(const value of ['javascript:alert(1)','http://g.page/r/abc/review','https://g.page.evil.com/r/abc/review','https://evil.com','https://user:password@g.page/r/abc/review','https://g.page/r/abc/review#anything','https://search.google.com/local/writereview?placeid=x&next=https://evil.com','https://g.page/r/abc/review?next=x'])assert.equal(googleReviewUrl(value),null);
});
