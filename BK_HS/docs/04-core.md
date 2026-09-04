# Core del Backend — Hidro Smart

## 1. Introducción

El `core` representa el núcleo principal del backend de Hidro Smart.

Aquí se concentra la lógica que permite que el sistema funcione independientemente de la tecnología utilizada para comunicarse con el exterior.

El Core se divide en tres partes principales:

```text
src/core/
│
├── domain/
├── application/
└── infrastructure/
```

Cada una tiene una responsabilidad diferente.

---

# 2. Objetivo del Core

El Core tiene como objetivo separar la lógica del sistema de los mecanismos externos como:

- HTTP.
- Express.
- PostgreSQL.
- MQTT.
- Redis.
- Servicios de notificaciones.

De esta manera, cambiar una tecnología externa no debería obligar a modificar las reglas principales del sistema.

Por ejemplo:

```text
Frontend
   ↓
API
   ↓
Core
   ↓
PostgreSQL
```

Si posteriormente PostgreSQL fuera reemplazado por otra tecnología, la lógica de negocio debería poder mantenerse.

---

# 3. Estructura general

La estructura será:

```text
core/
│
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── exceptions/
│
├── application/
│   ├── use-cases/
│   ├── ports/
│   │   ├── repositories/
│   │   └── services/
│   └── dtos/
│       ├── requests/
│       └── responses/
│
└── infrastructure/
    ├── repositories/
    │   └── postgres/
    ├── services/
    │   ├── mqtt/
    │   ├── notification/
    │   ├── cache/
    │   └── event-bus/
    └── mappers/
```

---

# 4. Domain

Ubicación:

```text
src/core/domain/
```

El `domain` representa las reglas y conceptos principales del negocio de Hidro Smart.

Aquí estarán las entidades que representan los elementos importantes del sistema.

```text
domain/
├── entities/
├── value-objects/
├── events/
└── exceptions/
```

El Domain **no debe depender de Express, PostgreSQL ni MQTT**.

---

# 5. Entidades del dominio

Ubicación:

```text
src/core/domain/entities/
```

Las entidades representan objetos importantes del sistema.

Se contemplan:

```text
User
Home
Device
Reading
Consumption
Alert
Actuator
```

---

## User

Representa al usuario de Hidro Smart.

Puede contener comportamientos y reglas relacionadas con la cuenta del usuario.

---

## Home

Representa un hogar administrado dentro de Hidro Smart.

Un hogar permite agrupar:

- Usuarios.
- Dispositivos.
- Información de consumo.
- Actuadores.

---

## Device

Representa un dispositivo IoT registrado en el sistema.

En el contexto de Hidro Smart, el dispositivo principal será el ESP32 encargado de comunicarse con los sensores y actuadores.

---

## Reading

Representa una lectura recibida desde un dispositivo.

Por ejemplo, una lectura proveniente del sensor de caudal.

```text
ESP32
   ↓
YF-S201
   ↓
Reading
```

---

## Consumption

Representa información procesada relacionada con el consumo de agua.

Puede utilizar las lecturas recibidas para generar información de consumo.

---

## Alert

Representa una alerta generada por el sistema.

Ejemplos:

- Consumo elevado.
- Posible fuga.
- Comportamiento anormal.
- Problemas con un dispositivo.

---

## Actuator

Representa un elemento controlable del sistema.

En Hidro Smart se contemplan principalmente:

```text
Electroválvula
Hidrobomba
```

---

# 6. Value Objects

Ubicación:

```text
src/core/domain/value-objects/
```

Los Value Objects representan valores que tienen reglas propias y que no necesitan identidad independiente.

Se contemplan inicialmente:

```text
Email
DeviceId
HomeId
```

Ejemplo:

```text
Email
```

En lugar de tratar un correo simplemente como un `string`, el Value Object puede encargarse de validar las reglas correspondientes.

---

# 7. Domain Events

Ubicación:

```text
src/core/domain/events/
```

Los eventos representan hechos importantes que ocurrieron dentro del sistema.

