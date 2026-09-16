# Integración ESP32 → BD → backend → frontend

Fecha de actualización: 2026-09-15.

Este documento describe el flujo que queda conectado para el firmware nuevo del
ESP32. Las credenciales Wi-Fi nunca pasan por PostgreSQL, el backend ni el
frontend: se envían localmente por BLE al dispositivo y el ESP32 las conserva
en su NVS.

## Flujo de datos

```text
ESP32/YF-S201
    │ MQTT
    ▼
Mosquitto :1883
    │
    ▼
Backend: parser → handler → función SQL protegida
    │                         │
    │                         ▼
    │                 PostgreSQL / device.device
    │                 PostgreSQL / consumption.sensor_reading
    ▼
Frontend: /devices → última telemetría y estado de aprovisionamiento
```

El código técnico que identifica la ruta MQTT es `device.code`. El `hardwareId`
es la identidad física estable que genera el ESP32 desde su eFuse. Pueden ser
iguales si `HIDROSMART_DEVICE_CODE` está vacío, pero el backend guarda ambos
valores por separado.

## Datos que consume cada capa

### ESP32 y MQTT

Telemetría:

```text
hidrosmart/devices/{deviceCode}/telemetry
```

El firmware nuevo publica `mqttMessageId`, `deviceId`, `hardwareId`,
`timestamp`, `flowRateLpm`, `consumptionLiters`, `totalLiters`, `pulses`,
`sampleIntervalSeconds`, `wifiRssiDbm` y `signalQuality`. En el ESP32,
`signalQuality` conserva el RSSI en dBm, por ejemplo `-38`; el backend acepta
ambos nombres y los normaliza.

Estado retenido:

```text
hidrosmart/devices/{deviceCode}/status
```

El estado publica `deviceId`, `hardwareId`, `status`, `provisioningState`,
`timestamp`, `firmwareVersion`, `lastIp`, `ssid` y RSSI. El backend acepta tanto
`provisioningState` como `provisioningStatus` y los
normaliza a `PENDING`, `BLE_READY`, `WIFI_CONNECTED`, `MQTT_CONNECTED`,
`COMPLETE` o `FAILED`.

### Base de datos

El changeset `20260915-device-provisioning` agrega en `device.device`:

- `hardware_id`, único cuando existe.
- `provisioning_status`.
- `provisioning_error`.
- `provisioning_updated_at`.
- `provisioned_at`.

El changeset `20260915-device-wifi-metadata` agrega `wifi_ssid` con un máximo
de 32 caracteres. `last_ip` ya se actualiza con el estado MQTT. Ambos son
metadatos informativos; la contraseña Wi-Fi no tiene columna, función de
consulta ni ruta REST.

La ingesta nueva usa la sobrecarga protegida de
`device.fn_ingest_sensor_reading(..., p_hardware_id)` y conserva la
idempotencia por `mqttMessageId`. Los estados MQTT usan la sobrecarga de
`device.fn_record_device_status(...)`, que actualiza identidad, conectividad y
estado de aprovisionamiento.

Liquibase ya aplicó los changesets DDL y de grants en la base local; el estado
verificado es de 223 changesets aplicados.

### Backend

Rutas relevantes:

```http
POST  /api/v1/devices
POST  /api/v1/devices/link
GET   /api/v1/devices
GET   /api/v1/devices/:deviceId
GET   /api/v1/devices/:deviceId/status
PATCH /api/v1/devices/:deviceId/provisioning
GET   /api/v1/devices/:deviceId/telemetry/latest
GET   /api/v1/devices/:deviceId/telemetry
```

El registro acepta `location`, pero no permite enviar manualmente un
`hardwareId`. La ruta de aprovisionamiento
permite a un usuario autorizado actualizar el estado administrativo del
proceso:

```json
{
  "hardwareId": "HS-680947471F14",
  "provisioningStatus": "COMPLETE",
  "provisioningError": null
}
```

