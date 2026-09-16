# Plan de integración IoT HidroSmart

Fecha de aplicación: 2026-09-15.

Este documento fija el contrato entre la placa física ESP32, el dispositivo
lógico de HidroSmart, PostgreSQL, el backend y los frontends web/móvil.

## 1. Identidad del dispositivo

La placa física y el registro lógico son conceptos separados:

```text
hardwareId = HS-141F47470968   # identidad única de la placa
deviceCode = ESP32-001         # código lógico usado por HidroSmart/MQTT
```

La placa observada actualmente reporta `HS-141F47470968`, anuncia BLE como
`HidroSmart-470968` y todavía inicia con cero redes guardadas. Por eso requiere
provisionamiento BLE antes de publicar por MQTT.

PostgreSQL guarda `hardware_id` con índice único parcial. No guarda SSID,
contraseñas Wi-Fi ni ningún secreto de provisionamiento.

## 2. Base de datos aplicada

La estructura existente se completa con:

- `device.device.hardware_id` y su índice único.
- Estado de provisionamiento: `PENDING`, `BLE_READY`, `WIFI_CONNECTED`,
  `MQTT_CONNECTED`, `COMPLETE` o `FAILED`.
- Función `device.fn_claim_provisioned_device(device_id, hardware_id)`, que
  exige `devices.manage`, valida que el usuario pueda administrar el
  dispositivo, evita reutilizar un hardware en otro dispositivo y devuelve el
  registro actualizado.
- Rollback y grant exclusivo para `hidro_smart_app`.

Archivos de la migración:

```text
BD_HS/01_ddl/06_functions/055_fn_claim_provisioned_device.sql
BD_HS/03_dcl/01_grants/048_device_hardware_claim.sql
```

## 3. Endpoints de asociación

Base local: `http://localhost:3000/api/v1`.
Todas las rutas requieren `Authorization: Bearer <access_token>`.

### Consultar por hardware

```http
GET /api/v1/devices/hardware/HS-141F47470968
```

Devuelve el dispositivo lógico accesible para el usuario:

```json
{
  "data": {
    "deviceId": "uuid-del-dispositivo",
    "code": "ESP32-001",
    "hardwareId": "HS-141F47470968",
    "name": "Medidor principal",
    "provisioningStatus": "BLE_READY"
  }
}
```

Si el hardware no está registrado o no pertenece a un hogar accesible,
responde `404`.

### Asociar hardware a un dispositivo lógico

```http
POST /api/v1/devices/{deviceId}/claim-hardware
Content-Type: application/json
```

```json
{
  "hardwareId": "HS-141F47470968"
}
```

La operación es idempotente para el mismo dispositivo y hardware. Si la placa
ya está asociada a otro dispositivo responde `409`; si el usuario no puede
administrar el dispositivo responde `403`.

## 4. Provisionamiento BLE

Servicio:

```text
4fafc201-1fb5-459e-8fcc-c5c9c331914b
```

Características:

```text
Configuración WRITE: beb5483e-36e1-4688-b7f5-ea07361b26a8
Estado READ/NOTIFY:   beb5483e-36e1-4688-b7f5-ea07361b26a9
```

El front web usa Web Bluetooth cuando el navegador lo permite. El front móvil
usa el puente WebView y `react-native-ble-plx` para escanear, conectar, leer el
estado inicial, recibir notificaciones y escribir la configuración.

Estado inicial esperado:

```json
{
  "state": "ready",
  "hardwareId": "HS-141F47470968",
  "deviceCode": "HS-141F47470968",
  "firmwareVersion": "1.1.0",
  "savedNetworks": 0,
  "wifiConnected": false,
  "mqttConnected": false
}
```

Antes de enviar la red, el usuario selecciona el dispositivo lógico y pulsa
**Asociar hardware**. Luego el front envía por BLE:

```json
{
  "ssid": "APRENDICES",
  "password": "CLAVE_WIFI",
  "mqttHost": "10.3.234.166",
  "mqttPort": 1883,
  "deviceCode": "ESP32-001"
}
```

La contraseña solo viaja por BLE al ESP32 y se conserva en la memoria segura
del dispositivo para sus perfiles Wi-Fi. Nunca se envía al backend ni se
guarda en PostgreSQL.

Estados BLE relevantes:

```text
configuration_received → wifi_connecting → wifi_connected
                                      └──→ wifi_failed
wifi_connected → provisioning_complete
               └──→ mqtt_unreachable
```

El firmware valida y aplica `deviceCode`, lo guarda junto a la configuración
MQTT cuando la red conecta y usa ese código para el topic.

## 5. MQTT y persistencia

Telemetría:

```text
hidrosmart/devices/{deviceCode}/telemetry
```

Estado retenido:

```text
hidrosmart/devices/{deviceCode}/status
```

Ejemplo de telemetría real:

```json
{
  "mqttMessageId": "ESP32-001-boot-secuencia",
  "deviceId": "ESP32-001",
  "hardwareId": "HS-141F47470968",
  "firmwareVersion": "1.1.0",
  "flowRateLpm": 1.387,
  "consumptionLiters": 0.11556,
  "totalLiters": 7.68889,
  "pulses": 52,
  "sampleIntervalSeconds": 5.0,
  "wifiRssiDbm": -38,
  "signalQuality": 100
}
```

El backend resuelve la lectura por `deviceId`/`deviceCode`, valida el
`mqttMessageId` para evitar duplicados y persiste la lectura junto con el
`hardwareId` y las métricas de conectividad. El flujo final es:

```text
ESP32 → Mosquitto → handler MQTT → función PostgreSQL → frontend por API
```

## 6. Orden operativo para probar

1. Ejecutar migraciones y levantar PostgreSQL, backend, Mosquitto y frontend.
2. Iniciar sesión con una cuenta titular que tenga `devices.manage`.
3. Abrir **Dispositivos IoT** y seleccionar el hogar.
4. Registrar o seleccionar el dispositivo lógico `ESP32-001`.
5. Abrir **Provisionamiento**, conectar por Bluetooth y verificar el
   `hardwareId` leído.
6. Pulsar **Asociar hardware** y comprobar que la tarjeta muestra la relación.
7. Enviar SSID, contraseña, host MQTT, puerto y `deviceCode`.
8. Confirmar `provisioning_complete` en BLE y `ONLINE` en MQTT.
9. Verificar la última lectura en Dispositivos IoT, Dashboard e historial.

Comandos de observación local:

```powershell
docker compose --env-file .env exec mosquitto mosquitto_sub -h localhost -p 1883 -t "hidrosmart/devices/+/telemetry" -v
docker compose --env-file .env logs -f backend
```

La compilación y carga física del firmware se realiza con PlatformIO desde
`firmware/`; debe repetirse después de modificar `firmware/src/main.cpp`.
