/** Keep white card text readable even when the business selects a pale brand color. */
export function cardColor(value?:string){
 const color=/^#[0-9a-f]{6}$/i.test(value||'')?value!:'#164d3b';
 const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
 return luminance>.18?`color-mix(in srgb, ${color} 40%, #061710)`:color;
}
