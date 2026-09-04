# Estructura del Proyecto Backend — Hidro Smart

## 1. Introducción

Este documento describe la estructura general del backend de Hidro Smart.

El backend está organizado para separar:

- API REST.
- Lógica de negocio.
- Acceso a datos.
- Comunicación MQTT.
- Procesos automáticos.
- Eventos.
- Configuración.
- Utilidades compartidas.
- Pruebas.

La estructura busca mantener el proyecto organizado, fácil de mantener y preparado para crecer.

---

# 2. Estructura general

```text
hidro-smart-backend/
│
├── src/
│
├── tests/
│
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 3. Carpeta `src`

```text
src/
```

Contiene todo el código fuente de la aplicación.

Dentro se encuentran los componentes principales del backend:

```text
src/
├── app.js
├── server.js
├── config/
├── api/
├── core/
├── mqtt/
├── events/
├── jobs/
└── shared/
```

---

# 4. `app.js`

Archivo:

```text
src/app.js
```

Su responsabilidad es configurar la aplicación.

Aquí se pueden registrar:

- Express.
- Middlewares.
- Rutas.
- Manejo global de errores.
- Configuraciones generales de la API.

Conceptualmente:

```text
app.js
│
├── Express
├── Middlewares
├── Routes
└── Error Handler
```

---

# 5. `server.js`

Archivo:

```text
src/server.js
```

Se encarga de iniciar el servidor.

Su responsabilidad principal es poner la aplicación a escuchar en el puerto configurado.

Flujo:

```text
server.js
   ↓
app.js
   ↓
Inicialización
   ↓
Servidor HTTP
```

---

# 6. Carpeta `config`

```text
src/config/
```

Contiene la configuración de los servicios externos y del entorno.

```text
config/
├── database.js
├── environment.js
├── mqtt.js
└── redis.js
```

### `database.js`

Configura PostgreSQL.

### `environment.js`

Lee y valida variables de entorno.

### `mqtt.js`

Configura la conexión MQTT.

### `redis.js`

Configura Redis.

---

# 7. Carpeta `api`

```text
src/api/
```

Contiene todo lo relacionado con la API REST.

```text
api/
├── controllers/
├── routes/
├── middlewares/
└── validators/
```

La API es la puerta de entrada para el frontend y otros clientes HTTP.

---

# 8. Controllers

Ubicación:

```text
src/api/controllers/
```

Los controllers reciben las peticiones HTTP y coordinan la ejecución del caso de uso correspondiente.

Ejemplos:

```text
auth.controller.js
user.controller.js
home.controller.js
device.controller.js
consumption.controller.js
AlertController.js
tariff.controller.js
goal.controller.js
vacation.controller.js
actuator.controller.js
```

El controller no debería contener reglas complejas del negocio.

Flujo:

```text
Request
   ↓
Controller
   ↓
Use Case
   ↓
Response
```

---

# 9. Routes

Ubicación:

```text
src/api/routes/
```

Define las rutas disponibles de la API.

La versión actual se encuentra en:

```text
src/api/routes/v1/
```

Contiene:

```text
auth.routes.js
users.routes.js
homes.routes.js
devices.routes.js
consumption.routes.js
alerts.routes.js
tariffs.routes.js
goals.routes.js
vacation.routes.js
actuators.routes.js
```

---

# 10. Versionado de API

El uso de:

```text
v1/
```

permite versionar la API.

Por ejemplo:

```text
/api/v1/users
/api/v1/homes
/api/v1/devices
```

Si posteriormente se necesita modificar la API de forma incompatible, se podría crear:

```text
/api/v2/
```

sin eliminar inmediatamente `v1`.

---

# 11. Middlewares

Ubicación:

```text
src/api/middlewares/
```

Contiene procesos que se ejecutan durante las peticiones HTTP.

Actualmente:

```text
auth.middleware.js
authorization.middleware.js
validation.middleware.js
rate-limit.middleware.js
error.middleware.js
```

---

# 12. Auth Middleware

Archivo:

```text
auth.middleware.js
```

Se encarga de verificar que una petición tenga una autenticación válida.

Flujo:

```text
Request
   ↓
