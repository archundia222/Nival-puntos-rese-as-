# Cimiento de Nival Puntos + Reseñas

Esta implementación usa la base Neon PostgreSQL existente y Neon Auth, conforme a la alternativa aprobada. No depende de Supabase para funcionar. El repositorio y la base son independientes de Nival Pay y Nival Links.

## Estado entregado
El SQL, los accesos por rol y el seed están preparados en el código. La migración se probó en PostgreSQL embebido. No se ha aplicado al Neon remoto ni creado el seed remoto porque la conexión autorizada a Neon está pendiente. No hay despliegue READY nuevo que pueda afirmarse sin estas comprobaciones.

## Archivos
| Archivo | Propósito |
|---|---|
| database/foundation-neon.sql | 19 tablas funcionales y dos tablas privadas de sesiones/límites, RLS, permisos, saldo y auditoría |
| lib/foundation/db.ts | Consultas parametrizadas con rol/contexto locales en cada transacción |
| lib/foundation/session.ts | Identidad verificada, rol real y membresía activa |
| lib/foundation/actions.ts | Operaciones del panel y acceso por PIN/token |
| lib/foundation/security.mjs | Hashes scrypt de PIN, tokens aleatorios y firma de orientación de rutas |
| proxy.ts | Middleware de Next.js 16, redirecciones y encabezados de seguridad |
| scripts/migrate.mjs | Aplicar SQL exclusivamente en nival_puntos_resenas, con checksum de versión |
| scripts/seed-demo.mjs | Crear Café Demo, owner, dos meseros y 20 clientes ficticios |
| scripts/bootstrap-admin.mjs | Asignar superadmin a un UUID con correo confirmado |
| tests/foundation.test.mjs | Pruebas de autorización e integridad en PostgreSQL |
| docs/PRUEBAS-MANUALES.md | Aceptación del recorrido real |

## 1. Preparar el proyecto
Requiere Node.js 22 o superior (los scripts usan WebSocket nativo). Dentro de la carpeta del repositorio:

```bash
npm ci
cp .env.example .env.local
```

Abrir .env.local y completar DATABASE_URL y NEON_AUTH_BASE_URL con los valores del proyecto Neon `soft-waterfall-47553388`, rama `br-billowing-bonus-b8ln5fvm`, base `nival_puntos_resenas`. No imprimir ni compartir esos valores. Generar dos secretos diferentes, uno para NEON_AUTH_COOKIE_SECRET y otro para SESSION_SECRET:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Ejecutar ese comando una vez por secreto. Mantener FOUNDATION_ENABLED=false hasta terminar el siguiente paso.

## 2. Inspeccionar, respaldar y migrar
Antes de cambiar de panel, verificar en Neon las tablas public.npr_businesses, public.npr_customers, public.npr_movements, public.npr_reviews y public.npr_diagnostics. El nuevo esquema no las modifica. Si contienen datos reales, respaldarlos y definir una importación que preserve IDs, saldos, usuarios y consentimiento antes de activar FOUNDATION_ENABLED. No mezclar automáticamente la demo del navegador con cuentas reales.

Ejecutar las pruebas y la migración:

```bash
npm test
npm run typecheck
npm run db:migrate
```

El script valida el nombre de la base, aplica la transacción y agrega un marcador privado de versión. Una segunda ejecución con el mismo checksum no duplica tablas. Si hay un esquema previo distinto, se detiene; no borra ni sobrescribe.

La conexión de despliegue debe poder crear roles NOLOGIN y asignárselos a su usuario. El servidor cambia siempre al rol mínimo para cada consulta; no atiende solicitudes normales con privilegios administrativos.

## 3. Crear Café Demo
En .env.local configurar:

- SEED_OWNER_EMAIL: correo nuevo controlado por ti para las pruebas.
- SEED_OWNER_PASSWORD: contraseña de al menos 12 caracteres.
- SEED_STAFF1_PIN y SEED_STAFF2_PIN: PIN diferentes, de 6 a 8 dígitos.
- APP_URL: http://localhost:3000 para el primer recorrido.

Autorizar exactamente http://localhost:3000 en Trusted Domains de Neon Auth. Luego:

```bash
npm run db:seed
```

El script crea usuarios con la API de autenticación y usa sus UUID reales. Los meseros tienen cuentas internas y entran únicamente mediante PIN en la app. No publica contraseñas ni PIN; escribe sus identificadores en .private/demo-access.json, ignorado por Git. Si una creación de cuentas falla a mitad del proceso, queda un checkpoint privado para resolverlo sin duplicar cuentas. Un Café Demo ya existente no se vuelve a crear.

Confirmar el correo del owner si Neon lo requiere. Los 20 clientes empiezan con saldo cero; los puntos solo se generan al registrar visitas. Sus teléfonos son ficticios. Para probar aislamiento completo, registrar otro owner y otro negocio desde /acceso y /panel, como describe el script manual.

