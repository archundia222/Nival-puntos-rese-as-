'use client';
import {useEffect,useRef,useState} from 'react';
import {Icon} from './icons';

type MenuItem={id:string;label:string;icon?:string;href?:string;children?:MenuItem[]};
function normalizeSection(section:string){
 if(section==='tarjetas'||section==='tus-tarjetas'||section==='programa')return 'mis-tarjetas';
 if(section==='compartir')return 'compartir-programa';
 return section;
}
function groupForSection(section:string):string|null{
 if(['mis-tarjetas','tus-tarjetas','programa','promociones','premios','compartir-programa','compartir'].includes(section))return 'programa';
 if(['google','nival-resenas'].includes(section))return 'resenas';
 if(section==='nival-pay')return 'cuenta';
 if(['equipo','usuarios','estadisticas','estadisticas-puntos','canjes','informes','sucursales'].includes(section))return 'operacion';
 if(['configuracion','ajustes','datos-negocio','plan'].includes(section))return 'cuenta';
 return null;
}
function makeItems(reviewLimit:number):MenuItem[]{
 const items:MenuItem[]=[
  {id:'inicio',label:'Inicio',icon:'inicio'},
  {id:'programa',label:'Programa de puntos',icon:'gift',children:[
   {id:'mis-tarjetas',label:'Tarjeta de puntos'},
   {id:'compartir-programa',label:'Compartir programa'},
  ]},
  {id:'clientes',label:'Clientes',icon:'clientes'},
  {id:'operacion',label:'Operación',icon:'file',children:[
   {id:'sucursales',label:'Sucursales'},
   {id:'equipo',label:'Equipo',href:'/panel/puntos?view=equipo'},
   {id:'informes',label:'Informes',href:'/panel/reportes'},
   {id:'canjes',label:'Canjes'},
  ]},
 ];
 if(reviewLimit>0)items.push({id:'resenas',label:'Reseñas',icon:'google',children:[
  {id:'google',label:'Reseñas de Google'},
  {id:'nival-resenas',label:'Tarjetas QR y NFC'},
 ]});
 items.push({id:'cuenta',label:'Cuenta',icon:'settings',children:[
  {id:'plan',label:'Facturación'},
  {id:'configuracion',label:'Configuración'},
  {id:'productos',label:'Productos adicionales',children:[{id:'nival-pay',label:'Nival Pay · regalo'}]},
 ]});
 return items;
}

