'use client';
import {useState} from 'react';
type Point={label:string;value:number;color?:string};
export function AxisChart({title,period,xLabel,yLabel,points,kind='bar'}:{title:string;period:string;xLabel:string;yLabel:string;points:Point[];kind?:'bar'|'line'}){
 const [selected,setSelected]=useState<number|null>(null);
 const max=Math.max(1,...points.map(p=>p.value));
 const W=660,H=270,left=78,right=636,top=24,bottom=204;
 const xx=(i:number)=>left+(kind==='line'?(i+.5)/Math.max(1,points.length):i+.5)/Math.max(1,kind==='line'?points.length:points.length)*(right-left);
 const yy=(v:number)=>bottom-v/max*(bottom-top);
 const ticks=[0,1,2,3,4].map(i=>max*i/4);
 return <figure className="ownerChart axisChart"><figcaption>{title} · {period}</figcaption><div className="axisChartScroll"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}, X: ${xLabel}, Y: ${yLabel}`}>
 {ticks.map((v,i)=><g key={i}><line x1={left} y1={yy(v)} x2={right} y2={yy(v)} stroke="#ccd8cf"/><text x={left-9} y={yy(v)+4} textAnchor="end" fontSize="12" fill="#293e34">{Number.isInteger(v)?v:v.toFixed(1)}</text></g>)}
 <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#415b4c" strokeWidth="1.5"/>
 <text x={(left+right)/2} y={H-8} textAnchor="middle" fontSize="13" fill="#172b21">X: {xLabel}</text>
 <text transform={`translate(16 ${(top+bottom)/2}) rotate(-90)`} textAnchor="middle" fontSize="13" fill="#172b21">Y: {yLabel}</text>
 {kind==='line'&&points.length>1&&<polyline fill="none" stroke="#1b6142" strokeWidth="3" points={points.map((p,i)=>`${xx(i)},${yy(p.value)}`).join(' ')}/>}
 {points.map((p,i)=>{const x=xx(i),y=yy(p.value),active=selected===i;return <g key={i} role="button" tabIndex={0} aria-label={`${p.label}: ${p.value} ${yLabel}`} onClick={()=>setSelected(active?null:i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(active?null:i)}}} style={{cursor:'pointer'}}>
 {kind==='bar'?<rect x={left+i*(right-left)/Math.max(1,points.length)+4} y={y} width={Math.max(2,(right-left)/Math.max(1,points.length)-8)} height={Math.max(2,bottom-y)} rx="4" fill={p.color||'#205c43'}/>:<><circle cx={x} cy={y} r="13" fill="transparent"/><circle cx={x} cy={y} r={active?7:5} fill="#205c43"/></>}
 {(points.length<=12||i%Math.ceil(points.length/12)===0)&&<text x={x} y={bottom+17} textAnchor="middle" fontSize="10.5" fill="#243a30">{p.label.length>10?p.label.slice(0,9)+'…':p.label}</text>}
 {active&&<g><rect x={Math.min(right-153,Math.max(left,x-76))} y={Math.max(1,y-53)} width="153" height="42" rx="7" fill="#142c23"/><text x={Math.min(right-153,Math.max(left,x-76))+9} y={Math.max(1,y-53)+17} fontSize="11" fill="#fff">{p.label.slice(0,21)}</text><text x={Math.min(right-153,Math.max(left,x-76))+9} y={Math.max(1,y-53)+32} fontSize="12" fontWeight="bold" fill="#fff">{p.value.toLocaleString('es-MX')} {yLabel.slice(0,18)}</text></g>}
 </g>})}
 </svg></div><small className="axisChartInstruction">Toca una barra o punto para ver su valor.</small></figure>;
}
