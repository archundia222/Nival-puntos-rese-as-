const fmt=(v:number)=>v.toLocaleString('es-MX');
export function Bars({title,items,unit='Cantidad de reseñas'}:{title:string;unit?:string;items:{label:string;value:number;color:string}[]}){
 const max=Math.max(1,...items.map(x=>x.value));
 return <figure className="ownerChart" aria-label={title}><figcaption>{title}</figcaption>{items.map(x=><div className="chartBar" key={x.label}><span>{x.label}</span><div><i style={{width:`${x.value/max*100}%`,background:x.color}}/></div><b>{fmt(x.value)}</b></div>)}<span className="chartHint">{unit}</span></figure>;
}
export function RatingLine({reports}:{reports:Record<string,any>[]}){
 const data=reports.map(r=>({date:String(r.period).slice(0,10),rating:Number(r.rating)})).filter(r=>Number.isFinite(r.rating));
 if(!data.length)return <p className="ownerEmpty">Nival aún no ha cargado calificaciones para este periodo.</p>;
 const left=34,right=302,top=15,bottom=145;
 const x=(i:number)=>data.length===1?(left+right)/2:left+i*(right-left)/(data.length-1);
 const y=(n:number)=>bottom-(n-1)*(bottom-top)/4;
 return <figure className="ownerChart"><figcaption>Calificación en el tiempo</figcaption><svg viewBox="0 0 320 180" role="img" aria-label="Evolución de la calificación de Google, de una a cinco estrellas">
 {[1,2,3,4,5].map(n=><g key={n}><line x1={left} x2={right} y1={y(n)} y2={y(n)} stroke="#e6ece8"/><text x="9" y={y(n)+4} fontSize="11" fill="#607267">{n}</text></g>)}
 <polyline fill="none" stroke="#175d47" strokeWidth="3" points={data.map((d,i)=>`${x(i)},${y(d.rating)}`).join(' ')}/>
 {data.map((d,i)=><circle key={i} cx={x(i)} cy={y(d.rating)} r="4" fill="#175d47"><title>{d.date}: {d.rating} estrellas</title></circle>)}
 <text x={left} y="168" fontSize="10" fill="#607267">{data[0].date}</text><text x={right} y="168" textAnchor="end" fontSize="10" fill="#607267">{data.at(-1)?.date}</text>
 </svg><details><summary>Ver valores de la gráfica</summary><ul>{data.map((d,i)=><li key={i}>{d.date} · {d.rating} ★</li>)}</ul></details></figure>;
}
