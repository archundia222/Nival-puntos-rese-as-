import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
import {saveBranchGoogleUrl} from './actions';
export function BranchGoogleSettings({businessId,branchId,branchName,url}:{businessId:string;branchId:string;branchName:string;url:string}){
 return <article className="ownerCard branchGoogleSettings" aria-label={'Configuración de reseñas · '+branchName}><div className="googleSettingsInline"><h3>Configuración de reseñas</h3><span className="googleHelp" tabIndex={0} role="note" aria-label="Las tarjetas NFC abrirán este enlace." title="Las tarjetas NFC abrirán este enlace.">ⓘ</span></div><ActionForm action={saveBranchGoogleUrl} label="Guardar"><Hidden name="businessId" value={businessId}/><Hidden name="branchId" value={branchId}/><Field name="googleUrl" label="Enlace de Google Maps" value={url}/></ActionForm></article>;
}
