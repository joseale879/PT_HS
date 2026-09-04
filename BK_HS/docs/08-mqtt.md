# MQTT — Hidro Smart

## 1. Introducción

MQTT es el mecanismo de comunicación utilizado para conectar los dispositivos IoT de Hidro Smart con el backend.

El objetivo es permitir:

- Enviar lecturas desde el ESP32 hacia el backend.
- Informar el estado del ESP32.
- Informar el estado de los actuadores.
- Enviar comandos desde el backend hacia el ESP32.
- Controlar la electroválvula.
- Controlar la hidrobomba.

La comunicación se realiza mediante un **MQTT Broker**.

---

# 2. Flujo general

```text
                    HIDRO SMART BACKEND
                           │
                           │ MQTT
                           ▼
                      MQTT BROKER
                           │
                           │ MQTT
                           ▼
                         ESP32
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
                Sensor          Actuadores
                YF-S201        ┌─────┴─────┐
                               ▼           ▼
                         Electroválvula  Hidrobomba
```

El backend no se comunica directamente con los pines del ESP32.

La comunicación física con los dispositivos es responsabilidad del firmware del ESP32.

---

# 3. Ubicación en el backend

Los componentes MQTT se distribuyen de la siguiente manera:

```text
src/
│
├── config/
│   └── mqtt.js
│
├── core/
│   ├── application/
│   │   └── ports/
│   │       └── services/
│   │           └── IMqttService.js
│   │
│   └── infrastructure/
│       └── services/
│           └── mqtt/
│               ├── MqttClient.js
│               ├── MqttPublisher.js
│               └── MqttSubscriber.js
│
└── mqtt/
    ├── topics.js
    ├── message-parser.js
    └── handlers/
        ├── reading.handler.js
        ├── device-status.handler.js
        └── actuator-status.handler.js
```

---

# 4. Componentes

## `config/mqtt.js`

Contiene la configuración necesaria para conectarse al broker MQTT.

No debe contener secretos directamente.

La configuración debe obtenerse mediante variables de entorno.

Ejemplo conceptual:

```text
MQTT_BROKER_URL
MQTT_USERNAME
MQTT_PASSWORD
MQTT_CLIENT_ID
```

Los nombres definitivos se establecerán durante la implementación.

---

# 5. IMqttService

Archivo:

```text
src/core/application/ports/services/IMqttService.js
```

Es el contrato que utiliza Application para comunicarse con MQTT.

Application no debe conocer la librería MQTT concreta.

Conceptualmente:

```text
Application
     │
     ▼
IMqttService
     │
     ▼
MqttPublisher
```

---

# 6. MqttClient

Archivo:

```text
src/core/infrastructure/services/mqtt/MqttClient.js
```

Gestiona la conexión con el broker.

Responsabilidades:

- Conectar.
- Desconectar.
- Detectar errores.
- Gestionar reconexión.
- Mantener el cliente MQTT disponible.

Conceptualmente:

```text
Backend
   ↓
MqttClient
   ↓
MQTT Broker
```

---

# 7. MqttPublisher

Archivo:

```text
src/core/infrastructure/services/mqtt/MqttPublisher.js
```

Se encarga de publicar mensajes.

Se utilizará principalmente para enviar comandos al ESP32.

Ejemplo:

```text
OpenValve
    ↓
MqttPublisher
    ↓
MQTT Broker
    ↓
ESP32
```

---

# 8. MqttSubscriber

Archivo:

```text
src/core/infrastructure/services/mqtt/MqttSubscriber.js
```

Se encarga de suscribirse a los topics que utiliza Hidro Smart.

Por ejemplo:

```text
Lecturas
Estados de dispositivos
Estados de actuadores
```

Flujo:

```text
ESP32
   ↓
MQTT Broker
   ↓
MqttSubscriber
   ↓
Handler
```

---

# 9. Topics MQTT

Archivo:

```text
src/mqtt/topics.js
```

Este archivo centraliza los topics utilizados por Hidro Smart.

