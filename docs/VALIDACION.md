# Evidencia de validación

Validación local, 5 de octubre de 2026. Incluye pruebas locales contra la base remota y un despliegue Preview READY.

- El DDL del nuevo esquema se ejecutó en PostgreSQL embebido con Neon Auth simulado.
- La suite completa pasó 39 pruebas. Comprueba dos negocios, owners distintos, staff, cliente por token y superadmin.
- Se comprobó que owner no puede asignarse superadmin ni consultar datos de otro negocio.
- Staff no puede leer pagos, reportes, auditoría, teléfono o hash del token del cliente.
- UPDATE/DELETE/TRUNCATE del historial están bloqueados incluso con los triggers activos y el rol de infraestructura usado en tests.
- El cambio de estado produce auditoría con actor y estados; un UPDATE al mismo estado no crea otro registro.
- Los PIN se validan con scrypt y comparación de tiempo constante; hashes con sal aleatoria. Se validan límites de intentos y revocación por cambio de PIN.
- Se comprobó revocación del token cliente; la inscripción con teléfono existente no concede acceso.
- Se ejecutaron typecheck y compilación de producción.
- Se revisaron los chunks JavaScript públicos para descartar variables privadas y los marcadores de secretos de prueba usados al compilar. No se usaron secretos reales en estas pruebas.
- Un servidor de producción de prueba respondió 200 en /demo, /acceso, /staff/acceso y /b/cafe-demo con el nuevo cimiento desactivado; /panel redirigió 307 a /acceso.
- La verificación visual en navegador quedó bloqueada: agent-browser no está instalado y la descarga de Chromium para Playwright devolvió archivos inválidos. No se declara verificación visual aprobada.
- Migración aplicada a Neon real: 19 tablas funcionales y tablas privadas, con RLS. El backend anterior permanece intacto.
- Seed remoto: Café Demo, owner, dos meseros y 20 clientes ficticios; segundo negocio y owner para aislamiento.
- En Neon real: owner A no lee clientes B; staff no lee pagos/reportes; DELETE del ledger bloqueado; cambio de estado deja auditoría (prueba revertida).
- Con servidor local y Neon real: correo/contraseña owner abre /panel; owner no entra a /admin. PIN staff devuelve 303, abre /staff y rechaza /admin. Se comprobaron cookies HttpOnly y datos del seed.
- Preview Vercel READY: https://nival-puntos-resenas-241loqm2n-nival-tech.vercel.app . La protección SSO impidió verificar sus páginas mediante la conexión disponible.
- Publicación en producción pendiente de autorización explícita: la revisión automática rechazó reemplazar el despliegue activo. No se modificó producción.
- Pendiente registrar y verificar la cuenta real del superadmin y ejecutar el bootstrap documentado. No se asignan privilegios por un correo sin verificar.
