'use client';
import {useEffect,useRef,useState} from 'react';
import {Icon} from './icons';

type MenuItem={id:string;label:string;icon?:string;href?:string;disabled?:boolean;children?:MenuItem[]};
function normalizeSection(section:string){
 if(['tarjetas','tus-tarjetas','programa','compartir','compartir-programa','nival-resenas'].includes(section))return 'mis-tarjetas';
 if(section==='google')return 'reseñas';
 return section;
}
function groupForSection(section:string):string|null{
 if(['mis-tarjetas','tus-tarjetas','programa','promociones','premios','compartir-programa','compartir','nival-resenas'].includes(section))return 'tarjetas';
 if(section==='nival-pay')return 'tarjetas';
 if(['clientes','campañas-clientes'].includes(section))return 'clientes-menu';
 if(['configuracion','ajustes','datos-negocio','plan'].includes(section))return 'cuenta';
 return null;
}
function makeItems(_reviewLimit:number,_nfcLimit:number):MenuItem[]{
 return [
  {id:'inicio',label:'Inicio',icon:'inicio'},
  {id:'tarjetas',label:'Tarjetas',icon:'card',children:[
   {id:'mis-tarjetas',label:'Mis tarjetas'},
   {id:'premios',label:'Premios y recompensas'},
  ]},
  {id:'clientes-menu',label:'Clientes',icon:'clientes',children:[
   {id:'clientes',label:'Clientes'},
   {id:'campañas-clientes',label:'Campañas'},
  ]},
  {id:'canjes',label:'Canjes',icon:'check'},
  {id:'reseñas',label:'Reseñas',icon:'google'},
  {id:'informes',label:'Informes',icon:'trend'},
  {id:'sucursales',label:'Sucursales',icon:'pin'},
  {id:'equipo',label:'Equipo',icon:'equipo'},
  {id:'cuenta',label:'Cuenta',icon:'settings',children:[
   {id:'plan',label:'Plan y facturación'},
   {id:'tarjetas-nfc',label:'Mis tarjetas NFC'},
   {id:'configuracion',label:'Configuración'},
  ]},
 ];
}

