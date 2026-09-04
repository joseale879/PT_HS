# Flujo de Datos IoT — Hidro Smart

## 1. Introducción

Este documento describe el flujo de comunicación entre los dispositivos IoT de Hidro Smart y el backend.

El sistema contempla principalmente:

- ESP32.
- Sensor de flujo YF-S201.
- MQTT Broker.
- Backend Hidro Smart.
- PostgreSQL.
- Electroválvula de 12 V.
- Hidrobomba.
- Módulo MOSFET compatible con señal de 3.3 V.

El flujo se divide en dos partes principales:

1. **Envío de información:** ESP32 → Backend.
2. **Envío de comandos:** Backend → ESP32 → Actuadores.

---

# 2. Arquitectura IoT

El flujo general es:

```text
                    HIDRO SMART
                         │
                    ┌────┴────┐
                    │ Backend │
                    └────┬────┘
                         │
                       MQTT
                         │
                  ┌──────┴──────┐
                  │ MQTT Broker │
                  └──────┬──────┘
                         │
                       Wi-Fi
                         │
                      ┌──┴──┐
                      │ESP32│
                      └──┬──┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
         YF-S201                 Actuadores
          Sensor                │
             │             ┌────┴────┐
             │             ▼         ▼
             │       Electroválvula Hidrobomba
             │
             ▼
          Lecturas
```

---

# 3. ESP32

El ESP32 funciona como dispositivo de control y comunicación.

Sus responsabilidades principales son:

- Conectarse a Wi-Fi.
- Leer el sensor YF-S201.
- Procesar las señales recibidas del sensor.
- Enviar lecturas mediante MQTT.
- Recibir comandos mediante MQTT.
- Controlar los actuadores.
- Informar el estado de los actuadores.
- Informar el estado de conectividad del dispositivo.

---

# 4. Sensor YF-S201

El YF-S201 se utiliza para detectar el flujo de agua.

El sensor genera pulsos eléctricos relacionados con el flujo.

Su conexión básica contempla:

```text
YF-S201
│
├── Rojo    → Alimentación
├── Negro   → GND
└── Amarillo → Señal de pulsos
```

La señal de pulsos es procesada por el ESP32.

---

# 5. Flujo del sensor

El proceso comienza físicamente en el sensor:

```text
Agua
 ↓
YF-S201
 ↓
Pulsos eléctricos
 ↓
ESP32
 ↓
Cálculo de flujo
 ↓
Mensaje MQTT
```

El backend no recibe directamente la señal eléctrica del sensor.

Recibe los datos procesados por el ESP32.

---

# 6. Lectura del sensor

El ESP32 obtiene información como:

```text
Flujo
Timestamp
Identificador del dispositivo
```

El formato definitivo del mensaje MQTT deberá mantenerse igual en el firmware y backend.

Ejemplo conceptual:

```text
{
  "deviceId": "...",
  "flowRate": 2.5,
  "timestamp": "..."
}
```

Este ejemplo representa únicamente la estructura conceptual.

---

# 7. ESP32 → MQTT

Después de obtener una lectura:

```text
ESP32
  ↓
Crear mensaje
  ↓
MQTT Publish
  ↓
MQTT Broker
```

El ESP32 publica el mensaje en un topic determinado.

---

# 8. MQTT Broker

El MQTT Broker funciona como intermediario de comunicación.

No es la base de datos principal.

Su función es recibir y distribuir mensajes MQTT.

```text
ESP32
   ↓
Publish
   ↓
MQTT Broker
   ↓
Subscribe
   ↓
Backend
```

---

# 9. Backend como Subscriber

El backend se suscribe a los topics necesarios.

Por ejemplo:

```text
device/+/reading
```

Conceptualmente:

```text
MQTT Broker
     │
     │ reading
     ▼
MqttSubscriber
     │
     ▼
Reading Handler
```

El topic definitivo debe coincidir con la implementación del ESP32.

---

# 10. Procesamiento de una lectura

El backend procesa la lectura mediante:

```text
MQTT
 ↓
MqttSubscriber
 ↓
Message Parser
 ↓
Reading Handler
 ↓
ReceiveReading
 ↓
Repository
 ↓
PostgreSQL
```

---

# 11. Validación de la lectura

Antes de almacenar una lectura, el backend debe validar la información recibida.

Conceptualmente:

```text
Mensaje MQTT
     ↓
¿Formato válido?
     │
     ├── No → Rechazar / registrar error
     │
     └── Sí
          ↓
       Procesar
```

