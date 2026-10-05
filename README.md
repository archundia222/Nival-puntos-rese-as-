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
- El panel de Google aún es una pantalla de prueba pública; no representa un acceso de administrador protegido.

## Verificación
```bash
node --test tests/metrics.test.cjs
npx tsc --noEmit
npm run build
```

## Siguiente fase
1. Backend independiente, cuentas reales y aislamiento por negocio; sin reutilizar recursos de Nival Pay.
2. Panel privado de Nival con bandeja global, diagnóstico manual y comparación de competencia.
3. Enlace público de reseñas y tarjeta de puntos con identificador seguro.
4. Despliegue de prueba y recorrido móvil completo antes de admitir clientes reales.
5. Integración de Google Business Profile después de validar ingresos, según la instrucción del dueño.
