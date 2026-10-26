# Guía de dispositivos IoT

Fecha de actualización: 2026-09-15.

Esta guía explica cómo registrar, vincular, editar y comprobar un dispositivo
IoT en HidroSmart. El flujo es el mismo para un ESP32 con caudalímetro u otro
equipo compatible con el contrato MQTT del proyecto.

## Conceptos importantes

- `code`: identificador técnico lógico del dispositivo. Se genera en el alta si
  no se envía y debe coincidir con `{deviceCode}` en el topic MQTT.
- `name`: nombre visible en la aplicación, por ejemplo `Sensor Baño`.
- `type`: tipo de dispositivo registrado, por ejemplo `flow_sensor`.
- `location`: lugar visible dentro del hogar, por ejemplo `Baño principal`.
  Es opcional y admite hasta 120 caracteres.
- `homeId`: UUID del hogar al que se asociará el dispositivo.
- `alertThreshold`: umbral de flujo que se puede configurar para generar una
  alerta.
- `wifiSsid`: SSID de la red activa reportada por el ESP32. Es un dato
  informativo y no contiene la contraseña.
- `lastIp`: última IP local reportada por el dispositivo.

El `code` no se debe cambiar para que coincida con el nombre mostrado. El
nombre y la ubicación son datos administrativos; el código lógico es la
identidad que usa MQTT y el `hardwareId` identifica la placa física.

## Aprovisionamiento del ESP32

El `hardwareId` es la identidad física estable que genera el ESP32 con los 12
caracteres hexadecimales del eFuse, por ejemplo `HS-141F47470968`. No se escribe
en el alta: se detecta por BLE y se asocia después desde el apartado
**Configurar** de la tarjeta. La pantalla también muestra el estado
`PENDING`, `BLE_READY`, `WIFI_CONNECTED`, `MQTT_CONNECTED`, `COMPLETE` o
`FAILED`.

En la placa probada, la salida observada fue `HS-141F47470968`, con YF-S201 en
GPIO 27, cero redes guardadas y BLE anunciado como `HidroSmart-470968`. Esto
significa que el sensor está listo, pero todavía no puede publicar porque falta
provisionar Wi-Fi y el broker. El alta genera un código lógico, por ejemplo
`ESP32-A1B2C3D4E5F6`; después de asociar el hardware, ese código será el usado
en el topic MQTT:

```text
hidrosmart/devices/ESP32-A1B2C3D4E5F6/telemetry
```

La actualización administrativa utiliza:

```http
PATCH /api/v1/devices/{deviceId}/provisioning
```

```json
{
  "hardwareId": "HS-141F47470968",
  "provisioningStatus": "COMPLETE",
  "provisioningError": null
}
```

Para asociar una placa detectada a un dispositivo lógico ya existente, consulta
primero `GET /api/v1/devices/hardware/HS-141F47470968` y luego ejecuta
`POST /api/v1/devices/{deviceId}/claim-hardware` con
`{ "hardwareId": "HS-141F47470968" }`. La asociación requiere
`devices.manage` y evita que el mismo hardware quede en dos equipos.

Las credenciales Wi-Fi se escriben por BLE directamente en el ESP32 usando el
servicio `4fafc201-1fb5-459e-8fcc-c5c9c331914b`, la característica de
configuración `beb5483e-36e1-4688-b7f5-ea07361b26a8` y la característica de
estado `beb5483e-36e1-4688-b7f5-ea07361b26a9`; nunca se guardan en la base ni se
envían al backend. La pantalla web puede solicitar el dispositivo, leer el
estado inicial y enviar:

```json
{
  "ssid": "APRENDICES",
  "password": "TU_PASSWORD",
  "mqttHost": "10.3.234.166",
  "mqttPort": 1883,
  "deviceCode": "ESP32-001"
}
```