No se deben escribir topics repetidos directamente en diferentes archivos.

La estructura definitiva debe establecerse antes de comenzar la implementación del ESP32.

Una organización recomendada es:

```text
hidro-smart/
├── devices/
├── readings/
└── actuators/
```

---

# 10. Identificación del dispositivo

Cada ESP32 debe poder identificarse de manera única.

Conceptualmente:

```text
hidro-smart/device/{deviceId}/...
```

Por ejemplo:

```text
hidro-smart/device/ESP32-001/...
```

El identificador definitivo debe coincidir con el identificador utilizado en la base de datos.

---

# 11. Topic de lecturas

Las lecturas del sensor de caudal deben viajar desde el ESP32 hacia el backend.

Conceptualmente:

```text
hidro-smart/device/{deviceId}/reading
```

Flujo:

```text
YF-S201
   ↓
ESP32
   ↓
reading topic
   ↓
MQTT Broker
   ↓
Backend
```

---

# 12. Información de una lectura

El mensaje MQTT debe utilizar un formato estructurado.

Ejemplo conceptual:

```json
{
  "deviceId": "ESP32-001",
  "timestamp": "2026-08-30T17:00:00Z",
  "flowRate": 5.2
}
```

Los nombres y unidades definitivos deben establecerse de acuerdo con el firmware y el modelo definitivo de la base de datos.

---

# 13. Sensor YF-S201

El YF-S201 genera pulsos relacionados con el flujo de agua.

El ESP32:

```text
1. Lee los pulsos.
2. Calcula el flujo.
3. Genera la información de lectura.
4. Publica el mensaje MQTT.
```

El backend recibe el resultado.

Por lo tanto:

```text
Sensor
   ↓
Pulsos
   ↓
ESP32
   ↓
Cálculo
   ↓
MQTT
   ↓
Backend
```

El cálculo físico de los pulsos pertenece al firmware del ESP32.

---

# 14. Estado del dispositivo

El ESP32 también puede informar su estado.

Conceptualmente:

```text
hidro-smart/device/{deviceId}/status
```

Ejemplo:

```json
{
  "deviceId": "ESP32-001",
  "status": "ONLINE",
  "timestamp": "2026-08-30T17:00:00Z"
}
```

Los estados definitivos deberán definirse durante la implementación.

---

# 15. Estado de los actuadores

Los actuadores pueden informar su estado al backend.

Por ejemplo:

```text
hidro-smart/device/{deviceId}/actuator/status
```

Un mensaje podría representar:

```json
{
  "deviceId": "ESP32-001",
  "actuator": "VALVE",
  "status": "OPEN"
}
```

Esto permite que el backend conozca el último estado informado por el dispositivo.

---

# 16. Comandos para actuadores

Los comandos se envían desde el backend hacia el ESP32.

Flujo:

```text
Frontend
   ↓
API
   ↓
Use Case
   ↓
IMqttService
   ↓
MqttPublisher
   ↓
MQTT Broker
   ↓
ESP32
```

---

# 17. Comando para electroválvula

La electroválvula tendrá como mínimo dos operaciones:

```text
OPEN
CLOSE
```

Conceptualmente:

```text
hidro-smart/device/{deviceId}/actuator/valve/command
```

Ejemplo:

```json
{
  "command": "OPEN"
}
```

El ESP32 recibe el comando y realiza la acción física.

---

# 18. Cierre de la electroválvula

Ejemplo:

```json
{
  "command": "CLOSE"
}
```

Flujo:

```text
Backend
   ↓
MQTT
   ↓
ESP32
   ↓
Control de salida
   ↓
MOSFET
   ↓
Electroválvula
```

---

# 19. Comando para hidrobomba

La hidrobomba tendrá como mínimo:

```text
START
STOP
```

Conceptualmente:

```text
hidro-smart/device/{deviceId}/actuator/pump/command
```

Ejemplo:

```json
{
  "command": "START"
}
```

---

# 20. Detener hidrobomba

Ejemplo:

