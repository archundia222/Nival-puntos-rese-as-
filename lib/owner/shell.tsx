'use client';
import {useEffect,useRef,useState} from 'react';
import {Icon} from './icons';

type MenuItem={id:string;label:string;icon?:string;href?:string;children?:MenuItem[]};
function normalizeSection(section:string){
 if(section==='tarjetas'||section==='tus-tarjetas'||section==='programa')return 'mis-tarjetas';
 if(section==='compartir')return 'compartir-programa';
 return section;
}
const customerItems:MenuItem[]=[
 {id:'clientes',label:'Todos los clientes'},
 {id:'clientes-new',label:'Nuevos'}, {id:'clientes-frequent',label:'Frecuentes'},
 {id:'clientes-risk',label:'En riesgo'}, {id:'clientes-absent',label:'Sin visita este mes'},
];
const cardItems:MenuItem[]=[
 {id:'promociones',label:'Premios y promociones'},
 {id:'mis-tarjetas',label:'Mis tarjetas'},
];
function makeItems(reviewLimit:number):MenuItem[]{
 const items:MenuItem[]=[
  {id:'sucursales',label:'Sucursales',icon:'pin'},
  {id:'inicio',label:'Dashboard',icon:'inicio'},
  {id:'tarjetas',label:'Tarjetas',icon:'compartir',children:cardItems},
  {id:'clientes',label:'Clientes',icon:'clientes',children:customerItems},
  ...(reviewLimit>0?[{id:'google',label:'Google y reseñas',icon:'google'}]:[]),
  {id:'gestion',label:'Gestión',icon:'file',children:[
   {id:'equipo',label:'Personal'},
   {id:'canjes',label:'Historial de canjes',href:'/panel/puntos?view=canjes'},
   {id:'estadisticas-puntos',label:'Actividad de puntos'},
   {id:'informes',label:'Informes',href:'/panel/reportes'},
  ]},
  {id:'ajustes',label:'Ajustes',icon:'settings',children:[
   {id:'datos-negocio',label:'Datos del negocio'},
   {id:'plan',label:'Plan y facturación'},
  ]},
 ];
 return items;
}

