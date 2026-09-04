# Domain — Hidro Smart

## 1. Introducción

La capa `domain` representa el núcleo de negocio de Hidro Smart.

Aquí se definen:

- Entidades.
- Objetos de valor.
- Eventos de dominio.
- Excepciones del dominio.
- Reglas de negocio relacionadas con estas entidades.

La capa Domain no debe depender directamente de:

- Express.
- PostgreSQL.
- MQTT.
- Redis.
- Frameworks externos.
- Controllers.
- Routes.

Su función es representar **qué es Hidro Smart y cuáles son sus reglas**, no cómo se conecta con otros sistemas.

---

# 2. Ubicación

```text
src/
└── core/
    └── domain/
        ├── entities/
        ├── value-objects/
        ├── events/
        └── exceptions/
```

---

# 3. Estructura

```text
domain/
│
├── entities/
│   ├── User.js
│   ├── Home.js
│   ├── Device.js
│   ├── Reading.js
│   ├── Consumption.js
│   ├── Alert.js
│   └── Actuator.js
│
├── value-objects/
│   ├── Email.js
│   ├── DeviceId.js
│   └── HomeId.js
│
├── events/
│   ├── ReadingReceived.js
│   ├── ConsumptionUpdated.js
│   ├── AlertTriggered.js
│   └── ActuatorCommanded.js
│
└── exceptions/
    ├── DomainError.js
    ├── ValidationError.js
    └── AuthorizationError.js
```

---

# 4. Entidades

Las entidades representan los objetos principales del negocio.

En Hidro Smart se contemplan inicialmente:

```text
User
Home
Device
Reading
Consumption
Alert
Actuator
```

Cada entidad posee una identidad propia y puede contener reglas relacionadas con su comportamiento.

---

# 5. User

Archivo:

```text
src/core/domain/entities/User.js
```

Representa al usuario de Hidro Smart.

Su responsabilidad dentro del dominio es representar la información y comportamiento relacionado con una cuenta.

Conceptualmente:

```text
User
├── id
├── información básica
├── estado
└── comportamiento de cuenta
```

La entidad `User` no debe encargarse de:

- Ejecutar SQL.
- Generar respuestas HTTP.
- Crear JWT directamente.
- Enviar correos.

Esas responsabilidades pertenecen a otras capas.

---

# 6. Home

Archivo:

```text
src/core/domain/entities/Home.js
```

Representa un hogar dentro del sistema.

El hogar es uno de los elementos principales para organizar los recursos de Hidro Smart.

Conceptualmente:

```text
Home
├── id
├── información del hogar
├── miembros
├── dispositivos
└── configuración relacionada
```

Un usuario puede tener relación con uno o varios hogares según las reglas definitivas del sistema.

---

# 7. Device

Archivo:

```text
src/core/domain/entities/Device.js
```

Representa un dispositivo IoT registrado en Hidro Smart.

En el proyecto, el dispositivo estará relacionado principalmente con el:

```text
ESP32
```

El ESP32 será el elemento encargado de comunicarse con los sensores y actuadores.

Conceptualmente:

```text
Device
├── id
├── identificación
├── hogar
├── estado
├── configuración
└── conectividad
```

La entidad `Device` representa el dispositivo desde el punto de vista del negocio.

No debe contener código específico para controlar directamente los GPIO del ESP32.

---

# 8. Reading

Archivo:

```text
src/core/domain/entities/Reading.js
```

Representa una lectura recibida desde un dispositivo IoT.

En Hidro Smart las lecturas estarán relacionadas principalmente con el sensor de caudal.

Flujo conceptual:

```text
Sensor
   ↓
ESP32
   ↓
MQTT
   ↓
Reading
```

Una lectura puede contener información como:

```text
Reading
├── deviceId
├── valor
├── unidad
└── fecha/hora
```

Los campos definitivos deberán corresponder con el modelo definitivo de la base de datos.

---

# 9. Consumption

Archivo:

```text
src/core/domain/entities/Consumption.js
```

Representa la información procesada del consumo de agua.

El consumo puede obtenerse a partir de las lecturas recibidas.

Flujo:

```text
Reading
   ↓
Procesamiento
   ↓
Consumption
```

La entidad puede representar información como:

- Consumo actual.
- Consumo acumulado.
- Consumo por período.
- Información utilizada para estadísticas.

La estructura final deberá coincidir con el modelo definitivo de PostgreSQL.

---

# 10. Alert

Archivo:

```text
src/core/domain/entities/Alert.js
```

Representa una situación que requiere atención del usuario o del sistema.

Ejemplos dentro de Hidro Smart:

```text
Consumo elevado
Posible fuga
Comportamiento anormal
Dispositivo desconectado
```

Conceptualmente:

```text
Alert
├── id
├── tipo
├── severidad
├── estado
├── fecha
└── información relacionada
```

La entidad debe controlar las reglas relacionadas con el estado de una alerta.