Auth Middleware
   ↓
¿JWT válido?
   │
   ├── No → Error
   │
   └── Sí
        ↓
     Controller
```

---

# 13. Authorization Middleware

Archivo:

```text
authorization.middleware.js
```

Comprueba si el usuario autenticado tiene permisos suficientes para realizar una operación.

Diferencia:

```text
Authentication
     ↓
¿Quién eres?
```

```text
Authorization
     ↓
¿Qué puedes hacer?
```

---

# 14. Validation Middleware

Archivo:

```text
validation.middleware.js
```

Se utiliza para validar los datos recibidos por la API.

Por ejemplo:

```text
POST /api/v1/users
```

Antes de llegar al caso de uso:

```text
Request
   ↓
Validation
   ↓
Use Case
```

Esto evita que datos inválidos entren al sistema.

---

# 15. Rate Limit Middleware

Archivo:

```text
rate-limit.middleware.js
```

Ayuda a limitar la cantidad de peticiones realizadas a determinados endpoints.

Es especialmente importante para endpoints sensibles como:

```text
Login
Registro
Refresh Token
```

---

# 16. Error Middleware

Archivo:

```text
error.middleware.js
```

Centraliza el manejo de errores HTTP.

Conceptualmente:

```text
Error
 ↓
Error Middleware
 ↓
HTTP Response
```

Esto permite evitar que cada controller tenga que implementar su propio sistema de errores.

---

# 17. Validators

Ubicación:

```text
src/api/validators/
```

Contiene las reglas de validación de las peticiones.

Ejemplos:

```text
auth.validator.js
user.validator.js
home.validator.js
device.validator.js
consumption.validator.js
actuator.validator.js
```

Los validators verifican la estructura de los datos recibidos.

---

# 18. Carpeta `core`

```text
src/core/
```

Es el núcleo de la aplicación.

Se divide en:

```text
core/
├── domain/
├── application/
└── infrastructure/
```

Esta separación es fundamental para mantener aislada la lógica de negocio.

---

# 19. Domain

Ubicación:

```text
src/core/domain/
```

Contiene los conceptos y reglas principales del negocio.

```text
domain/
├── entities/
├── value-objects/
├── events/
└── exceptions/
```

El dominio no debería depender directamente de Express, PostgreSQL o MQTT.

---

# 20. Entities

Ubicación:

```text
src/core/domain/entities/
```

Contiene las entidades principales de Hidro Smart.

Actualmente:

```text
User.js
Home.js
Device.js
Reading.js
Consumption.js
Alert.js
Actuator.js
```

Estas representan conceptos importantes del sistema.

---

# 21. User

Representa al usuario de Hidro Smart.

Puede estar relacionado con:

- Cuenta.
- Hogares.
- Roles.
- Permisos.
- Preferencias.

La implementación final debe coincidir con el modelo de la base de datos.

---

# 22. Home

Representa un hogar administrado dentro de Hidro Smart.

Puede relacionarse con:

```text
User
Device
Consumption
Alerts
Tariffs
Goals
Vacation
```

---

# 23. Device

Representa un dispositivo IoT conectado al sistema.

En Hidro Smart tiene relación con el ESP32 y los sensores.

Flujo general:

```text
ESP32
   ↓
Device
   ↓
MQTT
   ↓
Backend
```

---

# 24. Reading

Representa una lectura recibida desde un dispositivo.

Ejemplo conceptual:

```text
Device
   ↓
Sensor
   ↓
Reading
```

En el proyecto puede representar información relacionada con el flujo de agua.

---

# 25. Consumption

Representa información procesada relacionada con el consumo de agua.

Puede utilizar las lecturas recibidas para generar información de consumo.

```text
Reading
   ↓
