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

Instala PlatformIO, copia `provisioning/config.example.h` como
`provisioning/config.h`, completa los secretos localmente y ejecuta `pio run`.
El include de `provisioning/` está configurado en `platformio.ini` y el archivo
`config.h` está ignorado por Git.

Cada lectura publica `mqttMessageId`, `timestamp`, `flowRateLpm` y
`consumptionLiters`. El identificador combina el dispositivo, una sesión de
arranque aleatoria y la secuencia de la lectura, por lo que se conserva al
reintentar el mismo evento QoS 1 sin repetir la secuencia entre reinicios.