Por ejemplo:

```text
Activa
   ↓
Resuelta
```

---

# 11. Actuator

Archivo:

```text
src/core/domain/entities/Actuator.js
```

Representa un elemento que puede recibir órdenes de control.

En Hidro Smart se contemplan principalmente:

```text
Electroválvula
Hidrobomba
```

Conceptualmente:

```text
Actuator
├── id
├── tipo
├── estado
├── dispositivo
└── configuración
```

El Actuator **no controla físicamente el hardware**.

La entidad representa la lógica del actuador.

El envío físico del comando será responsabilidad de Infrastructure mediante MQTT.

---

# 12. Relación entre las entidades

La relación conceptual puede representarse así:

```text
User
  │
  ▼
Home
  │
  ├──────────────┐
  ▼              ▼
Device         Actuator
  │
  ▼
Reading
  │
  ▼
Consumption
  │
  ▼
Alert
```

Esta representación es conceptual.

Las relaciones reales dependerán del modelo definitivo de la base de datos.

---

# 13. Value Objects

Ubicación:

```text
src/core/domain/value-objects/
```

Los Value Objects representan valores que tienen reglas propias.

Se contemplan inicialmente:

```text
Email
DeviceId
HomeId
```

---

# 14. Email

Archivo:

```text
src/core/domain/value-objects/Email.js
```

Representa un correo electrónico válido.

En lugar de utilizar directamente:

```javascript
"user@example.com"
```

el dominio puede trabajar con:

```text
Email
```

Esto permite centralizar las reglas relacionadas con el formato del correo.

Ejemplo conceptual:

```text
Email
   ↓
Validar formato
   ↓
Email válido
```

---

# 15. DeviceId

Archivo:

```text
src/core/domain/value-objects/DeviceId.js
```

Representa el identificador de un dispositivo.

Permite evitar que diferentes partes del dominio manejen identificadores de dispositivos sin validación.

---

# 16. HomeId

Archivo:

```text
src/core/domain/value-objects/HomeId.js
```

Representa el identificador de un hogar.

Su objetivo es proporcionar una representación consistente del identificador dentro del dominio.

---

# 17. Domain Events

Ubicación:

```text
src/core/domain/events/
```

Los eventos de dominio representan hechos que ya ocurrieron.

Se contemplan:

```text
ReadingReceived
ConsumptionUpdated
AlertTriggered
ActuatorCommanded
```

Un evento no representa una orden.

Representa algo que ocurrió.

Ejemplo:

```text
ReadingReceived
```

significa:

```text
"El sistema recibió una lectura."
```

---

# 18. ReadingReceived

Archivo:

```text
src/core/domain/events/ReadingReceived.js
```

Representa la recepción de una lectura proveniente de un dispositivo.

Flujo:

```text
ESP32
   ↓
MQTT
   ↓
ReadingReceived
```

Este evento puede provocar posteriormente procesos como:

```text
Actualizar consumo
Analizar comportamiento
Generar alerta
Guardar información
```

---

# 19. ConsumptionUpdated

Archivo:

```text
src/core/domain/events/ConsumptionUpdated.js
```

Representa que la información de consumo fue actualizada.

Ejemplo:

```text
ReadingReceived
       ↓
Procesamiento
       ↓
ConsumptionUpdated
```

Otros componentes pueden reaccionar ante este evento sin que el proceso original tenga que conocerlos directamente.

---

# 20. AlertTriggered

Archivo:

```text
src/core/domain/events/AlertTriggered.js
```

Representa que el sistema detectó una condición que generó una alerta.

Ejemplo:

```text
ReadingReceived
       ↓
Analizar consumo
       ↓
Condición anormal
       ↓
AlertTriggered
```

Posteriormente puede ejecutarse:

```text
Crear alerta
       ↓
Notificar usuario
```

---

# 21. ActuatorCommanded

Archivo:

```text
src/core/domain/events/ActuatorCommanded.js
```

Representa que se generó un comando dirigido a un actuador.

Ejemplo:

```text
OpenValve
    ↓
ActuatorCommanded
```

Después el comando puede ser enviado mediante MQTT:

```text
ActuatorCommanded
       ↓
MQTT
       ↓
ESP32
       ↓
Electroválvula
```

---

# 22. Excepciones del dominio

Ubicación:

```text
src/core/domain/exceptions/
```

Las excepciones permiten representar errores relacionados con las reglas del dominio.

Se contemplan:

```text
DomainError
ValidationError
AuthorizationError
```

---

# 23. DomainError

Archivo:

```text
src/core/domain/exceptions/DomainError.js
```

Es la excepción base para errores relacionados con las reglas del dominio.

Puede servir como clase padre para errores más específicos.

Conceptualmente:

```text
DomainError
    │
    ├── ValidationError
    └── AuthorizationError
```

---

# 24. ValidationError

Archivo:

```text
src/core/domain/exceptions/ValidationError.js
```

