import type { ReactNode } from 'react';
const icons: Record<string, { color: string; shape: ReactNode }> = {
 trophy: {color:'#F3BC32',shape:<><path d="M7 3h10v5a5 5 0 0 1-10 0V3Z"/><path d="M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 13v6m-4 2h8m-6-2h4"/></>},
 chart: {color:'#E77A72',shape:<><path d="M4 20V12h3v8zm6 0V8h3v12zm6 0V3h3v17z"/></>},
 dollar: {color:'#26966D',shape:<><circle cx="12" cy="12" r="9"/><path d="M15 7H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H9m3-12v14"/></>},
 people: {color:'#20A58B',shape:<><circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M5 5a3 3 0 0 0 0 6m14-6a3 3 0 0 1 0 6M2 19v-2a4 4 0 0 1 3-4m17 6v-2a4 4 0 0 0-3-4"/></>},
 star: {color:'#F3BC32',shape:<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>},
 shield: {color:'#19AA68',shape:<><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/></>},
 heart: {color:'#EC706C',shape:<path d="M12 21 3 12C-2 5 7-1 12 6c5-7 14-1 9 6Z"/>},
 pin: {color:'#3D9EDF',shape:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>},
 trend: {color:'#359DD0',shape:<><path d="m3 18 6-6 4 3 8-10m-6 0h6v6"/></>},
 arrow: {color:'currentColor',shape:<path d="M4 12h16m-6-6 6 6-6 6"/>},
 'arrow-left': {color:'currentColor',shape:<path d="M20 12H4m6-6-6 6 6 6"/>},
 search: {color:'currentColor',shape:<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>},
 gift: {color:'currentColor',shape:<><path d="M3 9h18v4H3zm2 4v8h14v-8M12 9v12"/><path d="M12 9H7a3 3 0 1 1 3-3l2 3Zm0 0h5a3 3 0 1 0-3-3l-2 3Z"/></>},
 phone: {color:'currentColor',shape:<><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4m-3 14h2"/></>},
 qr: {color:'currentColor',shape:<><path d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h3v3h3v3h-6zm-3-3h3m3 0h3M12 3v6M3 12h6m3 3v6"/></>},
 card: {color:'currentColor',shape:<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>},
};
export default function LandingIcon({name}:{name:string}) {
 const icon=icons[name] ?? icons.star;
 return <svg className={`refIcon refIcon-${name}`} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={icon.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon.shape}</svg>;
}