También debe comprobarse que el dispositivo corresponda con un dispositivo registrado en Hidro Smart.

---

# 12. Relación dispositivo-hogar

Una lectura no debería aceptarse únicamente porque contiene un `deviceId`.

El backend debe comprobar la relación existente:

```text
Device
   ↓
Home
```

Esto ayuda a evitar que un dispositivo envíe información asociada incorrectamente a otro hogar.

La validación definitiva debe respetar las restricciones y relaciones existentes en la base de datos.

---

# 13. Almacenamiento

Después de validar la lectura:

```text
Reading Handler
      ↓
ReceiveReading
      ↓
Reading Repository
      ↓
PostgresReadingRepository
      ↓
PostgreSQL
```

La lectura queda almacenada para posteriores consultas y procesamiento.

---

# 14. Lecturas y consumo

Las lecturas recibidas pueden utilizarse para calcular información de consumo.

Conceptualmente:

```text
YF-S201
   ↓
Reading
   ↓
Consumption
   ↓
Summary
```

Los cálculos concretos deben seguir las reglas definidas para Hidro Smart.

---

# 15. Lectura → Evento

Después de procesar una lectura puede generarse un evento interno:

```text
ReadingReceived
```

Flujo:

```text
Reading
  ↓
ReadingReceived
  ↓
Event Handler
```

Esto permite desacoplar procesos posteriores.

---

# 16. Evento de consumo

Una lectura procesada puede provocar una actualización del consumo:

```text
ReadingReceived
       ↓
Consumption Handler
       ↓
ConsumptionUpdated
```

La implementación concreta dependerá de las reglas de negocio.

---

# 17. Generación de alertas

Si el sistema detecta una condición que corresponde a una alerta:

```text
Reading
   ↓
Reglas de negocio
   ↓
Alert
```

Por ejemplo, dependiendo de la configuración del sistema:

```text
Consumo elevado
Flujo anormal
Problema del dispositivo
```

Las condiciones exactas deben definirse en el dominio.

---

# 18. Flujo completo de entrada

```text
┌──────────────┐
│    YF-S201   │
└──────┬───────┘
       │ Pulsos
       ▼
┌──────────────┐
│    ESP32     │
└──────┬───────┘
       │ MQTT Publish
       ▼
┌──────────────┐
│ MQTT Broker  │
└──────┬───────┘
       │ MQTT
       ▼
┌──────────────┐
│ MQTT Handler │
└──────┬───────┘
       ▼
┌──────────────┐
│ ReceiveReading│
└──────┬───────┘
       ▼
┌──────────────┐
│ PostgreSQL   │
└──────────────┘
```

---

# 19. Control de actuadores

El backend también puede enviar comandos al ESP32.

Los actuadores contemplados son:

```text
Electroválvula
Hidrobomba
```

El flujo general es:

```text
Frontend
   ↓
API
   ↓
Actuator Controller
   ↓
Use Case
   ↓
MQTT Publisher
   ↓
MQTT Broker
   ↓
ESP32
   ↓
Actuador
```

---

# 20. Control de electroválvula

Para abrir la electroválvula:

```text
Frontend
   ↓
API
   ↓
OpenValve
   ↓
MQTT
   ↓
ESP32
   ↓
GPIO
   ↓
MOSFET
   ↓
Electroválvula
```

Para cerrarla:

```text
Frontend
   ↓
API
   ↓
CloseValve
   ↓
MQTT
   ↓
ESP32
   ↓
GPIO
   ↓
MOSFET
   ↓
Electroválvula
```

---

# 21. Alimentación de la electroválvula

La electroválvula trabaja con una alimentación de 12 V DC según la información proporcionada para el proyecto.

El ESP32 no debe alimentar directamente la electroválvula.

La separación conceptual es:

```text
ESP32
 │
 │ Señal 3.3 V
 ▼
MOSFET
 │
 │ Control
 ▼
Electroválvula
 │
 │
12 V DC
```

El módulo MOSFET actúa como elemento de conmutación.

---

# 22. Protección de la electroválvula

La electroválvula utiliza una bobina.

Al desenergizar una carga inductiva puede generarse un pico de tensión.

Por ello se contempla:

```text
Diodo 1N4007
```

como protección, salvo que el módulo MOSFET utilizado ya incluya la protección correspondiente.

La implementación eléctrica definitiva debe seguir el esquema y especificaciones del módulo utilizado.

---

# 23. Control de hidrobomba

El backend también contempla comandos para la hidrobomba:

```text
StartPump
StopPump
```

Flujo:

