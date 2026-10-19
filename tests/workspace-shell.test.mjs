import * as insights from '../lib/owner/review-insights.mjs';
import * as explorer from '../lib/owner/explorer.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
function component(path,overrides={}){
 const file=new URL('../lib/owner/'+path,import.meta.url);
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};const require=createRequire(file);
 vm.runInNewContext(source,{exports,require:key=>overrides[key]||require(key)});return exports;
}
const tour=component('tour.tsx');
const icons=component('icons.tsx');const {DashboardShell}=component('shell.tsx',{'./icons':icons,'./tour':tour});
test('business shell shows the approved operational menu, accessible navigation and account sections',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null},React.createElement('p',null,'Solo datos de Negocio A')));
 for(const title of ['Inicio','Tarjetas','Clientes','Canjes','Reseñas','Informes','Sucursales','Equipo','Cuenta'])assert.ok(html.includes(title),title);
 assert.ok(!html.includes('Operación'),'duplicate group removed');
 assert.ok(!html.includes('Tarjetas QR y NFC'),'old duplicate card menu removed');
 const section=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null,initialSection:'sucursales'},'Contenido'));
 for(const title of ['Sucursales','Equipo','Informes','Canjes'])assert.ok(section.includes(title),title);
 const account=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null,initialSection:'plan'},'Contenido'));
 assert.ok(account.includes('Plan y facturación'));
 for(const token of ['aria-controls="workspace-menu"','aria-current="page"','id="workspace-title"'])assert.ok(html.includes(token),token);
 assert.ok(html.includes('Negocio A')&&!html.includes('Negocio B')&&!html.includes('Estás explorando la demo.'));
 const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8');
 assert.match(shell,/onClick=\{\(\)=>toggle\(item\.id\)\}/);
 assert.match(shell,/aria-controls=\{'workspace-submenu-'\+item\.id\}/);
 assert.match(shell,/function groupForSection/);
 assert.match(shell,/if\(expanded===id\)\{setExpanded\(null\);return;\}/);
 assert.match(shell,/const normalized=normalizeSection\(key\)/);
});
test('demo and program settings reuse the same shell with explicit demo status and active configuration menu',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,initialSection:'ajustes'},'Contenido de ejemplo'));
 assert.ok(html.includes('data-section="ajustes"'));assert.ok(html.includes('>Demo</span>'));assert.ok(html.includes('Datos de demostración'));
 assert.ok(html.includes('Datos de ejemplo'));
 assert.ok(!html.includes('workspaceDemoBanner'));assert.ok(!html.includes('Estás explorando la demo.'));assert.ok(!html.includes('href="/acceso"'));
});

test('mobile preview keeps the closed drawer out of keyboard navigation',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,mobilePreview:true},'Contenido'));
 assert.match(html,/<aside[^>]+inert=""/);
 assert.ok(html.includes('aria-label="Abrir menú"'));assert.ok(html.includes('aria-expanded="false"'));
});

test('guided demo covers every panel section and starts with clear next and free exploration actions',()=>{
 assert.deepEqual(Array.from(tour.tourSteps,s=>s.key),['inicio','programa','clientes','equipo','ajustes']);
 const html=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'inicio',active:true,navigate:()=>{},setActive:()=>{}}));
 assert.ok(html.includes('Paso 1 de 5'));assert.ok(html.includes('Siguiente paso'));assert.ok(html.includes('Explorar libremente'));
 const final=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'ajustes',active:true,navigate:()=>{},setActive:()=>{}}));assert.ok(final.includes('Terminar recorrido'));
});

test('customer groups are filtered inside Customers and demo exit remains available without the tour',()=>{
 for(const section of ['clientes','clientes-new','clientes-frequent','clientes-risk','clientes-absent']){
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,initialSection:section},'Contenido'));
 assert.ok(html.includes('data-section="'+section+'"'));
 assert.ok(html.includes('Clientes'));
 assert.ok(html.includes('Tarjetas'));
 assert.ok(html.includes('Cuenta'));
 assert.ok(html.includes('Cerrar demo'));
 assert.ok(!html.includes('Frecuentes'));assert.ok(!html.includes('En riesgo'));
 }
 const group=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'clientes-risk',active:true,navigate:()=>{},setActive:()=>{}}));
 assert.ok(group.includes('Paso 3 de 5'));
});

