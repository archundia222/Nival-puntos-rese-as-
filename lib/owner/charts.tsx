import {AxisChart} from './axis-chart';
export function Bars({title,items,unit='Cantidad de reseñas',period='periodo seleccionado',xLabel='calificación'}:{title:string;unit?:string;period?:string;xLabel?:string;items:{label:string;value:number;color:string}[]}){
 return <AxisChart title={title} period={period} xLabel={xLabel} yLabel={unit} points={items}/>;
}
export function RatingLine({reports}:{reports:Record<string,any>[]}){
 const data=[...new Map(reports.map(r=>({date:String(r.period).slice(0,10),rating:Number(r.rating)})).filter(r=>Number.isFinite(r.rating)).map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(!data.length)return <p className="ownerEmpty">Sin calificaciones en este periodo.</p>;
 return <AxisChart title="Calificación de Google" period={data[0].date+' a '+data[data.length-1].date} xLabel="fecha" yLabel="estrellas (1–5)" kind="line" points={data.map(d=>({label:d.date,value:d.rating}))}/>;
}