```text
Frontend
   ↓
API
   ↓
StartPump
   ↓
MQTT
   ↓
ESP32
   ↓
Controlador
   ↓
Hidrobomba
```

La etapa de potencia de la hidrobomba debe seleccionarse de acuerdo con sus características eléctricas.

El ESP32 tampoco debe alimentar directamente una bomba de potencia.

---

# 24. Comandos MQTT

Los comandos enviados al ESP32 deben tener un formato definido.

Conceptualmente:

```text
{
  "command": "OPEN_VALVE",
  "deviceId": "..."
}
```

Otros comandos:

```text
OPEN_VALVE
CLOSE_VALVE
START_PUMP
STOP_PUMP
```

Los nombres definitivos deben coincidir exactamente entre backend y firmware.

---

# 25. ESP32 recibe el comando

El flujo es:

```text
MQTT Broker
     ↓
ESP32 Subscriber
     ↓
Leer comando
     ↓
Validar comando
     ↓
Ejecutar acción
```

Por ejemplo:

```text
OPEN_VALVE
     ↓
ESP32
     ↓
Activar GPIO
     ↓
MOSFET
     ↓
Electroválvula abierta
```

---

# 26. Confirmación del actuador

Después de ejecutar un comando, el ESP32 debería informar el estado.

Ejemplo:

```text
Backend
   ↓
OPEN_VALVE
   ↓
ESP32
   ↓
Electroválvula
   ↓
Estado
   ↓
MQTT
   ↓
Backend
```

Esto permite que el backend conozca el estado reportado por el dispositivo.

---

# 27. Flujo de estado

```text
ESP32
   ↓
Actuator Status
   ↓
MQTT
   ↓
Actuator Status Handler
   ↓
Backend
   ↓
PostgreSQL / Estado actual
```

La forma exacta de persistir el estado debe coincidir con el modelo de datos definitivo.

---

# 28. Estado del ESP32

El dispositivo también debe poder informar su estado.

Por ejemplo:

```text
ONLINE
OFFLINE
ERROR
```

Flujo:

```text
ESP32
   ↓
Status Message
   ↓
MQTT
   ↓
Device Status Handler
   ↓
Backend
```

---

# 29. Pérdida de conexión

Si el ESP32 pierde conexión:

```text
ESP32
   X
MQTT
```

el sistema debe poder determinar que el dispositivo dejó de comunicarse.

MQTT puede utilizar mecanismos como:

- Keep Alive.
- Last Will and Testament.
- QoS.

La configuración definitiva dependerá del broker y del firmware.

---

# 30. QoS

MQTT permite utilizar diferentes niveles de QoS.

La selección debe realizarse según el tipo de mensaje.

Conceptualmente:

```text
Lecturas
    ↓
QoS definido para telemetría

Comandos de actuadores
    ↓
QoS definido para control
```

Los niveles concretos deben definirse durante la implementación para evitar inconsistencias entre ESP32 y backend.

---

# 31. Seguridad MQTT

La conexión MQTT debe protegerse mediante:

- Credenciales.
- Autenticación del cliente.
- TLS cuando el broker lo permita.
- Topics correctamente definidos.
- Identificación de dispositivos.

Las credenciales MQTT deben almacenarse mediante variables de entorno.

---

# 32. Identificación del dispositivo

Cada ESP32 debe estar asociado a un dispositivo registrado en Hidro Smart.

Conceptualmente:

```text
ESP32
 ↓
Device ID
 ↓
Hidro Smart
 ↓
Home
```

Esto permite determinar a qué dispositivo y hogar pertenece la información.

---

# 33. Comunicación bidireccional

El sistema IoT utiliza comunicación en ambos sentidos.

### Entrada

```text
ESP32 → MQTT → Backend
```

### Salida

```text
Backend → MQTT → ESP32
```

Por lo tanto:

```text
                 MQTT
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
      ESP32               Backend
        │                   │
        ▼                   ▼
    Sensores             API/BD
        │
        ▼
    Actuadores
```

---

# 34. Backend y base de datos

MQTT no reemplaza PostgreSQL.

Cada tecnología tiene una responsabilidad diferente:

| Componente | Responsabilidad |
|---|---|
| ESP32 | Control y adquisición de datos |
| YF-S201 | Medición de flujo |
| MQTT | Transporte de mensajes |
| Backend | Procesamiento y reglas de negocio |
| PostgreSQL | Persistencia |
| Redis | Caché/datos temporales |
| Frontend | Interfaz del usuario |

---

# 35. Flujo completo de monitoreo

