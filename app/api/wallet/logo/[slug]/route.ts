import { publicBusiness } from '../../../../../lib/points/security';
import { createElement } from 'react';
import { ImageResponse } from 'next/og';
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}) {
 const b=await publicBusiness((await params).slug);
 if(!b?.program)return new Response(null,{status:404});
 const logo=b.program.logo_url||'';
 const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(logo);
 const headers={'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'};
 if(match)return new Response(new Uint8Array(Buffer.from(match[2],'base64')),{headers:{...headers,'Content-Type':'image/'+match[1]}});
 if(/^https:\/\//.test(logo))return new Response(null,{status:302,headers:{...headers,Location:logo}});
 return new ImageResponse(createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',background:b.program.color||'#164d3b',color:'white',fontSize:320,fontWeight:700}},b.name.slice(0,1).toUpperCase()),{width:660,height:660,headers});
}
