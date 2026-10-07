# Nival Puntos + Reseñas — operación v6

Decisiones del 6 de octubre de 2026 implementadas sobre el proyecto existente.

- Esencial: $399 MXN por 30 días, hasta 30 respuestas publicadas. Plus: $499 MXN por 30 días, hasta 100. No hay plan ilimitado.
- Primer pago confirmado no inicia la vigencia. El código se liga a ese pago y al negocio; su canje inicia los 30 días. Renovar durante la vigencia añade 30 días al vencimiento y no reinicia anticipadamente el cupo.
- Al vencer, los puntos, premios, informes y movimientos se conservan; la tarjeta se puede consultar. La base impide nuevas visitas y canjes.
- Tareas por negocio: diagnóstico inicial, dos revisiones semanales, resumen semanal, informe mensual y cobro. Incluyen nombre, identificador, teléfono, correo y enlaces al expediente.
- Importación de texto, JSON o capturas con OCR local en el navegador. El administrador verifica y completa datos inciertos antes de guardar. Deduplicación por autor, fecha, estrellas y texto normalizado.
- Diagnóstico de tres meses, informes semanales/mensuales: cifras de Google aportadas por el operador, reseñas por periodo, actividad de lealtad, temas, evidencia y recomendaciones. El análisis usa reglas transparentes, palabras y estrellas: no es una integración con un modelo de IA. No estima la calificación global a partir de la muestra.
- PDF creado por el servidor; borradores privados, aprobación explícita para publicar al dueño, marca de envío independiente. Envío manual por WhatsApp/correo; no hay envío automático de adjuntos.
- Respuestas propuestas con plantillas editables, publicación manual en Google, confirmación explícita posterior. Solo publicaciones confirmadas consumen cupo, con bloqueo por negocio en base de datos. Las respuestas no usadas no se acumulan; al agotarse el cupo quedan pendientes.
- Modalidades de premios existentes conservadas y añadida Sorpresa: pesos relativos configurables, asignación persistente por cliente. Los premios asignados no se pueden cambiar ni desactivar, y bloquean una transición de modalidad hasta entregarse. Se pueden crear otros premios. No hay migración automática de modalidades.
- Código manual de ocho dígitos, UUID en QR, solicitudes de puntos con identificador único. El intervalo por defecto de un minuto evita un doble clic; permite otra visita real más tarde el mismo día. Las reglas previamente personalizadas se conservan.
- Fotos de canjes privadas: se conserva el almacenamiento en la base existente cuando no hay R2 configurado. Si se configura R2, aplicar antes su migración existente. Ninguna foto ni token se expone sin permisos.

## Validación

Pruebas automatizadas sobre Postgres embebido: aislamiento, borradores invisibles, cupos, permisos, pago/activación, idempotencia, sorpresa persistente, protección de asignaciones y lectura al vencer. PDF de prueba generado y revisado visualmente. TypeScript, build y auditoría de producción se verifican antes del despliegue.

## Límites pendientes de infraestructura

- La verificación SMS propuesta requiere proveedor y configuración segura. Se conserva la recuperación por teléfono asistida por trabajador/dueño; no se afirma que exista OTP por SMS.
- Google Wallet tiene variables configuradas solo en Preview. No se modifica su configuración de producción sin credenciales cargadas de forma segura.
- No se puede certificar desde el contenedor el uso de NFC físico, cámara de cada celular, conexión móvil o la publicación en una cuenta real de Google.
