import {foundationEnabled} from '../../../lib/foundation/db';
import {redirect} from 'next/navigation';
import Legacy from './legacy-page';
export const dynamic='force-dynamic';
export default async function Page(props:{searchParams:Promise<{mes?:string}>}){if(foundationEnabled())redirect('/panel');return <Legacy {...props}/>;}
