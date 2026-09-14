# MQTT — HidroSmart

Fecha de revisión: 2026-09-14.

Este documento resume la implementación actual. El contrato detallado para el firmware está en `14-mqtt-protocol.md`; `13-flujo-datos-iot.md` describe la arquitectura y sus pendientes.

## Estado

- [x] Configuración MQTT del backend.
- [x] Cliente persistente con reconexión.
- [x] Publisher de infraestructura.
- [x] Subscriber de telemetría, estado y actuadores.
- [x] Parser y validación de payloads.
- [x] Handlers separados por tipo de mensaje.
- [x] Broker Mosquitto en Docker para desarrollo.
- [x] Prueba local de recepción y normalización.
- [x] Persistencia MQTT -> PostgreSQL con función protegida e idempotencia.
- [x] Comandos de actuadores desde una ruta/caso de uso.
- [ ] Seguridad de broker para un entorno real.

## Arquitectura de archivos

```text
src/config/mqtt.js
src/core/application/ports/services/IMqttService.js
src/core/infrastructure/services/mqtt/MqttClient.js
src/core/infrastructure/services/mqtt/MqttPublisher.js
src/core/infrastructure/services/mqtt/mqttClientSingleton.js
src/core/infrastructure/services/mqtt/MqttSubscriber.js
src/core/application/use-cases/actuator/ActuatorOperations.js
src/core/infrastructure/repositories/postgres/PostgresActuatorRepository.js
src/api/actuator.routes.js
src/mqtt/topics.js
src/mqtt/message-parser.js
src/mqtt/handlers/reading.handler.js
src/mqtt/handlers/device-status.handler.js
src/mqtt/handlers/actuator-status.handler.js
```

`MqttClient` administra la conexión. `MqttSubscriber` recibe mensajes. `message-parser` valida y normaliza. El handler de lecturas delega en `IngestReading`, que usa `PostgresTelemetryRepository` para persistir mediante una función SQL controlada y registrar el resultado de deduplicación.

## Configuración local

Variables del backend:

| Variable | Uso | Docker local |
|---|---|---|
| `MQTT_BROKER_URL` | URL del broker | `mqtt://mosquitto:1883` |
| `MQTT_USERNAME` | usuario del broker | vacío en Mosquitto local |
| `MQTT_PASSWORD` | contraseña del broker | vacía en Mosquitto local |
| `MQTT_CLIENT_ID` | identidad del backend | `hidrosmart-backend` |
| `MQTT_QOS` | calidad de servicio | `1` |
| `MQTT_RECONNECT_PERIOD_MS` | reconexión | `3000` |
| `MQTT_CONNECT_TIMEOUT_MS` | timeout de conexión | `10000` |

Los comandos `Pending` o `Published` sin ACK se marcan como `TimedOut` por el job
de backend. El comportamiento se configura con `ACTUATOR_COMMAND_TIMEOUT_MS`
(60 000 ms por defecto) y `ACTUATOR_COMMAND_TIMEOUT_BATCH_SIZE` (100 por ciclo).

En ejecución directa desde Windows, la URL del broker es `mqtt://localhost:1883`. Dentro de Docker es `mqtt://mosquitto:1883`.

Los comandos REST se publican en `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/command`. El backend guarda el ciclo de vida en `device.actuator_command`; el ESP32 puede devolver el mismo `correlationId` en el topic de estado para cerrar el comando como `Acknowledged`.

## Topics actuales

| Dirección | Topic | QoS | Retain |
|---|---|---:|---:|
| ESP32 -> backend | `hidrosmart/devices/{deviceCode}/telemetry` | 1 | No |
| ESP32 -> backend | `hidrosmart/devices/{deviceCode}/status` | 1 | Sí |
| ESP32 -> backend | `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/status` | 1 | Sí |
| backend -> ESP32, preparado | `hidrosmart/devices/{deviceCode}/config` | 1 | según uso |
| backend -> ESP32, preparado | `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/command` | 1 | No |

El código `{deviceCode}` debe coincidir con `device.device.code`. El handler
resuelve ese código mediante la función SQL protegida y rechaza dispositivos
desconocidos, inactivos, no asignados o payloads fuera de las reglas.

## Telemetría

El payload mínimo requiere `flowRateLpm` y `consumptionLiters`. Estas métricas se pueden agregar:

```json
{
  "flowRateLpm": 2.4,
  "consumptionLiters": 0.04,
  "totalLiters": 3.407,
  "pulses": 18,
  "signalQuality": -56,
  "timestamp": "2026-09-04T15:30:00Z"
}
```

El parser normaliza `signalQuality: -56` como RSSI Wi-Fi y calcula una calidad porcentual normalizada. También admite `wifiRssiDbm`, `signalQualityPercent`, `sampleIntervalSeconds`, `batteryLevel`, `voltage` y `temperature` con las validaciones descritas en `14-mqtt-protocol.md`.

## Flujo de persistencia

```text
reading.handler
    -> resolver y normalizar deviceCode
    -> IngestReading
    -> PostgresTelemetryRepository
    -> función SQL controlada
    -> consumption.sensor_reading
    -> device.device_telemetry_history (si aplica)
```

El flujo anterior está conectado. La función SQL conserva la lectura y las
métricas disponibles, separa `measured_at` de `received_at`, marca timestamps
sospechosos y aplica idempotencia por `mqttMessageId`.

QoS 1 puede entregar duplicados. El payload debe incluir `mqttMessageId` estable por lectura. La BD aplica un índice único parcial por dispositivo y mensaje, y la función de ingesta usa `ON CONFLICT DO NOTHING`.

## Prueba local

Con la pila levantada, publica contra `localhost:1883`:

```powershell
docker compose exec mosquitto mosquitto_pub -h localhost -p 1883 -t hidrosmart/devices/ESP32-246F28ABCDEF/telemetry -q 1 -m '{"flowRateLpm":2.4,"consumptionLiters":0.04,"totalLiters":3.407,"pulses":18,"signalQuality":-56,"timestamp":"2026-09-04T15:30:00Z"}'
docker compose logs -f backend
```

El resultado esperado es un mensaje procesado y una fila nueva en PostgreSQL,
salvo que el mismo `mqttMessageId` ya exista, en cuyo caso se descarta el
duplicado.

## Seguridad

El archivo `BK_HS/docker/mosquitto/mosquitto.conf` permite anónimo solo para desarrollo local, habilita persistencia y usa el volumen `hidro_smart_mosquitto_data`. Antes de conectar dispositivos fuera del equipo de desarrollo deben agregarse autenticación, ACL por dispositivo, TLS y rotación de credenciales.
