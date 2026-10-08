# Paneles y servicio · 8 de octubre de 2026

- Base: mismo árbol que producción a818a1f. Landing conservada; oferta Esencial actualizada a cero respuestas.
- Administrador: vistas independientes, menú con desplazamiento propio, expediente elegido explícitamente, estado por vigencia, tareas automáticas y testimonios en tres pasos con publicación individual. Editor general del sitio y links cortos retirados del panel.
- Negocio: navegación por rol, Programa de puntos separado de personal, QR para inscripción explicado, selección de los tres planes y Google histórico disponible en Solo Puntos.
- Personal: sumar puntos, canjear premios y consultar solo su actividad; historial y totales propios.
- $299: puntos activos; Google y reportes anteriores en solo lectura.
- $399: puntos, diagnóstico y seguimiento; ninguna respuesta manual incluida.
- $499: mismo seguimiento, con cupo de 100 respuestas por cada 30 días.
- Vencido o cancelado: sin consulta operativa ni nuevas operaciones; datos retenidos. Aviso 7 días antes del vencimiento; sin gracia operativa.
- Cambios de plan: efectivos al guardar el plan confirmado por Nival; cobro manual y vigencias de 30 días. No se borran puntos, clientes ni reportes. No se programan cambios futuros sin una nueva confirmación de pago.
- Cloudflare: carga al volver al formulario, reintento visible, botón bloqueado sin verificación y token nuevo tras errores. La comprobación humana final requiere interacción manual.

Validación: 140 pruebas automáticas; integración PostgreSQL de 499 → 399 → 299 → vencimiento → reactivación, deduplicación de tareas y conservación del historial; TypeScript, compilación y audit sin vulnerabilidades. Migración service-access-v3 probada en rama Neon de QA antes de aplicación.

Publicación: autorización recibida y cambios publicados en producción. La consulta de orden de reseñas se corrigió en dcfd3f5. El dominio habitual es https://nival-puntos-resenas.vercel.app; APP_URL apunta a ese dominio y el alias alternativo redirige a él para evitar el rechazo de Turnstile.