Se utiliza cuando una operación no cumple una regla de validación del dominio.

Ejemplo:

```text
Intentar realizar una operación con un valor inválido
```

La validación HTTP de los datos recibidos pertenece a la API, mientras que las reglas propias del negocio pertenecen al Domain.

---

# 25. AuthorizationError

Archivo:

```text
src/core/domain/exceptions/AuthorizationError.js
```

Representa una operación que no puede realizarse porque el usuario o contexto no tiene autorización suficiente.

Ejemplo conceptual:

```text
Usuario
   ↓
Intentar controlar actuador
   ↓
No tiene permiso
   ↓
AuthorizationError
```

---

# 26. Domain y ESP32

El Domain conoce el concepto de dispositivo y actuador, pero **no conoce los detalles físicos del ESP32**.

Por ejemplo, Domain no debe saber:

```text
GPIO 25
GPIO 26
MOSFET
12 V
1N4007
Wi-Fi
Broker MQTT
```

Esos detalles pertenecen a las capas externas.

El Domain solamente conoce conceptos como:

```text
Device
Actuator
OpenValve
CloseValve
StartPump
StopPump
```

---

# 27. Separación del hardware

La arquitectura debe mantener esta separación:

```text
DOMAIN
Device
Actuator
Reading
Consumption
        │
        ▼
APPLICATION
Casos de uso
        │
        ▼
INFRASTRUCTURE
MQTT
        │
        ▼
ESP32
        │
        ├── Sensor
        ├── MOSFET
        ├── Electroválvula
        └── Hidrobomba
```

Esto permite cambiar el hardware en el futuro sin modificar las reglas principales del negocio.

---

# 28. Ejemplo: abrir la electroválvula

El Domain no ejecuta:

```text
digitalWrite()
```

ni conoce GPIO.

El flujo correcto será:

```text
Usuario
   ↓
API
   ↓
OpenValve
   ↓
Reglas del dominio
   ↓
Comando del actuador
   ↓
Infrastructure
   ↓
MQTT
   ↓
ESP32
   ↓
MOSFET
   ↓
Electroválvula
```

---

# 29. Ejemplo: recibir una lectura

```text
YF-S201
   ↓
ESP32
   ↓
MQTT
   ↓
Infrastructure
   ↓
ReceiveReading
   ↓
Reading
   ↓
ReadingReceived
   ↓
Consumption
```

El Domain trabaja con la lectura y las reglas del negocio, no con la conexión física del sensor.

---

# 30. Reglas principales del Domain

Las reglas del negocio deberán ubicarse preferentemente dentro de las entidades y objetos de valor correspondientes.

Ejemplos:

```text
Un Email debe cumplir un formato válido.

Un dispositivo debe tener una identificación válida.

Un actuador solamente puede ejecutar operaciones permitidas.

Una alerta debe mantener un estado válido.

Una lectura debe cumplir las condiciones mínimas para ser procesada.
```

Las reglas específicas se definirán conforme se implemente cada módulo.

---

# 31. Qué NO pertenece al Domain

No deben colocarse dentro de `domain/`:

### SQL

```text
SELECT
INSERT
UPDATE
DELETE
```

### Express

```text
Request
Response
Router
Middleware
```

### MQTT

```text
mqtt.connect()
mqtt.publish()
mqtt.subscribe()
```

### PostgreSQL

```text
Pool
Client
Connection
```

### Redis

```text
Redis client
Cache connection
```

Estas responsabilidades pertenecen a Infrastructure o API.

---

# 32. Principio de independencia

El objetivo principal es:

```text
Domain
   ↓
NO conoce
   ↓
PostgreSQL
MQTT
Express
Redis
```

Mientras que las capas externas conocen y utilizan el Domain.

---

# 33. Flujo general del dominio

```text
Entrada
  ↓
Caso de uso
  ↓
Entidad
  ↓
Reglas de negocio
  ↓
Evento / resultado
  ↓
Caso de uso
  ↓
Respuesta
```

Por ejemplo:

```text
Nueva lectura
     ↓
Reading
     ↓
Validación
     ↓
ReadingReceived
     ↓
Actualizar consumo
     ↓
ConsumptionUpdated
```

---

# 34. Objetivo final

La capa Domain debe conseguir que Hidro Smart tenga un núcleo de negocio:

- Independiente.
- Fácil de probar.
- Fácil de mantener.
- Independiente de PostgreSQL.
- Independiente de MQTT.
- Independiente de Express.
- Preparado para evolucionar.

La idea principal es:

```text
        HIDRO SMART
             │
             ▼
          DOMAIN
             │
     ┌───────┼────────┐
     ▼       ▼        ▼
   User    Device   Actuator
             │        │
             ▼        ▼
          Reading   Commands
             │
             ▼
        Consumption
             │
             ▼
           Alerts
```

El Domain representa **el negocio de Hidro Smart**, mientras que las demás capas se encargan de conectarlo con el mundo exterior.