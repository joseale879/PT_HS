# Firmware ESP32 — HidroSmart

Última revisión: 2026-09-14.

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
comando de carga. En un ESP32 físico, `HIDROSMART_MQTT_HOST` debe ser la IP
local del equipo donde está publicado Mosquitto; nunca uses `localhost`.
El include de `provisioning/` está configurado en `platformio.ini` y el archivo
`config.h` está ignorado por Git.

Cada lectura publica `mqttMessageId`, `timestamp`, `flowRateLpm`,
`consumptionLiters`, `totalLiters`, `pulses`, `sampleIntervalSeconds` y
`wifiRssiDbm`. El identificador combina el dispositivo, una sesión de arranque
aleatoria y la secuencia de la lectura, por lo que no se repite entre reinicios.
