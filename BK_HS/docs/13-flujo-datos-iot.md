# Flujo de datos IoT actual

Fecha de revisión: 2026-09-14.

Este documento describe el flujo MQTT implementado en el backend y separa la persistencia de lecturas y estados de los comandos de actuadores ya expuestos por REST.

## Flujo de telemetría

```text
ESP32 + YF-S201
      |
      | MQTT publish
      v
Mosquitto :1883
      |
      | hidrosmart/devices/{deviceCode}/telemetry
      v
MqttSubscriber
      |
      v
message-parser
      |
      v
reading.handler
      |
      +--> logs normalizados (implementado)
      +--> IngestReading + PostgresTelemetryRepository + PostgreSQL (implementado)
```

El backend se conecta al broker desde Docker con `mqtt://mosquitto:1883`. En ejecución directa se usa la URL configurada en `.env`.

## Telemetría esperada

Para la primera integración con el ESP32 se aceptan estas métricas:

| Campo | Tipo | Significado |
|---|---|---|
| `pulses` | entero no negativo | Pulsos del YF-S201 durante el intervalo |
| `flowRateLpm` | número no negativo | Caudal instantáneo en litros por minuto |
| `consumptionLiters` | número no negativo | Litros consumidos en el intervalo |
| `totalLiters` | número no negativo, opcional | Acumulado del dispositivo |
| `signalQuality` | número, opcional | RSSI en dBm si llega como valor negativo |
| `wifiRssiDbm` | número, opcional | RSSI explícito en dBm |
| `timestamp` | ISO-8601 con zona, opcional | Hora de medición; el backend la normaliza a UTC y, si falta, usa recepción |

El parser requiere `flowRateLpm` y `consumptionLiters`. Las demás métricas se normalizan cuando llegan. Si el intervalo no es de un segundo, el firmware debe enviar `sampleIntervalSeconds` para que el backend pueda interpretarlo correctamente.

Ejemplo compatible:

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

## Topics

- Telemetría: `hidrosmart/devices/{deviceCode}/telemetry`, QoS 1, no retained.
- Estado: `hidrosmart/devices/{deviceCode}/status`, QoS 1, retained.
- Actuador: `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/status`, QoS 1, retained.
- Comandos: el publisher y la convención están preparados, pero todavía no existe el flujo completo desde una ruta REST o caso de uso.

El `deviceCode` debe coincidir con `device.device.code`. No se debe enviar un UUID inventado en el topic ni aceptar que el cuerpo cambie el dispositivo indicado por el topic.

## Persistencia implementada

La entrada MQTT ya escribe en `consumption.sensor_reading` mediante la función
SQL protegida. La resolución `deviceCode -> device_id -> home_id`, la
validación del estado/asignación, la idempotencia y el historial de telemetría
se ejecutan dentro del circuito de ingesta.

El frontend consulta la ultima lectura por `GET /api/v1/devices/:deviceId/telemetry/latest`.
La ruta comprueba la membresia del usuario al hogar del dispositivo y devuelve
`data: null` cuando el equipo todavia no ha enviado ninguna muestra.

El circuito implementado cubre:

1. Resolución segura del dispositivo por código.
2. Comprobación de dispositivo activo, hogar y relación autorizada.
3. Caso de uso `IngestReading` y `PostgresTelemetryRepository`.
4. Función SQL protegida con validación y grants mínimos necesarios.
5. Métricas MQTT, timestamps separados y deduplicación por `mqttMessageId`.
6. Idempotencia y manejo de duplicados por QoS 1.
7. Política para timestamp atrasado, futuro o fuera de rango.
8. La precisión ya quedó ajustada a `NUMERIC(14,3)` para litros y `NUMERIC(14,6)`
   para m³; queda validar la calibración con el caudalímetro real.

## Estado de dispositivo y actuadores

Los handlers de estado ya separan mensajes de dispositivo y actuador. El estado
del dispositivo y su historial se persisten; el control de electroválvula y
hidrobomba todavía requiere conectar el caso de uso, validar permisos y
completar el publisher desde una operación de negocio.

## Seguridad del broker

El Mosquitto incluido es exclusivamente de desarrollo:

- listener TCP en puerto 1883;
- conexiones anónimas;
- sin TLS;
- sin persistencia.

Para una red real se debe habilitar autenticación, ACL por dispositivo, TLS, identidad única y rotación de credenciales. No se debe conectar el ESP32 de producción a esta configuración abierta.

## Documento canónico

El contrato exacto de topics, payloads, normalización y comandos de prueba está en `14-mqtt-protocol.md`. Cuando se entregue el código del ESP32 se debe comparar contra ese contrato y actualizar ambos documentos si existe una decisión nueva.
