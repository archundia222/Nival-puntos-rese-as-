# Nival Puntos + Reseñas

Proyecto independiente de Nival Pay, Nival Tech y Nival Links. La operación de Google es manual; no usa Google Business Profile API.

## Backend activo
Neon Free: proyecto `soft-waterfall-47553388`, rama `br-billowing-bonus-b8ln5fvm`, base `nival_puntos_resenas`. Managed Better Auth habilitado con correo y contraseña. `database/neon.sql` ya se aplicó en esta base nueva. No volver a ejecutarlo ni aplicarlo a otros proyectos.

## Desarrollo
```bash
npm install
npm run dev
```
Configurar las variables de `.env.example` en `.env.local` y en el proyecto de alojamiento independiente. Ninguna clave privada lleva prefijo `NEXT_PUBLIC_`. El archivo local de credenciales está ignorado por Git.

## Funciones
- `/acceso`: registro, inicio de sesión, solicitud de recuperación y reenvío de verificación con Neon.
- `/panel`: crear negocio, registrar y buscar clientes, sumar visitas, canjear premios y configurar recompensas.
- `/panel/nival`: captura manual de reseñas de Google, confirmación de respuestas publicadas y diagnósticos. Requiere permiso en `npr_operators`; nadie se asigna ese permiso desde la web.
- `/panel/reporte`: resumen mensual por negocio, comparación de diagnósticos e impresión. Usa horario de Ciudad de México; el promedio de reseñas capturadas no es la calificación global de Google.
- `/opinar/[id]`: enlace compartible al destino Google del negocio, con activación y desactivación. No filtra visitantes por calificación.
- `/tarjeta/[token]`: consulta de puntos y recompensa con enlace único, desactivable y reemplazable. No publica nombre ni teléfono del cliente. No suma puntos al abrirla.
- Las rutas de demostración conservan datos solo en el navegador. No se migran automáticamente a cuentas reales.

## Separación y permisos
`lib/backend/query.ts` ejecuta consultas parametrizadas en una transacción por solicitud con rol y contexto locales. Los clientes no reciben la conexión de PostgreSQL. `npr_app` usa el UUID de la sesión verificada; `npr_anon` solo lee enlaces de reseñas activos; `npr_card_reader` solo lee una tarjeta activa cuyo token coincide. RLS se aplica en PostgreSQL incluso si se modifica el formulario.

## Verificación
```bash
node --test tests/*.cjs tests/neon-database.test.mjs
npx tsc --noEmit
npm run build
```
Las pruebas de esquema usan PostgreSQL embebido con cuentas ficticias. Comprueban aislamiento, permisos de operador, visitas/canjes y revocación de tarjetas. No sustituyen el recorrido con correo, cookies y alojamiento reales.

## Activación del alojamiento
1. Crear el proyecto Vercel `nival-puntos-resenas` desde `archundia222/Nival-puntos-rese-as-`, raíz del repositorio, Next.js.
2. Configurar `DATABASE_URL`, `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET` como valores privados.
3. Agregar el dominio exacto de producción a Trusted Domains en Neon Auth. El proyecto permite localhost para desarrollo.
4. Probar registro, acceso, cierre de sesión y recuperación. El servicio de correo compartido de Neon está configurado; la entrega real todavía debe comprobarse.
5. Registrar la cuenta del operador y agregar su UUID verificado a `npr_operators` mediante la administración de esta base nueva. No basar ese permiso en un correo sin verificar.
6. Probar dos negocios, búsqueda, puntos, canje, captura de reseñas, diagnóstico, resumen y páginas públicas antes de recibir datos reales.

## Estado actual del cimiento
La arquitectura aprobada usa Neon y Neon Auth existentes. `database/foundation-neon.sql` está aplicado al esquema `nival_pr`, sin modificar `public.npr_*` ni otros productos. Incluye RLS, historial inmutable, auditoría de estados y roles superadmin/owner/staff/cliente por token.

Seed remoto creado: Café Demo, owner, dos meseros y 20 clientes. Un segundo negocio permite verificar aislamiento. Las 39 pruebas, typecheck y build pasaron; correo y PIN se comprobaron contra Neon real.

Código en la rama `feature/cimiento-neon-roles`. Preview READY: https://nival-puntos-resenas-241loqm2n-nival-tech.vercel.app . Producción pendiente de aprobación explícita para sustituir el despliegue activo. Falta registrar y verificar la cuenta real del superadmin.

Guía: [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md). Pruebas manuales: [docs/PRUEBAS-MANUALES.md](docs/PRUEBAS-MANUALES.md). Evidencia y límites: [docs/VALIDACION.md](docs/VALIDACION.md).

Los SQL anteriores de Supabase son históricos: no aplicarlos en Neon. No ejecutar el cimiento en bases de otros productos.

## Fase 3 — Nival Puntos

Implementación en Neon de la tarjeta `/b/{slug}`, escáner `/staff`, fotos privadas de evidencia y configuración del owner en `/panel/puntos`. Detalles y aceptación: [docs/PUNTOS-FASE3.md](docs/PUNTOS-FASE3.md). Las tres migraciones incrementales de puntos ya se aplicaron en la base independiente; el código de esta fase está preparado localmente y pendiente de autorización para publicarlo en GitHub público/Preview. No volver a ejecutar el cimiento ni utilizar bases de Nival Pay o Nival Links.

### Fase 4 · panel del dueño (Neon)

`/panel` incluye Resumen, Google y Clientes. `/admin` carga los reportes y el dueño los consulta con RLS. Hay umbrales por negocio, 15 consejos, contacto individual editable por WhatsApp y comparación de periodos de México. Consulta [la documentación](docs/PANEL-FASE4.md) y prueba `/demo/panel` con 20 clientes ficticios.
