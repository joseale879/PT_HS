# Contrato MQTT del firmware

Topic: `hidrosmart/devices/{deviceCode}/telemetry`

```json
{
  "mqttMessageId": "ESP32-001-00000001-42",
  "deviceId": "ESP32-001",
  "timestamp": "2026-09-12T12:00:00.000Z",
  "flowRateLpm": 2.4,
  "consumptionLiters": 0.04,
  "totalLiters": 3.407,
  "pulses": 1,
  "sampleIntervalSeconds": 1,
  "wifiRssiDbm": -56,
  "batteryLevel": 100,
  "voltage": 5,
  "temperature": 25
}
```

`mqttMessageId` debe conservarse al reintentar el mismo evento.

El backend local mantiene compatibilidad temporal con el firmware anterior que
no enviaba `mqttMessageId` mediante `MQTT_ALLOW_LEGACY_TELEMETRY=true`. Esa
compatibilidad genera un identificador interno y no ofrece deduplicaciÃ³n ante
reentregas; el firmware actualizado debe seguir enviando el identificador
propio mostrado arriba.

Para el caudalímetro YF-S201, el firmware calcula:

```text
flowRateLpm = (pulsos del intervalo / segundos del intervalo) / 7.5
consumptionLiters = flowRateLpm * segundos del intervalo / 60
```

El intervalo predeterminado es de 5 segundos y se puede cambiar mediante
`HIDROSMART_SAMPLE_INTERVAL_MS` en `provisioning/config.h`.
