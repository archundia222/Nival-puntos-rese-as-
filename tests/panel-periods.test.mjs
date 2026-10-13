import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isInPeriod,periodEndingOn,periodCountFrom,previousPeriods} from '../lib/periods.ts';
import {customerGroups,weeklyAdvice} from '../lib/customer-segments.ts';
import {rangeReport} from '../lib/monthly-report.ts';
import {businessMenu} from '../lib/business-plan.ts';

test('30-day periods include both endpoints and remain consecutive',()=>{
 const current=periodEndingOn('2026-10-12');
 assert.deepEqual(current,{start:'2026-09-13',end:'2026-10-12'});
 assert.equal(isInPeriod('2026-09-13',current),true);
 assert.equal(isInPeriod('2026-09-12',current),false);
 const [previous]=previousPeriods(1,new Date('2026-10-12T12:00:00Z'));
 assert.deepEqual(previous,{start:'2026-08-14',end:'2026-09-12'});
 assert.equal(periodCountFrom('2026-09-01',new Date('2026-10-12T12:00:00Z')),2);
});

test('business menu matches the published plan sections',()=>{
 const labels=plan=>businessMenu(plan).map(item=>item.label);
 assert.deepEqual(labels('puntos'),['Inicio','Tarjetas','Clientes','Promociones','Informes','Configuración','Complementos']);
 assert.deepEqual(labels('esencial'),['Inicio','Tarjetas','Clientes','Reseñas','Promociones','Informes','Configuración','Complementos']);
 assert.deepEqual(labels('plus'),['Inicio','Tarjetas','Clientes','Reseñas','Promociones','Informes','Configuración','Complementos']);
});

test('customer groups are exclusive and follow the agreed priority',()=>{
 const period=periodEndingOn('2026-10-12');
 const customers=[
  {id:'risk',created_at:'2026-01-01'},
  {id:'never',created_at:'2026-10-01'},
  {id:'new',created_at:'2026-10-10'},
  {id:'frequent',created_at:'2026-01-01'},
 ];
 const movements=[
  {customer_id:'risk',kind:'visit',happened_at:'2026-08-01T12:00:00Z'},
  ...['2026-10-01','2026-10-05','2026-10-10'].map(day=>({customer_id:'new',kind:'visit',happened_at:`${day}T12:00:00Z`})),
  ...['2026-10-01','2026-10-05','2026-10-10'].map(day=>({customer_id:'frequent',kind:'visit',happened_at:`${day}T12:00:00Z`})),
 ];
 const groups=customerGroups(customers,movements,period,'2026-10-12',30);
 assert.deepEqual([...groups.atRisk],['risk']);
 assert.deepEqual([...groups.neverVisited],['never']);
 assert.deepEqual([...groups.new],['new']);
 assert.deepEqual([...groups.frequent],['frequent']);
 assert.equal(weeklyAdvice(groups),'Tienes 1 clientes en riesgo. Mándales una promoción para que vuelvan.');
});

test('period report counts boundary records and points metrics',()=>{
 const report=rangeReport(
  [{id:'a',created_at:'2026-09-13T12:00:00Z'}],
  [{customer_id:'a',kind:'visit',points:1,happened_at:'2026-09-13T12:00:00Z'},{customer_id:'a',kind:'redeem',points:-5,happened_at:'2026-10-12T12:00:00Z'}],
  [],
  '2026-09-13','2026-10-12',
 );
 assert.equal(report.newCustomers,1);
 assert.equal(report.visits,1);
 assert.equal(report.redemptions,1);
});