Se contemplan:

```text
ReadingReceived
ConsumptionUpdated
AlertTriggered
ActuatorCommanded
```

Ejemplo:

```text
ReadingReceived
      ↓
Procesar lectura
      ↓
Actualizar consumo
      ↓
ConsumptionUpdated
```

Los eventos permiten desacoplar diferentes procesos del sistema.

---

# 8. Excepciones del dominio

Ubicación:

```text
src/core/domain/exceptions/
```

Aquí estarán los errores relacionados con reglas del dominio.

Ejemplos:

```text
DomainError
ValidationError
AuthorizationError
```

Estas excepciones posteriormente serán transformadas por la API en respuestas HTTP apropiadas.

---

# 9. Application

Ubicación:

```text
src/core/application/
```

La capa Application contiene los **casos de uso** del sistema.

Aquí se define qué puede hacer Hidro Smart.

Por ejemplo:

```text
Registrar usuario
Iniciar sesión
Crear hogar
Registrar dispositivo
Consultar consumo
Abrir electroválvula
Encender hidrobomba
```

Su estructura será:

```text
application/
├── use-cases/
├── ports/
└── dtos/
```

---

# 10. Use Cases

Ubicación:

```text
src/core/application/use-cases/
```

Cada caso de uso representa una operación concreta del sistema.

Se organizarán por módulo:

```text
use-cases/
│
├── auth/
├── user/
├── home/
├── device/
├── consumption/
├── alert/
├── actuator/
├── tariff/
├── goal/
└── vacation/
```

---

# 11. Casos de uso de autenticación

```text
auth/
├── RegisterUser.js
├── LoginUser.js
├── RefreshToken.js
└── LogoutUser.js
```

Estos casos de uso gestionarán las operaciones principales relacionadas con la autenticación.

---

# 12. Casos de uso de usuarios

```text
user/
├── GetUser.js
├── UpdateUser.js
└── DeleteUser.js
```

Gestionarán las operaciones del perfil del usuario.

---

# 13. Casos de uso de hogares

```text
home/
├── CreateHome.js
├── GetHome.js
├── UpdateHome.js
└── ManageMembers.js
```

Gestionarán la creación y administración de hogares.

---

# 14. Casos de uso de dispositivos

```text
device/
├── RegisterDevice.js
├── UpdateDevice.js
├── GetDevice.js
├── GetDeviceStatus.js
└── ConfigureDevice.js
```

Gestionarán los dispositivos IoT registrados.

---

# 15. Casos de uso de consumo

```text
consumption/
├── ReceiveReading.js
├── GetCurrentConsumption.js
├── GetConsumptionHistory.js
└── GetConsumptionSummary.js
```

Esta parte será especialmente importante porque conecta las lecturas del ESP32 con la información de consumo del sistema.

---

# 16. Casos de uso de alertas

```text
alert/
├── GetPendingAlerts.js
├── UpdateAlertStatus.js
├── CreateAlertRule.js
├── ListAlertRules.js
├── UpdateAlertRule.js
└── DeleteAlertRule.js
```

Gestionarán el ciclo de vida de las alertas.

---

# 17. Casos de uso de actuadores

```text
actuator/
├── OpenValve.js
├── CloseValve.js
├── StartPump.js
├── StopPump.js
└── GetActuatorStatus.js
```

Estos casos de uso serán responsables de coordinar las acciones sobre:

```text
Electroválvula
Hidrobomba
```

El caso de uso no controla directamente los pines del ESP32.

Su función será coordinar la solicitud con el servicio correspondiente.

```text
OpenValve
    ↓
IMqttService
    ↓
MQTT
    ↓
ESP32
```

---

# 18. Ports

Ubicación:

```text
src/core/application/ports/
```

Los Ports representan contratos que permiten al Core comunicarse con recursos externos sin depender directamente de sus implementaciones.

Se dividirán en:

```text
ports/
├── repositories/
└── services/
```

---

# 19. Repository Ports

Ubicación:

```text
ports/repositories/
```

