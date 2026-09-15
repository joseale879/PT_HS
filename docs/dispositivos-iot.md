# Guía de dispositivos IoT

Fecha de actualización: 2026-09-14.

Esta guía explica cómo registrar, vincular, editar y comprobar un dispositivo
IoT en HidroSmart. El flujo es el mismo para un ESP32 con caudalímetro u otro
equipo compatible con el contrato MQTT del proyecto.

## Conceptos importantes

- `code`: identificador técnico del dispositivo. Debe coincidir exactamente con
  `{deviceCode}` en el topic MQTT, por ejemplo `ESP32-001`.
- `name`: nombre visible en la aplicación, por ejemplo `Sensor Baño`.
- `type`: tipo de dispositivo registrado, por ejemplo `flow_sensor`.
- `location`: lugar visible dentro del hogar, por ejemplo `Baño principal`.
  Es opcional y admite hasta 120 caracteres.
- `homeId`: UUID del hogar al que se asociará el dispositivo.
- `alertThreshold`: umbral de flujo que se puede configurar para generar una
  alerta.

El `code` no se debe cambiar para que coincida con el nombre mostrado. El
nombre y la ubicación son datos administrativos; el código es la identidad que
usa MQTT.

## Requisitos previos

Desde la raíz `PT_HS`, Docker Desktop debe estar iniciado y la pila local debe
estar levantada:

```powershell
docker compose --env-file .env up -d
docker compose --env-file .env ps
```

La base debe tener las migraciones aplicadas:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase update
```

La pantalla de dispositivos necesita una sesión autenticada y un hogar
seleccionado. Registrar, vincular, editar, configurar, desactivar y desvincular
requiere el permiso `devices.manage` y, para las operaciones del hogar, ser su
titular (`Owner`). El backend y PostgreSQL vuelven a validar estos permisos;
ocultar un botón en el frontend no es un mecanismo de seguridad.

## Opción A: registrar un dispositivo nuevo

Esta opción se usa cuando el código todavía no existe en `device.device`.

1. Abre el frontend en `http://localhost:5173` e inicia sesión.
2. Entra en **Dispositivos IoT**.
3. Selecciona el hogar correcto.
4. Pulsa **Registrar nuevo dispositivo**.
5. Completa:
   - **Código**: el mismo que publica el ESP32, por ejemplo `ESP32-001`.
   - **Nombre**: nombre que verá la persona usuaria.
   - **Tipo**: tipo del sensor o dispositivo.
   - **Ubicación**: baño, cocina, jardín, etc. Puede quedar vacía.
   - **Umbral**: opcional; se expresa en m³/h según la configuración actual.
6. Guarda el formulario.

El frontend envía una solicitud `POST /api/v1/devices` con este formato:

```json
{
  "homeId": "11111111-1111-4111-8111-111111111111",
  "code": "ESP32-001",
  "name": "Sensor Baño Principal",
  "type": "flow_sensor",
  "location": "Baño principal",
  "alertThreshold": 10
}
```

El backend registra el dispositivo y crea la asociación con el hogar dentro de
una transacción. La base ejecuta
`device.fn_register_device_with_location(...)`; no se debe insertar el
dispositivo directamente en PostgreSQL para el flujo normal.

## Opción B: vincular un dispositivo ya registrado

Esta opción se usa cuando el dispositivo ya existe en la base, pero todavía no
está asociado al hogar seleccionado. Es el caso habitual de un equipo
pre-registrado o de un dispositivo que se quiere asociar a otro hogar.

1. Entra en **Dispositivos IoT** y selecciona el hogar cuyo titular hará la
   vinculación.
2. Pulsa **Vincular dispositivo**.
3. Escribe el código exacto publicado por el equipo, por ejemplo `ESP32-001`.
4. Confirma.

La API utilizada es:

```http
POST /api/v1/devices/link
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "homeId": "11111111-1111-4111-8111-111111111111",
  "code": "ESP32-001"
}
```

La función `device.fn_link_device_to_home(code, home_id)` comprueba el permiso,
la titularidad del hogar, que el dispositivo esté activo y que el código exista.
Si la relación ya existía suspendida, la reactiva; no crea asociaciones
duplicadas.

## Editar nombre y ubicación

En **Dispositivos IoT**, pulsa **Configurar** en la tarjeta del equipo y edita
el nombre o la ubicación. El código MQTT no se edita desde este formulario.

La API es:

```http
PUT /api/v1/devices/{deviceId}
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "name": "Sensor Baño Principal",
  "location": "Baño principal"
}
```

La ubicación se guarda en `device.device.location` como `VARCHAR(120)`. Los
dispositivos existentes pueden tener la ubicación vacía; al editarlo se puede
completar sin cambiar su código ni sus lecturas.

