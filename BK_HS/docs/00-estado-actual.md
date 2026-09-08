# Estado actual del sistema

Fecha de revisión: 2026-09-07.

Este documento es el resumen operativo del backend y debe leerse junto con la documentación de BD y frontend. Distingue las funciones comprobadas de las que todavía requieren integración.

## Resumen

- PostgreSQL y Liquibase fueron verificados en Docker con 177 changesets aplicados. Si Docker Desktop está detenido, la verificación debe repetirse.
- El backend Node.js/Express está disponible en `http://localhost:3000` y usa el rol de aplicación `hidro_smart_app`.
- La API REST se monta bajo `/api/v1`; el health público está en `GET /health`.
- JWT, refresh tokens persistentes, logout, cambio y recuperación de contraseña están implementados.
- Hogares, membresías, dispositivos, consumo, tarifas, alertas, metas, vacaciones, soporte, roles y auditoría tienen rutas implementadas.
- MQTT ya tiene configuración, cliente, publicación, suscripción, parser y handlers básicos.
- MQTT todavía no persiste la lectura en PostgreSQL. La recepción termina en el handler y queda registrada en logs.

## Rutas REST montadas

Las rutas se montan en `src/app.js`:

| Prefijo | Responsabilidad |
|---|---|
| `/api/v1/auth` | registro, login, sesión, contraseñas |
| `/api/v1/homes` | hogares, miembros y solicitudes |
| `/api/v1/devices` | dispositivos, configuración, estado y vinculación |
| `/api/v1/consumption` | resumen, lecturas agregadas, costos |
| `/api/v1/users` | perfil y preferencias |
| `/api/v1/tariffs` | tarifa vigente por hogar |
| `/api/v1/alerts` | alertas, reglas, umbrales e historial |
| `/api/v1/goals` | metas y progreso |
| `/api/v1/vacation` | configuración del modo vacaciones |
| `/api/v1/roles` | administración de roles |
| `/api/v1/support` | catálogos, tickets y respuestas |
| `/api/v1/audit` | consulta administrativa de auditoría |

El inventario completo de métodos, parámetros y permisos está en `03-endpoints.md`. No existe actualmente una ruta REST montada para recibir telemetría MQTT: la telemetría entra por el broker.

## Autenticación

Públicas, además de `GET /` y `GET /health`:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/request-password-reset`
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

El parser acepta las métricas del YF-S201: `pulses`, `flowRateLpm`, `consumptionLiters`, `totalLiters`, `timestamp` y calidad de señal mediante `signalQuality` o `wifiRssiDbm`. También reconoce métricas opcionales de salud como batería, voltaje y temperatura.

La configuración Docker usa `mqtt://mosquitto:1883`. Mosquitto está en modo anónimo y sin TLS únicamente para desarrollo local.

## Bloque pendiente de persistencia IoT

El handler aún no invoca un caso de uso tipo `ReceiveReading` ni un repositorio de lecturas. Antes de activar la escritura hay que:

1. Resolver `deviceCode` del topic contra `device.device.code`.
2. Verificar que el dispositivo esté activo y pertenezca a un hogar autorizado.
3. Insertar en `consumption.sensor_reading` con una conexión/rol de ingestión controlado.
4. Definir idempotencia, validación de timestamp y estrategia ante mensajes duplicados.
5. Revisar el permiso para `device.device_telemetry_history` si también se guardará la salud del dispositivo.

Advertencia de precisión: `consumption.sensor_reading.consumption_liters` es actualmente `NUMERIC(10,2)`. Una muestra de `0.040 L` se redondearía a `0.04 L`, y los agregados basados en `consumption_m3` pueden perder precisión. Esto debe resolverse en una migración antes de ingerir lecturas por segundo.

## Verificaciones realizadas

- `npm test`: 82 pruebas unitarias aprobadas.
- `npm run check`: aprobado.
- Frontend: formato y build aprobados.
- Liquibase: `validate` y `status --verbose` aprobados.
- Docker: la pila integrada quedó validada en la última ejecución; requiere Docker Desktop activo para repetirla.
- MQTT: una telemetría de prueba fue recibida y normalizada por el backend.
- Pruebas de integración externas: quedan omitidas cuando no están configuradas sus credenciales.

## No confundir con pendiente

- El endpoint de actuadores HTTP y el envío de comandos desde casos de uso todavía no están implementados; `MqttPublisher` existe como infraestructura preparada.
- La navegación web es interna por estado de React; todavía no hay deep links con React Router.
- Algunas métricas visuales del dashboard continúan siendo valores de presentación y no deben tomarse como telemetría MQTT real.
