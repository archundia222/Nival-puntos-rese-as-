import 'server-only';
import {createNeonAuth} from '@neondatabase/auth/next/server';
let instance:ReturnType<typeof createNeonAuth>|undefined;
export function getAuth(){
 if(!instance){const baseUrl=process.env.NEON_AUTH_BASE_URL;const secret=process.env.NEON_AUTH_COOKIE_SECRET;if(!baseUrl||!secret)throw Error('Auth setup pending');const normalizedBaseUrl=baseUrl.trim().replace(/\/+$/,'');instance=createNeonAuth({baseUrl:normalizedBaseUrl,cookies:{secret,sessionDataTtl:1},logLevel:'silent'});}
 return instance;
}