## 4. Activar roles y administración
Cambiar FOUNDATION_ENABLED=true en .env.local. Iniciar:

```bash
npm run dev
```

Registrar tu cuenta administrativa en /acceso y confirmar el correo. Obtener su UUID desde neon_auth."user" en la base independiente; configurar ADMIN_USER_ID en .env.local y ejecutar:

```bash
npm run db:admin
```

Este es un comando de infraestructura, no una opción pública del sitio. Nunca asignar superadmin por el correo escrito en un formulario.

## 5. Rutas
| Ruta | Acceso |
|---|---|
| /acceso | Correo/contraseña; registro, recuperación y confirmación de Neon Auth |
| /entrar | Verifica la sesión y dirige al panel del rol real |
| /admin | Superadmin: estados, pagos manuales, reportes y auditoría |
| /panel | Owner: sus negocios, clientes, programa y reportes |
| /staff/acceso | Negocio + UUID del mesero + PIN |
| /staff | Staff: clientes de su negocio, visitas y canjes |
| /b/[slug] | Cliente sin login; registro con consentimiento o consulta por token |
| /demo | Demo local separada de la base real |

El proxy usa un indicador de rol firmado para orientar las redirecciones. No sirve para autorizar una operación: páginas y acciones vuelven a verificar identidad, rol y membresía en el servidor. Cambiar una URL o enviar otro businessId no concede acceso.

Un mesero desactivado o con PIN modificado pierde el acceso de su sesión en la siguiente operación. Las sesiones del mesero duran 8 horas. Cuenta y origen tienen límite de 5 intentos cada 15 minutos. La cuenta de propietario/superadmin usa las sesiones de Neon Auth.

La tarjeta de cliente usa un token de 32 bytes; solo su SHA-256 queda en la base. Se guarda en cookie HttpOnly, Secure en producción, SameSite=Lax. Un teléfono coincidente no recupera la cuenta sin prueba de identidad. El owner puede crear un nuevo acceso, entregarlo al cliente y revocar el anterior. Esos enlaces son privados y no se comparten públicamente.

## 6. Desplegar en Vercel
1. Crear un proyecto independiente desde archundia222/Nival-puntos-rese-as-. Raíz del repositorio, framework Next.js, Node.js 22 o 24.
2. Usar la rama de esta entrega para Preview. No conectar este código al proyecto de Nival Pay.
3. Configurar DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, SESSION_SECRET, FOUNDATION_ENABLED=true y APP_URL en el ambiente Preview. Repetir con valores de producción cuando corresponda. Ninguna variable secreta tiene prefijo NEXT_PUBLIC_. No cargar las variables SEED_* ni ADMIN_USER_ID en Vercel.
4. En Neon Auth, agregar a Trusted Domains el dominio exacto del despliegue, además del dominio definitivo. Cambiar APP_URL al dominio usado. Para pruebas consistentes, usar un dominio Preview estable; autorizar cada origen exacto si cambia.
5. Desplegar. Esperar READY y revisar logs. Ejecutar el script manual con cuentas reales de prueba y dos negocios.
6. Solo después de completar el recorrido publicado, integrar la rama en main y usarla en el proyecto de producción independiente.

No se ejecutan migraciones ni seed automáticamente durante npm run build. Esto evita mutaciones de base en cada despliegue Preview.

## 7. Alcance y límites
- Cobro manual: registrar pago en /admin actualiza vigencia y estado en la misma transacción. Estado activo sin vigencia no permite registrar visitas.
- Historial append-only: ni owner, staff ni superadmin funcional pueden editar, borrar o truncar point_ledger. Correcciones mediante entradas adjust del administrador.
- Canjes crean una fila pendiente automáticamente. La revisión de fotos, aprobación y reversión transaccional necesita el siguiente flujo de operación; no hay almacenamiento de fotos configurado todavía.
- single permite el primer premio activo; choose exige una meta elegida y bloqueada por el cliente; sequence exige el siguiente premio no canjeado. Las reglas se comprueban en la base.
- El panel muestra hasta 200 clientes para registrar movimientos y hasta 50 para administrar accesos; búsqueda de teléfono exacto consulta todo el negocio. Administración muestra los 100 negocios más recientes; paginación amplia corresponde al desarrollo siguiente.
- site_content, tareas, consejos y códigos de activación tienen esquema y permisos; los editores y el consumo de códigos aún no se exponen en la app base.
- FOUNDATION_ENABLED=false conserva los paneles reales anteriores. Al activarlo, las escrituras del backend anterior se bloquean. Las tablas antiguas siguen intactas para permitir una importación revisada.
- Se integró Tailwind junto con los estilos actuales; se omitió Preflight para conservar la presentación de las rutas de demo.

## Referencias
- https://github.com/neondatabase/neon-js/blob/main/packages/auth/NEXT-JS.md
- https://nextjs.org/docs/app/getting-started/proxy
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://vercel.com/docs/git
