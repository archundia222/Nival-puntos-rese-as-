'use client';
import {useEffect,useRef,useState} from 'react';
import {Icon} from './icons';
import {DemoTour} from './tour';
const clientMenus=[['clientes','Todos los clientes','Directorio completo'],['clientes-new','Nuevos','Primeras visitas'],['clientes-frequent','Frecuentes','Tu comunidad más fiel'],['clientes-risk','En riesgo','Recupera su próxima visita'],['clientes-lost','Perdidos','Vuelve a conectar'],['clientes-absent','Sin visita este mes','Clientes por invitar']] as const;
const menus=[['inicio','Resumen','La actividad de tu negocio'],['google','Google','Reseñas, reputación y mejoras'],['puntos','Puntos','Clientes, visitas y premios']] as const;
const pointMenus=[['operar','Puntos y canjes','Registrar visitas y entregar premios'],['clientes','Clientes','Actividad y segmentos'],['equipo','Personal','Accesos y actividad'],['compartir','QR y tarjeta','Invita a tus clientes'],['programa','Configuración de tarjeta','Diseño, reglas y premios'],['canjes','Historial de canjes','Revisar evidencia']] as const;
const accountMenu=['ajustes','Mi plan y cuenta','Datos y suscripción'] as const;
export function DashboardShell({name,owner,status,demo,logout,children,initialSection='inicio',homeUrl,mobilePreview=false,pointsOnly=false}:{name:string;owner:string;status:string;demo:boolean;logout:React.ReactNode;children:React.ReactNode;initialSection?:string;homeUrl?:string;mobilePreview?:boolean;pointsOnly?:boolean}){
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const [tour,setTour]=useState(true);
 const [section,setSection]=useState(initialSection),[open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(mobilePreview),[clientsOpen,setClientsOpen]=useState(initialSection.startsWith('clientes')),[pointsExpanded,setPointsExpanded]=useState(initialSection!=='inicio'&&initialSection!=='google');
 const sidebar=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const m=window.matchMedia('(max-width: 960px)');const sync=()=>{setMobile(m.matches||mobilePreview);setOpen(false);};sync();m.addEventListener('change',sync);const hash=()=>{const key=window.location.hash.slice(1);if([...menus,...pointMenus,...clientMenus,...[accountMenu]].some(x=>x[0]===key)){setSection(key);setClientsOpen(key.startsWith('clientes'));setPointsExpanded(pointMenus.some(x=>x[0]===key)||key.startsWith('clientes'));requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));}};hash();window.addEventListener('hashchange',hash);return()=>{m.removeEventListener('change',sync);window.removeEventListener('hashchange',hash);};},[mobilePreview,pointsOnly]);
 useEffect(()=>{if(!open||!mobile)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}if(e.key==='Tab'){const nodes=Array.from(sidebar.current?.querySelectorAll<HTMLElement>('button,a[href]')||[]);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);};},[open,mobile]);
 function navigate(key:string){
  if(!demo&&['puntos','operar','programa','equipo','canjes'].includes(key)){
   const params=new URLSearchParams(homeUrl?.split('?')[1]||window.location.search.slice(1));
   const business=params.get('business');const destination=key==='operar'?'/panel/operar':'/panel/puntos';
   if(business)params.set('business',business);
   if(key!=='operar')params.set('view',key==='puntos'||key==='programa'?'programa':key);
   window.location.href=destination+(params.toString()?'?'+params.toString():'');return;
  }
  if(homeUrl){window.location.href=homeUrl+'#'+key;return;}
  setSection(key);setClientsOpen(key.startsWith('clientes'));setPointsExpanded(pointMenus.some(x=>x[0]===key)||key.startsWith('clientes'));setOpen(false);
  window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+key);window.scrollTo({top:0,behavior:'smooth'});requestAnimationFrame(()=>document.getElementById('workspace-title')?.focus());
}
 const current=[...clientMenus,...pointMenus,...menus,[accountMenu]].find(x=>x[0]===section)||menus[0];
 const inPoints=pointMenus.some(x=>x[0]===section)||section.startsWith('clientes');
 return <div className="nivalShell" data-section={section} data-open={open} data-collapsed={collapsed}>
 <a className="workspaceSkip" href="#workspace-title">Ir al contenido</a>
 {mobile&&open&&<button className="workspaceBackdrop" tabIndex={-1} aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}/>}
 <aside className="workspaceSidebar" id="workspace-menu" ref={sidebar} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label="Menú de tu negocio" inert={mobile&&!open}>
 <div className="workspaceBrand"><span className="brandMark">N</span><span className="brandWords">nival<span>ESPACIO DE NEGOCIOS</span></span><button className="drawerClose" aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}><Icon name="close"/></button></div>
 <div className="workspaceBusiness"><span className="businessAvatar">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>{demo?'Negocio de demostración':'Mi negocio'}</small></div></div>
 <nav className="workspaceNav" aria-label="Secciones del panel">
  <div className="workspaceNavGroup"><div className="workspaceNavCaption">TU NEGOCIO</div>
   <button title="Resumen" onClick={()=>navigate('inicio')} aria-current={section==='inicio'?'page':undefined}><Icon name="inicio"/><span><strong>Resumen</strong><small>La actividad de tu negocio</small></span>{section==='inicio'&&<i/>}</button>
   <button title="Google" onClick={()=>navigate('google')} aria-current={section==='google'?'page':undefined}><Icon name="google"/><span><strong>Google</strong><small>Reseñas, reputación y mejoras</small></span>{section==='google'&&<i/>}</button>
   <details className="workspaceMenuGroup workspacePointsGroup" open={inPoints||pointsExpanded} onToggle={event=>setPointsExpanded(event.currentTarget.open)}>
    <summary title="Puntos" aria-current={inPoints?'page':undefined}><Icon name="points"/><span><strong>Puntos</strong><small>Clientes, visitas y premios</small></span><i aria-hidden="true"/></summary>
    <div className="clientSubmenu" aria-label="Secciones de puntos">
     {pointMenus.filter(([id])=>id!=='clientes'&&(!demo||!['operar','canjes'].includes(id))).map(([id,label,hint])=><button key={id} title={label} onClick={()=>navigate(id)} aria-current={id===section?'page':undefined}><span><strong>{label}</strong><small>{hint}</small></span></button>)}
     <details className="workspaceMenuGroup workspaceClientGroup" open={clientsOpen} onToggle={event=>setClientsOpen(event.currentTarget.open)}>
      <summary title="Clientes" aria-current={section.startsWith('clientes')?'page':undefined}><span><strong>Clientes</strong><small>Actividad y segmentos</small></span><i aria-hidden="true"/></summary>
      <div className="clientSubmenu" aria-label="Grupos de clientes">{clientMenus.map(([id,label,hint])=><button key={id} title={label} onClick={()=>navigate(id)} aria-current={id===section?'page':undefined}><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>
     </details>
    </div>
   </details>
  </div>
  <div className="workspaceNavGroup workspaceAccountGroup"><div className="workspaceNavCaption">CUENTA</div>
   <button className="workspaceUtilityButton" title="Mi plan y cuenta" onClick={()=>navigate('ajustes')} aria-current={section==='ajustes'?'page':undefined}><Icon name="ajustes"/><span><strong>Mi plan y cuenta</strong><small>Datos y suscripción</small></span>{section==='ajustes'&&<i/>}</button>
  </div>
 </nav>
 <div className="workspaceSidebarBottom"><a className="workspaceHelp" href="https://wa.me/525539044788?text=Hola%2C%20necesito%20ayuda%20con%20mi%20panel%20Nival" target="_blank" rel="noreferrer"><span>¿Necesitas una mano?</span><strong>Hablar con Nival <Icon name="arrow" size={16}/></strong></a><div className="workspaceLegal"><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></div>
 </aside>
 <div className="workspaceMain" inert={mobile&&open}>
 <header className="workspaceTopbar"><div className="topbarLocation"><button ref={trigger} className="hamburger" aria-label={mobile?(open?'Cerrar menú':'Abrir menú'):(collapsed?'Expandir menú':'Contraer menú')} aria-expanded={mobile?open:!collapsed} aria-controls="workspace-menu" onClick={()=>mobile?setOpen(v=>!v):setCollapsed(v=>!v)}><Icon name="menu"/></button><span>Mi negocio <span className="breadcrumbSlash">/</span> <strong>{current[1]}</strong></span></div><div className="topbarUser">{demo&&<a className="workspaceSecondary demoExit" href="/">Finalizar demo</a>}<span className={'workspaceStatus '+(status==='Activo'?'isActive':'')}>{demo?'Demo':status}</span><span className="userAvatar" title={owner}>{owner.slice(0,1).toUpperCase()}</span><span className="userName">{owner}</span>{!demo&&logout}</div></header>
 <div className="workspaceContent"><div className="workspacePageHeading"><div><span className="workspaceEyebrow">NIVAL · TU NEGOCIO, MÁS CERCA</span><h1 id="workspace-title" tabIndex={-1}>{current[1]}</h1><p>{current[2]}</p></div><span className="workspaceSecure"><Icon name="check" size={16}/> Espacio privado de tu negocio</span></div>{demo&&<div className="workspaceDemoBanner"><span><b>Estás explorando la demo.</b> Datos de ejemplo; aquí no se modifica ningún negocio real.</span><a href="/acceso">Entrar a mi cuenta <Icon name="arrow" size={16}/></a></div>}{demo&&<DemoTour section={section} active={tour} navigate={navigate} setActive={setTour}/>} {mounted?children:<p role="status" aria-busy="true">Cargando los datos de tu negocio…</p>}<footer className="workspaceFooter"><span>Nival Tech · Hecho para los negocios que crecen.</span><span>{demo?'Datos ficticios · 5 de octubre de 2026':'Información de tu negocio'}</span></footer></div>
 </div></div>;
}
