import test from 'node:test';
import assert from 'node:assert/strict';
import {filterCustomers,customerCsv} from '../lib/owner/explorer.mjs';
const customers=[{id:'a',name:'Ángela',visits:2,is_new:true,last_visit:'2026-10-01',marketing_consent:false},{id:'b',name:'Bruno',visits:8,is_frequent:true,last_visit:'2026-10-05',marketing_consent:true},{id:'c',name:'Carla',visits:5,is_risk:true,last_visit:'2026-08-01'}];
test('customer directory combines accent-insensitive search, segments and sorting without mutating source data',()=>{
 assert.deepEqual(filterCustomers(customers,'angela').map(c=>c.id),['a']);
 assert.deepEqual(filterCustomers(customers,'','risk').map(c=>c.id),['c']);
 assert.deepEqual(filterCustomers(customers,'BRU','frequent').map(c=>c.id),['b']);
 assert.deepEqual(filterCustomers(customers,'Angela','risk'),[]);
 assert.deepEqual(filterCustomers(customers).map(c=>c.id),['b','c','a']);
 assert.deepEqual(filterCustomers(customers,'','all','recent').map(c=>c.id),['b','a','c']);
 assert.deepEqual(filterCustomers(customers,'','all','name').map(c=>c.id),['a','b','c']);
 assert.deepEqual(customers.map(c=>c.id),['a','b','c']);
});
test('CSV exports only the filtered rows, preserves accents, escapes quotes and prevents spreadsheet formulas',()=>{
 const csv=customerCsv(filterCustomers(customers,'','risk'));
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('Carla'));assert.ok(!csv.includes('Bruno'));assert.ok(!csv.includes('Ángela'));
 assert.ok(!customerCsv([{name:'Ana',phone:'525512345678',visits:1}]).includes('525512345678'));
 const dangerous=customerCsv([{name:'=HYPERLINK("evil")',visits:1},{name:'@SUM(1)',visits:1}]);
 assert.ok(dangerous.includes('"\'=HYPERLINK(""evil"")"'));assert.ok(dangerous.includes('"\'@SUM(1)"'));
 assert.ok(customerCsv(customers).includes('Ángela'));
});