export function DashboardShell({name,owner,status,demo,logout,children,initialSection='inicio',homeUrl,mobilePreview=false,pointsOnly=false,planName='Puntos',price=299,responseLimit=0,periodDay=1,branches=[],branchId}:{name:string;owner:string;status:string;demo:boolean;logout:React.ReactNode;children:React.ReactNode;initialSection?:string;homeUrl?:string;mobilePreview?:boolean;pointsOnly?:boolean;planName?:string;price?:number;responseLimit?:number;periodDay?:number;branches?:Record<string,any>[];branchId?:string}){
 const [section,setSection]=useState(()=>normalizeSection(initialSection)),[open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(mobilePreview),[expanded,setExpanded]=useState<string[]>(initialSection.startsWith('clientes')?['clientes']:['tus-tarjetas','programa','mis-tarjetas','promociones','compartir-programa','compartir','tarjetas'].includes(initialSection)?['tarjetas']:initialSection==='equipo'||initialSection.startsWith('estadisticas')||initialSection==='google'||initialSection==='informes'||initialSection==='canjes'?['gestion']:initialSection==='configuracion'||initialSection==='plan'?['ajustes']:[]);
 const sidebar=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const items=makeItems(responseLimit);
 useEffect(()=>{const m=window.matchMedia('(max-width: 960px)');const sync=()=>{setMobile(m.matches||mobilePreview);setOpen(false);};sync();m.addEventListener('change',sync);const hash=()=>{const key=window.location.hash.slice(1);if(key){const normalized=normalizeSection(key);setSection(normalized);if(normalized!==key)window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+normalized);if(normalized==='mis-tarjetas'||normalized==='promociones'||normalized==='compartir-programa')setExpanded(current=>current.includes('tarjetas')?current:[...current,'tarjetas']);}};hash();window.addEventListener('hashchange',hash);return()=>{m.removeEventListener('change',sync);window.removeEventListener('hashchange',hash);};},[mobilePreview]);
 useEffect(()=>{if(!open||!mobile)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}if(e.key==='Tab'){const nodes=Array.from(sidebar.current?.querySelectorAll<HTMLElement>('button,a[href]')||[]);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);};},[open,mobile]);
 function hrefFor(path:string){const target=new URL(path,window.location.origin);if(homeUrl){const base=new URL(homeUrl,window.location.origin);if(base.searchParams.has('business')&&!target.searchParams.has('business'))target.searchParams.set('business',base.searchParams.get('business')!);if(base.searchParams.has('branch')&&!target.searchParams.has('branch'))target.searchParams.set('branch',base.searchParams.get('branch')!);}return target.pathname+(target.searchParams.size?'?'+target.searchParams.toString():'')+target.hash;}
 function toggle(id:string){setExpanded(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 function navigate(item:MenuItem){
  if(item.href){
   if(demo){
    const target=item.id==='canjes'?'canjes':item.id==='informes'?'informes':item.id;
    setSection(target);setOpen(false);
    window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+target);
    window.scrollTo({top:0,behavior:'smooth'});
    requestAnimationFrame(()=>document.getElementById('workspace-title')?.focus());
    return;
   }
   window.location.href=hrefFor(item.href);return;
  }
  const target=item.id==='estadisticas'?'estadisticas-puntos':item.id==='tarjetas'?'mis-tarjetas':item.id==='gestion'?'equipo':item.id==='datos-negocio'?'ajustes':item.id==='ajustes'?'configuracion':item.id;
  if(homeUrl){const home=new URL(homeUrl,window.location.origin);if(window.location.pathname!==home.pathname){home.hash=target;window.location.href=home.pathname+home.search+home.hash;return;}}
  setSection(target);
  if(item.children)setExpanded(current=>current.includes(item.id)?current:[...current,item.id]);
  setOpen(false);window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+target);
  window.scrollTo({top:0,behavior:'smooth'});requestAnimationFrame(()=>document.getElementById('workspace-title')?.focus());
 }
 function render(item:MenuItem,depth=0){
  const active=section===item.id||(item.id==='clientes'&&section.startsWith('clientes'))||(item.id==='gestion'&&(section==='equipo'||section.startsWith('estadisticas')||section==='google'||section==='informes'||section==='canjes'))||(item.id==='ajustes'&&(section==='configuracion'||section==='plan'||section==='ajustes'))||(item.id==='datos-negocio'&&section==='ajustes')||(item.id==='tarjetas'&&(section==='compartir-programa'||section==='tus-tarjetas'||section==='mis-tarjetas'||section==='promociones'));
  if(item.children)return <div className={'workspaceMenuGroup'+(depth?' isNested':'')} key={item.id}>
   <button className={'workspaceNavItem'+(active?' isActive':'')} aria-expanded={expanded.includes(item.id)} aria-controls={'workspace-submenu-'+item.id} onClick={()=>toggle(item.id)} aria-current={active?'page':undefined}>{item.icon&&<Icon name={item.icon}/>}<span><strong>{item.label}</strong></span><i aria-hidden="true"/></button>
   {expanded.includes(item.id)&&<div className="workspaceSubmenu" id={'workspace-submenu-'+item.id} aria-label={item.label}>{item.children.map(child=>render(child,depth+1))}</div>}
  </div>;
  return <button key={item.id} className={'workspaceNavItem'+(active?' isActive':'')+(depth?' isSubItem':'')} aria-current={active?'page':undefined} onClick={()=>navigate(item)}>{item.icon&&<Icon name={item.icon}/>}<span><strong>{item.label}</strong></span>{item.id==='nival-pay'||item.id==='nival-resenas'?<b className="includedTag">Incluido</b>:null}</button>;
 }
 const menu=[...items,{id:'complementos-label',label:'COMPLEMENTOS'},
  {id:'nival-pay',label:'Nival Pay',icon:'card'}, {id:'nival-resenas',label:'Nival Reseñas',icon:'compartir'}] as MenuItem[];
 const sectionAlias=section==='ajustes'?'datos-negocio':section==='equipo'?'equipo':section==='programa'?'mis-tarjetas':section==='promociones'||section==='premios'?'promociones':section;
 const current=menu.flatMap(x=>[x,...(x.children||[])]).flatMap(x=>[x,...(x.children||[])]).find(x=>x.id===sectionAlias)||items[0];
 return <div className="nivalShell" data-section={section} data-open={open} data-collapsed={collapsed}>
  <a className="workspaceSkip" href="#workspace-title">Ir al contenido</a>
  {mobile&&open&&<button className="workspaceBackdrop" tabIndex={-1} aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}/>}
  <aside className="workspaceSidebar" id="workspace-menu" ref={sidebar} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label="Menú de tu negocio" inert={mobile&&!open}>
   <div className="workspaceBrand"><span className="brandMark">N</span><span className="brandWords">nival<span>ESPACIO DE NEGOCIOS</span></span><button className="drawerClose" aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}><Icon name="close"/></button></div>
   <div className="workspaceBusiness"><span className="businessAvatar">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>{demo?'Negocio de demostración':'Mi negocio'}</small></div></div>
   <nav className="workspaceNav" aria-label="Secciones del panel"><div className="workspaceNavCaption">TU NEGOCIO</div>
    {menu.map((item,index)=>item.id==='complementos-label'?<div className="workspaceNavCaption workspaceComplementCaption" key={item.id}>COMPLEMENTOS</div>:render(item))}
   </nav>
   <div className="workspaceSidebarBottom"><div className="workspacePlanSummary"><strong>Plan {planName}</strong><small>${price} MXN · periodo de 30 días</small></div><a className="workspaceHelp" href="https://wa.me/525539044788?text=Hola%2C%20necesito%20ayuda%20con%20mi%20panel%20Nival" target="_blank" rel="noreferrer"><span>¿Necesitas una mano?</span><strong>Hablar con Nival <Icon name="arrow" size={16}/></strong></a><div className="workspaceLegal"><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></div>
  </aside>
  <div className="workspaceMain" inert={mobile&&open}>
   <header className="workspaceTopbar"><div className="topbarLocation"><button ref={trigger} className="hamburger" aria-label={mobile?(open?'Cerrar menú':'Abrir menú'):(collapsed?'Expandir menú':'Contraer menú')} aria-expanded={mobile?open:!collapsed} aria-controls="workspace-menu" onClick={()=>mobile?setOpen(v=>!v):setCollapsed(v=>!v)}><Icon name="menu"/></button><span>Mi negocio <span className="breadcrumbSlash">/</span> <strong>{current.label}</strong></span>{!demo&&branches.filter(x=>x.active).length>0&&<label className="branchPicker"><span>Sucursal</span><select aria-label="Sucursal seleccionada" value={branchId||branches.find(x=>x.is_primary)?.id||''} onChange={e=>{const url=new URL(window.location.href);url.searchParams.set('branch',e.target.value);window.location.assign(url.toString());}}>{branches.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}</div><div className="topbarUser">{demo&&<a className="workspaceSecondary demoExit" href="/">Cerrar demo</a>}<span className={'workspaceStatus '+(status==='Activo'?'isActive':'')}>{demo?'Demo':status}</span><span className="userAvatar" title={owner}>{owner.slice(0,1).toUpperCase()}</span><span className="userName">{owner}</span>{!demo&&logout}</div></header>
   <div className="workspaceContent"><div className="workspacePageHeading"><div><span className="workspaceEyebrow">{demo?'DEMO NIVAL':'NIVAL · TU NEGOCIO'}</span><h1 id="workspace-title" tabIndex={-1}>{current.label}</h1></div><div className="workspacePlanChips"><span className="workspacePlanChip">Plan {planName}</span><span className="workspacePeriodChip">Día {periodDay} de 30<div className="workspaceTopPeriod"><i style={{width:(periodDay/30*100)+'%'}}/></div></span></div></div>{demo&&<div className="workspaceDemoBanner"><span><b>Estás explorando la demo.</b> Datos de ejemplo; aquí no se modifica ningún negocio real.</span><a href="/acceso">Entrar a mi cuenta <Icon name="arrow" size={16}/></a></div>}{children}<footer className="workspaceFooter"><span>Nival Tech</span><span>{demo?'Datos de demostración':'Información de tu negocio'}</span></footer></div>
  </div>
 </div>;
}
