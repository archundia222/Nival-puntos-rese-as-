# Panel del dueño · Fase 4 (Neon)

`/panel` exige una sesión owner y una membresía activa. Si se solicita un negocio ajeno devuelve 404. Las consultas usan el rol `npr_v2_owner`, el ID del usuario y RLS. Ninguna lectura del panel usa una conexión de sistema.

## Bloques

- **Resumen:** visitas, primeras visitas, puntos de visitas y canjes no revertidos del periodo; pendientes de ese periodo. Compara periodos completos de calendario de México (día anterior, mes anterior o año anterior). El ranking identifica quién registró cada movimiento, conserva operadores anteriores y muestra señales de revisión, no acusaciones: volumen >=10 y >2 veces el promedio de otros operadores, canjes revertidos y canjes pendientes.
- **Google:** totales y distribución corresponden al último reporte disponible hasta el fin del filtro; nuevas/respuestas corresponden solo al periodo elegido. Prefiere el reporte de la granularidad elegida; si no existe, un mes puede sumar reportes diarios y un año puede sumar mensuales o diarios. Nunca suma juntos reportes de distinta granularidad. Si faltan días o meses, muestra los registros cargados, sin inventar los faltantes. Checklist de ocho elementos, consejos y bitácora fechada son de solo lectura para el dueño.
- **Clientes:** segmentos a la fecha actual de México, independientes del periodo seleccionado para Resumen/Google. Se pueden solapar. Solo `type='visit'` cuenta como visita; no se infieren visitas desde un saldo o desde la fecha de registro. Tarjetas sin visitas aparecen en «No han venido este mes», no se clasifican como perdidas.

Umbrales por negocio: nuevos 14 días; frecuentes >=3 visitas en 30 días; riesgo de 31 a 60 días desde la última visita con >=2 visitas en total; perdidos >60 días. Los límites de días cuentan fechas de calendario de México. «Últimos 14 días» incluye hoy y los 13 días previos. Los umbrales se guardan con RLS en `segment_settings`.

`generateAdvice(segment, businessContext)` vive en `lib/owner/domain.mjs`. Consume las plantillas de `advice_templates`, inserta `{n}` y ofrece tres variantes por segmento. Este es el punto único para sustituir la selección por una llamada futura de IA. No existe integración de IA ni envío de mensajes. Cada contacto permite editar el texto y después abrir click-to-chat.

## Carga desde admin

El formulario de `/admin` admite día, mes y año; guarda cinco cantidades por estrellas que deben sumar el total de reseñas. «Respondidas» cuenta solo las reseñas nuevas del periodo; no puede superar «Nuevas». Admite los ocho estados del checklist, consejos y fecha/descripcion de cambios.

Los reportes históricos permitían respuestas sobre el total: `answered_scope='legacy_total'` conserva su contenido sin atribuirlo al periodo. El owner ve sus métricas de ficha, pero respuestas/pendientes/% muestran «—» hasta que Nival actualice el reporte con el formulario nuevo. Al actualizarlo `answered_scope='period'`.

## Migraciones

```bash
node --env-file=.env.local scripts/migrate-owner.mjs --apply
node --env-file=.env.local scripts/migrate-owner.mjs --apply --report-scope
```

Ambas son incrementales y registran checksum en `schema_versions`. Ya se aplicaron en la base independiente `nival_puntos_resenas`.

## Validación y ejemplo

`tests/owner-fixture.mjs` crea 20 clientes y movimientos históricos en una base PGlite descartable con el esquema PostgreSQL real. Solo ese entorno de prueba permite insertar las fechas históricas; los controles del libro real de Neon permanecen activos.

La consulta manual `database/owner-segments-check.sql` al 2026-10-05 dio:

| Segmento | Resultado |
|---|---:|
| Nuevos | 4 |
| Frecuentes | 4 |
| En riesgo | 4 |
| Perdidos | 4 |
| No han venido este mes | 12 |

Resumen octubre: 8 visitas, 4 primeras visitas y 8 puntos; septiembre: 11 visitas y 6 primeras visitas. También se verifican cambios de umbral y aislamiento del owner; la acción real de carga de admin se ejecuta contra PostgreSQL de prueba y sus valores se leen con el rol owner.

`/demo/panel` usa el mismo componente de presentación de `/panel` y fixtures generados desde las mismas consultas SQL. Es una demo de solo lectura, sin teléfonos reales, sin acceso a tablas privadas y sin botones de escritura. El corte es 2026-10-05; los otros periodos fuera del ejemplo muestran estados vacíos. `/demo/panel?mobile=1` muestra el panel dentro de un viewport de 360 px.

Las gráficas se construyen con barras accesibles y SVG responsive. La calificación conserva la escala 1–5. Las cantidades y valores están disponibles como texto; no se necesita una librería de gráficos adicional.

Para regenerar fixtures:

```bash
node scripts/generate-owner-demo.mjs
```
