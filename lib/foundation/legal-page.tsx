import {foundationEnabled,systemQuery} from './db';
import {publishedLegal} from './legal.mjs';
export async function legalText(key:string){if(foundationEnabled()){const [row]=await systemQuery('select value_published from nival_pr.site_content where key=$1',[key]);return publishedLegal(key,row);}return publishedLegal(key);}
export async function LegalPage({contentKey,title}:{contentKey:string;title:string}){const text=await legalText(contentKey);return <main className="dashboard"><h1>{title}</h1><article className="reviewBox preserveLines">{text}</article><p><a href="/terminos">Términos</a> · <a href="/privacidad">Aviso de Privacidad</a> · <a href="/">Inicio</a></p></main>}
