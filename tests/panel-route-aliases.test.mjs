import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('legacy panel deep links redirect into authenticated owner dashboard',()=>{
 const paths={clientes:'clientes',campanas:'promociones',tarjetas:'mis-tarjetas',resenas:'google'};
 for(const [path,section] of Object.entries(paths)){
  const source=read('app/panel/'+path+'/page.tsx');
  assert.ok(source.includes("redirectToPanel('"+section+"'"),path);
  assert.ok(!source.includes('query('),path);
 }
 const helper=read('lib/owner/panel-redirect.ts');
 assert.ok(helper.includes("redirect('/panel'"));
 for(const key of ['business','branch','kind','period'])assert.ok(helper.includes("'"+key+"'"));
});
