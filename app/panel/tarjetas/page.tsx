import {redirectToPanel} from '../../../lib/owner/panel-redirect';
export const dynamic='force-dynamic';
export default async function PanelAlias({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 redirectToPanel('mis-tarjetas',await searchParams);
}
