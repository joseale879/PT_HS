# Flujo de datos IoT actual

Fecha de revisión: 2026-09-04.

Este documento describe el flujo que ya existe en el backend y separa el transporte implementado de la persistencia y los comandos que aún están pendientes.

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
      +--> ReceiveReading + repository + PostgreSQL (pendiente)
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
| `timestamp` | ISO-8601, opcional | Hora de medición; si falta se usa recepción |

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

## Persistencia pendiente

La base de datos ya tiene `device.device`, `device.home_device`, `consumption.sensor_reading` y `device.device_telemetry_history`, pero la entrada MQTT aún no escribe allí.

Antes de guardar lecturas hay que implementar:

1. Resolución segura del dispositivo por código.
2. Comprobación de dispositivo activo, hogar y relación autorizada.
3. Caso de uso `ReceiveReading` y repositorio PostgreSQL.
4. Usuario/rol de ingestión con los grants mínimos necesarios.
5. Idempotencia y manejo de duplicados por QoS 1.
6. Política para timestamp atrasado, futuro o fuera de rango.
7. Ajuste de precisión de `consumption_liters`, que hoy es `NUMERIC(10,2)` y no representa adecuadamente lecturas de `0.040 L` por segundo.

## Estado de dispositivo y actuadores

Los handlers de estado ya separan mensajes de dispositivo y actuador. La actualización persistente del historial de salud y el control de electroválvula/hidrobomba todavía requieren conectar el caso de uso, validar permisos y completar el publisher desde una operación de negocio.

## Seguridad del broker

El Mosquitto incluido es exclusivamente de desarrollo:

- listener TCP en puerto 1883;
- conexiones anónimas;
- sin TLS;
- sin persistencia.

Para una red real se debe habilitar autenticación, ACL por dispositivo, TLS, identidad única y rotación de credenciales. No se debe conectar el ESP32 de producción a esta configuración abierta.

## Documento canónico

El contrato exacto de topics, payloads, normalización y comandos de prueba está en `14-mqtt-protocol.md`. Cuando se entregue el código del ESP32 se debe comparar contra ese contrato y actualizar ambos documentos si existe una decisión nueva.
