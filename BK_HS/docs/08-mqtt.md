# MQTT — HidroSmart

Fecha de revisión: 2026-09-04.

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
- [ ] Persistencia MQTT -> PostgreSQL.
- [ ] Comandos de actuadores desde una ruta/caso de uso.
- [ ] Seguridad de broker para un entorno real.

## Arquitectura de archivos

```text
src/config/mqtt.js
src/core/application/ports/services/IMqttService.js
src/core/infrastructure/services/mqtt/MqttClient.js
src/core/infrastructure/services/mqtt/MqttPublisher.js
src/core/infrastructure/services/mqtt/MqttSubscriber.js
src/mqtt/topics.js
src/mqtt/message-parser.js
src/mqtt/handlers/reading.handler.js
src/mqtt/handlers/device-status.handler.js
src/mqtt/handlers/actuator-status.handler.js
```

`MqttClient` administra la conexión. `MqttSubscriber` recibe mensajes. `message-parser` valida y normaliza. Los handlers adaptan cada mensaje a la siguiente operación, que para lecturas todavía es logging y no persistencia.

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

En ejecución directa desde Windows, la URL del broker es `mqtt://localhost:1883`. Dentro de Docker es `mqtt://mosquitto:1883`.

## Topics actuales

| Dirección | Topic | QoS | Retain |
|---|---|---:|---:|
| ESP32 -> backend | `hidrosmart/devices/{deviceCode}/telemetry` | 1 | No |
| ESP32 -> backend | `hidrosmart/devices/{deviceCode}/status` | 1 | Sí |
| ESP32 -> backend | `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/status` | 1 | Sí |
| backend -> ESP32, preparado | `hidrosmart/devices/{deviceCode}/config` | 1 | según uso |
| backend -> ESP32, preparado | `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/command` | 1 | No |

El código `{deviceCode}` debe coincidir con `device.device.code`. La base de datos aún no se consulta desde el handler para resolver ese código.

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

## Flujo pendiente de persistencia

```text
reading.handler
    -> resolver deviceCode y home
    -> ReceiveReading
    -> repositorio PostgreSQL
    -> consumption.sensor_reading
    -> device.device_telemetry_history (si aplica)
```

El flujo anterior todavía no está conectado. Además, `consumption_liters` es `NUMERIC(10,2)` y no conserva correctamente una lectura de `0.040 L` por segundo; primero se necesita una migración de precisión y sus pruebas.

QoS 1 puede entregar duplicados. La persistencia debe incluir una clave de idempotencia o secuencia por dispositivo.

## Prueba local

Con la pila levantada, publica contra `localhost:1883`:

```powershell
docker compose exec mosquitto mosquitto_pub -h localhost -p 1883 -t hidrosmart/devices/ESP32-246F28ABCDEF/telemetry -q 1 -m '{"flowRateLpm":2.4,"consumptionLiters":0.04,"totalLiters":3.407,"pulses":18,"signalQuality":-56,"timestamp":"2026-09-04T15:30:00Z"}'
docker compose logs -f backend
```

El resultado esperado actualmente es un mensaje normalizado en los logs del backend. No se debe esperar todavía una fila nueva en PostgreSQL.

## Seguridad

El archivo `BK_HS/docker/mosquitto/mosquitto.conf` permite anónimo, no usa TLS y desactiva persistencia. Esto es válido solo para desarrollo local. Antes de conectar dispositivos fuera del equipo de desarrollo deben agregarse autenticación, ACL por dispositivo, TLS y rotación de credenciales.
