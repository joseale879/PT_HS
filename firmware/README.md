# Firmware ESP32 — HidroSmart

Última revisión: 2026-09-15.

Firmware base versionado para el dispositivo IoT de HidroSmart. El proyecto
usa PlatformIO y separa Wi-Fi, MQTT, sensores, actuadores, OTA y almacenamiento.

```text
firmware/
├── provisioning/   configuracion inicial
├── wifi/            conexion Wi-Fi
├── mqtt/            topics y contrato de mensajes
├── sensors/         lectura de caudal
├── actuators/       comandos y estados
├── ota/             actualizacion de firmware
├── storage/         secuencia y configuracion local
├── src/             punto de entrada compilable
└── tests/           pruebas de contrato
```

En esta red local, `provisioning/config.example.h` ya deja el broker en
`192.168.1.10:1883`, que corresponde al PC donde corre Mosquitto. Si la IP
cambia por DHCP, actualiza `HIDROSMART_MQTT_HOST`; desde el ESP32 no uses
`localhost`, `127.0.0.1` ni `mosquitto`.

Instala PlatformIO, copia `provisioning/config.example.h` como
`provisioning/config.h`, completa los secretos localmente y ejecuta:

```powershell
pio run
pio run -t upload
pio device monitor
```

Si el puerto no se detecta automáticamente, agrega `--upload-port COMx` al
comando de carga. El include de `provisioning/` está configurado en
`platformio.ini` y el archivo `config.h` está ignorado por Git.

## Provisionamiento Wi-Fi por BLE

El dispositivo guarda hasta cinco perfiles en NVS mediante `Preferences`. Cada
perfil contiene SSID, contraseÃ±a, host y puerto MQTT. Si Wi-Fi conecta pero
Mosquitto no responde, mantiene BLE activo para corregir el broker sin volver a
cargar el firmware.

El firmware ahora genera un `hardwareId` estable desde el eFuse del ESP32, por
ejemplo `HS-680947471F14`. Si `HIDROSMART_DEVICE_CODE` queda vacío, ese ID también se
usa como `deviceId` y como parte del topic MQTT. Si necesitas conservar la
vinculación anterior, define explícitamente `HIDROSMART_DEVICE_CODE` en tu
`config.h`.

El dispositivo guarda hasta cinco redes y la configuración del broker en NVS
mediante `Preferences`. Al iniciar intenta las redes guardadas; si ninguna
conecta, activa BLE con un nombre como `HidroSmart-470968` (los últimos seis
caracteres del hardwareId `HS-141F47470968`).

Para una primera prueba, usa una herramienta BLE local (por ejemplo nRF Connect)
con estos identificadores:

```text
Servicio:       4fafc201-1fb5-459e-8fcc-c5c9c331914b
Configuración:  beb5483e-36e1-4688-b7f5-ea07361b26a8
Estado:         beb5483e-36e1-4688-b7f5-ea07361b26a9
```

Escribe este JSON en la característica **Configuración**; lee y escucha los
estados en la característica **Estado**:

```json
{
  "ssid": "NOMBRE_DE_LA_RED",
  "password": "CLAVE_WIFI",
  "mqttHost": "192.168.1.10",
  "mqttPort": 1883,
  "deviceCode": "ESP32-001"
}
```

`deviceCode` es opcional por compatibilidad; cuando se envía, el ESP32 lo
valida y lo usa para publicar el topic lógico después de guardar la
configuración. El `hardwareId` sigue identificando la placa física.

El firmware prueba la red antes de guardarla. El resultado se envía por
notificaciones BLE con estados como `wifi_connecting`, `wifi_failed`,
`wifi_connected`, `mqtt_unreachable` o `provisioning_complete`. La contraseña
Wi-Fi no se publica en MQTT, PostgreSQL, Git ni en los logs.

La pantalla web de dispositivos ya consume este contrato en Chrome/Edge sobre
HTTPS o localhost. En un dispositivo físico usa la IP del PC donde corre
Mosquitto, nunca `localhost`. La aplicación móvil usa el puente nativo
`react-native-ble-plx`; para BLE se requiere un development build, no Expo Go.

Esta primera versión deja el servicio BLE sin pairing ni PIN para facilitar la
prueba en laboratorio. Antes de usarla fuera de una red controlada se debe añadir
autenticación BLE y rotación segura de credenciales.

Cada lectura publica `mqttMessageId`, `timestamp`, `flowRateLpm`,
`consumptionLiters`, `totalLiters`, `pulses`, `sampleIntervalSeconds`,
`wifiRssiDbm` y `signalQuality`. El identificador combina el dispositivo, una sesión de arranque
aleatoria y la secuencia de la lectura, por lo que no se repite entre reinicios.
