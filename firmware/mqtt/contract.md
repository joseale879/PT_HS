# Contrato MQTT del firmware

Topic: `hidrosmart/devices/{deviceCode}/telemetry`

Cuando `HIDROSMART_DEVICE_CODE` está vacío, `{deviceCode}` es el `hardwareId`
generado por el ESP32 usando los 12 caracteres hexadecimales del eFuse, por
ejemplo `HS-680947471F14`. Ese valor debe registrarse o
vincularse en HidroSmart antes de esperar lecturas en un hogar.

```json
{
  "mqttMessageId": "ESP32-001-00000001-42",
  "deviceId": "ESP32-001",
  "hardwareId": "HS-680947471F14",
  "timestamp": "2026-09-12T12:00:00.000Z",
  "flowRateLpm": 2.4,
  "consumptionLiters": 0.04,
  "totalLiters": 3.407,
  "pulses": 1,
  "sampleIntervalSeconds": 1,
  "wifiRssiDbm": -56,
  "signalQuality": -56,
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

## Aprovisionamiento BLE

El ESP32 activa el servicio BLE
`4fafc201-1fb5-459e-8fcc-c5c9c331914b`, la característica de configuración
`beb5483e-36e1-4688-b7f5-ea07361b26a8` y la característica de estado
`beb5483e-36e1-4688-b7f5-ea07361b26a9`. El nombre anunciado es
`HidroSmart-XXXXXX`, usando el identificador de hardware sin el prefijo `HS-`.

La primera lectura de la característica devuelve el estado del dispositivo:

```json
{
  "state": "ready",
  "hardwareId": "HS-680947471F14",
  "deviceCode": "HS-680947471F14",
  "firmwareVersion": "1.1.0",
  "savedNetworks": 0,
  "wifiConnected": false,
  "mqttConnected": false
}
```

El frontend escribe la configuración en la característica **Configuración** y
lee/escucha los estados en la característica **Estado**:

```json
{
  "ssid": "APRENDICES",
  "password": "TU_PASSWORD",
  "mqttHost": "10.3.234.166",
  "mqttPort": 1883,
  "deviceCode": "ESP32-001"
}
```

`deviceCode` es opcional para conservar compatibilidad con clientes antiguos;
cuando se envía, el ESP32 lo valida, lo guarda después de conectar Wi-Fi y lo
usa para publicar el topic lógico. `hardwareId` sigue siendo la identidad
física y no se reemplaza.

El ESP32 notifica `wifi_connecting`, `wifi_connected`,
`provisioning_complete`, `wifi_failed` o `mqtt_unreachable`. Los estados de
conexión incluyen `hardwareId`, `deviceCode`, `firmwareVersion`,
`savedNetworks`, `wifiConnected` y `mqttConnected`; cuando corresponde,
también incluyen `ssid`, `ip` y `rssi`.

`mqtt_unreachable` no borra la red guardada y mantiene BLE disponible para
corregir `mqttHost` o `mqttPort`. El firmware guarda como máximo cinco perfiles
SSID, cada uno con su contraseña y configuración MQTT.

`signalQuality` conserva el RSSI en dBm (por ejemplo `-38`) para coincidir con
el payload del ESP32. El backend también acepta el nombre anterior
`wifiRssiDbm` y normaliza ambos valores.
