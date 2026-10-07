# Seguridad y operación — piloto

## Acceso administrativo
Owner y superadmin usan Neon Auth con correo y contraseña. La sesión real se valida en servidor en cada página/acción protegida; el cookie `nival_route` solo orienta navegación y no concede permisos. El hint de ruta expira en 8 horas. Staff usa PIN de 6–8 dígitos, scrypt y una sesión aleatoria revocable que expira en 8 horas. Cerrar sesión revoca la sesión staff, borra cookies locales y cierra Neon Auth.

Los intentos de PIN se limitan por cuenta e IP a 5 por ventana de 15 minutos. El endpoint de login por correo usa la misma barrera por IP y correo, por lo que cubre owner y superadmin.

## Turnstile
El alta pública de cuenta de negocio exige un desafío Turnstile verificado por servidor antes de permitir `sign-up/email`. El alta pública de clientes verifica Turnstile directamente en la Server Action antes de crear la tarjeta.

Variables de Preview que debe cargar el propietario directamente en Vercel:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (pública)
- `TURNSTILE_SECRET_KEY` (Secret)

## Evidencias de canje
El destino elegido es Cloudflare R2 privado, compatible con S3. Es independiente de la base, económico para objetos y permite URLs firmadas. El bucket nunca es público. La base guarda solo metadatos y `object_key`. `/api/points/evidence` autoriza owner/superadmin y redirige a una URL firmada por 60 segundos.

Variables de Preview pendientes:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_EVIDENCE_BUCKET`

La migración segura existente es `scripts/migrate-evidence.mjs --apply`: sube cada binario heredado, vuelve a descargarlo, compara tamaño y SHA-256, registra metadatos y solo entonces elimina el binario de Neon. Si la copia no coincide, conserva el original.

## Errores
`instrumentation.ts` captura errores de servidor y los envía a un proyecto Sentry si existe `SENTRY_DSN`. Sin DSN falla cerrado y no afecta la petición. El propietario debe crear el proyecto Sentry, cargar `SENTRY_DSN` directamente en Vercel Preview y configurar una alerta de "nuevo issue" o errores > 0 al correo deseado.

## Neon: restauración
Para piloto comercial se recomienda **Launch** como mínimo: permite ampliar Instant Restore hasta 7 días. Free conserva solo una ventana corta (6 horas en la documentación vigente). Scale es apropiado cuando se necesiten controles/SLA superiores y hasta 30 días.

Procedimiento: 1) detener escrituras/despliegues; 2) Neon Console > proyecto > Branches/Restore; 3) elegir punto anterior al incidente; 4) crear/restaurar una rama desde ese instante; 5) validar conteos y datos críticos en la rama restaurada; 6) cambiar la aplicación a la rama restaurada solo tras validar; 7) conservar temporalmente la rama dañada para investigación; 8) ejecutar smoke tests antes de reabrir escrituras.

## Vercel
El team Nival Tech fue consultado por API y actualmente está en `hobby`. Hobby es solo para uso personal/no comercial según los términos vigentes. Antes de cobrar clientes, cambiar el team a **Pro** o superior.

## Wallet
Los IDs de este proyecto usan exclusivamente `puntos_business_` y `puntos_customer_` bajo el issuer configurado, separados de otros proyectos Nival. El estado Demo/Publishing del issuer no puede inferirse de una variable: debe verificarse en Google Pay & Wallet Console. En Demo solo Admin/Developer/testers pueden guardar pases; Publishing permite usuarios generales.

## Secretos
`.env.example` contiene únicamente nombres vacíos. Los secretos son server-only; no usar prefijo `NEXT_PUBLIC_` salvo la site key pública de Turnstile. Se revisaron los 100 commits visibles de la rama piloto buscando claves privadas, URLs Postgres con contraseña, tokens GitHub/Stripe y valores de secretos conocidos, sin coincidencias. CI mantiene un escaneo adicional del árbol actual.

## Acceso privado del fundador

- Ruta independiente: `/acceso-administrador`. `/admin/acceso` redirige a ella.
- El registro de negocios sigue creando perfiles `owner`; no concede administración.
- El primer acceso se configura exclusivamente con `rodrigoarchundia379@gmail.com` desde el formulario privado y requiere confirmar ese correo.
- El servidor concede el perfil únicamente después de iniciar sesión con contraseña y comprobar la identidad confirmada devuelta por Neon Auth. No confía en un correo ni un rol enviado por el navegador.
- Todas las páginas y acciones administrativas vuelven a exigir la identidad autorizada y el perfil `superadmin` asociado al mismo ID.
- El formulario privado limita intentos por cuenta, verifica el origen de la solicitud y renueva la orientación de navegación al iniciar sesión. El permiso real siempre se consulta en servidor.
- Configuración y recuperación tienen formularios propios. La recuperación no permite entrar al panel hasta iniciar sesión de nuevo y validar la identidad.
- No se crean cuentas desde pruebas automáticas ni se cambia una contraseña del fundador. La entrega de correo y el primer acceso requieren la intervención del titular.
- El correo reservado tampoco puede iniciar sesión mediante el endpoint público de negocios. La sesión administrativa requiere una prueba HMAC vinculada al usuario y a la sesión del proveedor, expira a las 8 horas y se guarda en una cookie HttpOnly/Secure/SameSite.
- La configuración inicial genera una contraseña aleatoria desconocida para el solicitante, cierra la sesión creada y envía confirmación y definición de contraseña al correo autorizado. Evita que un tercero elija la contraseña del fundador antes de que este confirme su correo.