Se contemplan:

```text
IUserRepository.js
IHomeRepository.js
IDeviceRepository.js
IReadingRepository.js
IConsumptionRepository.js
IAlertRepository.js
```

Estos archivos representan contratos.

Por ejemplo:

```text
IDeviceRepository
```

define las operaciones que necesita el sistema para trabajar con dispositivos.

La implementación real estará en Infrastructure.

```text
Application
     ↓
IDeviceRepository
     ↓
PostgresDeviceRepository
     ↓
PostgreSQL
```

---

# 20. Service Ports

Ubicación:

```text
ports/services/
```

Se contemplan:

```text
IMqttService.js
INotificationService.js
ICacheService.js
```

Estos contratos permiten que Application utilice servicios externos sin conocer sus detalles de implementación.

Por ejemplo:

```text
Application
     ↓
IMqttService
     ↓
MqttPublisher
     ↓
MQTT Broker
```

---

# 21. DTOs

Ubicación:

```text
src/core/application/dtos/
```

Los DTO permiten definir los datos que entran y salen de los casos de uso.

Estructura:

```text
dtos/
├── requests/
└── responses/
```

## Requests

Representan los datos que necesita una operación.

Ejemplo:

```text
RegisterUserRequest
CreateHomeRequest
RegisterDeviceRequest
OpenValveRequest
```

## Responses

Representan los datos que serán devueltos.

Ejemplo:

```text
UserResponse
HomeResponse
DeviceResponse
ConsumptionResponse
AlertResponse
```

Los DTO ayudan a evitar exponer directamente las entidades internas.

---

# 22. Infrastructure

Ubicación:

```text
src/core/infrastructure/
```

Infrastructure contiene las implementaciones concretas de los Ports.

Aquí se conectan las reglas del Core con las tecnologías externas.

```text
infrastructure/
├── repositories/
├── services/
└── mappers/
```

---

# 23. Repositories PostgreSQL

Ubicación:

```text
src/core/infrastructure/repositories/postgres/
```

Aquí estarán las implementaciones de los repositories.

```text
PostgresUserRepository.js
PostgresHomeRepository.js
PostgresDeviceRepository.js
PostgresReadingRepository.js
PostgresConsumptionRepository.js
PostgresAlertRepository.js
```

Su responsabilidad será comunicarse con PostgreSQL.

---

# 24. Servicios de Infrastructure

Se contemplan:

```text
services/
├── mqtt/
├── notification/
├── cache/
└── event-bus/
```

Cada uno tendrá una responsabilidad específica.

---

## MQTT

Se encargará de comunicarse con el broker MQTT.

Será utilizado para:

- Recibir lecturas.
- Recibir estados.
- Enviar comandos.
- Comunicarse con el ESP32.

---

## Notification

Permitirá implementar posteriormente servicios de notificación.

Por ejemplo:

- Email.
- Push.
- Otros canales que sean necesarios.

---

## Cache

Permitirá implementar caché para información que se consulte frecuentemente.

---

## Event Bus

Permitirá distribuir eventos internos entre diferentes partes del backend.

---

# 25. Mappers

Ubicación:

```text
src/core/infrastructure/mappers/
```

Se contemplan:

```text
UserMapper.js
HomeMapper.js
DeviceMapper.js
ReadingMapper.js
AlertMapper.js
```

Los mappers permiten convertir datos entre diferentes representaciones.

Por ejemplo:

```text
PostgreSQL
     ↓
Mapper
     ↓
Domain Entity
```

Y:

```text
Domain Entity
     ↓
Mapper
     ↓
Response DTO
```

---

# 26. Flujo completo dentro del Core

Ejemplo: consultar un dispositivo.

```text
HTTP Request
     ↓
Controller
     ↓
GetDevice
     ↓
IDeviceRepository
     ↓
PostgresDeviceRepository
     ↓
PostgreSQL
     ↓
DeviceMapper
     ↓
Device Entity
     ↓
Response DTO
     ↓
Controller
     ↓
HTTP Response
```

