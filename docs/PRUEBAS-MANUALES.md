# Script de pruebas manuales — ejecutar después de implementar y preparar el seed

Estas pruebas son el criterio de aceptación, no resultados ya aprobados. Utilizar solo base de prueba independiente. Preparar Café Demo con owner A y staff A1/A2, otro negocio con owner B y staff B1, y 20 clientes ficticios del Café.

1. **Owner aislado.** Abrir dos perfiles de navegador. Iniciar sesión como A y B. A debe ver únicamente Café Demo. Cambiar UUID/slug en URL y formulario por el negocio B: respuesta 403/404 o lista vacía, sin datos B. Repetir para clientes, puntos, pagos, informes, objetivos y canjes. Probar también consultas SQL con rol npr_v2_owner y UUID A en una transacción: SELECT del negocio B devuelve cero filas. No ejecutar con el rol administrativo de infraestructura.
2. **Staff limitado.** Entrar con PIN A1. /staff muestra solo Café. Visitar /admin, /panel, finanzas y reportes: acceso denegado/redirección. Solicitar endpoints directamente: 403. Con rol npr_v2_staff, SELECT de payments/review_reports falla por falta de privilegios. SELECT de customers.phone y memberships.pin_hash también debe fallar. Inactivar membresía y repetir: sesión pierde permisos en la siguiente operación.
3. **Historial inmutable.** Registrar visita válida. Intentar UPDATE, DELETE y TRUNCATE de point_ledger como owner, staff y superadmin funcional: falla y conserva el movimiento. Probar la protección de auditoría igual. No deshabilitar triggers.
4. **Saldo y simultaneidad.** Comparar point_balance con SUM(points). Intentar canje sin saldo: falla. Intentar insertar visita con 1000 puntos: falla si el programa da 1. Mandar dos visitas simultáneas: se acepta una según separación temporal. Mandar dos canjes simultáneos con saldo para uno: solo uno se acepta. Un premio de otro negocio debe fallar. Doble reversión del mismo movimiento debe fallar.
5. **Auditoría.** Como superadmin, cambiar Café de registrado a activo. Ver audit_log: business_id, actor_id, estado anterior, nuevo y fecha correctos. Repetir UPDATE al mismo estado: no crea registro adicional. Revertir transacción de cambio: no conserva auditoría de un cambio que no ocurrió.
6. **Cliente por token.** Abrir tarjeta cliente 1 sin login: solo saldo/premios públicos. Cambiar customer_id al cliente 2: acceso denegado. Sin cookie/token no hay acceso. Rotar token: el anterior deja de funcionar. Nunca mostrar teléfono/nombre de otros clientes.
7. **Secretos.** Revisar DevTools Network, Sources y archivos JavaScript descargados. Buscar el valor real de DATABASE_URL, NEON_AUTH_COOKIE_SECRET y cualquier clave privada configurada: ninguno aparece. Revisar que no tengan prefijo NEXT_PUBLIC_. Revisar repositorio y logs; la prueba no se limita a ocultar cadenas en la interfaz.
8. **PIN y activación.** PIN incorrecto repetido dispara bloqueo temporal; mismo PIN en otro negocio no permite entrar. Una activación usada/expirada falla. Dos consumos concurrentes del mismo código permiten únicamente uno.
9. **Publicación y rutas.** Ver /admin, /panel, /staff, /b/[slug] y /demo en móvil y escritorio. Sesión expirada vuelve al acceso. /demo no escribe en negocio real. Modificar borrador de site_content no cambia página pública; publicar sí.
10. **Registro de resultados.** Anotar fecha, versión desplegada, rol, acción, resultado esperado/real y evidencia. Cualquier fuga de datos, inserción no autorizada o secreto expuesto impide aprobación.

## Resultado local de esta entrega
Las pruebas automáticas verifican los permisos SQL con dos negocios y usuarios independientes. El PIN usa scrypt con sal aleatoria, no texto plano. Los tests anteriores y nuevos se ejecutan con npm test.

Pendiente en remoto: conexión Neon, inspección/importación de datos existentes, aplicación de la migración, seed real, login correo/PIN y recorrido publicado en Vercel. No se confunden tests locales de PostgreSQL con pruebas reales de correo, cookies o despliegue.

El cliente no inicia sesión con contraseña: /b/cafe-demo identifica su cookie de tarjeta. Staff entra en /staff/acceso con negocio cafe-demo, UUID de .private/demo-access.json y el PIN privado del seed. Para owner/superadmin, usar /acceso.