Consumption
```

---

# 26. Alert

Representa una alerta generada por alguna condición del sistema.

Por ejemplo, dependiendo de las reglas definidas:

```text
Consumo elevado
Flujo anormal
Problema del dispositivo
```

Las condiciones exactas deben corresponder a las reglas de negocio de Hidro Smart.

---

# 27. Actuator

Representa un actuador controlable.

En el proyecto se contempla principalmente:

```text
Electroválvula
Hidrobomba
```

Flujo:

```text
Backend
   ↓
MQTT
   ↓
ESP32
   ↓
Controlador/MOSFET
   ↓
Actuador
```

---

# 28. Value Objects

Ubicación:

```text
src/core/domain/value-objects/
```

Contiene objetos que representan valores con reglas propias.

Actualmente:

```text
Email.js
DeviceId.js
HomeId.js
```

Estos ayudan a evitar que datos importantes sean tratados simplemente como strings sin validación.

---

# 29. Domain Events

Ubicación:

```text
src/core/domain/events/
```

Contiene eventos relacionados con cambios importantes del dominio.

Actualmente:

```text
ReadingReceived.js
ConsumptionUpdated.js
AlertTriggered.js
ActuatorCommanded.js
```

Ejemplo:

```text
ReadingReceived
      ↓
Procesamiento
      ↓
ConsumptionUpdated
```

---

# 30. Domain Exceptions

Ubicación:

```text
src/core/domain/exceptions/
```

Contiene errores relacionados específicamente con reglas del dominio.

Ejemplos:

```text
DomainError.js
ValidationError.js
AuthorizationError.js
```

---

# 31. Application

Ubicación:

```text
src/core/application/
```

Contiene los casos de uso de la aplicación.

Se divide en:

```text
application/
├── use-cases/
├── ports/
└── dtos/
```

---

# 32. Use Cases

Ubicación:

```text
src/core/application/use-cases/
```

Contiene las operaciones que el sistema puede realizar.

Se divide por funcionalidades:

```text
auth/
user/
home/
device/
consumption/
alert/
actuator/
tariff/
goal/
vacation/
```

---

# 33. Auth Use Cases

```text
auth/
├── RegisterUser.js
├── LoginUser.js
├── RefreshToken.js
└── LogoutUser.js
```

Responsabilidades:

```text
RegisterUser
→ Registrar usuario

LoginUser
→ Autenticar usuario

RefreshToken
→ Renovar autenticación

LogoutUser
→ Cerrar sesión
```

---

# 34. User Use Cases

```text
user/
├── GetUser.js
├── UpdateUser.js
└── DeleteUser.js
```

Permiten gestionar información del usuario.

---

# 35. Home Use Cases

```text
home/
├── CreateHome.js
├── GetHome.js
├── UpdateHome.js
└── ManageMembers.js
```

Permiten administrar hogares y sus miembros.

---

# 36. Device Use Cases

```text
device/
├── RegisterDevice.js
├── UpdateDevice.js
├── GetDevice.js
├── GetDeviceStatus.js
└── ConfigureDevice.js
```

Permiten administrar dispositivos IoT.

---

# 37. Consumption Use Cases

```text
consumption/
├── ReceiveReading.js
├── GetCurrentConsumption.js
├── GetConsumptionHistory.js
└── GetConsumptionSummary.js
```

Permiten recibir y consultar información relacionada con el consumo.

---

# 38. Alert Use Cases

```text
alert/
├── GetPendingAlerts.js
├── UpdateAlertStatus.js
├── CreateAlertRule.js
├── ListAlertRules.js
├── UpdateAlertRule.js
└── DeleteAlertRule.js
```

Gestionan las alertas del sistema.

---

# 39. Actuator Use Cases

```text
actuator/
├── OpenValve.js
├── CloseValve.js
├── StartPump.js
├── StopPump.js
└── GetActuatorStatus.js
```

Estos casos de uso permiten controlar los actuadores.

Flujo:

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
Electroválvula
```