```json
{
  "command": "STOP"
}
```

Flujo:

```text
Backend
   ↓
MQTT
   ↓
ESP32
   ↓
Salida de control
   ↓
Controlador de potencia
   ↓
Hidrobomba
```

---

# 21. Separación entre comando y estado

Es importante diferenciar:

```text
COMMAND
```

de:

```text
STATUS
```

Un comando significa:

> "Haz esto."

Un estado significa:

> "Esto es lo que actualmente está ocurriendo."

Ejemplo:

```text
Backend
   │
   │ OPEN
   ▼
ESP32
   │
   │ OPEN
   ▼
Backend
```

El primer `OPEN` es un comando.

El segundo `OPEN` es una confirmación/estado.

---

# 22. Ejemplo completo de electroválvula

```text
Usuario
   ↓
Frontend
   ↓
POST /api/v1/actuators/{id}/open
   ↓
ActuatorController
   ↓
OpenValve
   ↓
IMqttService
   ↓
MqttPublisher
   ↓
MQTT Broker
   ↓
ESP32
   ↓
MOSFET
   ↓
Electroválvula
   ↓
Estado
   ↓
ESP32
   ↓
MQTT
   ↓
MqttSubscriber
   ↓
actuator-status.handler
   ↓
Backend
```

---

# 23. Message Parser

Archivo:

```text
src/mqtt/message-parser.js
```

Su responsabilidad es interpretar los mensajes recibidos.

Flujo:

```text
MQTT Message
     ↓
Message Parser
     ↓
Validación
     ↓
Objeto estructurado
     ↓
Handler
```

No debe contener reglas complejas del negocio.

---

# 24. Reading Handler

Archivo:

```text
src/mqtt/handlers/reading.handler.js
```

Procesa los mensajes relacionados con lecturas.

Flujo:

```text
MQTT
 ↓
Reading Handler
 ↓
ReceiveReading
 ↓
Application
```

El handler adapta el mensaje MQTT al caso de uso.

---

# 25. Device Status Handler

Archivo:

```text
src/mqtt/handlers/device-status.handler.js
```

Procesa mensajes relacionados con el estado del dispositivo.

Por ejemplo:

```text
ONLINE
OFFLINE
```

Los valores definitivos deberán establecerse durante la implementación.

---

# 26. Actuator Status Handler

Archivo:

```text
src/mqtt/handlers/actuator-status.handler.js
```

Procesa los estados enviados por los actuadores.

Ejemplo:

```text
VALVE → OPEN
VALVE → CLOSED
PUMP → ON
PUMP → OFF
```

Esto permite actualizar la información correspondiente en el backend.

---

# 27. Validación de mensajes

Los mensajes MQTT recibidos no deben almacenarse directamente.

Primero deben validarse.

Flujo:

```text
MQTT Message
     ↓
Parse
     ↓
Validate
     ↓
Valid
   ↙   ↘
 Sí     No
 ↓       ↓
Procesar  Rechazar
```

Se deben validar como mínimo:

- Identificador del dispositivo.
- Tipo de mensaje.
- Datos obligatorios.
- Formato.
- Timestamp cuando corresponda.
- Valores permitidos.

---

# 28. Mensajes inválidos

Si llega un mensaje incorrecto:

```text
MQTT
 ↓
Parser
 ↓
Invalid
 ↓
Error handling
```

No se debe insertar información inválida en la base de datos.

También se debe registrar el error para facilitar el diagnóstico.

---

# 29. Seguridad MQTT

La conexión MQTT debe utilizar autenticación y comunicación segura cuando el entorno lo permita.

No se deben colocar credenciales directamente en:

```text
topics.js
handlers
controllers
use cases
```

Las credenciales deben administrarse mediante configuración segura.

---

# 30. QoS

MQTT permite diferentes niveles de calidad de servicio.

La elección debe hacerse según el tipo de mensaje.

Conceptualmente:

