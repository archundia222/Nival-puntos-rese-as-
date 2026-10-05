# Nival Puntos + Reseñas

MVP independiente de Nival Tech para validar manualmente un servicio combinado de lealtad y reseñas.

## Principios de esta versión
- Proyecto separado de Nival Pay y Nival Links.
- Operación manual primero.
- Sin dependencia de Google Business Profile API en el MVP.
- Automatización e integraciones se dejan para una fase posterior, después de validar ingresos y operación.

## Desarrollo
```bash
npm install
npm run dev
```

## Estado del prototipo
- Guarda datos solo en el navegador; no hay autenticación real ni sincronización entre dispositivos.
- No usar datos de clientes reales hasta conectar almacenamiento compartido y permisos por negocio.
- Perfil de negocio, clientes, historial de visitas y canjes, clientes en riesgo (30 días configurable).
- Captura manual de reseñas, clasificación positiva/neutral/negativa y confirmación de respuesta publicada en Google.
- Resumen mensual calculado desde los registros, con descarga JSON.
- Conserva clientes y puntos anteriores; no inventa fechas de visitas faltantes. Los reportes anteriores siguen guardados.
- Las rutas de demostración son públicas y usan datos locales; el panel real del operador en `/panel/nival` requiere permisos verificados.

## Verificación
```bash
node --test tests/metrics.test.cjs tests/monthly-report.test.cjs tests/database.test.mjs
npx tsc --noEmit
npm run build
```

## Siguiente fase
1. Backend independiente, cuentas reales y aislamiento por negocio; sin reutilizar recursos de Nival Pay.
2. Panel privado de Nival con bandeja global, diagnóstico manual y comparación de competencia.
3. Activar y verificar tarjetas de puntos en el despliegue independiente.
4. Despliegue de prueba y recorrido móvil completo antes de admitir clientes reales.
5. Integración de Google Business Profile después de validar ingresos, según la instrucción del dueño.


## Backend independiente preparado (aún sin activar)
- `/acceso`: registro y login con Supabase Auth.
- `/panel`: negocio autenticado, clientes, búsqueda por nombre/teléfono, visitas, canjes con confirmación y recompensa. Última visita con horario de Ciudad de México.
- `/panel/nival`: captura de reseñas por operador, bandeja de todos los negocios.
- `database/diagnostics.sql`: diagnóstico manual con historial, lectura por negocio y escritura exclusiva del operador. Aplicar después de `bootstrap.sql` en la base independiente.
- `/panel/reporte`: resumen mensual privado por negocio, selección de mes e impresión para guardar PDF. Cuenta visitas con horario de Ciudad de México; el promedio corresponde solo a reseñas capturadas, no a la calificación global de Google. Los meses anteriores reflejan el estado actual del historial, no una instantánea congelada.
- `database/bootstrap.sql`: esquema nuevo con RLS, permisos por columna, puntos no negativos e historial protegido contra modificaciones.
- Las rutas reales requieren las variables de `.env.example`. Si faltan, el acceso explica que está pendiente y ofrece la demo.
- Las rutas de demostración conservan sus datos locales. No se migran automáticamente datos de navegador a cuentas reales.

### Activación pendiente
1. Reactivar y revisar el proyecto de pruebas antes de aplicar el SQL. No ejecutar el esquema en bases existentes de Nival Pay, Nival Tech o Nival Links.
2. Revisar tablas existentes y confirmar que los nombres `npr_*` no estén ocupados. Aplicar `database/bootstrap.sql` una sola vez en el proyecto independiente.
3. Configurar URL y clave publicable del proyecto separado, redirecciones de Auth y el correo de confirmación. La plantilla de confirmación debe apuntar a `/auth/confirm?token_hash={{ .TokenHash }}&type=signup` en el dominio del nuevo sitio. Verificar envío de correos antes de vender.
4. Dar permisos al operador insertando su UUID verificado de Auth en `npr_operators` desde la administración de la base; nadie puede darse ese permiso desde la web.
5. Aplicar `database/diagnostics.sql` y probar diagnóstico y comparación entre revisiones. No se conecta a la API de Google.
6. Probar registro, confirmación, login, separación entre dos negocios, visita, canje, captura y lectura de reseñas en la base real.

### Pruebas de permisos sin tocar bases externas
`node --test tests/database.test.mjs` ejecuta el esquema en PostgreSQL embebido con usuarios ficticios. Comprueba aislamiento de negocios, bloqueo de autopromoción a operador, permisos de reseñas y canjes sin saldo. No sustituye la prueba de conexión, correo y cookies contra Supabase real.

## Enlaces públicos de reseñas preparados
- `database/review-links.sql`: aplicar después de `bootstrap.sql` únicamente en la base independiente.
- El dueño configura el nombre público y el enlace de «Pedir reseñas» en `/panel`, copia su página `/opinar/[id]` y puede desactivarla sin cambiar el QR.
- La página pública ofrece el mismo acceso a Google para todos; no selecciona visitantes según su calificación ni registra una reseña por abrir el enlace.
- Se publica exclusivamente nombre y destino Google. Los teléfonos, puntos, historiales y datos privados permanecen protegidos.
- Enlaces admitidos: `g.page/r/.../review`, `maps.app.goo.gl/...` y `search.google.com/local/writereview?placeid=...`. El dueño debe comprobar que el enlace corto lleve a su ficha antes de imprimir.
- Esta función está preparada en código; requiere activar la base, aplicar el SQL y verificar el flujo en el despliegue independiente.

## Tarjetas de puntos del cliente preparadas
- Aplicar `database/customer-cards.sql` después de `bootstrap.sql` en la base independiente. No cambia datos de los proyectos existentes.
- Configurar `SUPABASE_SECRET_KEY` solo en el servidor del nuevo sitio. Nunca usar prefijo `NEXT_PUBLIC_` para esta clave, ni incluirla en Git.
- El negocio activa la tarjeta por cliente, copia `/tarjeta/[token]`, la desactiva o genera otro enlace para revocar el anterior. Nace desactivada.
- El enlace funciona como llave de consulta: quien lo tenga verá únicamente nombre del negocio, puntos y premio; no nombres de clientes, teléfonos ni historial.
- La consulta no registra visitas ni canjes. El saldo se calcula desde movimientos, no desde datos enviados por el visitante.
- La ruta no se indexa y no envía el enlace como referencia a otras páginas. Incluye cabeceras privadas sin caché; verificar también el despliegue antes de compartir tarjetas reales.
- Pruebas locales cubren permisos, desactivación, rotación y límites de recompensa; sigue pendiente el recorrido en Supabase y alojamiento reales.

## Recuperación de acceso preparada
- `/acceso` incluye recuperación de contraseña y reenvío de confirmación; las respuestas no confirman si un correo está registrado.
- `/auth/confirm` valida OTP de tipo `signup` o `recovery`, o intercambia códigos PKCE. Sus destinos son fijos; ignora redirecciones arbitrarias.
- `/restablecer` exige una sesión verificada antes de mostrar el cambio de contraseña. Los enlaces caducados permiten solicitar uno nuevo.
- Configurar Site URL del proyecto independiente al dominio nuevo y permitir `/auth/confirm` y `/auth/confirm?flow=recovery` en Redirect URLs.
- Plantilla «Confirm signup»: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirmar mi cuenta</a>`.
- Plantilla «Reset password»: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Cambiar contraseña</a>`.
- No cambiar las plantillas ni la configuración de Auth de las aplicaciones existentes. Todavía se requiere verificar entrega real de correos, enlaces y cookies cuando se active la base independiente.