Para la hidrobomba:

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
Hidrobomba
```

---

# 40. Tariff, Goal y Vacation

También se contemplan:

```text
tariff/
goal/
vacation/
```

Estos módulos permiten implementar funcionalidades relacionadas con:

- Tarifas.
- Metas de ahorro.
- Modo vacaciones.

Los casos de uso concretos se definirán según las tablas y reglas definitivas de la base de datos.

---

# 41. Ports

Ubicación:

```text
src/core/application/ports/
```

Define contratos que necesita Application para comunicarse con componentes externos.

Se divide en:

```text
ports/
├── repositories/
└── services/
```

---

# 42. Repository Ports

```text
repositories/
├── IUserRepository.js
├── IHomeRepository.js
├── IDeviceRepository.js
├── IReadingRepository.js
├── IConsumptionRepository.js
└── IAlertRepository.js
```

Representan contratos para acceder a los datos.

Por ejemplo:

```text
IUserRepository
```

define qué operaciones necesita Application para trabajar con usuarios.

No define cómo PostgreSQL ejecutará esas operaciones.

---

# 43. Service Ports

```text
services/
├── IMqttService.js
├── INotificationService.js
└── ICacheService.js
```

Definen contratos para servicios externos.

Ejemplo:

```text
IMqttService
```

permite que Application solicite operaciones MQTT sin conocer directamente la librería MQTT.

---

# 44. DTOs

Ubicación:

```text
src/core/application/dtos/
```

Se utiliza para definir los datos que entran y salen de los casos de uso.

```text
dtos/
├── requests/
└── responses/
```

Los DTOs ayudan a evitar exponer directamente las entidades internas.

---

# 45. Infrastructure

Ubicación:

```text
src/core/infrastructure/
```

Contiene las implementaciones concretas de los contratos definidos por Application.

```text
infrastructure/
├── repositories/
├── services/
└── mappers/
```

Aquí sí pueden aparecer tecnologías concretas como:

```text
PostgreSQL
MQTT
Redis
```

---

# 46. Repositories

Ubicación:

```text
src/core/infrastructure/repositories/postgres/
```

Contiene las implementaciones para PostgreSQL.

Ejemplos:

```text
PostgresUserRepository.js
PostgresHomeRepository.js
PostgresDeviceRepository.js
PostgresReadingRepository.js
PostgresConsumptionRepository.js
PostgresAlertRepository.js
```

Flujo:

```text
Use Case
   ↓
Repository Port
   ↓
Postgres Repository
   ↓
PostgreSQL
```

---

# 47. Services

Ubicación:

```text
src/core/infrastructure/services/
```

Contiene implementaciones concretas de servicios externos.

```text
services/
├── mqtt/
├── notification/
├── cache/
└── event-bus/
```

---

# 48. MQTT Infrastructure

```text
mqtt/
├── MqttClient.js
├── MqttPublisher.js
└── MqttSubscriber.js
```

Responsabilidades:

### MqttClient

Gestiona la conexión con el broker.

### MqttPublisher

Publica mensajes.

### MqttSubscriber

Se suscribe a topics.

---

# 49. Mappers

Ubicación:

```text
src/core/infrastructure/mappers/
```

Contiene transformaciones entre:

```text
Entidad
DTO
Modelo de base de datos
```

Ejemplo:

```text
PostgreSQL
   ↓
UserMapper
   ↓
User
```

Esto evita mezclar estructuras de persistencia con las entidades del dominio.

---

# 50. Carpeta `mqtt`

```text
src/mqtt/
```

Contiene componentes específicos de la comunicación MQTT a nivel de aplicación.

```text
mqtt/
├── topics.js
├── message-parser.js
└── handlers/
```

---

# 51. Topics MQTT

Archivo:

```text
topics.js
```

Centraliza los topics utilizados por Hidro Smart.

Ejemplos conceptuales:

```text
device/+/reading
device/+/status
device/+/actuator/status
```

Los topics definitivos deben coincidir con los definidos para el firmware del ESP32.

---

# 52. Message Parser

Archivo:

```text
message-parser.js
```

Interpreta los mensajes recibidos desde MQTT.

Flujo:

```text
MQTT
 ↓
