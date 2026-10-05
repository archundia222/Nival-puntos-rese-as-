# Nival Puntos — Fase 3

La base de datos, sesiones y fotos privadas están en Neon. No se requiere Supabase. Las fotos se guardan como `bytea` en el esquema privado con límite de 3 MB; se entregan únicamente al owner del negocio desde una ruta autenticada, sin caché ni URL pública. Esta decisión mantiene el stack solicitado y permite reemplazar después el almacenamiento con un adaptador dedicado si aumenta el volumen.

## Funciones

- `/b/{slug}`: alta con nombre, teléfono mexicano +52, consentimiento y aviso de privacidad. Token aleatorio de 256 bits en cookie HttpOnly, Secure en producción, SameSite=Lax y vigencia anual; únicamente su SHA-256 en Neon, con caducidad en servidor.
- Tarjeta con marca, logo, color, nombre del programa, progreso, QR personal y seis últimos movimientos. Consulta actualizaciones cada seis segundos mientras la pestaña está visible. Respeta movimiento reducido.
- Modos: single toma el primer premio; choose bloquea elección hasta canjear; sequence recorre los premios activos ordenados y reinicia el ciclo.
- `/staff`: acceso con UUID y PIN individual derivado con scrypt, escáner de cámara con ZXing y búsqueda exacta por teléfono. Servicio instalable sin caché de información privada. Recuperación con enlace de un solo uso de 15 minutos al WhatsApp registrado, que exige confirmar la identidad y revoca el token anterior al consumirse. No envía mensajes automáticamente.
- Visitas: libro inmutable, actor auditado, reglas y serialización por cliente en PostgreSQL. Nuevos programas: seis horas mínimas y una visita por día de Ciudad de México. Reglas existentes se preservan.
- Canje: foto obligatoria, firma de archivo validada en servidor, confirmación y movimiento asociado. La foto se vincula al negocio, cliente y actor. No se aceptan rutas de fotos arbitrarias enviadas por el navegador.
- `/panel/puntos`: programa y logo, creación y edición de premios sin modificar metas bloqueadas, meseros con desactivación inmediata, revisión de canjes y reversión mediante un ajuste compensatorio único. Revertir canjes en orden desde el más reciente conserva la secuencia. QR SVG con zona libre y cartel imprimible con logo mediante guardar como PDF.

## Migración

`database/points-neon.sql` es incremental y no debe ejecutarse sobre otras bases. `node --env-file=.env.local scripts/migrate-points.mjs --apply`, seguido por el mismo comando con `--lifecycle` y luego `--legacy-phones`, verifica nombre de base y checksum en schema_versions. No volver a ejecutar foundation-neon.sql.

Las identidades de meseros nuevos son exclusivamente de PIN, sin cuenta de correo. Un trigger conserva la validación del UUID de Neon Auth para perfiles owner/superadmin. Ningún rol de aplicación recibe acceso directo a fotos, hashes o recuperaciones; las funciones privadas verifican membresía y alcance antes de operar.

## Validación

51 pruebas automáticas pasaron, incluidas nueve nuevas pruebas de PostgreSQL para registro/caducidad, límites, evidencia obligatoria, choose/desbloqueo/reversión, sequence cíclico, aislamiento de fotos/clientes, baja inmediata de staff recuperación de un solo uso y compatibilidad con teléfonos de diez dígitos anteriores. TypeScript y compilación de producción pasaron.

Las comprobaciones HTTP contra la aplicación real verificaron: formulario de registro que emite cookie HttpOnly/Secure anual, reingreso directo, formulario choose bloqueado, acceso real con PIN y render del escáner, visita, rechazo duplicado, foto requerida, canje con bytes privados guardados en Neon, recuperación click-to-chat, rechazo de origen ajeno y revocación inmediata. Estas comprobaciones usaron datos sintéticos y no enviaron WhatsApp.

Pendiente de publicar el código y la prueba física con dos celulares. La revisión automática rechazó el push al repositorio público por considerar que la autorización para implementar no incluye publicar este código. La rama remota aún conserva las Fases 1 y 2; la Fase 3 está en los commits locales preparados para subir tras autorización. Las pruebas automatizadas y sesiones de navegador no sustituyen comprobar cámara, instalación y reingreso en teléfonos reales.

## Prueba física de aceptación

1. Owner: `/panel/puntos`, crear programa y dos premios; para la prueba puede poner un premio de un punto, modo choose, seis horas y una visita al día. Crear un mesero con PIN y copiar su identificador.
2. Celular cliente: abrir `/b/{slug}`, registrarse, elegir premio, cerrar y reabrir el enlace en el mismo navegador. Debe entrar directo sin formulario.
3. Celular mesero: abrir `/staff/acceso`, ingresar negocio, identificador y PIN; permitir cámara y escanear el QR del celular cliente. Registrar una visita y confirmar nombre/puntos. Repetir: se rechaza.
4. Sin foto, el botón de canje queda deshabilitado y una solicitud directa al servidor se rechaza. Adjuntar evidencia y confirmar: el canje termina, los puntos se descuentan y el cliente puede elegir de nuevo.
5. Owner: ver la foto, aprobar o revertir. La reversión restituye puntos sin borrar historial. Otro owner no puede leer la evidencia ni los clientes.
6. Desactivar al mesero desde el owner y repetir una acción sin cerrar la sesión del mesero: se deniega.
7. Recuperación: solicitar nuevo acceso desde el mesero y abrir el enlace en otro navegador; el anterior deja de consultar la tarjeta. Volver a usar el enlace de recuperación: se rechaza.
8. PWA: instalar desde Chrome en Android o Safari Compartir en iPhone. Comprobar cámara y conectividad; sin internet no se registran movimientos.
