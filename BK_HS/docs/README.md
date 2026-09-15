# Documentación del backend HidroSmart

Fecha de revisión: 2026-09-14.

La documentación se mantiene alineada con el código que realmente está montado. Para una lectura rápida empieza por:

- `../../docs/estado-integral.md`: estado transversal de todo el sistema.

- `00-estado-actual.md`: estado comprobado del backend.
- `00-integracion-front-back-bd.md`: conexiones, variables y flujo entre capas.
- `03-endpoints.md`: inventario de rutas REST reales.
- `../../docs/dispositivos-iot.md`: guía operativa de registro, vinculación,
  edición y comprobación de dispositivos.
- `14-mqtt-protocol.md`: contrato MQTT vigente para el backend y el ESP32.
- `13-flujo-datos-iot.md`: flujo IoT y límites actuales.
- `pendientes-proyecto.md`: checklist de trabajo pendiente.
- `auditoria-p2-correcciones.md`: cierre del informe P2 y límites actuales.

Los documentos `01` a `12` conservan decisiones de arquitectura, dominio, seguridad, jobs y estructura. Cuando un documento conceptual mencione una ruta o componente que no aparece en `src/app.js`, prevalece el código y la ruta real de `03-endpoints.md`.

## Mapa de documentación

- `01-arquitectura-backend.md`, `04-core.md`, `05-domain.md`, `06-application.md`, `07-infrastructure.md`, `10-shared.md`, `11-config.md`, `12-estructura-proyecto.md`: organización interna.
- `02-api.md`, `03-endpoints.md`: contrato y rutas HTTP vigentes; `03-endpoints.md` es la fuente de verdad para actuadores.
- `08-mqtt.md`, `13-flujo-datos-iot.md`, `14-mqtt-protocol.md`: integración MQTT.
- `00-ambiente-local.md`, `14-seguridad-backend.md`: operación y seguridad.
- `00-roles-y-permisos.md`, `endpoints-por-rol.md`, `frontend-endpoints-por-rol.md`: autorización.

La persistencia de telemetría MQTT está conectada mediante `device.fn_ingest_sensor_reading`, con métricas validadas e idempotencia por `mqttMessageId`. El dominio de recomendaciones está expuesto en `/api/v1/recommendations` y protegido por `reports.read` más RLS. El dominio de actuadores está expuesto en `/api/v1/actuators`, con comandos publicados por MQTT, estados persistidos y ACK por `correlationId`.

El último corte comprobado tiene 157 pruebas unitarias backend aprobadas. Las
pruebas autenticadas/RLS de integración se omiten cuando no se configuran
usuarios funcionales de prueba.

## Verificación local

Desde `BK_HS`:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd start
```

La API directa queda en `http://localhost:3000`; con el frontend/Nginx se
consume mediante `/api/v1`. El backend usa `DB_HOST=postgres` y `DB_PORT=5432`
dentro de Docker, y `DB_HOST=localhost` y `DB_PORT=5433` cuando se ejecuta
directamente desde Windows.

## Estado de integraciones

- PostgreSQL: conectado mediante repositorios y funciones versionadas.
- Consumo avanzado: `GET /api/v1/consumption/advanced` usa la función SQL
  autorizada para series diarias, horarias, mensuales y por ubicación.
- JWT: access token, refresh token, logout, cambio y recuperación de contraseña.
- SMTP: Nodemailer integrado para Gmail; envía eventos de autenticación, perfil, ciclo de cuenta y acceso a hogares; requiere configurar las variables
  `SMTP_*` y una clave de aplicación.
- MQTT: conexión, suscripción, parseo, publicación y persistencia de lecturas
  mediante función SQL protegida.
- Privacy/ARCO: consentimientos, solicitudes propias, gestión administrativa y
  exportación JSON propia disponibles en `/api/v1/privacy`; el resumen de consumo está disponible en PDF y Excel desde `/api/v1/reports`.
- Actuadores: rutas REST, permisos, tablas/RLS, publicación MQTT y persistencia de estados implementados; falta validación con placa real y seguridad de broker para producción.

Cuando una documentación conceptual contradiga una ruta inexistente, prevalecen
`src/app.js` y `03-endpoints.md`.
- Bitácora transversal de cambios del 2026-09-14: `../../docs/cambios-2026-09-14.md`.