El subscriber no recibe credenciales Wi-Fi. Solo procesa los mensajes MQTT,
valida sus campos y delega la persistencia al repositorio de PostgreSQL.

### Frontend

En **Dispositivos IoT** el frontend ya:

1. Registra un equipo únicamente con nombre, tipo y umbral; el código lógico
   lo genera el backend.
2. Muestra `hardwareId` y el estado de aprovisionamiento en cada tarjeta.
3. Muestra la última lectura persistida del ESP32.
4. Abre un apartado de configuración centralizado con nombre, ubicación,
   umbral, red Wi-Fi, IP, RSSI, estado BLE y enlace al historial.
5. Permite editar el estado y el error de aprovisionamiento mediante
   `PATCH /devices/:deviceId/provisioning`.
6. Permite descubrir un ESP32 por BLE desde la configuración, leer su identidad y
   enviar la configuración Wi-Fi/MQTT desde la pantalla de aprovisionamiento.

La pantalla solicita el dispositivo por Bluetooth usando los UUID del firmware,
lee el estado inicial, escucha las notificaciones y escribe el JSON de
configuración Wi-Fi/MQTT. La contraseña solo viaja por BLE y no se envía al
backend. La opción de conectar por Bluetooth se oculta automáticamente cuando
el estado inicial o una notificación confirma Wi-Fi conectado, incluso si
Mosquitto todavía no responde. Web Bluetooth requiere Chrome/Edge en HTTPS o localhost. En la app
móvil, `HidroSmartWebView.jsx` traduce los mensajes de la WebView a
`react-native-ble-plx`, por lo que el aprovisionamiento BLE funciona mediante un
development build.

## Prueba local reproducible

El ESP32 guarda hasta cinco perfiles, cada uno con su SSID, contraseÃ±a, host y
puerto MQTT. Si logra Wi-Fi pero no logra conectarse a Mosquitto, mantiene BLE
activo para recibir una correcciÃ³n del broker.

Con Docker levantado:

```powershell
docker compose --env-file .env ps
docker compose --env-file .env logs --tail=50 backend
docker compose --env-file .env exec mosquitto mosquitto_sub -h localhost -p 1883 -t "hidrosmart/devices/+/telemetry" -v
```

Para consultar la persistencia:

```powershell
$query = "SELECT d.code, d.hardware_id, d.wifi_ssid, d.last_ip, d.provisioning_status, d.connectivity_status, COUNT(sr.reading_id) AS readings, MAX(sr.recorded_at) AS last_reading FROM device.device d LEFT JOIN consumption.sensor_reading sr ON sr.device_id = d.device_id WHERE d.code = 'ESP32-001' GROUP BY d.code, d.hardware_id, d.wifi_ssid, d.last_ip, d.provisioning_status, d.connectivity_status;"
docker compose --env-file .env exec -T postgres psql -U hidro_smart_admin -d hidro_smart -c $query
```

La prueba de integración ejecutada el 2026-09-15 publicó un estado `ONLINE`
con `hardwareId=HW-ESP32-001` y una telemetría con
`mqttMessageId=integration-20260915-001`. El resultado observado fue:

```text
hardware_id: HW-ESP32-001
provisioning_status: COMPLETE
connectivity_status: ONLINE
flow_rate_lpm: 3.973
consumption_liters: 0.331
total_liters: 9.276
```

## Pendientes reales

- Cargar y compilar el firmware con PlatformIO sobre el ESP32 físico.
- Probar el GPIO con el caudalímetro y confirmar el nivel eléctrico seguro de la
  señal.
- Probar el flujo BLE del frontend con el ESP32 físico y confirmar permisos del
  navegador.
- Añadir autenticación, ACL y TLS a Mosquitto antes de cualquier despliegue.
- Validar el development build Android/iOS con el ESP32 físico; el código nativo
  ya está integrado, pero no se puede compilar iOS desde Windows.
