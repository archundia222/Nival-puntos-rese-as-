import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeReviewInsights,decodeReviewInsights} from '../lib/owner/review-insights.mjs';
function form(values){const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,String(v));return f;}
test('manual review themes sort by actual counts, preserve advice and permit overlapping mentions',()=>{
 const f=form({notes:'Consejo anterior',analyzed:5,positiveTheme0:'Café',positiveCount0:3,positiveTheme1:'Atención',positiveCount1:4,negativeTheme0:'Espera',negativeCount0:2,improve:'Medir tiempos',keep:'Saludo amable'});
 const encoded=encodeReviewInsights(f,20);assert.ok(!encoded.error);
 const {notes,analysis}=decodeReviewInsights(encoded.value);assert.equal(notes,'Consejo anterior');assert.equal(analysis.analyzed,5);
 assert.deepEqual(analysis.positive,[{theme:'Atención',count:4},{theme:'Café',count:3}]);assert.equal(analysis.improve,'Medir tiempos');assert.equal(analysis.keep,'Saludo amable');
});
test('analysis rejects invalid sample sizes, unsupported counts and unlabeled evidence',()=>{
 for(const values of [{analyzed:0,keep:'x'},{analyzed:11},{analyzed:1.5},{analyzed:5,positiveTheme0:'Café',positiveCount0:6},{analyzed:5,positiveTheme0:'Café',positiveCount0:1.5},{analyzed:5,positiveCount0:3},{analyzed:5,positiveTheme0:'Café'},{analyzed:5,positiveTheme0:'x'.repeat(161),positiveCount0:1}])assert.ok(encodeReviewInsights(form(values),10).error,JSON.stringify(values));
});
test('legacy advice and reports without text analysis remain readable without invented themes',()=>{
 assert.deepEqual(decodeReviewInsights('Mejorar horarios'),{notes:'Mejorar horarios',analysis:null});
 assert.equal(encodeReviewInsights(form({notes:'Mejorar horarios'}),10).value,'Mejorar horarios');
 assert.equal(decodeReviewInsights('NIVAL_REVIEW_INSIGHTS_V1:{bad').analysis,null);
 assert.equal(decodeReviewInsights('').analysis,null);
});
