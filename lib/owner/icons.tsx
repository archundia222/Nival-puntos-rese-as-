export function Icon({name,size=20}:{name:string;size?:number}){
 const paths:Record<string,React.ReactNode>={
  inicio:<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/></>,
  clientes:<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/></>,
  google:<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>,
  equipo:<><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/></>,
  points:<><circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9M10 8h4"/></>,
  compartir:<><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z"/><path d="M21 12h-3M12 3v3M12 18v3M12 12h3"/></>,
  ajustes:<><circle cx="12" cy="12" r="3"/><path d="m9 3-.7 3-2.8 1-2.6-.9L1 10l2.3 2L3 15l-1.3 2.4L5 20l2.6-1 2.4 1 1 3h4l.7-3 2.8-1 2.6.9L23 16l-2.3-2 .3-3 1.3-2.4L19 6l-2.6 1L14 6l-1-3Z"/></>,
  menu:<path d="M4 6h16M4 12h16M4 18h16"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,arrow:<path d="M5 12h14m-5-5 5 5-5 5"/>,
  search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,download:<><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></>,check:<path d="m5 12 4 4L19 6"/>,link:<><path d="m9 15 6-6M8 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></>,
  trend:<><path d="m3 17 6-6 4 4 8-10M15 5h6v6"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,logout:<><path d="M9 3H3v18h6M10 12h11m-4-4 4 4-4 4"/></>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.inicio}</svg>;
}
