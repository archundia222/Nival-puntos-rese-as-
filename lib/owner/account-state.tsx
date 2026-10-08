import {PlanChoices} from './plan-choices';
import {quoteUrl} from '../foundation/registration.mjs';
import {redeemActivationCode} from '../admin/actions';
import {ActionForm} from '../foundation/forms';
import {Field,Hidden} from '../foundation/fields';
export function AccountState({b}:{b:Record<string,any>}){
 return <><section className="ownerCard accountLock"><div><span className="workspaceEyebrow">QUÉ SIGUE</span><h2>{b.paid_until?'Renueva para continuar':'Tu cuenta está creada. Activa tu negocio.'}</h2><ol className="onboardingSteps"><li>Registro recibido: <strong>{b.name}</strong></li><li>{b.status==='pago_pendiente'?'Nival registró tu pago. Pide el código si aún no lo recibes.':'Coordina tu pago con Nival por WhatsApp.'}</li><li>Pega tu código en esta cuenta. Desde ese momento tienes 30 días.</li></ol><p>Código del negocio: <code>{b.slug}</code>. Este identifica al negocio para tu personal; el código NIV activa la mensualidad.</p><p>Tu historial se conserva al vencer y al cambiar de plan.</p></div><a className="workspacePrimary" href={quoteUrl(b)} target="_blank" rel="noreferrer">Coordinar pago o pedir mi código</a><ActionForm action={redeemActivationCode} label="Activar mis 30 días" preserveOnError><Hidden name="businessId" value={b.id}/><Field name="code" label="Código de activación NIV-XXXX-XXXX"/></ActionForm></section><PlanChoices b={b}/></>;
}
