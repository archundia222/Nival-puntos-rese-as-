export function customerEntryPath(slug){
 if(!/^[a-z0-9-]{1,100}$/.test(String(slug||'')))throw Error('Invalid business slug');
 return '/b/'+slug;
}
export function customerEntryUrl(origin,slug){
 const url=new URL(customerEntryPath(slug),origin);
 if(!/^https?:$/.test(url.protocol))throw Error('Invalid origin');
 return url.href;
}
