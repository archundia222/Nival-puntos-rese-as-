import {test} from 'node:test';
import assert from 'node:assert/strict';
import {administratorEmail, isAdministratorIdentity, canEnterAdministration} from '../lib/security/admin-policy.mjs';
const user = {id: 'verified-owner', email: administratorEmail, emailVerified: true};
const profile = {id: user.id, role: 'superadmin'};
test('only the confirmed designated account with its own admin profile enters', () => {
  assert.equal(canEnterAdministration(user, profile), true);
  assert.equal(canEnterAdministration({...user, email: 'other@example.com'}, profile), false);
  assert.equal(canEnterAdministration({...user, emailVerified: false}, profile), false);
  assert.equal(canEnterAdministration(user, {...profile, role: 'owner'}), false);
  assert.equal(canEnterAdministration(user, {...profile, id: 'other-account'}), false);
  assert.equal(canEnterAdministration(null, profile), false);
});
test('email identity requires verification and an authenticated user id', () => {
  assert.equal(isAdministratorIdentity({...user, email: administratorEmail.toUpperCase()}), true);
  assert.equal(isAdministratorIdentity({...user, emailVerified: 'true'}), false);
  assert.equal(isAdministratorIdentity({...user, id: ''}), false);
  assert.equal(isAdministratorIdentity({...user, email: administratorEmail + '.attacker.com'}), false);
});
import {signAdminProof,validAdminProof} from '../lib/security/admin-proof.mjs';
test('private access proof expires, rejects tampering and cannot transfer between users or sessions',()=>{
 const secret='s'.repeat(32);const proof=signAdminProof('u','session-1',secret,1000);
 assert.equal(validAdminProof(proof,'u','session-1',secret,1001),true);
 assert.equal(validAdminProof(proof,'u','session-2',secret,1001),false);
 assert.equal(validAdminProof(proof,'other','session-1',secret,1001),false);
 assert.equal(validAdminProof(proof+'x','u','session-1',secret,1001),false);
 assert.equal(validAdminProof(proof,'u','session-1',secret,1000+8*3600*1000),false);
 assert.equal(validAdminProof(undefined,'u','session-1',secret,1001),false);
});