test('sidebar accordion opens only the selected group and keeps a single page title',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null,initialSection:'plan'},'Contenido'));
 const css=readFileSync(new URL('../lib/owner/workspace.css',import.meta.url),'utf8');
 assert.ok(html.includes('<h1 id="workspace-title" tabindex="-1">Plan y facturación</h1>'));
 assert.ok(html.includes('id="workspace-submenu-cuenta"'));
 assert.ok(!html.includes('id="workspace-submenu-operacion"'));
 assert.ok(!html.includes('id="workspace-submenu-equipo-menu"'));
 const dashboard=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null},'Contenido'));
 assert.ok(dashboard.includes('<h1 id="workspace-title" tabindex="-1">Inicio</h1>'));
 assert.ok(!dashboard.includes('breadcrumbSlash'));
 assert.ok(css.includes('background:#173d31')&&css.includes('background:#d8ef78'));
 assert.ok(css.includes('.workspaceNavItem[aria-expanded="true"] i'));
});
test('selected owner menu destinations reveal their matching panel instead of leaving a blank workspace',()=>{
 const css=readFileSync(new URL('../lib/owner/workspace.css',import.meta.url),'utf8');
 for(const [section,panel] of [['inicio','inicio'],['mis-tarjetas','mis-tarjetas'],['clientes','clientes'],['equipo','equipo'],['sucursales','sucursales'],['informes','informes'],['canjes','canjes'],['plan','plan'],['configuracion','configuracion'],['ajustes','ajustes']])assert.ok(css.includes(`.nivalShell[data-section="${section}"] [data-panel="${panel}"]`),`${section} → ${panel}`);
 assert.match(css,/\[data-panel="compartir"\]\{display:block\}/);
 assert.ok(css.includes('@media(max-width:700px){.nivalShell .cardCatalogGrid{grid-template-columns:1fr}}'));
});
test('Inicio is a short operational summary with drilldowns, not a duplicated card editor',()=>{
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8');
 const catalog=readFileSync(new URL('../lib/points/card-catalog.tsx',import.meta.url),'utf8');
 for(const token of ['homePending','homeQuickActions','homeCoreMetrics','ActivityChart','CustomerMix','Actividad reciente','Ver detalle','data-panel="reseñas"','data-panel="informes"'])assert.ok(owner.includes(token),token);
 for(const token of ['data-panel="mis-tarjetas"','nfcLimit={limits.nfcCards}','reviewCards={data.reviewCards||[]}'])assert.ok(owner.includes(token),token);
 assert.ok(owner.includes('{emptyState&&<StartGuide state={startState||undefined}/>'));
 assert.ok(!owner.includes('Ingresos de clientes recurrentes'),'no invented ticket values');
 assert.ok(!shell.includes("label:'Complementos'"));
 assert.ok(!catalog.includes('Tarjeta de regalo')&&!catalog.includes('id="gift-card"'),'gift card is removed from every business');
});
test('sidebar replaces the full top bar and keeps all account and branch controls accessible',()=>{const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8'),css=readFileSync(new URL('../lib/owner/workspace.css',import.meta.url),'utf8');assert.ok(!shell.includes('<header className="workspaceTopbar"'),'full top bar must not exist');assert.ok(shell.includes('className="sidebarIdentity"')&&shell.includes('branchPicker')&&shell.includes('workspaceStatus')&&shell.includes('demo?"Demo":status'));assert.ok(shell.includes('logout}</div>'),'logout stays in sidebar');assert.ok(shell.includes('workspaceFloatingMenu'),'mobile/desktop menu toggle remains');assert.ok(css.includes('.workspaceSubmenu')&&css.includes('isSubItem.isActive'),'submenu contrast and active state remain');const icons=['inicio','card','clientes','check','google','trend','pin','equipo','settings'];for(const icon of icons)assert.ok(shell.includes("icon:'"+icon+"'"),'distinct menu icon '+icon);});
test('onboarding steps are single clickable rows with one highlighted next step',async()=>{
 const guide=component('start-guide.tsx',{'./icons':icons,'../foundation/db':{query:async()=>[]}});
 const state={complete:false,completed:0,steps:[
  {done:false,label:'Crear premio',icon:'gift',href:'/premio'},
  {done:false,label:'Activar tarjeta',icon:'card',href:'/tarjeta'},
  {done:false,label:'Colocar QR de reseñas',icon:'google',href:'/qr'},
  {done:false,label:'Registrar primer cliente',icon:'check',href:'/cliente'},
 ]};
 const html=renderToStaticMarkup(await guide.StartGuide({state}));
 assert.equal((html.match(/Crear premio/g)||[]).length,1);
 assert.equal((html.match(/class="startGuideStep/g)||[]).length,4);
 assert.equal((html.match(/aria-current="step"/g)||[]).length,1);
 assert.ok(!html.includes('startGuideNext'));
 assert.ok(html.includes('0 / 4'));
});

const {CustomerExplorer}=component('customer-explorer.tsx',{'./icons':icons,'./explorer.mjs':explorer});
test('large customer directory bounds rendered rows and segment pages do not offer other group filters',()=>{
 const customers=Array.from({length:43},(_,i)=>({id:String(i),name:'Cliente '+i,visits:1,is_risk:true}));
 const html=renderToStaticMarkup(React.createElement(CustomerExplorer,{customers,fixedSegment:'risk'}));
 assert.equal((html.match(/class="customerListRow"/g)||[]).length,20);
 assert.ok(html.includes('Página 1 de 3'));assert.ok(html.includes('43 clientes'));
 assert.ok(!html.includes('Tipo de cliente'));
 const empty=renderToStaticMarkup(React.createElement(CustomerExplorer,{customers:[],fixedSegment:'risk'}));
 assert.ok(empty.includes('No hay clientes en este grupo'));assert.ok(!empty.includes('Página 0'));
});

const {ReviewInsights}=component('review-insights-view.tsx',{'./review-insights.mjs':insights});
test('review report displays grounded themes and actions, legacy report makes no inferred text claims',()=>{
 const f=new FormData();for(const [key,value] of Object.entries({analyzed:'5',positiveTheme0:'Servicio amable',positiveCount0:'4',negativeTheme0:'Espera',negativeCount0:'2',improve:'Medir tiempos',keep:'Mantener el saludo'}))f.set(key,value);
 const html=renderToStaticMarkup(React.createElement(ReviewInsights,{notes:insights.encodeReviewInsights(f,10).value}));
 for(const text of ['Elogios más frecuentes','Quejas más frecuentes','Servicio amable','4 de 5','Qué mejorar','Medir tiempos','Qué seguir haciendo','Mantener el saludo'])assert.ok(html.includes(text),text);
 const legacy=renderToStaticMarkup(React.createElement(ReviewInsights,{notes:'Consejo manual'}));
 assert.ok(legacy.includes('Pendiente de análisis'));assert.ok(legacy.includes('Consejo manual'));assert.ok(!legacy.includes('Servicio amable'));
});

test('catalog promotions remain available before card creation and publish only in the final step',()=>{
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 const points=readFileSync(new URL('../app/panel/puntos/page.tsx',import.meta.url),'utf8');
 const catalog=readFileSync(new URL('../lib/points/card-catalog.tsx',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../lib/points/program-editor.tsx',import.meta.url),'utf8');
 const workspace=readFileSync(new URL('../lib/points/card-workspace.tsx',import.meta.url),'utf8');
 const actions=readFileSync(new URL('../lib/foundation/actions.ts',import.meta.url),'utf8');
 assert.ok(owner.includes('data-panel="premios"')&&owner.includes('<RewardWorkspace'),'promotion gallery is a dedicated submenu');
 assert.ok(owner.includes('data-panel="mis-tarjetas"')&&owner.includes('<CardCatalog'));
 assert.ok(catalog.includes('setupState={setupState}'));
 assert.ok(editor.includes('tab!==3')&&editor.includes('tab===3&&<button type="submit"'),'publishing blocked until the final step');
 assert.ok(editor.includes('primaryRewardId')&&editor.includes('rewardOrder'));
 assert.ok(workspace.includes('initialEdit?"edit":"list"'));
 assert.ok(points.includes("view==='premios'")&&points.includes('<CardWorkspace'));
 assert.ok(actions.includes('catalog_only')&&actions.includes('primaryRewardId'));
 assert.ok(actions.includes('Promoción publicada en tu catálogo. Ya puedes elegirla al configurar la tarjeta.'));
});
test('menu destinations identify the matching screen and onboarding actions jump to their forms',()=>{
 const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8');
 const points=readFileSync(new URL('../app/panel/puntos/page.tsx',import.meta.url),'utf8');
 const guide=readFileSync(new URL('../lib/owner/start-guide.tsx',import.meta.url),'utf8');
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 assert.ok(!shell.includes("id:'promociones',label:'Premios y promociones'"));
 assert.ok(shell.includes("item.id==='usuarios'?'equipo':item.id"));
 assert.ok(readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8').includes('<CampaignOverview'));
 assert.ok(shell.includes("item.id==='fidelidad'||item.id==='programa'?'mis-tarjetas'"));
 assert.ok(shell.includes("window.location.pathname!==home.pathname"));
 assert.ok(shell.includes("home.hash=target;window.location.href=home.pathname+home.search+home.hash"));
 assert.ok(points.includes("'programa','promociones','premios','equipo','canjes','compartir'"));
 assert.ok(points.includes("view==='programa'?'mis-tarjetas':view==='equipo'?'equipo':view"));
 assert.ok(guide.includes("href:base+'&edit=1#card-editor'"));
 assert.ok(shell.includes("setSection('mis-tarjetas');setExpanded('fidelidad')"));
 assert.ok(guide.includes("label:'Crear tu primera promoción'")&&guide.includes("view=premios#premios"));
 assert.match(owner,/<section data-panel="plan"[^]*?<PlanChoices b=\{b\}\/>/);
});
