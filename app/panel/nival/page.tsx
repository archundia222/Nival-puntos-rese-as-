import {foundationEnabled} from '../../../lib/foundation/db';
import {redirect} from 'next/navigation';
import Legacy from './legacy-page';
export const dynamic='force-dynamic';
export default async function Page(){if(foundationEnabled())redirect('/admin');return <Legacy/>;}