export function DashboardShell({name,owner,status,demo,logout,children,initialSection='inicio',homeUrl,mobilePreview=false,pointsOnly=false,planName='Puntos',price=299,responseLimit=0,periodDay=1,branches=[],branchId}:{name:string;owner:string;status:string;demo:boolean;logout:React.ReactNode;children:React.ReactNode;initialSection?:string;homeUrl?:string;mobilePreview?:boolean;pointsOnly?:boolean;planName?:string;price?:number;responseLimit?:number;periodDay?:number;branches?:Record<string,any>[];branchId?:string}){
 const [section,setSection]=useState(()=>normalizeSection(initialSection)),[open,setOpen]=useState(false),[collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(mobilePreview),[expanded,setExpanded]=useState<string|null>(()=>groupForSection(normalizeSection(initialSection)));
 const sidebar=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const items=makeItems(responseLimit);
 useEffect(()=>{const m=window.matchMedia('(max-width: 960px)');const sync=()=>{setMobile(m.matches||mobilePreview);setOpen(false);};sync();m.addEventListener('change',sync);const hash=()=>{const key=window.location.hash.slice(1);if(key){const normalized=normalizeSection(key);if(normalized==='card-editor'){setSection('mis-tarjetas');setExpanded('fidelidad');return;}setSection(normalized);setExpanded(groupForSection(normalized));if(normalized!==key)window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+normalized);}};hash();window.addEventListener('hashchange',hash);return()=>{m.removeEventListener('change',sync);window.removeEventListener('hashchange',hash);};},[mobilePreview]);
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
  const active=section===item.id||(item.id==='clientes'&&section.startsWith('clientes'))||(item.id==='operacion'&&(section==='equipo'||section==='usuarios'||section.startsWith('estadisticas')||section==='canjes'||section==='informes'||section==='sucursales'))||(item.id==='cuenta'&&(section==='plan'||section==='ajustes'||section==='configuracion'||section==='nival-pay'))||(item.id==='productos'&&section==='nival-pay')||(item.id==='resenas'&&(section==='google'||section==='nival-resenas'))||(item.id==='configuracion'&&section==='ajustes')||(item.id==='programa'&&(section==='compartir-programa'||section==='tus-tarjetas'||section==='mis-tarjetas'||section==='promociones'));
  if(item.children)return <div className={'workspaceMenuGroup'+(depth?' isNested':'')} key={item.id}>
   <button className={'workspaceNavItem'+(active?' isActive':'')} aria-expanded={expanded===item.id} aria-controls={'workspace-submenu-'+item.id} onClick={()=>toggle(item.id)} aria-current={active?'page':undefined}>{item.icon&&<Icon name={item.icon}/>}<span><strong>{item.label}</strong></span><i aria-hidden="true"/></button>
   {expanded===item.id&&<div className="workspaceSubmenu" id={'workspace-submenu-'+item.id} aria-label={item.label}>{item.children.map(child=>render(child,depth+1))}</div>}
  </div>;
  return <button key={item.id} className={'workspaceNavItem'+(active?' isActive':'')+(depth?' isSubItem':'')} aria-current={active?'page':undefined} onClick={()=>navigate(item)}>{item.icon&&<Icon name={item.icon}/>}<span><strong>{item.label}</strong></span></button>;
 }
 const menu=[...items] as MenuItem[];
 const sectionAlias=section==='ajustes'?'configuracion':section.startsWith('clientes-')?'clientes':section==='programa'?'mis-tarjetas':section==='promociones'||section==='premios'?'mis-tarjetas':section;
 const flatten=(list:MenuItem[]):MenuItem[]=>list.flatMap(x=>[x,...(x.children?flatten(x.children):[])]);
 const current=flatten(menu).find(x=>x.id===sectionAlias)||items[0];
 return <div className="nivalShell" data-section={section} data-open={open} data-collapsed={collapsed}>
  <a className="workspaceSkip" href="#workspace-title">Ir al contenido</a>
  {mobile&&open&&<button className="workspaceBackdrop" tabIndex={-1} aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}/>}
  <aside className="workspaceSidebar" id="workspace-menu" ref={sidebar} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label="Menú de tu negocio" inert={mobile&&!open}>
   <div className="workspaceBrand"><span className="brandMark">N</span><span className="brandWords">nival<span>ESPACIO DE NEGOCIOS</span></span><button className="drawerClose" aria-label="Cerrar menú" onClick={()=>{setOpen(false);trigger.current?.focus();}}><Icon name="close"/></button></div>
   <div className="workspaceBusiness"><span className="businessAvatar">{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>{demo?'Negocio de demostración':'Mi negocio'}</small></div></div>
   <nav className="workspaceNav" aria-label="Secciones del panel"><div className="workspaceNavCaption">TU NEGOCIO</div>
    {menu.map(item=>render(item))}
   </nav>
   <div className="workspaceSidebarBottom"><div className="workspacePlanSummary"><strong>Plan {planName}</strong><small>${price} MXN · periodo de 30 días</small></div><a className="workspaceHelp" href="https://wa.me/525539044788?text=Hola%2C%20necesito%20ayuda%20con%20mi%20panel%20Nival" target="_blank" rel="noreferrer"><span>¿Necesitas una mano?</span><strong>Hablar con Nival <Icon name="arrow" size={16}/></strong></a><div className="workspaceLegal"><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></div>
  </aside>
  <div className="workspaceMain" inert={mobile&&open}>
   <header className="workspaceTopbar"><div className="topbarLocation"><button ref={trigger} className="hamburger" aria-label={mobile?(open?'Cerrar menú':'Abrir menú'):(collapsed?'Expandir menú':'Contraer menú')} aria-expanded={mobile?open:!collapsed} aria-controls="workspace-menu" onClick={()=>mobile?setOpen(v=>!v):setCollapsed(v=>!v)}><Icon name="menu"/></button>{!demo&&branches.filter(x=>x.active).length>0&&<label className="branchPicker"><span>Sucursal</span><select aria-label="Sucursal seleccionada" value={branchId||branches.find(x=>x.is_primary)?.id||''} onChange={e=>{const url=new URL(window.location.href);url.searchParams.set('branch',e.target.value);window.location.assign(url.toString());}}>{branches.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}</div><div className="topbarUser">{demo&&<a className="workspaceSecondary demoExit" href="/">Cerrar demo</a>}<span className={'workspaceStatus '+(status==='Activo'?'isActive':'')}>{demo?'Demo':status}</span><span className="userAvatar" title={owner}>{owner.slice(0,1).toUpperCase()}</span><span className="userName">{owner}</span>{!demo&&logout}</div></header>
   <div className="workspaceContent"><div className="workspacePageHeading"><div>{demo&&<span className="workspaceExampleTag">Datos de ejemplo</span>}<span className="workspaceEyebrow">{demo?'DEMO NIVAL':'NIVAL · TU NEGOCIO'}</span><h1 id="workspace-title" tabIndex={-1}>{current.label}</h1></div><div className="workspacePlanChips"><span className="workspacePlanChip">Plan {planName}</span><span className="workspacePeriodChip">Día {periodDay} de 30<div className="workspaceTopPeriod"><i style={{width:(periodDay/30*100)+'%'}}/></div></span></div></div>{children}<footer className="workspaceFooter"><span>Nival Tech</span><span>{demo?'Datos de demostración':'Información de tu negocio'}</span></footer></div>
  </div>
 </div>;
}
