# Protocolo MQTT implementado

Fecha de revisión: 2026-09-04.

Este es el contrato vigente entre el backend y el futuro firmware ESP32. Sustituye los ejemplos antiguos basados en `hidro-smart/device/...`.

## Identidad del dispositivo

`{deviceCode}` debe ser el valor de `device.device.code` registrado en HidroSmart. Se permiten letras, números, guiones y guiones bajos. Ejemplo: `ESP32-246F28ABCDEF`.

El código del topic es la fuente de identidad del mensaje. Cuando se implemente la persistencia, el backend deberá resolverlo contra PostgreSQL y no aceptar un dispositivo desconocido.

## Topics

| Dirección | Uso | Topic | QoS | Retain |
|---|---|---|---:|---:|
| ESP32 -> backend | Telemetría | `hidrosmart/devices/{deviceCode}/telemetry` | 1 | No |
| ESP32 -> backend | Estado del dispositivo | `hidrosmart/devices/{deviceCode}/status` | 1 | Sí |
| ESP32 -> backend | Estado de actuador | `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/status` | 1 | Sí |
| backend -> ESP32 | Configuración preparada | `hidrosmart/devices/{deviceCode}/config` | 1 | según uso |
| backend -> ESP32 | Comando preparado | `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/command` | 1 | No |

El backend se suscribe actualmente a los tres topics de entrada. El publisher conoce los topics de salida, pero todavía no existe una ruta REST/caso de uso que envíe comandos de actuadores.

## Telemetría del YF-S201

El parser requiere `flowRateLpm` y `consumptionLiters`.

| Campo | Requerido | Tipo | Regla |
|---|---:|---|---|
| `flowRateLpm` | Sí | número | mayor o igual a cero, L/min |
| `consumptionLiters` | Sí | número | mayor o igual a cero, consumo del intervalo |
| `totalLiters` | No | número | mayor o igual a cero, acumulado del dispositivo |
| `pulses` | No | entero | mayor o igual a cero |
| `sampleIntervalSeconds` | No | número | mayor que cero si no se publica cada segundo |
| `timestamp` | No | texto ISO-8601 | hora de medición; si falta se usa recepción |
| `signalQuality` | No | número | RSSI en dBm si es negativo; también acepta porcentaje |
| `wifiRssiDbm` | No | número | RSSI explícito en dBm |
| `signalQualityPercent` | No | número | porcentaje de calidad, entre 0 y 100 |
| `batteryLevel` | No | número | entre 0 y 100 |
| `voltage` | No | número | entre 0 y 60 V |
| `temperature` | No | número | entre -55 y 125 °C |

Ejemplo recomendado para la primera prueba:

```json
{
  "flowRateLpm": 2.40,
  "consumptionLiters": 0.040,
  "totalLiters": 3.407,
  "pulses": 18,
  "signalQuality": -56,
  "timestamp": "2026-09-04T10:30:00-05:00"
}
```

`consumptionLiters` representa solo el intervalo publicado, no el acumulado. Si el firmware mide una vez por segundo, `2.40 L/min / 60 = 0.040 L` en ese segundo.

`signalQuality: -56` se normaliza como `wifiRssiDbm: -56` y como calidad porcentual para el futuro historial de dispositivo. El firmware puede enviar directamente `wifiRssiDbm` y `signalQualityPercent` si ya calcula ambos.

`totalLiters` es útil para diagnóstico, pero el total confiable del sistema debe calcularse con lecturas persistidas porque el contador del ESP32 puede reiniciarse.

## Estado del dispositivo

El ESP32 debe publicar `ONLINE` retenido al conectar y configurar el Last Will como `OFFLINE` retenido:

Topic: `hidrosmart/devices/{deviceCode}/status`

```json
{ "status": "ONLINE", "timestamp": "2026-09-04T15:00:00Z" }
```

Estados admitidos: `ONLINE`, `OFFLINE` y `ERROR`.

## Estado de actuadores

Topic: `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/status`.

```json
{ "actuator": "VALVE", "status": "OPEN", "timestamp": "2026-09-04T15:00:00Z" }
```

Para `VALVE` se esperan `OPEN` y `CLOSED`; para `PUMP`, `ON` y `OFF`. El actuador del cuerpo debe coincidir con el segmento del topic.

## Flujo actualmente implementado

```text
MQTT broker -> MqttSubscriber -> message-parser -> handler -> logs normalizados
                                                   -> PostgreSQL (pendiente)
```

Archivos principales:

- `src/config/mqtt.js`
- `src/core/infrastructure/services/mqtt/MqttClient.js`
- `src/core/infrastructure/services/mqtt/MqttPublisher.js`
- `src/core/infrastructure/services/mqtt/MqttSubscriber.js`
- `src/mqtt/topics.js`
- `src/mqtt/message-parser.js`
- `src/mqtt/handlers/reading.handler.js`
- `src/mqtt/handlers/device-status.handler.js`
- `src/mqtt/handlers/actuator-status.handler.js`

La validación y normalización están implementadas. `reading.handler.js` todavía no invoca `ReceiveReading` ni un repositorio.

## Persistencia pendiente

Cuando se cierre la ingestión, el backend deberá:

1. resolver `deviceCode` contra `device.device.code`;
2. comprobar dispositivo activo y asociación en `device.home_device`;
3. validar límites, timestamp y duplicados;
4. insertar consumo en `consumption.sensor_reading`;
5. guardar salud en `device.device_telemetry_history` si corresponde;
6. usar permisos mínimos y registrar errores sin perder el mensaje.

Advertencia actual: `consumption.sensor_reading.consumption_liters` es `NUMERIC(10,2)`. No conserva la escala de `0.040 L`. Debe existir una migración Liquibase antes de ingerir lecturas por segundo y deben revisarse las funciones/vistas que usan `consumption_m3`.

Como MQTT QoS 1 puede reentregar mensajes, la persistencia debe usar una secuencia o clave de idempotencia por dispositivo.

## Configuración local

| Variable | Docker | Ejecución directa |
|---|---|---|
| `MQTT_BROKER_URL` | `mqtt://mosquitto:1883` | `mqtt://localhost:1883` |
| `MQTT_CLIENT_ID` | `hidrosmart-backend` | valor local equivalente |
| `MQTT_QOS` | `1` | `1` |
| `MQTT_RECONNECT_PERIOD_MS` | `3000` | configurable |
| `MQTT_CONNECT_TIMEOUT_MS` | `10000` | configurable |

El broker de desarrollo escucha en `localhost:1883` desde Windows. `BK_HS/docker/mosquitto/mosquitto.conf` permite conexiones anónimas, no usa TLS y no tiene persistencia.

## Prueba local

Con Docker levantado:

```powershell
docker compose exec mosquitto mosquitto_pub -h localhost -p 1883 -t hidrosmart/devices/ESP32-246F28ABCDEF/telemetry -q 1 -m '{"flowRateLpm":2.4,"consumptionLiters":0.04,"totalLiters":3.407,"pulses":18,"signalQuality":-56,"timestamp":"2026-09-04T15:30:00Z"}'
docker compose logs -f backend
```

El resultado esperado hoy es un payload normalizado en los logs del backend. No se debe esperar todavía una fila nueva en PostgreSQL.

## Seguridad para una etapa posterior

Antes de utilizar el broker fuera del desarrollo local se necesitan autenticación, ACL por dispositivo, TLS, identidad única, rotación de credenciales y límites de tamaño/frecuencia. El firmware no debe conectarse a la configuración anónima de desarrollo en una red real.
