import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {sendWalletCampaign} from './wallet-campaign-action';

export function WalletCampaignPanel({businessId,demo=false}:{businessId:string;demo?:boolean}){
 return <section className="ownerCard walletCampaignPanel" aria-labelledby="wallet-campaigns-title">
   <header><div><span className="workspaceEyebrow">CLIENTES · GOOGLE WALLET</span><h2 id="wallet-campaigns-title">Campañas y notificaciones</h2><p>Envía una oferta a los clientes de un grupo que aceptaron comunicaciones y tienen su tarjeta en Wallet.</p></div></header>
   {demo?<p className="ownerEmpty">La demo no envía notificaciones.</p>:
   <ActionForm action={sendWalletCampaign} label="Enviar notificación">
    <Hidden name="businessId" value={businessId}/>
    <label>Destinatarios<select name="audience" defaultValue="at_risk"><option value="all">Todos los clientes habilitados</option><option value="new">Nuevos</option><option value="frequent">Frecuentes</option><option value="at_risk">En riesgo</option><option value="lost">Inactivos</option><option value="absent">Sin visita</option></select></label>
    <label>Título de la campaña<input type="text" name="title" placeholder="Tenemos un premio para ti" maxLength={60} required/></label>
    <label>Mensaje<textarea name="body" placeholder="Vuelve esta semana y descubre tus recompensas." maxLength={250} rows={3} required/></label>
    <label className="consentLabel"><input name="confirmation" type="checkbox" required/><span>Confirmo el público y el mensaje. Solo se contactará a clientes con consentimiento registrado.</span></label>
   </ActionForm>}
   <p className="walletCampaignNotice">El envío es manual. Google Wallet controla si la notificación se muestra. Por seguridad se limita a 10 destinatarios por envío y a un mensaje por cliente cada 24 horas.</p>
 </section>;
}