Message Parser
 ↓
Mensaje estructurado
 ↓
Handler
```

---

# 53. MQTT Handlers

```text
handlers/
├── reading.handler.js
├── device-status.handler.js
└── actuator-status.handler.js
```

Procesan diferentes tipos de mensajes.

### Reading Handler

Procesa lecturas de sensores.

### Device Status Handler

Procesa estados del dispositivo.

### Actuator Status Handler

Procesa estados de actuadores.

---

# 54. Carpeta `events`

```text
src/events/
```

Contiene handlers para eventos internos.

```text
events/
└── handlers/
    ├── reading.handler.js
    ├── consumption.handler.js
    ├── alert.handler.js
    └── actuator.handler.js
```

Ejemplo:

```text
ReadingReceived
       ↓
reading.handler
       ↓
Procesamiento
```

---

# 55. Carpeta `jobs`

```text
src/jobs/
```

Contiene tareas programadas.

```text
jobs/
├── daily-consumption.job.js
├── summary.job.js
└── cleanup.job.js
```

Se utilizan para procesos automáticos como:

- Procesamiento diario.
- Resúmenes.
- Limpieza.

---

# 56. Carpeta `shared`

```text
src/shared/
```

Contiene componentes reutilizables.

```text
shared/
├── constants/
├── utils/
└── exceptions/
```

---

# 57. Utils

```text
utils/
├── logger.js
├── jwt.js
└── password.js
```

### logger.js

Registro de eventos y errores.

### jwt.js

Gestión de JWT.

### password.js

Hash y verificación de contraseñas.

---

# 58. Tests

La carpeta:

```text
tests/
```

contiene las pruebas del backend.

```text
tests/
├── unit/
├── integration/
└── e2e/
```

---

# 59. Unit Tests

```text
tests/unit/
├── domain/
└── application/
```

Prueban componentes individuales sin depender de todo el sistema.

Ejemplos:

```text
User
Device
Use Cases
Value Objects
```

---

# 60. Integration Tests

```text
tests/integration/
```

Comprueban la interacción entre componentes.

Por ejemplo:

```text
Use Case
   ↓
Repository
   ↓
PostgreSQL
```

---

# 61. E2E Tests

```text
tests/e2e/
```

Comprueban flujos completos de la aplicación.

Ejemplo:

```text
Login
 ↓
JWT
 ↓
Crear hogar
 ↓
Registrar dispositivo
 ↓
Consultar consumo
```

---

# 62. Dockerfile

Archivo:

```text
Dockerfile
```

Define cómo construir la imagen del backend.

Conceptualmente:

```text
Dockerfile
    ↓
Imagen Docker
    ↓
Contenedor Backend
```

---

# 63. docker-compose.yml

Define los servicios necesarios para ejecutar el sistema.

Puede incluir:

```text
Backend
PostgreSQL
Redis
MQTT Broker
```

Conceptualmente:

```text
Docker Compose
│
├── backend
├── postgres
├── redis
└── mqtt
```

La composición exacta debe coincidir con la infraestructura utilizada por el proyecto.

---

# 64. package.json

Archivo:

```text
package.json
```

Define:

- Nombre del proyecto.
- Dependencias.
- Scripts.
- Versión.
- Configuración de Node.js.

También permite ejecutar comandos como:

```text
npm install
npm run dev
npm test
```

Los scripts definitivos se definirán durante la implementación.

---

# 65. README.md

Es la documentación principal del proyecto.

Debe explicar:

- Qué es Hidro Smart.
- Cómo instalarlo.
- Cómo ejecutar el backend.
- Variables de entorno.
- Docker.
- Base de datos.
- MQTT.
- Tests.
- Estructura general.

---

# 66. Flujo general del backend

La comunicación principal será:

```text
                  FRONTEND
                     │
                     ▼
                  API REST
                     │
                     ▼
                CONTROLLER
                     │
                     ▼
                  USE CASE
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       DOMAIN                 PORTS
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
                REPOSITORY              SERVICE
                     │                     │
                     ▼                     ▼
                PostgreSQL               MQTT
                                           │
                                           ▼
                                         ESP32
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                       Electroválvula              Hidrobomba
```

---

# 67. Flujo de una lectura

```text
YF-S201
   ↓
