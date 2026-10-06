export async function verifyTurnstile(token,ip,env=process.env,fetcher=fetch){
 const secret=env.TURNSTILE_SECRET_KEY;
 if(!secret)throw Error('TURNSTILE_NOT_CONFIGURED');
 if(!token||typeof token!=='string'||token.length>2048)return false;
 const body=new URLSearchParams({secret,response:token});if(ip&&ip!=='unknown')body.set('remoteip',ip);
 const r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(5000)});
 if(!r.ok)return false;const d=await r.json();return d.success===true;
}
