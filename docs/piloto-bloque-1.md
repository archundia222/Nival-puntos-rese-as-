# Bloque 1 — Registro y cotización

Base: feature/google-wallet-v5, dc87f56. Rama de trabajo: feature/piloto-bloque-1.

## Cambios
Formulario compartido en el primer negocio y en «Registrar otro negocio». Campos obligatorios: negocio, enlace, giro, dueño, teléfono mexicano, correo y enlace HTTPS de Google Maps. Valida en servidor y normaliza teléfono a 52 + 10 dígitos. Consentimiento obligatorio con enlaces a /terminos y /privacidad.

Registro completo mediante función SQL con datos, membresía, plan y bitácora de aceptación en una misma transacción. Revoca el acceso de autenticación a la función antigua para impedir que se omitan los campos obligatorios. No modifica el archivo histórico foundation-neon.sql ni su checksum.

El panel del dueño y el administrador comparten el generador de WhatsApp que incluye todos los datos, Google Maps, ID y plan. La landing dirige al panel/registro para obtener un ID real antes de cotizar. /registro dirige al panel cuando el cimiento está habilitado; la demostración anterior permanece disponible cuando no lo está.

## Evidencia automática
Antes de editar: npm test, 59/59, cero fallos.
Después: npm test, 62/62, cero fallos.
Nuevas pruebas: validación de todos los campos y consentimiento; mensaje WhatsApp decodificado con todos los datos; registro SQL real en PGlite con persistencia, membresía, plan, bitácora, rechazo sin aceptación y rechazo del acceso a la función antigua.
TypeScript y next build: aprobados.

## Activación pendiente
No se aplicó SQL en Neon, no se modificaron variables ni se desplegó producción. Aplicar database/registration-pilot.sql únicamente en la base independiente nival_puntos_resenas antes de habilitar esta versión. Probarlo primero en una rama/base de Preview separada. No ejecutar foundation-neon.sql sobre una base existente.

Los términos son un aviso provisional y privacidad conserva el documento anterior marcado como borrador. El contenido legal completo y su publicación se realizarán en el bloque 2. No iniciar el piloto con datos reales hasta completar esa dependencia.

## Pruebas manuales cuando exista Preview con la migración
1. Entrar desde «Cotizar o activar por WhatsApp», crear cuenta e iniciar sesión.
2. Registrar el negocio con todos los campos; probar datos faltantes, teléfono/correo/Maps inválidos y casilla sin aceptar.
3. Abrir ambos enlaces legales y regresar sin perder el formulario.
4. Registrar y abrir WhatsApp en el panel inactivo: verificar destinatario 525539044788 y todos los datos, ID y plan; enviar tú el mensaje y confirmar su recepción.
5. Como administrador, abrir la cotización del mismo negocio y comparar datos.
6. Registrar un segundo negocio desde el panel y comprobar el mismo formulario.
7. En teléfono físico, revisar campos, lista de giros, teclado de teléfono y correo y apertura de WhatsApp.
