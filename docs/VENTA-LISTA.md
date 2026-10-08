# Diagnóstico y plan de ejecución — 7 de octubre de 2026

Base: fix/acceso-meseros-turnstile-preview, conservando el hero y las funcionalidades existentes. El backend vigente es Neon Auth + PostgreSQL; los archivos Supabase son legado, no se migran ni se aplican.

Existe: roles privados, RLS, libro inmutable de puntos, PIN del personal, fotos de canje, pagos manuales, códigos ligados al negocio, reportes guardados, PDF, segmentos, demo y Wallet. Falta comprobar el recorrido publicado con usuarios reales. Fallas encontradas: alta SQL de $299 rechazada; error de activación genérico y sin límite por cuenta; reportes ocultos al bajar de plan; permisos por vigencia dispersos; navbar no sticky y acceso admin visible; landing sin historia por scroll; incorporación pública del personal inexistente.

Orden: 1) autenticación y activación; 2) permisos centrales y conservación de historial; 3) navegación y móvil; 4) historia por scroll conservando hero; 5) dueño y personalización; 6) reseñas, empleados y cliente; 7) administrador; 8) demo, pruebas y documentación. Compilación, tipos y pruebas son requisito antes de avanzar. No modificar Nival Pay ni Nival Links.

Decisiones: permiso de administrador requiere identidad verificada y rol de base, nunca un registro público. Códigos ajenos no revelan el otro negocio. Las reseñas se solicitan sin premio; puntos solo por compra confirmada. Historial pertenece al negocio y permanece legible al vencer o bajar de plan.
