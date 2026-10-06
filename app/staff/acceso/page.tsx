import {ActionForm} from '../../../lib/foundation/forms';
import {Field} from '../../../lib/foundation/fields';
import {loginStaff} from '../../../lib/foundation/actions';
import {foundationEnabled} from '../../../lib/foundation/db';
export const dynamic='force-dynamic';
export default function StaffLogin(){return <main className="dashboard authShell staffAuth"><header className="dashHead authHead"><div><small>NIVAL · PERSONAL</small><h1>Acceso con PIN</h1></div><a href="/acceso">Acceso por correo</a></header><section className="reviewBox">{foundationEnabled()?<><p>Usa el identificador que Nival entregó para tu cuenta de mesero.</p><ActionForm action={loginStaff} label="Entrar"><Field name="slug" label="Enlace de tu negocio (ejemplo: cafe-demo)"/><Field name="staffId" label="Identificador de mesero"/><label>PIN<input name="pin" type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6,8}" required minLength={6} maxLength={8}/></label></ActionForm></>:<p>El acceso para meseros estará disponible cuando se active el nuevo cimiento.</p>}</section></main>}
