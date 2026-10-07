# Bloque 3 — Fotos privadas de canje

## Recomendación
Cloudflare R2 privado, por sus URLs firmadas y compatibilidad S3. El código usa el SDK S3 oficial. Vercel Blob privado también es viable y tiene integración directa con Vercel; S3 es una alternativa compatible. Esta elección aún requiere crear y validar el bucket real.
Fuentes: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ ; https://vercel.com/docs/vercel-blob/using-blob-sdk ; https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html .

## Cambios
La cámara/selector acepta JPEG, PNG y WebP. Antes de enviar, comprime en el navegador a JPEG, lado máximo 1600 px, calidad 0.8; entrada máxima 15 MB. El servidor admite hasta 3 MB, verifica firma, MIME, dimensiones, límite de 20 megapíxeles y decodificación real. Rechaza SVG, archivos animados y contenidos falsos. La compresión elimina metadatos originales al volver a codificar en canvas.

El archivo se sube desde servidor; el navegador no recibe credenciales ni elige rutas arbitrarias. Neon guarda ruta, objeto, MIME, tamaño y hash, no bytes. La autorización y el enlace con el canje conservan los controles existentes en Postgres. Staff puede adjuntar evidencia al canje; no puede consultarla después. Solo el owner de ese negocio y el superadmin obtienen URLs firmadas de lectura de 60 segundos. Los enlaces firmados son credenciales temporales: quien tenga uno puede usarlo hasta que expire; no deben compartirse. Respuestas y objetos se indican private/no-store.

Una operación de base de datos incierta no provoca borrado del archivo: podría estar ligado a un canje ya confirmado. Los archivos huérfanos por fallos se conservan para reconciliar; no se implementó borrado automático en este bloque.

## Migración
No se ejecutó sobre Neon ni R2 reales. El script procesa una foto a la vez, copia, descarga y verifica tamaño/hash. Solo entonces registra metadatos y borra bytes heredados en una transacción. Reintentos conservan rutas y enlaces del canje. Si falla la copia, verificación o hay conflicto de referencia, se detiene y conserva el original. No altera saldos ni el historial del ledger.

## Preparar Preview sin tocar producción
1. Crear bucket R2 independiente, por ejemplo nival-evidence-preview. Mantener desactivados acceso público r2.dev y dominio público.
2. Crear token de lectura/escritura limitado a ese bucket.
3. Cargar directamente en Vercel, solo Preview: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_EVIDENCE_BUCKET. Todas privadas, sin NEXT_PUBLIC_. No pegar valores en chat.
4. Utilizar una rama de Neon separada para Preview. Copiar los datos de prueba allí y confirmar que DATABASE_URL apunta a esa rama. Cambiarla requiere aprobación del usuario. El script comprueba el nombre de base, pero no distingue por sí solo ramas Neon con el mismo nombre.
5. Revisar y aplicar database/evidence-object-storage.sql en la base Preview. Sobre las migraciones existentes de puntos; no volver a ejecutar el cimiento completo.
6. En un entorno autorizado con variables cargadas de forma privada, ejecutar: node --env-file=.env.local scripts/migrate-evidence.mjs --apply . No crear el archivo de secretos en el repositorio ni publicarlo.
7. Comprobar en Neon que count(*) de nival_pr_private.evidence_photos sea 0 y que existan metadatos en evidence_objects. Revisar varios canjes, incluyendo fotos antiguas. La tabla antigua vacía se conserva para no destruir el esquema prematuramente.
8. Solo después de comprobar Preview, aprobar explícitamente variables, migración y despliegue de producción. Producción debe usar otro bucket y credenciales.

La ruta nueva no sirve bytes heredados de Neon: las fotos antiguas no se verán hasta migrarlas. No desplegar esta versión antes de preparar almacenamiento y migración. Las consultas a otras tablas siguen funcionando; un fallo de almacenamiento impide el canje y no descuenta puntos. HEIC/HEIF no está admitido: usar cámara/formato compatible o convertir la foto antes de seleccionarla.

## Pruebas manuales obligatorias
- Canje con foto desde un celular: confirmar compresión, premio, saldo y lectura del dueño.
- Desde otro dueño, staff y navegador sin sesión: acceso denegado a /api/points/evidence?id=ID.
- Superadmin: puede leer el mismo canje.
- URL firmada: abrir inmediatamente; esperar más de 60 segundos y repetir la solicitud de descarga sin usar una copia ya descargada o caché. Debe fallar. La URL original sin firma tampoco debe abrir el archivo.
- Bucket: comprobar realmente que r2.dev y dominios públicos están desactivados.
- Migración de fotos antiguas: comparar imágenes, contar filas binarias restantes y mantener respaldo hasta verificar.
- Simular fallo de R2 en Preview: el canje falla sin descontar puntos. Una visita sin foto sigue funcionando.

## Evidencia automática
Antes del cambio: 65/65 aprobadas. Las pruebas nuevas cubren firma y vencimiento configurado, permisos antes de emitir URL, copia/verificación, orden de subida y registro, validación real de imágenes, persistencia solo de metadatos y acceso de roles en PostgreSQL, y compresión con APIs de navegador simuladas. La firma se genera con el SDK real y credenciales ficticias: no demuestra acceso, expiración o configuración de un bucket remoto real.

Resultado final: npm test 71/71, cero fallos; TypeScript, next build, sintaxis del script de migración y git diff --check aprobados. No se han copiado ni borrado fotos reales.