```text
Lecturas
→ QoS definido según frecuencia y tolerancia a pérdida.

Comandos de actuadores
→ QoS definido priorizando confiabilidad.

Estados
→ QoS definido según necesidad de sincronización.
```

Los valores definitivos de QoS deben establecerse durante las pruebas del sistema.

No se debe asumir un único QoS para todo el proyecto.

---

# 31. Retained Messages

Los mensajes retenidos pueden ser útiles para determinados estados, pero deben utilizarse solamente donde tenga sentido.

Por ejemplo:

```text
Estado actual del dispositivo
```

podría ser candidato a conservarse.

Las lecturas históricas no deberían depender de un retained message; deben persistirse en PostgreSQL.

---

# 32. Último estado del dispositivo

El backend puede mantener el último estado conocido del dispositivo.

Conceptualmente:

```text
ESP32
 ↓
STATUS
 ↓
MQTT
 ↓
Backend
 ↓
PostgreSQL / Cache
```

Esto permite consultar desde el frontend:

```text
¿El dispositivo está conectado?
```

---

# 33. Comunicación bidireccional

Hidro Smart utiliza MQTT en ambos sentidos:

### ESP32 → Backend

```text
Lecturas
Estados
Eventos del dispositivo
```

### Backend → ESP32

```text
Abrir válvula
Cerrar válvula
Encender bomba
Apagar bomba
Configuraciones permitidas
```

---

# 34. Flujo completo del sistema IoT

```text
                  ┌───────────────┐
                  │   FRONTEND    │
                  └───────┬───────┘
                          │ HTTP
                          ▼
                  ┌───────────────┐
                  │   BACKEND     │
                  └───────┬───────┘
                          │
                          │ MQTT
                          ▼
                  ┌───────────────┐
                  │ MQTT BROKER   │
                  └───────┬───────┘
                          │
                          ▼
                       ┌──────┐
                       │ ESP32│
                       └──┬───┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          YF-S201    Electroválvula  Hidrobomba
```

---

# 35. Principio de separación

La arquitectura debe mantener estas responsabilidades:

```text
ESP32
→ Control físico y lectura de sensores.

MQTT
→ Transporte de mensajes.

Infrastructure
→ Comunicación técnica con MQTT.

Application
→ Casos de uso.

Domain
→ Reglas del negocio.

API
→ Comunicación HTTP con el frontend.

PostgreSQL
→ Persistencia.
```

---

# 36. Reglas importantes

### Regla 1

El ESP32 no debe acceder directamente a PostgreSQL.

```text
ESP32 ✕ PostgreSQL
```

Debe utilizar:

```text
ESP32 → MQTT → Backend → PostgreSQL
```

### Regla 2

El frontend no debe comunicarse directamente con el ESP32.

```text
Frontend ✕ ESP32
```

Debe utilizar:

```text
Frontend → API → Backend → MQTT → ESP32
```

### Regla 3

El Domain no debe conocer MQTT.

```text
Domain ✕ MQTT
```

### Regla 4

Application debe utilizar `IMqttService`.

```text
Application → IMqttService
```

Infrastructure implementa la comunicación real.

---

# 37. Resumen

La arquitectura MQTT de Hidro Smart queda:

```text
                         HIDRO SMART
                              │
               ┌──────────────┴──────────────┐
               │                             │
           FRONTEND                       ESP32
               │                             │
              HTTP                         MQTT
               │                             │
               ▼                             ▼
             API ◄───────────────► MQTT BROKER
               │                             │
               ▼                             │
         APPLICATION                         │
               │                             │
               ▼                             │
            DOMAIN                           │
               │                             │
               ▼                             │
        INFRASTRUCTURE ◄────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
  PostgreSQL           Redis
```

El punto más importante es que **MQTT será el puente entre el backend y el ESP32**, mientras que la lógica de negocio continuará aislada en `Domain` y `Application`.

Los componentes físicos —YF-S201, electroválvula, hidrobomba y el circuito de control— son responsabilidad del ESP32 y su firmware; el backend únicamente intercambia los mensajes definidos mediante MQTT.