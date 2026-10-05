import {giros} from './registration.mjs';
export function RegistrationFields(){return <>
<label>Nombre del negocio<input name="name" required minLength={2} maxLength={150}/></label>
<label>Enlace del negocio<input name="slug" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="mi-negocio"/></label>
<label>Giro<select name="giro" required defaultValue=""><option value="" disabled>Selecciona un giro</option>{giros.map(g=><option key={g}>{g}</option>)}</select></label>
<label>Nombre del dueño<input name="owner_name" required minLength={2} maxLength={150} autoComplete="name"/></label>
<label>Teléfono (+52)<input name="phone" type="tel" required maxLength={20} placeholder="+52 55 1234 5678" autoComplete="tel"/></label>
<label>Correo<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
<label>Enlace de Google Maps<input name="google_maps_url" type="url" required maxLength={2048} placeholder="https://maps.app.goo.gl/…"/></label>
<label className="wide"><input name="accept_legal" type="checkbox" required/>Acepto los <a href="/terminos" target="_blank" rel="noreferrer">Términos</a> y el <a href="/privacidad" target="_blank" rel="noreferrer">Aviso de Privacidad</a>.</label>
</>}