El estado inicial incluye `state: ready`, `hardwareId`, `deviceCode`, `firmwareVersion`,
`savedNetworks`, `wifiConnected` y `mqttConnected`. Luego el ESP32 notifica
`wifi_connecting`, `wifi_connected`, `provisioning_complete`, `wifi_failed` o
`mqtt_unreachable`. Web Bluetooth funciona en Chrome/Edge sobre HTTPS o
localhost. La aplicación móvil ya incluye el puente nativo con
`react-native-ble-plx`; para probarlo se necesita un development build, no Expo
Go.

## Configuración centralizada

El botón **Configurar** abre un único apartado para el dispositivo. Allí se
pueden editar el nombre, la ubicación y el umbral; consultar el código lógico,
el `hardwareId`, la red Wi-Fi, la última IP, el RSSI y el estado de conexión;
abrir el historial de lecturas; y ejecutar el provisionamiento BLE cuando aún
no existe una conexión Wi-Fi confirmada.

La contraseña Wi-Fi se muestra únicamente como un campo vacío para reemplazar
la red. No se puede recuperar desde el ESP32, la API ni PostgreSQL, y nunca se
devuelve en una respuesta. Cuando el estado BLE inicial o MQTT indica
`wifiConnected: true`, `WIFI_CONNECTED`, `MQTT_CONNECTED`, `COMPLETE` o
`ONLINE`, el botón **Conectar por Bluetooth** desaparece automáticamente. Si
el ESP32 informa que Wi-Fi funciona pero Mosquitto no responde, también se
considera que Wi-Fi ya está conectado y no se ofrece una conexión BLE nueva
desde ese apartado.

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

Esta opción crea el dispositivo lógico y lo asocia al hogar. El usuario no
escribe códigos, `hardwareId` ni credenciales de red en este formulario.

1. Abre el frontend en `http://localhost:5173` e inicia sesión.
2. Entra en **Dispositivos IoT**.
3. Selecciona el hogar correcto.
4. Pulsa **Registrar nuevo dispositivo**.
5. Completa únicamente:
   - **Nombre**: nombre que verá la persona usuaria.
   - **Tipo**: tipo del sensor o dispositivo.
   - **Umbral**: opcional; se expresa en m³/h según la configuración actual.
6. Guarda el formulario.

El backend genera automáticamente el código lógico `ESP32-XXXXXXXXXXXX`.
Después, desde **Configurar**, el frontend descubre el `hardwareId` por
Bluetooth, lo asocia al dispositivo lógico y permite enviar la red Wi-Fi y el
host MQTT mientras el equipo todavía no está configurado.

El frontend envía una solicitud `POST /api/v1/devices` con este formato:

```json
{
  "homeId": "11111111-1111-4111-8111-111111111111",
  "name": "Sensor Baño Principal",
  "type": "flow_sensor",
  "alertThreshold": 10
}
```

El backend registra el dispositivo y crea la asociación con el hogar dentro de
una transacción. La base ejecuta la función de registro con el código generado;
no se debe insertar el dispositivo directamente en PostgreSQL para el flujo
normal.

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

### Consultar red e IP desde PostgreSQL

Para comprobar los metadatos recibidos del último estado MQTT:

```powershell
$query = "SELECT code, hardware_id, wifi_ssid, last_ip, wifi_rssi_dbm, connectivity_status, provisioning_status, last_connection_at FROM device.device WHERE code = 'ESP32-001';"
docker compose --env-file .env exec -T postgres psql -U hidro_smart_admin -d hidro_smart -c $query
```

`wifi_ssid` y `last_ip` solo tendrán valor después de que el firmware publique
un estado que incluya `ssid` e `ip`/`lastIp`. La contraseña no aparecerá en esta
consulta porque no se almacena.

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

- `device.device`: identidad, código, nombre, tipo, ubicación, estado,
  configuración y metadatos no sensibles de red (`wifi_ssid`, `last_ip`).
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

En la última verificación local, Liquibase tenía 223 changesets aplicados y el
backend tenía 163 pruebas unitarias aprobadas. El flujo de registro, edición,
vinculación, aprovisionamiento BLE, persistencia de SSID/IP y consulta del
historial ya está implementado. La prueba final pendiente es validar el flujo
completo con el ESP32 y el caudalímetro físicos, además de endurecer MQTT antes
de producción.
