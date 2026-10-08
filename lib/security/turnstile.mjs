export async function verifyTurnstile(token,ip,env=process.env,fetcher=fetch){
 const secret=env.TURNSTILE_SECRET_KEY;
 if(!secret)throw Error('TURNSTILE_NOT_CONFIGURED');
 if(!token||typeof token!=='string'||token.length>2048)return false;
 const body=new URLSearchParams({secret,response:token});if(ip&&ip!=='unknown')body.set('remoteip',ip);
 const r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(5000)});
 if(!r.ok){console.error('Turnstile Siteverify HTTP error',r.status);return false;}const d=await r.json();if(d.success!==true){console.warn('Turnstile Siteverify rejected token',Array.isArray(d['error-codes'])?d['error-codes']:[]);return false;}return true;
}
