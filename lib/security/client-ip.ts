export function trustedClientIp(headers:Pick<Headers,'get'>,onVercel=Boolean(process.env.VERCEL)){
 if(!onVercel)return 'local';
 return (headers.get('x-forwarded-for')||'unknown').split(',')[0].trim()||'unknown';
}
