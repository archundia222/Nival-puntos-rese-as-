import { NextRequest, NextResponse } from 'next/server';
import { query, authScope, foundationEnabled } from '../../../lib/foundation/db';
import { cookieOptions, routeCookie, secret, staffCookie } from '../../../lib/foundation/session';
import { randomToken, sha256, signedHint } from '../../../lib/foundation/security.mjs';

export const dynamic = 'force-dynamic';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const slug = url.searchParams.get('negocio') || '';
  const id = url.searchParams.get('persona') || '';
  const fallback = new URL('/staff/acceso?error=enlace', request.url);

  if (!foundationEnabled() || !/^[a-z0-9-]{1,100}$/.test(slug) || !uuid.test(id)) {
    return NextResponse.redirect(fallback, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  }

  try {
    // The employee UUID in the QR acts as their access key. Resolve it only
    // against an active staff membership for the matching business.
    const [person] = await query(authScope(), 'select * from nival_pr_private.pin_identity($1,$2)', [slug, id]);
    if (!person) return NextResponse.redirect(fallback, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });

    const token = randomToken();
    await query(authScope(), 'select nival_pr_private.issue_staff_session($1,$2,$3)', [person.user_id, person.business_id, sha256(token)]);
    const response = NextResponse.redirect(new URL('/staff', request.url));
    response.cookies.set(staffCookie, token, cookieOptions);
    response.cookies.set(routeCookie, signedHint('staff', secret()), cookieOptions);
    response.headers.set('Cache-Control', 'no-store, private');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch {
    return NextResponse.redirect(fallback, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  }
}