export function DashboardShell({name,owner,status,demo,logout,children,initialSection='inicio',homeUrl,mobilePreview=false,pointsOnly=false,planName='Puntos',price=299,responseLimit=0,nfcLimit=3,periodDay=1,branches=[],branchId}:{name:string;owner:string;status:string;demo:boolean;logout:React.ReactNode;children:React.ReactNode;initialSection?:string;homeUrl?:string;mobilePreview?:boolean;pointsOnly?:boolean;planName?:string;price?:number;responseLimit?:number;nfcLimit?:number;periodDay?:number;branches?:Record<string,any>[];branchId?:string}){
 const [section,setSection]=useState(()=>normalizeSection(initialSection)),[open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(mobilePreview),[expanded,setExpanded]=useState<string|null>(()=>groupForSection(normalizeSection(initialSection)));
 const sidebar=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const items=makeItems(responseLimit,nfcLimit);
 useEffect(()=>{const m=window.matchMedia('(max-width: 960px)');const sync=()=>{setMobile(m.matches||mobilePreview);setOpen(false);};sync();m.addEventListener('change',sync);const hash=()=>{const key=window.location.hash.slice(1);if(key){if(key==='google'){setSection('reseñas');setExpanded(null);return;}if(key.startsWith('mensaje-')){setSection('campañas-clientes');setExpanded('clientes-menu');requestAnimationFrame(()=>document.getElementById(key)?.scrollIntoView({behavior:'smooth',block:'center'}));return;}const normalized=normalizeSection(key);if(normalized==='card-editor'){setSection('mis-tarjetas');setExpanded('fidelidad');return;}setSection(normalized);setExpanded(groupForSection(normalized));if(normalized!==key)window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+normalized);}};hash();window.addEventListener('hashchange',hash);return()=>{m.removeEventListener('change',sync);window.removeEventListener('hashchange',hash);};},[mobilePreview]);
 useEffect(()=>{if(!open||!mobile)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}if(e.key==='Tab'){const nodes=Array.from(sidebar.current?.querySelectorAll<HTMLElement>('button,a[href]')||[]);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);};},[open,mobile]);
 function hrefFor(path:string){const target=new URL(path,window.location.origin);if(homeUrl){const base=new URL(homeUrl,window.location.origin);if(base.searchParams.has('business')&&!target.searchParams.has('business'))target.searchParams.set('business',base.searchParams.get('business')!);if(base.searchParams.has('branch')&&!target.searchParams.has('branch'))target.searchParams.set('branch',base.searchParams.get('branch')!);}return target.pathname+(target.searchParams.size?'?'+target.searchParams.toString():'')+target.hash;}
 function toggle(id:string){
  if(expanded===id){setExpanded(null);return;}
  setExpanded(id);
 }
 function navigate(item:MenuItem){
  if(item.href){
   if(demo){
    const target=item.id==='canjes'?'canjes':item.id==='informes'?'informes':item.id==='usuarios'?'equipo':item.id;
    setSection(target);setOpen(false);
    window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+target);
    window.scrollTo({top:0,behavior:'smooth'});
    requestAnimationFrame(()=>document.getElementById('workspace-title')?.focus());
    return;
   }
   window.location.href=hrefFor(item.href);return;
  }
  const target=item.id==='estadisticas'?'estadisticas-puntos':item.id==='tarjetas'||item.id==='fidelidad'||item.id==='programa'?'mis-tarjetas':item.id==='gestion'||item.id==='operacion'?'equipo':item.id==='usuarios'?'equipo':item.id==='datos-negocio'?'ajustes':item.id==='ajustes'?'configuracion':item.id==='productos'?'nival-pay':item.id;
  if(homeUrl){const home=new URL(homeUrl,window.location.origin);if(window.location.pathname!==home.pathname){home.hash=target;window.location.href=home.pathname+home.search+home.hash;return;}}
  setSection(target);setExpanded(groupForSection(target));
  setOpen(false);window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+target);
  window.scrollTo({top:0,behavior:'smooth'});requestAnimationFrame(()=>document.getElementById('workspace-title')?.focus());
 }
 function render(item:MenuItem,depth=0){
  const active=section===item.id||(item.id==='tarjetas'&&['mis-tarjetas','google','nival-resenas','compartir-programa','compartir','promociones','nival-pay','premios'].includes(section))||(item.id==='mis-tarjetas'&&['mis-tarjetas','google','nival-resenas','compartir-programa','compartir','promociones','nival-pay'].includes(section))||(item.id==='clientes-menu'&&['clientes','campañas-clientes'].includes(section))||(item.id==='cuenta'&&(section==='plan'||section==='ajustes'||section==='configuracion'||section==='tarjetas-nfc'))||(item.id==='configuracion'&&section==='ajustes');
  if(item.children)return <div className={'workspaceMenuGroup'+(depth?' isNested':'')} key={item.id}>
   <button className={'workspaceNavItem'+(active?' isActive':'')} aria-expanded={expanded===item.id} aria-controls={'workspace-submenu-'+item.id} onClick={()=>toggle(item.id)} aria-current={active?'page':undefined}>{item.icon&&<Icon name={item.icon}/>}<span><strong>{item.label}</strong></span><i aria-hidden="true"/></button>
   {expanded===item.id&&<div className="workspaceSubmenu" id={'workspace-submenu-'+item.id} aria-label={item.label}>{item.children.map(child=>render(child,depth+1))}</div>}
  </div>;
  return <button key={item.id} className={'workspaceNavItem'+(active?' isActive':'')+(depth?' isSubItem':'')} aria-current={active?'page':undefined} aria-disabled={item.disabled||undefined} title={item.disabled?'Revisa tu plan para activar esta herramienta':undefined} onClick={()=>!item.disabled&&navigate(item)}>{item.icon&&<Icon name={item.icon}/>}<span><strong>{item.label}</strong></span></button>;
 }
 const menu=[...items] as MenuItem[];
 const sectionAlias=section==='ajustes'?'configuracion':section.startsWith('clientes-')?'clientes':section==='programa'||section==='promociones'||section==='google'||section==='nival-resenas'||section==='compartir-programa'||section==='nival-pay'?'mis-tarjetas':section;
 const flatten=(list:MenuItem[]):MenuItem[]=>list.flatMap(x=>[x,...(x.children?flatten(x.children):[])]);
 const current=flatten(menu).find(x=>x.id===sectionAlias)||items[0];
 return <div className="nivalShell" data-section={section} data-open={open} data-collapsed={collapsed}>
  <a className="workspaceSkip" href="#workspace-title">Ir al contenido</a>
  {mobile&&open&&<button className="workspaceBackdrop" tabIndex={-1} aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}/>}
  <aside className="workspaceSidebar" id="workspace-menu" ref={sidebar} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label="Menú de tu negocio" inert={mobile&&!open}>
   <div className="workspaceBrand"><span className="brandMark">N</span><span className="brandWords">nival<span>ESPACIO DE NEGOCIOS</span></span><button className="drawerClose" aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}><Icon name="close"/></button></div>
   <div className="workspaceBusiness"><div className="workspaceBusinessIdentity"><span className="businessAvatar">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>{demo?'Negocio de demostración':'Mi negocio'}</small></div></div>{branches.some(x=>x.active)&&<label className="branchPicker"><span>Sucursal activa</span><select aria-label="Sucursal seleccionada" value={branchId||branches.find(x=>x.is_primary)?.id||""} onChange={e=>{const url=new URL(window.location.href);url.searchParams.set("branch",e.target.value);window.location.assign(url.toString());}}>{branches.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}</div>
   <nav className="workspaceNav" aria-label="Secciones del panel"><div className="workspaceNavCaption">TU NEGOCIO</div>
    {menu.map(item=>render(item))}
   </nav>
   <div className="workspaceSidebarBottom"><div className="workspacePlanSummary"><span className="planActiveLabel"><i aria-hidden="true"/>{demo?'DEMO':status==='Activo'?'PLAN ACTIVO':'ESTADO DEL PLAN'}</span><strong>{planName}</strong><small>${price} MXN <span>·</span> 30 días</small></div><div className="sidebarIdentity"><div className="sidebarIdentityRow"><span className="userAvatar">{owner.slice(0,1).toUpperCase()}</span><strong title={owner}>{owner}</strong><div className="sidebarLogout">{demo?<a href="/">Cerrar demo</a>:logout}</div></div></div><a className="workspaceHelp" href="https://wa.me/525539044788?text=Hola%2C%20necesito%20ayuda%20con%20mi%20panel%20Nival" target="_blank" rel="noreferrer"><span>¿Necesitas una mano?</span><strong>Hablar con Nival <Icon name="arrow" size={16}/></strong></a><div className="workspaceLegal"><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></div>
  </aside>
  <div className="workspaceMain" inert={mobile&&open}>
   <button ref={trigger} className="hamburger workspaceFloatingMenu" aria-label={mobile?(open?'Cerrar menú':'Abrir menú'):(collapsed?'Expandir menú':'Contraer menú')} aria-expanded={mobile?open:!collapsed} aria-controls="workspace-menu" onClick={()=>mobile?setOpen(v=>!v):setCollapsed(v=>!v)}><Icon name="menu"/></button>
   <div className="workspaceContent"><div className="workspacePageHeading">{demo&&<span className="workspaceExampleTag">Datos de ejemplo</span>}<h1 id="workspace-title" tabIndex={-1}>{current.label}</h1></div>{children}<footer className="workspaceFooter"><span>Nival Tech</span><span>{demo?'Datos de demostración':'Información de tu negocio'}</span></footer></div>
  </div>
 </div>;
}
