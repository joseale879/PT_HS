# Pruebas de firmware

- Cada perfil guardado conserva su SSID, contraseÃ±a, host y puerto MQTT.
- Si Wi-Fi conecta y MQTT falla, el dispositivo activa o conserva BLE para
  corregir el broker.

- Un evento nuevo genera un `mqttMessageId` nuevo.
- El `hardwareId` conserva el mismo valor después de reiniciar el ESP32.
- Una red enviada por BLE solo aparece en NVS después de conectar correctamente.
- Una red válida vuelve a conectar automáticamente después de reiniciar.
- Un JSON BLE inválido devuelve `invalid_json` o `invalid_configuration`.
- Una configuración válida devuelve `provisioning_complete` cuando MQTT responde.
- El topic usa `hidrosmart/devices/{deviceCode}/telemetry` y conserva el payload
  del YF-S201 con `mqttMessageId`, `hardwareId`, `wifiRssiDbm` y
  `signalQuality`.

La prueba física BLE puede ejecutarse desde la pantalla web en Chrome/Edge o
con nRF Connect. En iOS se debe validar mediante la aplicación móvil nativa,
porque Safari no ofrece Web Bluetooth.
- Un reintento conserva el mismo identificador.
- El timestamp se expresa en ISO 8601 UTC.
- Las metricas respetan los rangos aceptados por el backend.
