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
test('business shell shows the plan-aware workspace menu and cycle chip',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null},React.createElement('p',null,'Solo datos de Negocio A')));
 for(const title of ['Inicio','Puntos y premios','Tarjeta de regalo','Google y reseñas','Clientes','Sucursales','Operación','Ajustes','Día 1 de 30'])assert.ok(html.includes(title),title);
 assert.ok(html.includes('aria-controls="workspace-menu"'));assert.ok(html.includes('aria-current="page"'));assert.ok(html.includes('id="workspace-title"'));
 assert.ok(!html.includes('Incluido'));
 assert.ok(html.includes('Negocio A'));assert.ok(!html.includes('Negocio B'));assert.ok(!html.includes('Estás explorando la demo.'));
 const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8');
 assert.match(shell,/onClick=\{\(\)=>toggle\(item\.id\)\}/);
 assert.match(shell,/aria-controls=\{'workspace-submenu-'\+item\.id\}/);
 assert.match(shell,/function groupForSection/);assert.match(shell,/if\(expanded===id\)\{setExpanded\(null\);return;\}/);assert.ok(!shell.includes('navigate(destination[id])'));
 assert.match(shell,/const normalized=normalizeSection\(key\)/);
});
test('demo and program settings reuse the same shell with explicit demo status and active configuration menu',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,initialSection:'ajustes'},'Contenido de ejemplo'));
 assert.ok(html.includes('data-section="ajustes"'));assert.ok(html.includes('Estás explorando la demo.'));assert.ok(html.includes('Datos de ejemplo'));
 assert.ok(html.includes('href="/acceso"'));
});

test('mobile preview keeps the closed drawer out of keyboard navigation',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,mobilePreview:true},'Contenido'));
 assert.match(html,/<aside[^>]+inert=""/);
 assert.ok(html.includes('aria-label="Abrir menú"'));assert.ok(html.includes('aria-expanded="false"'));
});

test('guided demo covers every panel section and starts with clear next and free exploration actions',()=>{
 assert.deepEqual(Array.from(tour.tourSteps,s=>s.key),['inicio','programa','clientes','google','equipo','compartir','ajustes']);
 const html=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'inicio',active:true,navigate:()=>{},setActive:()=>{}}));
 assert.ok(html.includes('Paso 1 de 7'));assert.ok(html.includes('Siguiente paso'));assert.ok(html.includes('Explorar libremente'));
 const final=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'ajustes',active:true,navigate:()=>{},setActive:()=>{}}));assert.ok(final.includes('Terminar recorrido'));
});

test('customer groups are filtered inside Customers and demo exit remains available without the tour',()=>{
 for(const section of ['clientes','clientes-new','clientes-frequent','clientes-risk','clientes-absent']){
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,initialSection:section},'Contenido'));
 assert.ok(html.includes('data-section="'+section+'"'));
 assert.ok(html.includes('Clientes'));
 assert.ok(html.includes('Puntos y premios'));
 assert.ok(html.includes('Tarjeta de regalo'));
 assert.ok(html.includes('Cerrar demo'));
 assert.ok(!html.includes('Frecuentes'));assert.ok(!html.includes('En riesgo'));
 }
 const group=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'clientes-risk',active:true,navigate:()=>{},setActive:()=>{}}));
 assert.ok(group.includes('Paso 3 de 7'));
});

test('sidebar accordion opens only the active group and keeps a single page title',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null,initialSection:'plan'},'Contenido'));
 const css=readFileSync(new URL('../lib/owner/workspace.css',import.meta.url),'utf8');
 assert.match(html,/aria-expanded="true"[^>]*aria-controls="workspace-submenu-ajustes"/);
 assert.ok(!html.includes('id="workspace-submenu-fidelidad"'));
 assert.ok(!html.includes('id="workspace-submenu-operacion"'));
 assert.ok(!html.includes('id="workspace-submenu-resenas"'));
 const dashboard=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null},'Contenido'));
 assert.ok(dashboard.includes('<h1 id="workspace-title" tabindex="-1">Inicio</h1>'));
 assert.ok(!dashboard.includes('breadcrumbSlash'));
 assert.ok(css.includes('background:#173d31')&&css.includes('background:#d8ef78'));
 assert.ok(css.includes('.workspaceNavItem[aria-expanded="true"] i'));
});
test('home presents points, gift cards and reviews, while an empty account avoids zero metrics',()=>{
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 for(const label of ["name:'Puntos'","name:'Tarjeta de regalo'","name:'Google y reseñas'","href={'#'+product.id}"])assert.ok(owner.includes(label),label);
 assert.ok(owner.includes('{emptyState&&<StartGuide'));
 assert.ok(owner.includes('<ProductHub data={{...data,hasPayCard:Boolean(b.pay_card_url)}}/>'));
 assert.ok(owner.includes('{!emptyState&&<>'));
});

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
 assert.equal((html.match(/data-label="Teléfono"/g)||[]).length,20);
 assert.ok(html.includes('Página 1 de 3'));assert.ok(html.includes('43 clientes'));
 assert.ok(!html.includes('Tipo de cliente'));
 const empty=renderToStaticMarkup(React.createElement(CustomerExplorer,{customers:[],fixedSegment:'risk'}));
 assert.ok(empty.includes('No hay clientes en este grupo'));assert.ok(!empty.includes('Página 0'));
});

