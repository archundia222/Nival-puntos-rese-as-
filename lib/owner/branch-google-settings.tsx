import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {saveBranchGoogleUrl} from './actions';
export function BranchGoogleSettings({businessId,branchId,branchName,url}:{businessId:string;branchId:string;branchName:string;url:string}){
 return <article className="ownerCard branchGoogleSettings" aria-label={'Enlace de Google para las tarjetas · '+branchName}><div className="googleSettingsInline"><h3>Enlace de Google para tus tarjetas</h3><span className="googleHelp" tabIndex={0} role="note" aria-label="Este es el enlace que abrirán las tarjetas NFC y QR de reseñas." title="Las tarjetas NFC y QR abrirán este enlace.">ⓘ</span></div><p>Nival usa este enlace para que tus clientes abran la ficha de Google de esta sucursal. Los reportes y la respuesta a reseñas los gestiona el administrador de Nival.</p><ActionForm action={saveBranchGoogleUrl} label="Guardar enlace"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId}/><Field name="googleUrl" label="Enlace de tu ficha en Google Maps" value={url}/></ActionForm></article>;
}
