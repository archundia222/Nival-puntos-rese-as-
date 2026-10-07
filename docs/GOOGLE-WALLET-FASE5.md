# Google Wallet — fase 5

Implementación de Loyalty Class por negocio y Loyalty Object por cliente en Neon. IDs estables bajo el prefijo `puntos_`, separados de la clase demo de otras webs Nival. El QR es `NIVAL:<customer UUID>` y no es un token de acceso. Continúan las reglas de visitas y auditoría por mesero.

## Activación

El emisor anterior es `3388000000023196757`; la cuenta de servicio es `nival-tech-wallet@nival-tech-wallet.iam.gserviceaccount.com`. Los dos valores públicos están configurados en Preview de `nival-puntos-resenas`.

Falta agregar **GOOGLE_WALLET_PRIVATE_KEY** como Secret de servidor en Vercel, Preview. Vercel no permite exportar el Secret existente de `nival-tech-platform`. Usar la llave original guardada; no pegarla en chat ni en GitHub. Alternativa: `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON` con el JSON completo como Secret. Luego crear un nuevo deployment para cargar las variables.

Nunca usar NEXT_PUBLIC_ para la configuración Wallet. El código criptográfico se importa solo mediante `lib/wallet/server.ts`, con `server-only`. El frontend únicamente recibe el enlace JWT firmado; ninguna llave privada.

La cuenta de servicio ya debe tener permiso Developer en el emisor. No reutilizar `GOOGLE_WALLET_CLASS_SUFFIX`: cada negocio tiene su propia clase. El endpoint requiere cookie de cliente válida, negocio activo y comprobación de Origin. Ignora IDs de cliente enviados por el navegador.

Logo público: `/api/wallet/logo/{slug}` entrega el logo del programa (PNG/JPEG/WebP inline, redirección a HTTPS si es externo), o genera un monograma PNG. No publica información de clientes. La URL pública proviene de GOOGLE_WALLET_PUBLIC_ORIGIN o las variables de deployment Vercel. Debe ser HTTPS y accesible a Google sin protección de deployment.

## Cola

`database/google-wallet.sql`: tabla privada `wallet_sync`, sin acceso para owner/staff/customer. Solo se suscribe un cliente cuando solicita agregar su tarjeta. Triggers después de cada movimiento (incluidos ajustes por reversión) y edición de programa incrementan la revisión. Fallar al encolar nunca revierte el libro de puntos.

La API de visitas, las acciones del owner y el refresco de la tarjeta usan `after()` para procesar la cola después de responder. Worker con lease de 2 minutos, SKIP LOCKED, timeout de red, reintentos exponenciales hasta una hora y revisión de generación: si llegan puntos durante la sincronización permanecen pendientes. El saldo siempre se consulta del ledger. Errores guardados como código sanitario, nunca respuesta de Google ni JWT.

`/api/cron/wallet`, protegido por CRON_SECRET, reintenta un lote limitado a tiempo de función cada día a las 06:45 UTC (compatible con Hobby). Cron Vercel solo corre en Production; en Preview se procesa por solicitudes de la app o invocación autorizada del endpoint. Una avería prolongada puede retrasar actualizaciones; no se promete actualización instantánea del dispositivo.

Migración: `node --env-file=.env.local scripts/migrate-wallet.mjs --apply`. Verifica base independiente y checksum.

## Validación

Pruebas locales: JWT RSA verificable; configuraciones split/JSON; campos y QR; API Google simulada, 404/409/403; esquema PostgreSQL real en PGlite con worker real, reintentos, movimientos concurrentes y aislamiento. TypeScript y build Next.

Pendiente de aceptación externa: tras cargar el Secret, en Android con cuenta de prueba autorizada agregar tarjeta, comprobar logo/color/saldo, registrar visita y verificar saldo en Wallet. No se ha afirmado que esa prueba física esté completada.

## Apple Wallet — plan únicamente

Apple Developer Program: 99 USD al año, sujeto a moneda local/impuestos. Crear Pass Type ID y certificado, generar y firmar `.pkpass` en servidor, publicar descarga. Para actualizar puntos: web service con registro de dispositivos/pases y autenticación, notificaciones APNs y entrega del nuevo pase firmado. Certificados y llaves solo en servidor. No implementado en esta fase.