---

# 27. Flujo de una lectura del ESP32

Ejemplo de una lectura del sensor:

```text
YF-S201
    ↓
ESP32
    ↓
MQTT
    ↓
MqttSubscriber
    ↓
Reading Handler
    ↓
ReceiveReading
    ↓
IReadingRepository
    ↓
PostgreSQL
```

Después pueden generarse eventos:

```text
ReadingReceived
      ↓
ConsumptionUpdated
      ↓
AlertTriggered
```

---

# 28. Flujo de control de actuadores

Ejemplo: abrir la electroválvula.

```text
Frontend
    ↓
API
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
```

Para la hidrobomba:

```text
Frontend
    ↓
API
    ↓
ActuatorController
    ↓
StartPump
    ↓
IMqttService
    ↓
MQTT
    ↓
ESP32
    ↓
Controlador
    ↓
Hidrobomba
```

---

# 29. Regla de dependencias

Las dependencias deberán seguir una dirección clara:

```text
API
 ↓
Application
 ↓
Domain
```

Y:

```text
Infrastructure
 ↓
Implementa Ports
```

El Domain no debe depender de Infrastructure.

Incorrecto:

```text
Domain → PostgreSQL
Domain → MQTT
Domain → Express
```

Correcto:

```text
Domain
   ↑
Application
   ↑
Infrastructure
```

Infrastructure implementa los contratos que necesita Application.

---

# 30. Qué NO debe hacerse en el Core

No se debe colocar:

### SQL directamente en los Controllers

Incorrecto:

```text
Controller → SQL
```

### MQTT directamente en los Controllers

Incorrecto:

```text
Controller → MQTT
```

### Reglas de negocio en las Routes

Incorrecto:

```text
Route → reglas complejas
```

### Dependencias de Express en Domain

Incorrecto:

```text
Domain → Express
```

La responsabilidad debe permanecer separada.

---

# 31. Estructura final del Core

```text
core/
│
├── domain/
│   ├── entities/
│   │   ├── User.js
│   │   ├── Home.js
│   │   ├── Device.js
│   │   ├── Reading.js
│   │   ├── Consumption.js
│   │   ├── Alert.js
│   │   └── Actuator.js
│   │
│   ├── value-objects/
│   │   ├── Email.js
│   │   ├── DeviceId.js
│   │   └── HomeId.js
│   │
│   ├── events/
│   │   ├── ReadingReceived.js
│   │   ├── ConsumptionUpdated.js
│   │   ├── AlertTriggered.js
│   │   └── ActuatorCommanded.js
│   │
│   └── exceptions/
│       ├── DomainError.js
│       ├── ValidationError.js
│       └── AuthorizationError.js
│
├── application/
│   ├── use-cases/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── home/
│   │   ├── device/
│   │   ├── consumption/
│   │   ├── alert/
│   │   ├── actuator/
│   │   ├── tariff/
│   │   ├── goal/
│   │   └── vacation/
│   │
│   ├── ports/
│   │   ├── repositories/
│   │   └── services/
│   │
│   └── dtos/
│       ├── requests/
│       └── responses/
│
└── infrastructure/
    ├── repositories/
    │   └── postgres/
    │
    ├── services/
    │   ├── mqtt/
    │   ├── notification/
    │   ├── cache/
    │   └── event-bus/
    │
    └── mappers/
```

---

# 32. Resumen

El Core es el centro de la lógica del backend.

Su división principal es:

```text
DOMAIN
   ↓
Reglas y entidades del negocio

APPLICATION
   ↓
Casos de uso

INFRASTRUCTURE
   ↓
Implementaciones y tecnologías externas
```

En Hidro Smart:

```text
API
 ↓
Application
 ↓
Domain
 ↓
Ports
 ↓
Infrastructure
 ↓
PostgreSQL / MQTT / servicios externos
```

Esta separación permitirá mantener el backend organizado y facilitará posteriormente el desarrollo, las pruebas, el mantenimiento y la integración con el frontend y los dispositivos ESP32.
