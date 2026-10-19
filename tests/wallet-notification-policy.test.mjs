import test from 'node:test';
import assert from 'node:assert/strict';
import {canNotifyPass,walletCampaignEligiblePlan} from '../lib/wallet/notification-policy.mjs';
const NOW=Date.parse('2026-10-18T12:00:00Z');
test('Wallet notifications deny unknown consent or unconfirmed pass',()=>{
 assert.equal(canNotifyPass({optedIn:false,passConfirmed:true,timestamps:[],now:NOW}),false);
 assert.equal(canNotifyPass({optedIn:true,passConfirmed:false,timestamps:[],now:NOW}),false);
 assert.equal(canNotifyPass({timestamps:[],now:NOW}),false);
});
test('Wallet accepts at most three notifications per rolling 24 hours',()=>{
 const ago=h=>new Date(NOW-h*3600000).toISOString();
 const basic={optedIn:true,passConfirmed:true,now:NOW};
 assert.equal(canNotifyPass({...basic,timestamps:[]}),true);
 assert.equal(canNotifyPass({...basic,timestamps:[ago(1),ago(2),ago(23)]}),false);
 assert.equal(canNotifyPass({...basic,timestamps:[ago(1),ago(2),ago(24)]}),true);
 assert.equal(canNotifyPass({...basic,timestamps:[ago(0.5),ago(1),ago(26),ago(27)]}),true);
});
test('Wallet campaign access preserves published plan limits',()=>{
 assert.equal(walletCampaignEligiblePlan(299),false);
 assert.equal(walletCampaignEligiblePlan(399),true);
 assert.equal(walletCampaignEligiblePlan(549),true);
});
