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
const icons=component('icons.tsx');const {DashboardShell}=component('shell.tsx',{'./icons':icons});
test('business shell renders six identifiable sections, accessible menu control and owner-specific identity',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Negocio A',owner:'Ana',status:'Activo',demo:false,logout:null},React.createElement('p',null,'Solo datos de Negocio A')));
 for(const title of ['Inicio','Clientes','Google y reseñas','Equipo','QR y tarjeta','Configuración'])assert.ok(html.includes(title),title);
 assert.ok(html.includes('aria-controls="workspace-menu"'));assert.ok(html.includes('aria-current="page"'));assert.ok(html.includes('id="workspace-title"'));
 assert.ok(html.includes('Negocio A'));assert.ok(!html.includes('Negocio B'));assert.ok(!html.includes('Estás explorando la demo.'));
});
test('demo and program settings reuse the same shell with explicit demo status and active configuration menu',()=>{
 const html=renderToStaticMarkup(React.createElement(DashboardShell,{name:'Café Demo',owner:'Ana',status:'Activo',demo:true,logout:null,initialSection:'ajustes'},'Contenido de ejemplo'));
 assert.ok(html.includes('data-section="ajustes"'));assert.ok(html.includes('Estás explorando la demo.'));assert.ok(html.includes('Datos de ejemplo'));
 assert.ok(html.includes('href="/acceso"'));
});
