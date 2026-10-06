import test from 'node:test';import assert from 'node:assert/strict';import {customerEntryPath,customerEntryUrl} from '../lib/points/entry.mjs';
test('NFC business entry is stable, contains no customer secret and matches public /b route',()=>{
 assert.equal(customerEntryPath('cafe-prueba'),'/b/cafe-prueba');
 assert.equal(customerEntryUrl('https://nival.example','cafe-prueba'),'https://nival.example/b/cafe-prueba');
 assert.ok(!customerEntryUrl('https://nival.example','cafe-prueba').includes('token'));
 for(const slug of ['', '../admin','Cafe','a/b','x?token=secret'])assert.throws(()=>customerEntryPath(slug));
 assert.throws(()=>customerEntryUrl('javascript:alert(1)','cafe-prueba'));
});
