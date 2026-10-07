# Bloque 2 — Documentos legales y consentimiento

## Implementación
/terminos y /privacidad contienen borradores completos para negocios con clientes recurrentes. Los cuatro datos de Nival quedan como [RAZÓN SOCIAL], [RFC], [DOMICILIO] y [CORREO]. Cada negocio debe informar su propia identidad, domicilio y canal de derechos antes del registro de clientes.

/admin permite guardar borrador y publicar términos, privacidad y texto breve de consentimiento. Las páginas y la tarjeta solo leen la versión publicada o, mientras no exista, el borrador inicial claramente identificado. Guardar no publica. El editor impide quitar la advertencia de revisión legal en esta fase. Corregida una consulta existente que necesitaba convertir explícitamente el texto a PostgreSQL text.

Enlaces en registro del negocio, tarjeta/registro del cliente, landing y panel del dueño. Marketing separado en casilla opcional y desmarcada. La migración legal-pilot.sql agrega autorización y fecha, preserva el consentimiento operativo y mantiene RLS. Los clientes antiguos quedan sin autorización comercial por defecto. El panel del dueño solo habilita el enlace de WhatsApp comercial para quienes lo autorizaron. La autorización no implica envío automático.

## Evidencia
Suite original: 59/59 antes de modificar. Bloque 1: 62/62. Bloque 2: 65/65, sin fallos.
Tres pruebas nuevas: cobertura de contenido, advertencia y lectura solo de publicación; ejecución de acciones reales de borrador/publicación con base PostgreSQL embebida, bitácora y rechazo de owner; consentimiento comercial opcional, persistencia, fecha y aislamiento entre negocios.
TypeScript, next build y git diff --check aprobados.

## Fuentes oficiales consultadas
- Ley vigente, Cámara de Diputados: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf (reforma indicada 14-11-2025). Aviso: artículo 15. Derechos y plazos: artículos 28 a 34; días hábiles definidos en artículo 2.
- Política Google Maps: https://support.google.com/contributionpolicy/answer/7400114?hl=es . Sin incentivos por reseñas ni selección de clientes satisfechos.

Son borradores para revisión legal; no se certifica cumplimiento por pruebas de software.

## Dependencias pendientes del piloto
Completar identidad y contactos reales de Nival y del negocio. Confirmar proveedores, países y política de conservación. Verificar técnicamente los 7 días de gracia en solo lectura, ventana de exportación y procedimiento de cancelación; el texto los declara pendientes. No se implementó exportación ni gestión automática de bajas comerciales en este bloque. Si un cliente pide BAJA, tramitar manualmente la revocación con personal autorizado antes de cualquier nuevo contacto; se puede retirar el consentimiento mediante consent_customer_legal con el token vigente del propio cliente. Falta un control dedicado de bajas desde el panel.

No se aplicó SQL en Neon ni se cambiaron variables ni se desplegó producción. Antes de probar esta rama en Preview, aplicar en una base separada registration-pilot.sql y legal-pilot.sql sobre el esquema que ya incluye las migraciones de puntos y panel. No volver a ejecutar foundation-neon.sql en una base existente.

## Pruebas manuales
1. En Preview, como superadmin, guardar un cambio legal sin publicar. En otra sesión comprobar que /terminos o /privacidad mantiene su versión anterior.
2. Publicar y comprobar el texto actualizado sin iniciar sesión. Abrir también el texto breve en el registro de la tarjeta.
3. Probar que un dueño no accede al editor legal; revisar los enlaces en landing, registro de negocio, tarjeta y panel.
4. Registrar un cliente sin marcar mensajes comerciales: tarjeta funciona y el dueño no tiene el enlace comercial habilitado. Registrar otro con autorización: enlace habilitado.
5. En teléfono, revisar legibilidad de ambos documentos, casillas y retorno al formulario.
6. Completar campos del responsable y revisión legal antes de publicar una versión operativa para negocios reales.
