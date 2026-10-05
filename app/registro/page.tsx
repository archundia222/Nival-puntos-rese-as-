import {foundationEnabled} from '../../lib/foundation/db';
import {redirect} from 'next/navigation';
import DemoForm from './demo-form';
export default function Register(){if(foundationEnabled())redirect('/panel');return <DemoForm/>;}