```text
          AGUA
            │
            ▼
        YF-S201
            │
            ▼
          ESP32
            │
            ▼
      MQTT Broker
            │
            ▼
         Backend
            │
       ┌────┴────┐
       ▼         ▼
 PostgreSQL    Eventos
       │
       ▼
   Consumo
       │
       ▼
    Frontend
```

---

# 36. Flujo completo de control

```text
       Frontend
           │
           ▼
        Backend
           │
           ▼
      MQTT Broker
           │
           ▼
         ESP32
           │
       ┌───┴────┐
       ▼        ▼
    MOSFET   Controlador
       │        │
       ▼        ▼
 Electroválvula Hidrobomba
```

---

# 37. Manejo de errores

El sistema debe contemplar errores en diferentes puntos.

### Sensor

```text
YF-S201
 ↓
Lectura inválida
```

### ESP32

```text
ESP32
 ↓
Error de lectura
```

### Wi-Fi

```text
ESP32
 ↓
Sin conexión
```

### MQTT

```text
MQTT
 ↓
Broker no disponible
```

### Backend

```text
Backend
 ↓
Error de procesamiento
```

### PostgreSQL

```text
PostgreSQL
 ↓
Error de persistencia
```

Cada capa debe manejar el error correspondiente.

---

# 38. Reintentos

Los mecanismos de reconexión deben aplicarse principalmente a conexiones externas.

Ejemplo:

```text
ESP32
 ↓
MQTT desconectado
 ↓
Reintentar conexión
```

En el backend:

```text
Backend
 ↓
MQTT desconectado
 ↓
Reintentar conexión
```

Los reintentos no deben generar duplicación de lecturas o comandos.

---

# 39. Idempotencia

Los comandos críticos deben diseñarse considerando posibles duplicaciones.

Por ejemplo, si se recibe:

```text
OPEN_VALVE
OPEN_VALVE
```

el sistema debe evitar provocar un comportamiento incorrecto por la duplicación.

El estado esperado sería simplemente:

```text
VALVE = OPEN
```

La estrategia definitiva dependerá del protocolo de comandos implementado.

---

# 40. Separación entre software y hardware

El backend no debe conocer detalles eléctricos como:

```text
GPIO
Resistencias
Voltaje de bobina
Conexión física
```

El backend solamente trabaja con conceptos:

```text
OPEN_VALVE
CLOSE_VALVE
START_PUMP
STOP_PUMP
```

El ESP32 convierte esos comandos en acciones físicas.

---

# 41. Responsabilidad del ESP32

```text
ESP32
├── Wi-Fi
├── MQTT
├── YF-S201
├── GPIO
├── Electroválvula
└── Hidrobomba
```

El ESP32 es responsable de la interacción física.

---

# 42. Responsabilidad del Backend

```text
Backend
├── Autenticación
├── Usuarios
├── Hogares
├── Dispositivos
├── Consumo
├── Alertas
├── Actuadores
├── Reglas de negocio
└── Persistencia
```

El backend es responsable de la lógica del sistema.

---

# 43. Responsabilidad del Frontend

```text
Frontend
├── Dashboard
├── Consumo
├── Dispositivos
├── Alertas
├── Actuadores
└── Configuración
```

El frontend presenta la información y permite al usuario interactuar con el sistema.

---

# 44. Flujo completo Hidro Smart

```text
                         FRONTEND
                            │
                     HTTP / REST API
                            │
                            ▼
                      ┌───────────┐
                      │  BACKEND  │
                      └─────┬─────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        PostgreSQL        Redis          MQTT
                                          │
                                          ▼
                                    ┌───────────┐
                                    │   ESP32   │
                                    └─────┬─────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                         ▼                ▼                ▼
                      YF-S201       Electroválvula     Hidrobomba
                         │
                         ▼
                      Lecturas
                         │
                         └──────────────► MQTT
```

---

# 45. Resumen

El flujo IoT de Hidro Smart se divide en dos procesos principales.

## Monitoreo

```text
YF-S201
 ↓
ESP32
 ↓
MQTT
 ↓
Backend
 ↓
PostgreSQL
 ↓
Frontend
```

## Control

```text
Frontend
 ↓
Backend
 ↓
MQTT
 ↓
ESP32
 ↓
MOSFET / Controlador
 ↓
Electroválvula / Hidrobomba
```

El principio principal es:

> **El ESP32 se encarga de la interacción física, MQTT del transporte de mensajes, el backend de la lógica de negocio y PostgreSQL de la persistencia.**

Esto permite mantener separadas las responsabilidades entre software, comunicación y hardware.