ESP32
   ↓
MQTT
   ↓
MQTT Subscriber
   ↓
Reading Handler
   ↓
ReceiveReading
   ↓
Reading Repository
   ↓
PostgreSQL
```

---

# 68. Flujo de control de electroválvula

```text
Frontend
   ↓
POST /api/v1/actuators/...
   ↓
Actuator Controller
   ↓
OpenValve / CloseValve
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

---

# 69. Flujo de control de hidrobomba

```text
Frontend
   ↓
Actuator Controller
   ↓
StartPump / StopPump
   ↓
IMqttService
   ↓
MqttPublisher
   ↓
MQTT Broker
   ↓
ESP32
   ↓
Controlador
   ↓
Hidrobomba
```

---

# 70. Regla de separación

Cada capa tiene una responsabilidad.

```text
API
↓
Recibir peticiones

Application
↓
Ejecutar casos de uso

Domain
↓
Reglas del negocio

Infrastructure
↓
Tecnologías externas

MQTT
↓
Comunicación IoT

Jobs
↓
Procesos automáticos

Shared
↓
Componentes reutilizables

Config
↓
Configuración
```

---

# 71. Estructura completa

```text
hidro-smart-backend/
│
├── src/
│   │
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── environment.js
│   │   ├── mqtt.js
│   │   └── redis.js
│   │
│   ├── api/
│   │   ├── controllers/
│   │   ├── routes/
│   │   │   └── v1/
│   │   ├── middlewares/
│   │   └── validators/
│   │
│   ├── core/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── exceptions/
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── ports/
│   │   │   └── dtos/
│   │   │
│   │   └── infrastructure/
│   │       ├── repositories/
│   │       │   └── postgres/
│   │       ├── services/
│   │       └── mappers/
│   │
│   ├── mqtt/
│   │   ├── topics.js
│   │   ├── message-parser.js
│   │   └── handlers/
│   │
│   ├── events/
│   │   └── handlers/
│   │
│   ├── jobs/
│   │   ├── daily-consumption.job.js
│   │   ├── summary.job.js
│   │   └── cleanup.job.js
│   │
│   └── shared/
│       ├── constants/
│       ├── utils/
│       └── exceptions/
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── application/
│   ├── integration/
│   └── e2e/
│
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 72. Principio general del proyecto

La estructura está diseñada para que cada parte tenga una responsabilidad clara.

La idea principal es:

```text
                    HIDRO SMART
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
      API              MQTT              JOBS
       │                 │                 │
       ▼                 ▼                 ▼
 APPLICATION         ESP32            AUTOMATIZACIÓN
       │
       ▼
    DOMAIN
       │
       ▼
 INFRASTRUCTURE
       │
       ├──────────► PostgreSQL
       ├──────────► Redis
       └──────────► Servicios externos
```

Esto permite que el backend pueda crecer sin convertir todo el código en una sola estructura difícil de mantener.

---

# 73. Regla principal

> **Cada carpeta debe tener una responsabilidad definida y las capas deben comunicarse respetando la arquitectura establecida.**

La estructura no busca agregar carpetas por agregar. Cada componente debe existir porque tiene una función concreta dentro de Hidro Smart.
