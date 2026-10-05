import {neon} from '@neondatabase/serverless';
export type Row=Record<string,any>&{id:string;name:string;display_name:string;google_url:string;active:boolean;created_at:string;customer_id:string;kind:'visit'|'redeem';points:number;happened_at:string;rating:number;review_date:string;answered_at:string|null;checked_on:string;review_count:number;findings:string;recommendations:string};
type QueryError={code?:string;message:string};
type Result<T>={data:T|null;error:QueryError|null};
const tables=new Set(['npr_operators','npr_businesses','npr_customers','npr_movements','npr_reviews','npr_diagnostics','npr_review_links']);
const identifier=(value:string)=>{if(!/^[a-z_][a-z0-9_]*$/.test(value))throw Error('Invalid column');return `"${value}"`;};
export class Query implements PromiseLike<Result<Row[]>>{
 private columns='*';private returning=false;private values:Record<string,unknown>|null=null;private operation:'select'|'insert'|'update'='select';private filters:{column:string;value:unknown}[]=[];private sort:{column:string;asc:boolean}[]=[];private offset=0;private count=500;
 constructor(private table:string,private execute:(text:string,params:unknown[])=>Promise<Row[]>){if(!tables.has(table))throw Error('Invalid table');}
 select(columns:string){this.columns=columns;this.returning=true;return this;}
 insert(values:Record<string,unknown>){this.operation='insert';this.values=values;return this;}
 update(values:Record<string,unknown>){this.operation='update';this.values=values;return this;}
 eq(column:string,value:unknown){this.filters.push({column,value});return this;}
 is(column:string,value:null){this.filters.push({column,value});return this;}
 order(column:string,options?:{ascending?:boolean}){this.sort.push({column,asc:options?.ascending!==false});return this;}
 range(start:number,end:number){if(!Number.isInteger(start)||start<0||end<start||end-start>499)throw Error('Invalid range');this.offset=start;this.count=end-start+1;return this;}
 async single():Promise<Result<Row>>{const result=await this.run();return result.error?{data:null,error:result.error}:result.data?.length===1?{data:result.data[0],error:null}:{data:null,error:{message:'Expected one row'}};}
 async maybeSingle():Promise<Result<Row>>{const result=await this.run();return result.error?{data:null,error:result.error}:!result.data?.length?{data:null,error:null}:result.data.length===1?{data:result.data[0],error:null}:{data:null,error:{message:'Expected at most one row'}};}
 private async run():Promise<Result<Row[]>>{
  try{
   const params:unknown[]=[];const bind=(value:unknown)=>{params.push(value);return `$${params.length}`;};
   const fields=this.columns==='*'?'*':this.columns.split(',').map(identifier).join(',');
   let text='';
   if(this.operation==='select')text=`select ${fields} from public.${identifier(this.table)}`;
   else{const entries=Object.entries(this.values||{});if(!entries.length)throw Error('Missing values');
    if(this.operation==='insert')text=`insert into public.${identifier(this.table)} (${entries.map(([key])=>identifier(key)).join(',')}) values (${entries.map(([,value])=>bind(value)).join(',')})`;
    else text=`update public.${identifier(this.table)} set ${entries.map(([key,value])=>`${identifier(key)}=${bind(value)}`).join(',')}`;
   }
   if(this.filters.length)text+=` where ${this.filters.map(({column,value})=>value===null?`${identifier(column)} is null`:`${identifier(column)}=${bind(value)}`).join(' and ')}`;
   if(this.operation==='select'){if(this.sort.length)text+=` order by ${this.sort.map(({column,asc})=>`${identifier(column)} ${asc?'asc':'desc'}`).join(',')}`;text+=` limit ${bind(this.count)} offset ${bind(this.offset)}`;}
   else if(this.returning)text+=` returning ${fields}`;
   const rows=await this.execute(text,params);
   return {data:rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value instanceof Date?(key==='review_date'||key==='checked_on'?value.toISOString().slice(0,10):value.toISOString()):key==='rating'&&value!==null?Number(value):value])) as Row),error:null};
  }catch(error){return {data:null,error:{code:(error as {code?:string}).code,message:'Database operation failed'}};}
 }
 then<TResult1=Result<Row[]>,TResult2=never>(onfulfilled?:((value:Result<Row[]>)=>TResult1|PromiseLike<TResult1>)|null,onrejected?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2>{return this.run().then(onfulfilled,onrejected);}
}
export function scopedClient(role:'npr_app'|'npr_anon'|'npr_card_reader',scope:string){
 const url=process.env.DATABASE_URL;if(!url)throw Error('Database setup pending');const sql=neon(url);
 const execute=async(text:string,params:unknown[])=>{
  const results=await sql.transaction([sql.query(`set local role ${role}`),sql.query("select set_config('npr.user_id',$1,true), set_config('npr.card_token',$2,true)",[role==='npr_app'?scope:'',role==='npr_card_reader'?scope:'']),sql.query(text,params)]);
  return results[2] as Row[];
 };
 return {from:(table:string)=>new Query(table,execute)};
}
