# Documentación del backend HidroSmart

Fecha de revisión: 2026-09-07.

La documentación se mantiene alineada con el código que realmente está montado. Para una lectura rápida empieza por:

- `00-estado-actual.md`: estado comprobado del backend.
- `00-integracion-front-back-bd.md`: conexiones, variables y flujo entre capas.
- `03-endpoints.md`: inventario de rutas REST reales.
- `14-mqtt-protocol.md`: contrato MQTT vigente para el backend y el ESP32.
- `13-flujo-datos-iot.md`: flujo IoT y límites actuales.
- `pendientes-proyecto.md`: checklist de trabajo pendiente.

Los documentos `01` a `12` conservan decisiones de arquitectura, dominio, seguridad, jobs y estructura. Cuando un documento conceptual mencione una ruta o componente que no aparece en `src/app.js`, prevalece el código y la ruta real de `03-endpoints.md`.

## Mapa de documentación

- `01-arquitectura-backend.md`, `04-core.md`, `05-domain.md`, `06-application.md`, `07-infrastructure.md`, `10-shared.md`, `11-config.md`, `12-estructura-proyecto.md`: organización interna.
- `02-api.md`, `03-endpoints.md`: API; las secciones de actuadores en documentos antiguos son propuestas si no están montadas.
- `08-mqtt.md`, `13-flujo-datos-iot.md`, `14-mqtt-protocol.md`: integración MQTT.
- `00-ambiente-local.md`, `14-seguridad-backend.md`: operación y seguridad.
- `00-roles-y-permisos.md`, `endpoints-por-rol.md`, `frontend-endpoints-por-rol.md`: autorización.

La persistencia de telemetría MQTT todavía está pendiente. El subscriber valida y normaliza mensajes, pero no inserta lecturas en PostgreSQL.

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
- JWT: access token, refresh token, logout, cambio y recuperación de contraseña.
- SMTP: Nodemailer preparado para Gmail; requiere configurar las variables
  `SMTP_*` y una clave de aplicación.
- MQTT: conexión, suscripción, parseo y publicación preparados; persistencia de
  lecturas aún pendiente.
- Actuadores: publisher preparado, pero no hay rutas REST montadas.

Cuando una documentación conceptual contradiga una ruta inexistente, prevalecen
`src/app.js` y `03-endpoints.md`.
