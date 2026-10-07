export function parseDsn(value){try{const u=new URL(value);if(u.protocol!=='https:'||!u.username)return null;const project=u.pathname.split('/').filter(Boolean).at(-1);if(!project)return null;return {endpoint:u.origin+'/api/'+project+'/envelope/',key:u.username};}catch{return null;}}
export async function captureServerError(error,context={},env=process.env,fetcher=fetch){
 const dsn=parseDsn(env.SENTRY_DSN||'');if(!dsn)return false;
 const eventId=crypto.randomUUID().replaceAll('-','');const message=error instanceof Error?error.message:String(error);
 const header=JSON.stringify({event_id:eventId,dsn:env.SENTRY_DSN,sdk:{name:'nival.direct-sentry',version:'1'}});
 const item=JSON.stringify({type:'event'});const event=JSON.stringify({event_id:eventId,timestamp:Date.now()/1000,platform:'javascript',level:'error',environment:env.VERCEL_ENV||env.NODE_ENV||'unknown',message:message.slice(0,1000),tags:{route:String(context.route||'unknown').slice(0,200)},request:{url:String(context.url||'').slice(0,500)}});
 try{const r=await fetcher(dsn.endpoint,{method:'POST',headers:{'Content-Type':'application/x-sentry-envelope','X-Sentry-Auth':'Sentry sentry_version=7, sentry_key='+dsn.key},body:header+'\n'+item+'\n'+event,signal:AbortSignal.timeout(3000)});return r.ok;}catch{return false;}
}
