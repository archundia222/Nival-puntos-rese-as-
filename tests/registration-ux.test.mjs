import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {fieldErrorMessage} from '../lib/foundation/field-error.mjs';
test('registration renders mobile keyboards, understandable labels and no technical link field',()=>{
 const filename=new URL('../lib/foundation/registration-fields.tsx',import.meta.url);
 const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:createRequire(filename)});
 const html=renderToStaticMarkup(React.createElement(exports.RegistrationFields));
 for(const [name,type] of [['phone','tel'],['email','email'],['google_maps_url','url']]){
  const input=html.match(new RegExp('<input[^>]*name="'+name+'"[^>]*>'))?.[0];
  assert.ok(input,name);assert.ok(input.includes('type="'+type+'"'));assert.ok(input.includes('inputMode="'+type+'"'));
 }
 assert.ok(html.includes('Nombre del dueño o administrador'));
 assert.ok(html.includes('Agregamos +52 automáticamente'));
 assert.ok(!html.includes('name="slug"'));
});
test('invalid fields tell the user what is missing or how to correct it',()=>{
 const field={label:'Nombre del negocio',type:'text',validity:{valueMissing:true},minLength:2,validationMessage:''};
 assert.equal(fieldErrorMessage(field),'Completa el campo «Nombre del negocio».');
 assert.match(fieldErrorMessage({...field,type:'checkbox'}),/Debes aceptar los Términos/);
 assert.match(fieldErrorMessage({...field,type:'email',validity:{typeMismatch:true}}),/nombre@correo.com/);
 assert.match(fieldErrorMessage({...field,type:'url',validity:{typeMismatch:true}}),/https/);
 assert.match(fieldErrorMessage({...field,validity:{tooShort:true}}),/al menos 2 caracteres/);
});
