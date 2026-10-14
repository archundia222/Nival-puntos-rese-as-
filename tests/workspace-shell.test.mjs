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
 for(const title of ['Dashboard','Tarjetas','Clientes','Gestión','Ajustes','Nival Pay','Nival Reseñas','Periodo activo · día 1 de 30'])assert.ok(html.includes(title),title);
 assert.ok(html.includes('aria-controls="workspace-menu"'));assert.ok(html.includes('aria-current="page"'));assert.ok(html.includes('id="workspace-title"'));
 assert.ok(html.includes('Negocio A'));assert.ok(!html.includes('Negocio B'));assert.ok(!html.includes('Estás explorando la demo.'));
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

test('customer groups have independent navigation and demo exit remains available without the tour',()=>{
 for(const section of ['clientes','clientes-new','clientes-frequent','clientes-risk','clientes-absent']){
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,initialSection:section},'Contenido'));
 assert.ok(html.includes('data-section="'+section+'"'));
 assert.ok(html.includes('Clientes'));
 assert.ok(html.includes('Tarjetas'));
 assert.ok(html.includes('Cerrar demo'));
 }
 const group=renderToStaticMarkup(React.createElement(tour.DemoTour,{section:'clientes-risk',active:true,navigate:()=>{},setActive:()=>{}}));
 assert.ok(group.includes('Paso 3 de 7'));
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

test('card personalization guide lives under Puntos, not the Resumen section',()=>{
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 const points=readFileSync(new URL('../app/panel/puntos/page.tsx',import.meta.url),'utf8');
 assert.ok(!owner.includes('{startGuide}'));
 assert.ok(points.includes("view==='programa'&&<StartGuide"));
 assert.ok(points.includes('<CardWorkspace')&&points.includes('Administrar premios adicionales'));
});

test('menu destinations identify the matching screen and onboarding actions jump to their forms',()=>{
 const shell=readFileSync(new URL('../lib/owner/shell.tsx',import.meta.url),'utf8');
 const points=readFileSync(new URL('../app/panel/puntos/page.tsx',import.meta.url),'utf8');
 const guide=readFileSync(new URL('../lib/owner/start-guide.tsx',import.meta.url),'utf8');
 const owner=readFileSync(new URL('../lib/owner/view.tsx',import.meta.url),'utf8');
 assert.ok(shell.includes("id:'promociones',label:'Campañas y promociones'"));
 assert.ok(shell.includes("section==='equipo'?'equipo'"));
 assert.ok(shell.includes("section==='programa'?'mis-tarjetas'"));
 assert.ok(shell.includes("window.location.pathname!==home.pathname"));
 assert.ok(shell.includes("home.hash=target;window.location.href=home.pathname+home.search+home.hash"));
 assert.ok(points.includes("'programa','promociones','equipo','canjes','compartir'"));
 assert.ok(points.includes("view==='programa'?'mis-tarjetas':view==='equipo'?'equipo':view"));
 assert.ok(guide.includes("href:base+'#programa'"));
 assert.match(owner,/<section data-panel="plan"[^]*?<PlanChoices b=\{b\}\/>/);
});
