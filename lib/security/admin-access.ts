import 'server-only';
import {cookies,headers} from 'next/headers';
import {createHmac} from 'node:crypto';
import {getAuth} from '../backend/auth';
import {authScope, query, systemQuery} from '../foundation/db';
import {secret, staffCookie, routeCookie, adminCookie, cookieOptions} from '../foundation/session';
import {signedHint} from '../foundation/security.mjs';
import {signAdminProof} from './admin-proof.mjs';
import {administratorEmail, isAdministratorIdentity} from './admin-policy.mjs';
import {trustedClientIp} from './client-ip';

export async function limitAdminAccess(email: string) {
  if (email.trim().toLowerCase() !== administratorEmail) throw Error('Acceso reservado.');
  return 'https://nival-puntos-resenas.vercel.app';
}

export async function registerFailedAdminLogin() {
  const ip=trustedClientIp(await headers());
  const key = createHmac('sha256', secret()).update('admin-access:' + administratorEmail + ':' + ip).digest('hex');
  const [attempt] = await query(authScope(), 'select nival_pr_private.claim_pin_attempt($1) accepted', [key]);
  if (!attempt?.accepted) throw Error('Espera 15 minutos antes de intentar de nuevo.');
}

export async function authorizeOwnAdministrator() {
  const {data, error} = await getAuth().getSession();
  if (error || !isAdministratorIdentity(data?.user) || !data?.session?.id) return false;
  const user = data!.user;
  // The email is checked against the provider's verified session, never a form value.
  await systemQuery("insert into nival_pr.profiles(id,role,full_name) values($1,'superadmin',$2) on conflict(id) do update set role='superadmin'", [user.id, user.name || 'Rodrigo']);
  (await cookies()).delete(staffCookie);
  (await cookies()).set(routeCookie,signedHint('superadmin',secret()),cookieOptions);
  (await cookies()).set(adminCookie,signAdminProof(user.id,data!.session.id,secret()),cookieOptions);
  return true;
}