## Configurar umbral y estado

El umbral se modifica desde la configuración del dispositivo y se actualiza
con `PUT /api/v1/devices/{deviceId}/config` o con la operación de actualización
disponible en el frontend. El estado administrativo se gestiona con las rutas
de estado y desactivación protegidas.

La ubicación, el nombre y el umbral no sustituyen las métricas del ESP32. Las
lecturas llegan exclusivamente por MQTT y se persisten en PostgreSQL mediante
la función protegida de ingesta.

## Cómo verificar que el dispositivo está funcionando

### Ver mensajes en Mosquitto

Desde la raíz del proyecto:

```powershell
docker compose --env-file .env exec mosquitto mosquitto_sub `
  -h localhost -p 1883 -t "hidrosmart/devices/+/telemetry" -v
```

El topic debe contener el mismo código registrado. Un payload compatible con
el ESP32 puede verse así:

```json
{
  "deviceId": "ESP32-001",
  "flowRateLpm": 3.973,
  "consumptionLiters": 0.331,
  "totalLiters": 9.275,
  "pulses": 149,
  "sampleIntervalSeconds": 5,
  "signalQuality": -33
}
```

### Consultar lecturas persistidas

En el entorno local se puede consultar la evidencia con el rol administrador
de PostgreSQL, sin modificar datos:

```powershell
$query = "SELECT d.code, COALESCE(d.location, '—') AS location, COUNT(sr.reading_id) AS readings, MAX(sr.measured_at) AS last_reading FROM device.device d LEFT JOIN consumption.sensor_reading sr ON sr.device_id = d.device_id WHERE d.code = 'ESP32-001' GROUP BY d.code, d.location;"
docker compose --env-file .env exec -T postgres psql -U hidro_smart_admin -d hidro_smart -c $query
```

La columna `readings` debe aumentar mientras el ESP32 publica muestras y
`last_reading` debe actualizarse. No se debe corregir el contador editando la
tabla: si no aumenta, se debe revisar el topic, el código, la asociación y los
logs del backend.

### Consultar desde la API

Con un token obtenido al iniciar sesión:

```powershell
$headers = @{ Authorization = "Bearer <access_token>" }
Invoke-WebRequest -Headers $headers `
  http://localhost:3000/api/v1/devices/{deviceId}/telemetry/latest
```

La respuesta contiene la última lectura autorizada o `data: null` si todavía no
existe una muestra para ese dispositivo.

## Errores frecuentes

| Síntoma | Causa probable | Qué revisar |
|---|---|---|
| `401 Unauthorized` | No hay sesión o el token expiró | Iniciar sesión y renovar la sesión |
| `403 Forbidden` | Falta `devices.manage` o el usuario no es titular del hogar | Rol funcional, permiso y hogar seleccionado |
| `404` al vincular | El código no existe, está inactivo o está escrito diferente | Comparar con `device.device.code` y con el topic MQTT |
| Código duplicado al registrar | El equipo ya fue registrado | Usar **Vincular dispositivo** |
| Se muestra ubicación `—` | El registro anterior no tenía ubicación | Abrir **Configurar** y guardarla |
| No llegan lecturas | Topic, código, asociación o broker incorrectos | Suscribirse a Mosquitto y revisar logs del backend |
| Lectura rechazada | Payload inválido, dispositivo inactivo o sin asociación activa | Revisar el contrato MQTT y la relación hogar-dispositivo |

## Modelo de datos y archivos de referencia

- `device.device`: identidad, código, nombre, tipo, ubicación, estado y
  configuración del equipo.
- `home.home_device`: asociación activa entre hogares y dispositivos.
- `consumption.sensor_reading`: lecturas de consumo y métricas del ESP32.
- `device.device_telemetry_history`: historial de conectividad y salud.
- `device.fn_register_device_with_location(...)`: registro controlado.
- `device.fn_link_device_to_home(...)`: vinculación controlada.
- `BK_HS/docs/03-endpoints.md`: inventario de rutas REST.
- `BK_HS/docs/14-mqtt-protocol.md`: contrato MQTT.
- `BK_HS/docs/13-flujo-datos-iot.md`: recorrido ESP32 → Mosquitto → backend →
  PostgreSQL.

## Estado actual verificado

En la última verificación local, el changelog tenía 217 changesets aplicados,
el backend tenía 156 pruebas unitarias aprobadas y `ESP32-001` estaba asociado a
un hogar con lecturas persistidas en PostgreSQL. El flujo de registro, edición y
vinculación ya está implementado. Las consultas avanzadas de consumo por día,
hora, mes y ubicación también quedaron conectadas; todavía quedan las alertas
reales del dashboard, el carrusel de hogares, reportes completos con datos reales
y la prueba final con hardware.
