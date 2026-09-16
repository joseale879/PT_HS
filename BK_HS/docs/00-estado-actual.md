# Estado actual del sistema

Fecha de revisión: 2026-09-15.

Este documento es el resumen operativo del backend y debe leerse junto con la documentación de BD y frontend. Distingue las funciones comprobadas de las que todavía requieren integración.

## Resumen

- PostgreSQL y Liquibase fueron verificados en Docker con 223 changesets aplicados. Si Docker Desktop está detenido, la verificación debe repetirse.
- El backend Node.js/Express está disponible en `http://localhost:3000` y usa el rol de aplicación `hidro_smart_app`.
- La API REST se monta bajo `/api/v1`; el health público está en `GET /health`.
- La operación expone `GET /health/live` para liveness y `GET /health/ready` para readiness de PostgreSQL y MQTT.
- Registro, verificación de correo, JWT, refresh tokens persistentes, logout,
  cambio y recuperación de contraseña están implementados.
- El perfil devuelve y actualiza avatar opcional y teléfono de hasta 60 caracteres.
- La gestión de sesiones permite listar sesiones propias, cerrar una, cerrar las demás o cerrar todas sin exponer tokens.
- Hogares, membresías, dispositivos, consumo, tarifas, alertas, metas, vacaciones, recomendaciones, soporte, roles y auditoría tienen rutas implementadas.
- El flujo de dispositivos incluye registro con `location`, vinculación por
  `device.code`, edición centralizada de nombre/ubicación/umbral,
  aprovisionamiento BLE, persistencia de `wifi_ssid`/`last_ip` y telemetría
  persistida; los detalles operativos están en `../../docs/dispositivos-iot.md`.
- MQTT ya tiene configuración, cliente, publicación, suscripción, parser y handlers básicos.
- El job de limpieza de auditoría usa el procedimiento SQL protegido y bloqueo advisory.
- MQTT persiste lecturas en PostgreSQL mediante una función protegida, con métricas, timestamps separados e idempotencia por mensaje. El contrato nuevo del ESP32 también incluye `hardwareId` y estados de aprovisionamiento.

## Rutas REST montadas

Las rutas se montan en `src/app.js`:

| Prefijo | Responsabilidad |
|---|---|
| `/api/v1/auth` | registro, login, sesión, contraseñas |
| `/api/v1/homes` | hogares, miembros y solicitudes |
| `/api/v1/devices` | dispositivos, configuración, estado y vinculación |
| `/api/v1/consumption` | resumen, lecturas agregadas, costos y series avanzadas por día, hora, mes o ubicación |
| `/api/v1/users` | perfil y preferencias |
| `/api/v1/tariffs` | tarifa vigente por hogar |
| `/api/v1/alerts` | alertas, reglas, umbrales e historial |
| `/api/v1/goals` | metas y progreso |
| `/api/v1/vacation` | configuración del modo vacaciones |
| `/api/v1/roles` | administración de roles |
| `/api/v1/support` | catálogos, tickets y respuestas |
| `/api/v1/audit` | consulta administrativa de auditoría |
| `/api/v1/privacy` | consentimientos, exportación propia y solicitudes ARCO |
| `/api/v1/reports` | exportación de consumo en PDF y Excel, historial propio y descarga posterior |
| `/api/v1/recommendations` | recomendaciones propias y resumen por hogar |

El inventario completo de métodos, parámetros y permisos está en `03-endpoints.md`. No existe actualmente una ruta REST montada para recibir telemetría MQTT: la telemetría entra por el broker. Los reportes resumidos se descargan mediante `/api/v1/reports/consumption.pdf` o `/api/v1/reports/consumption.xlsx`; cada descarga queda registrada y puede consultarse en `/api/v1/reports/history`.

## Autenticación

