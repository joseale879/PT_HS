# Contrato MQTT del ESP32

## Un ID lógico activo por placa

El ESP32 selecciona un solo código lógico activo por vez entre
`HS-7A3F91C8D2E4`, `HS-B6E04D79A153`, `HS-2C8A5F01E7B9` y
`HS-141F47470968`, y publica cada lectura una sola vez en su tópico
`telemetry`. Se suscribe a comandos de los cuatro códigos para que la orden de
vigilancia llegue aunque cambie el ID activo. El `hardwareId` derivado del
eFuse identifica la placa física y no sustituye el código lógico.

La ACL Flespi del ESP32 debe permitir publicar `status` y `telemetry` para los
cuatro códigos y suscribirse a `commands` para los cuatro. El backend conserva
un token separado.

## Topics

```text
hidrosmart/devices/{deviceCode}/telemetry
hidrosmart/devices/{deviceCode}/status
hidrosmart/devices/{deviceCode}/commands
```

`deviceCode` es el código lógico de la placa. `hardwareId` continúa siendo la
identidad física inmutable y viaja en cada estado y lectura.

## Telemetría

Publicada cada cinco segundos por defecto en `telemetry`:

```json
{
  "mqttMessageId": "HS-7A3F91C8D2E4-123456-42",
  "deviceId": "HS-7A3F91C8D2E4",
  "hardwareId": "HS-141F47470968",
  "timestamp": "2026-10-11T12:00:00Z",
  "flowRateLpm": 2.4,
  "consumptionLiters": 0.2,
  "totalLiters": 3.4,
  "pulses": 18,
  "sampleIntervalSeconds": 5,
  "measurementEnabled": true,
  "wifiRssiDbm": -56,
  "signalQuality": -56
}
```

No cambies `mqttMessageId` al reintentar exactamente la misma lectura. El
backend lo usa para evitar duplicados.

Con `measurementEnabled: false`, `flowRateLpm` y `pulses` siguen reflejando el
sensor; `consumptionLiters` se envía como cero y `totalLiters` queda congelado.
La base de datos usa el caudal/pulsos durante ese modo para evaluar la regla de
fuga continua.

El cálculo predeterminado del YF-S201 es:

```text
flowRateLpm = (pulsos / segundos) / 7.5
consumptionLiters = flowRateLpm × segundos / 60
```

## Estado

El estado MQTT retenido del código activo contiene, entre otros, `deviceId`, `hardwareId`,
`status`, `provisioningState`, `timestamp`, `firmwareVersion`, `lastIp`,
`linkedToHome`, `measurementEnabled`, `bleLocked`, `ssid` y `wifiRssiDbm`.

El campo `status` utiliza `ONLINE` u `OFFLINE`. `provisioningState` expresa
`PENDING`, `BLE_READY`, `WIFI_CONNECTED`, `MQTT_CONNECTED` o `COMPLETE`.

## Comandos

El backend publica JSON en `commands`:

```json
{ "command": "confirm_link" }
```

Para alternar entre el conteo normal y la vigilancia de fugas, el backend envía:

```json
{
  "command": "set_measurement",
  "enabled": false,
  "commandId": "uuid-de-la-orden",
  "timestamp": "2026-10-28T12:00:00Z"
}
```

El ESP32 persiste el valor de `enabled`, pero mantiene activa la interrupción del
caudalímetro y sigue publicando lecturas cada cinco segundos. Con `enabled: false`,
los litros dejan de sumarse al total del hogar; el caudal y los pulsos reales se
siguen guardando para que el detector de flujo continuo pueda generar alertas de
fuga. Wi-Fi y MQTT permanecen conectados. La interfaz refleja el modo confirmado
por `status`; la aceptación del publish MQTT por sí sola no confirma la ejecución.

| Comando | Efecto |
| --- | --- |
| `confirm_link` | Marca hogar asociado y detiene BLE. |
| `unlink` | Elimina asociación, conserva Wi-Fi y vuelve a anunciar BLE. |
| `enable_ble` | Habilita BLE para configuración. |
| `disable_ble` | Solo se acepta si la placa ya está asociada. |
| `set_measurement` | `enabled: false` activa vigilancia: no suma litros al total, pero conserva lecturas de caudal/pulsos para fugas; `true` reanuda el conteo normal. No apaga la placa, el sensor ni MQTT. |

## BLE

El servicio BLE usa `4fafc201-1fb5-459e-8fcc-c5c9c331914b`; la característica
de escritura de configuración es `beb5483e-36e1-4688-b7f5-ea07361b26a8` y la
de lectura/notificación de estado es `beb5483e-36e1-4688-b7f5-ea07361b26a9`.

Si MQTT no está disponible, el firmware conserva las redes guardadas y mantiene
BLE disponible mientras el dispositivo no esté asociado. `confirm_link` guarda
el bloqueo de BLE, cierra las conexiones GATT activas y detiene el anuncio;
`unlink` elimina la asociación y vuelve a anunciar BLE. Mantener BOOT durante
cinco segundos habilita la recuperación física local. El servicio BLE no usa
pairing ni PIN.

La configuración BLE admite `ssid`, `password`, `mqttHost`, `mqttPort` y
`deviceCode`. No incluye ni publica contraseñas MQTT; esas se compilan en
`config.h` cuando el broker las requiere.

Al cambiar solo el `deviceCode`, la app puede enviar `password` vacía porque
el firmware no devuelve la contraseña Wi-Fi por BLE. Si el SSID ya está
guardado, el ESP32 reutiliza la contraseña almacenada y mantiene la conexión
Wi-Fi existente cuando ya está conectado a esa red.

Para Flespi, el ESP32 usa MQTT sobre TLS en `mqtt.flespi.io:8883`, valida el
certificado con el CA público incluido en `provisioning/flespi_root_ca.h` y
autentica con un token ACL exclusivo para la placa. La contraseña MQTT puede
quedar vacía cuando el token se envía como usuario. Asigna ACL del dispositivo
solo a sus topics: publicar telemetría/estado propios y suscribirse a comandos
propios. El backend usa otro token con permisos de suscripción y publicación
limitados a sus funciones.
