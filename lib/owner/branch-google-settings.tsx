import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {saveBranchGoogleUrl} from './actions';
export function BranchGoogleSettings({businessId,branchId,branchName,url}:{businessId:string;branchId:string;branchName:string;url:string}){return <article className="ownerCard branchGoogleSettings"><h3>Ficha de Google · {branchName}</h3><p>Configura la ficha de esta sucursal. Sus tarjetas NFC abrirán ese enlace.</p><ActionForm action={saveBranchGoogleUrl} label="Guardar ficha de esta sucursal"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId}/><Field name="googleUrl" label="Enlace HTTPS de Google Maps" value={url}/></ActionForm></article>;}
