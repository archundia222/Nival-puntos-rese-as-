/** Keep white card text readable even when the business selects a pale brand color. */
export function cardColor(value?:string){
 const color=/^#[0-9a-f]{6}$/i.test(value||'')?value!:'#164d3b';
 const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
 return luminance>.18?`color-mix(in srgb, ${color} 40%, #061710)`:color;
}
export function readableCardText(preferred?:string,background?:string){
 const luminance=(value:string)=>{if(!/^#[0-9a-f]{6}$/i.test(value))return 1;const channels=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
 const ratio=(a:number,b:number)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05),bg=luminance(background||"#164d3b"),fg=luminance(preferred||"#ffffff");
 if(ratio(bg,fg)>=4.5)return preferred||"#ffffff";
 return ratio(bg,1)>=ratio(bg,.012)?"#ffffff":"#10251b";
}
