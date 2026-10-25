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