Públicas, además de `GET /` y `GET /health`:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/request-password-reset`
- `GET /api/v1/auth/password-reset-context?resetToken=...`
- `POST /api/v1/auth/reset-password`

Protegidas:

- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- Todas las rutas de hogares, usuarios, dispositivos, consumo, tarifas, alertas, metas, vacaciones, roles, soporte y auditoría, con permisos adicionales según el caso.

El frontend guarda la sesión en su capa de storage y el cliente HTTP intenta una renovación ante `401` una sola vez. El refresh token se envía al backend y se rota/revoca según el flujo de autenticación.

## MQTT implementado

Archivos principales:

- `src/config/mqtt.js`
- `src/core/infrastructure/services/mqtt/MqttClient.js`
- `src/core/infrastructure/services/mqtt/MqttPublisher.js`
- `src/core/infrastructure/services/mqtt/MqttSubscriber.js`
- `src/mqtt/topics.js`
- `src/mqtt/message-parser.js`
- `src/mqtt/handlers/*.handler.js`

Suscripciones actuales:

- `hidrosmart/devices/+/telemetry`
- `hidrosmart/devices/+/status`
- `hidrosmart/devices/+/actuators/+/status`

El parser acepta las métricas del YF-S201: `pulses`, `flowRateLpm`, `consumptionLiters`, `totalLiters`, `timestamp` y calidad de señal mediante `signalQuality` o `wifiRssiDbm`. También reconoce métricas opcionales de salud como batería, voltaje y temperatura. Los timestamps deben incluir zona horaria ISO-8601 y se normalizan a UTC; si faltan se usa la recepción como fallback.

La configuración Docker usa `mqtt://mosquitto:1883`. Mosquitto está en modo anónimo y sin TLS únicamente para desarrollo local.

## Persistencia IoT

El firmware nuevo también envía `hardwareId` y estado de aprovisionamiento;
el backend los normaliza y PostgreSQL los persiste en `device.device`.

El handler delega en `IngestReading` y `PostgresTelemetryRepository`. El circuito:

1. Resuelve `deviceCode` del topic contra `device.device.code`.
2. Verifica que el dispositivo esté activo y pertenezca a un hogar autorizado.
3. Inserta en `consumption.sensor_reading` mediante la función SQL protegida.
4. Aplica idempotencia, validación de timestamp y estrategia ante mensajes duplicados.
5. El handler de estado persiste el historial de telemetría disponible mediante su función SQL protegida y normaliza `ONLINE/OFFLINE/ERROR`, `lastIp`, firmware y aprovisionamiento.

La precisión del consumo ya está corregida: `consumption_liters` usa
`NUMERIC(14,3)` y el m³ generado usa `NUMERIC(14,6)`. Una muestra de `0.040 L`
se conserva como `0.000040 m³`; falta validarlo con el ESP32 y el caudalímetro
reales.

## Verificaciones realizadas

- `npm test`: 163 pruebas unitarias aprobadas en la última ejecución.
- `npm run check`: aprobado.
- Frontend: formato y build aprobados.
- Liquibase: `validate`, `update` y `status --verbose` aprobados; 223 changesets aplicados.
- Docker: la pila integrada quedó validada en la última ejecución; requiere Docker Desktop activo para repetirla.
- MQTT: una telemetría con el formato del ESP32 fue recibida, normalizada y persistida; la repetición del mismo `mqttMessageId` no duplicó la fila.
- BLE: el contrato de dos características y el puente móvil quedaron implementados; falta probar el development build con la placa física.
- Pruebas de integración externas: quedan omitidas cuando no están configuradas sus credenciales.

## No confundir con pendiente

- El endpoint de actuadores HTTP y el envío de comandos desde casos de uso ya están implementados; requieren prueba con ESP32 real y endurecimiento de Mosquitto antes de producción.
- Recomendaciones tiene API backend disponible; la pantalla frontend actual es visual y la generación automática a partir de reglas de consumo sigue pendiente de una decisión de producto.
- La navegación web usa React Router 7.18.3; el contrato de deep links se mantiene en la documentación del frontend.
- El indicador de flujo actual del dashboard usa el último agregado horario disponible y no debe tomarse como telemetría MQTT en tiempo real. Las tarjetas principales sí consultan los agregados del backend.