const {ReviewInsights}=component('review-insights.tsx',{'./review-insights.mjs':insights});
test('review report displays grounded themes and actions, legacy report makes no inferred text claims',()=>{
 const f=new FormData();for(const [key,value] of Object.entries({analyzed:'5',positiveTheme0:'Servicio amable',positiveCount0:'4',negativeTheme0:'Espera',negativeCount0:'2',improve:'Medir tiempos',keep:'Mantener el saludo'}))f.set(key,value);
 const html=renderToStaticMarkup(React.createElement(ReviewInsights,{notes:insights.encodeReviewInsights(f,10).value}));
 for(const text of ['Elogios más frecuentes','Quejas más frecuentes','Servicio amable','4 de 5','Qué mejorar','Medir tiempos','Qué seguir haciendo','Mantener el saludo'])assert.ok(html.includes(text),text);
 const legacy=renderToStaticMarkup(React.createElement(ReviewInsights,{notes:'Consejo manual'}));
 assert.ok(legacy.includes('Pendiente de análisis'));assert.ok(legacy.includes('Consejo manual'));assert.ok(!legacy.includes('Servicio amable'));
});

test('first reward is configured with the card and extra rewards appear only after publishing',()=>{
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 const points=readFileSync(new URL('../app/panel/puntos/page.tsx',import.meta.url),'utf8');
 const catalog=readFileSync(new URL('../lib/points/card-catalog.tsx',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../lib/points/program-editor.tsx',import.meta.url),'utf8');
 const cardWorkspace=readFileSync(new URL('../lib/points/card-workspace.tsx',import.meta.url),'utf8');
 const actions=readFileSync(new URL('../lib/foundation/actions.ts',import.meta.url),'utf8');
 assert.ok(!owner.includes('{startGuide}'));
 assert.ok(!points.includes('<StartGuide'));
 assert.ok(catalog.includes('setupState={setupState}'));
 assert.ok(!points.includes('setupState={setupState||undefined}'));
 assert.ok(!editor.includes('editorSetupProgress'));
 assert.ok(editor.includes('Configura el premio y publícalo en un paso.'));
 assert.ok(cardWorkspace.includes('initialEdit?"edit":"list"'));
 assert.ok(points.includes('initialEdit={params.edit===\'1\'}'));
 assert.ok(points.includes('{program?<details className="reviewBox extraRewards"'));
 assert.ok(points.includes('Tu primer premio se crea con la tarjeta'));
 assert.ok(points.includes('Configurar tarjeta'));
 assert.ok(!editor.includes('firstCardGuide'));
 assert.ok(actions.includes("'{campaign_rules,targets,all}'"));
 assert.ok(points.includes('<CardWorkspace')&&points.includes('Premios adicionales ('));
 assert.ok(actions.includes('Configura y guarda tu tarjeta en «Mis tarjetas» antes de agregar otro premio.'));
});

test('menu destinations identify the matching screen and onboarding actions jump to their forms',()=>{
 const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8');
 const points=readFileSync(new URL('../app/panel/puntos/page.tsx',import.meta.url),'utf8');
 const guide=readFileSync(new URL('../lib/owner/start-guide.tsx',import.meta.url),'utf8');
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 assert.ok(shell.includes("id:'promociones',label:'Premios y promociones'"));
 assert.ok(shell.includes("section==='equipo'?'equipo'"));
 assert.ok(shell.includes("section==='programa'?'mis-tarjetas'"));
 assert.ok(shell.includes("window.location.pathname!==home.pathname"));
 assert.ok(shell.includes("home.hash=target;window.location.href=home.pathname+home.search+home.hash"));
 assert.ok(points.includes("'programa','promociones','equipo','canjes','compartir'"));
 assert.ok(points.includes("view==='programa'?'mis-tarjetas':view==='equipo'?'equipo':view"));
 assert.ok(guide.includes("&view=programa&edit=1#card-editor"));
 assert.ok(shell.includes("setSection('mis-tarjetas');setExpanded('fidelidad')"));
 assert.ok(guide.includes("href:base+'#programa'"));
 assert.match(owner,/<section data-panel="plan"[^]*?<PlanChoices b=\{b\}\/>/);
});
