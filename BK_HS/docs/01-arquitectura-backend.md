# Arquitectura del Backend — Hidro Smart

Nota de estado (2026-09-07): esta guía conserva la arquitectura objetivo. Para
el estado implementado prevalecen `00-estado-actual.md`, `03-endpoints.md` y
el código de `src/app.js`. Actuadores HTTP, persistencia MQTT, Redis y MFA no
forman parte de la API activa actual.

## 1. Introducción

El backend de **Hidro Smart** será el encargado de conectar el frontend, la base de datos PostgreSQL y los dispositivos IoT utilizados para el monitoreo y control del consumo de agua.

El backend permitirá:

- Gestionar usuarios y autenticación.
- Gestionar hogares.
- Registrar y administrar dispositivos ESP32.
- Recibir información de los sensores.
- Registrar y consultar el consumo de agua.
- Generar y gestionar alertas.
- Controlar actuadores.
- Controlar la electroválvula.
- Controlar la hidrobomba.
- Comunicarse con los dispositivos IoT mediante MQTT.
- Proporcionar una API REST para el frontend.
- Ejecutar procesos automáticos mediante Jobs.

---

# 2. Arquitectura general

Hidro Smart utilizará principalmente una combinación de las siguientes arquitecturas y enfoques:

1. **Monolito Modular**
2. **Arquitectura Hexagonal**
3. **Domain-Driven Design (DDD)**
4. **Arquitectura orientada a eventos**
5. **API REST**
6. **Arquitectura IoT basada en MQTT**

Estas decisiones buscan mantener el proyecto organizado y permitir que cada parte tenga una responsabilidad clara.

---

# 3. Monolito Modular

El backend será desarrollado como una **única aplicación**, pero estará dividido internamente en diferentes módulos.

Esto significa que no tendremos varios servidores independientes para cada funcionalidad.

La estructura estará organizada por responsabilidades:

```text
Auth
User
Home
Device
Consumption
Alert
Actuator
Tariff
Goal
Vacation
```

Por ejemplo:

```text
auth/
user/
home/
device/
consumption/
alert/
actuator/
```

Cada módulo tendrá sus propios casos de uso y responsabilidades.

## Ventajas

- Facilita el desarrollo.
- Simplifica el despliegue.
- Reduce la complejidad inicial.
- Facilita las pruebas.
- Permite separar claramente las funcionalidades.
- En el futuro podría facilitar la extracción de módulos a microservicios.

---

# 4. Arquitectura Hexagonal

La arquitectura hexagonal permite separar la lógica del negocio de las tecnologías externas.

En Hidro Smart esto significa que las reglas principales del sistema no deben depender directamente de:

- Express.
- PostgreSQL.
- MQTT.
- Redis.
- HTTP.
- Servicios externos.

La estructura principal será:

```text
src/
│
├── api/
├── core/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── mqtt/
├── events/
├── jobs/
├── shared/
└── config/
```

---

# 5. Capas principales

## 5.1 API

Ubicación:

```text
src/api/
```

Es la entrada HTTP del sistema.

Se encarga de:

- Routes.
- Controllers.
- Middlewares.
- Validaciones.

Su función es recibir solicitudes del frontend y enviarlas al caso de uso correspondiente.

Flujo:

```text
Frontend
    ↓
Route
    ↓
Middleware
    ↓
Controller
```

---

## 5.2 Application

Ubicación:

```text
src/core/application/
```

Contiene los **casos de uso** del sistema.

Ejemplos:

```text
RegisterUser
LoginUser
RegisterDevice
ReceiveReading
GetConsumptionHistory
OpenValve
CloseValve
StartPump
StopPump
```

La capa Application coordina las operaciones necesarias para cumplir una acción del sistema.

Ejemplo:

```text
OpenValve
    ↓
Verificar autorización
    ↓
Verificar dispositivo
    ↓
Enviar comando MQTT
```

---

# 6. Domain

Ubicación:

```text
src/core/domain/
```

Representa el núcleo del negocio de Hidro Smart.

Aquí estarán las entidades y reglas principales.

Entidades:

```text
User
Home
Device
Reading
Consumption
Alert
Actuator
```

También existirán:

```text
Value Objects
Domain Events
Domain Exceptions
```

El Domain debe mantenerse independiente de tecnologías externas.

Por ejemplo, `Device.js` no debería importar PostgreSQL ni MQTT.

---

# 7. Infrastructure

Ubicación:

```text
src/core/infrastructure/
```

Contiene las implementaciones concretas de los servicios externos.

Aquí estarán:

- Repositories de PostgreSQL.
- Servicios MQTT.
- Caché.
- Event Bus.
- Mappers.
- Otros servicios externos que posteriormente sean necesarios.

Ejemplo:

```text
Application
    ↓
IDeviceRepository
    ↓
PostgresDeviceRepository
    ↓
PostgreSQL
```

La aplicación trabaja con una interfaz y la infraestructura proporciona la implementación real.

---

# 8. Comunicación con PostgreSQL

La base de datos será PostgreSQL.

El acceso se realizará mediante repositories.

El flujo será:

```text
Controller
    ↓
Use Case
    ↓
Repository Interface
    ↓
Postgres Repository
    ↓
PostgreSQL
```

Esto evita colocar consultas SQL directamente en los controllers o casos de uso.

---

# 9. Arquitectura IoT

Una parte fundamental de Hidro Smart es la comunicación con el ESP32.

El sistema utilizará MQTT para intercambiar información entre el backend y los dispositivos.

## Envío de información

El ESP32 obtiene información del sensor de caudal y la envía al broker MQTT.

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
```

El backend podrá utilizar esta información para:

- Registrar lecturas.
- Calcular consumo.
- Actualizar estados.
- Generar alertas.

---

# 10. Control de actuadores

Hidro Smart también necesita controlar elementos físicos.

Los principales actuadores considerados son:

- Electroválvula de 12 V.
- Hidrobomba.

El ESP32 será el encargado de ejecutar físicamente los comandos.

El backend solamente enviará la orden mediante MQTT.

## Electroválvula

```text
Frontend
    ↓
API
    ↓
OpenValve / CloseValve
    ↓
MQTT
    ↓
ESP32
    ↓
MOSFET
    ↓
Electroválvula
```

## Hidrobomba

```text
Frontend
    ↓
API
    ↓
StartPump / StopPump
    ↓
MQTT
    ↓
ESP32
    ↓
Controlador
    ↓
Hidrobomba
```

El backend no controla directamente los pines del ESP32. Su responsabilidad es enviar y recibir información mediante MQTT.

---

# 11. Arquitectura orientada a eventos

Hidro Smart utilizará eventos internos para comunicar determinados procesos.

Ejemplos:

```text
ReadingReceived
ConsumptionUpdated
AlertTriggered
ActuatorCommanded
```

Por ejemplo:

```text
ReadingReceived
       ↓
Procesar lectura
       ↓
Actualizar consumo
       ↓
Comprobar condiciones
       ↓
Generar AlertTriggered
```

Esto permite separar procesos y evitar que una funcionalidad dependa directamente de otra.

---

# 12. API REST

La comunicación entre el frontend y el backend se realizará mediante una API REST.

Las rutas estarán versionadas:

```text
/api/v1
```

Ejemplo:

```text
/api/v1/auth
/api/v1/users
/api/v1/homes
/api/v1/devices
/api/v1/consumption
/api/v1/alerts
/api/v1/actuators
```

La API será responsable de recibir las solicitudes del frontend y devolver respuestas estructuradas.

---

# 13. Seguridad

La seguridad será aplicada de forma transversal.

El backend deberá controlar:

- Autenticación.
- Autorización.
- Validación de datos.
- Protección de endpoints.
- Manejo seguro de contraseñas.
- Protección de variables sensibles.
- Control de acceso a hogares y dispositivos.

Especialmente, las operaciones sobre los actuadores deben verificar que el usuario tenga permiso para controlar el dispositivo.

Ejemplo:

```text
Usuario
   ↓
JWT válido
   ↓
¿Tiene permiso?
   ↓
¿Tiene acceso al hogar?
   ↓
¿Puede controlar el dispositivo?
   ↓
Enviar comando MQTT
```

---

# 14. Jobs

Los Jobs estarán ubicados en:

```text
src/jobs/
```

Serán utilizados para tareas que deban ejecutarse automáticamente.

Ejemplos:

```text
daily-consumption.job.js
summary.job.js
cleanup.job.js
```

Podrán utilizarse para:

- Procesamiento de consumo diario.
- Generación de resúmenes.
- Limpieza de información temporal.
- Procesos periódicos necesarios para el sistema.

---

# 15. Shared

La carpeta:

```text
src/shared/
```

contendrá componentes reutilizables por diferentes módulos.

Ejemplos:

```text
constants/
utils/
exceptions/
```

Entre las utilidades estarán:

```text
logger.js
jwt.js
password.js
```

No se utilizará `shared` para almacenar funcionalidades que pertenezcan específicamente a un dominio.

---

# 16. Configuración

La configuración estará centralizada en:

```text
src/config/
```

Archivos principales:

```text
database.js
environment.js
mqtt.js
redis.js
```

Estos archivos permitirán configurar las conexiones y variables necesarias para ejecutar el backend.

Las credenciales y secretos deberán mantenerse mediante variables de entorno.

---

# 17. Flujo completo del sistema

La arquitectura completa puede representarse de la siguiente manera:

```text
                         FRONTEND
                            │
                            │ HTTP/REST
                            ▼
                    ┌───────────────┐
                    │      API      │
                    │ Routes        │
                    │ Controllers   │
                    │ Middlewares   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ APPLICATION   │
                    │ Use Cases     │
                    │ Ports         │
                    │ DTOs          │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    DOMAIN     │
                    │ Entities      │
                    │ Value Objects │
                    │ Events        │
                    │ Rules         │
                    └───────┬───────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   INFRASTRUCTURE    │
                 │                     │
                 │ PostgreSQL          │
                 │ MQTT                │
                 │ Cache               │
                 │ Event Bus           │
                 └───────┬─────────────┘
                         │
             ┌───────────┴────────────┐
             ▼                        ▼
       PostgreSQL                    MQTT
                                      │
                                      ▼
                                    ESP32
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                      YF-S201    Electroválvula  Hidrobomba
```

---

# 18. Principios de la arquitectura

El backend seguirá principalmente estos principios:

### Separación de responsabilidades

Cada componente debe tener una responsabilidad clara.

### Inversión de dependencias

Las reglas de negocio no deben depender de implementaciones concretas.

### Bajo acoplamiento

Los módulos deben depender lo menos posible unos de otros.

### Alta cohesión

Cada módulo debe concentrarse en una funcionalidad específica.

### Seguridad

La autenticación y autorización deben formar parte del diseño desde el principio.

### Testabilidad

Los casos de uso y reglas de negocio deben poder probarse de forma independiente.

---

# 19. Estructura relacionada

La arquitectura se refleja directamente en la estructura:

```text
hidro-smart-backend/
│
├── src/
│   ├── api/
│   ├── config/
│   ├── core/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── mqtt/
│   ├── events/
│   ├── jobs/
│   └── shared/
│
├── tests/
│
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

Esta estructura permite separar claramente:

```text
Entrada HTTP
      ↓
Lógica de aplicación
      ↓
Reglas del negocio
      ↓
Infraestructura
      ↓
BD / MQTT / Servicios externos
```

---

# 20. Resumen

La arquitectura de Hidro Smart está diseñada para mantener separado el negocio de las tecnologías externas.

El sistema tendrá:

- **Monolito modular** para mantener una aplicación organizada.
- **Arquitectura hexagonal** para separar negocio e infraestructura.
- **DDD** para representar correctamente el dominio.
- **API REST** para comunicarse con el frontend.
- **MQTT** para comunicarse con los ESP32.
- **PostgreSQL** para almacenar la información.
- **Eventos** para procesos internos desacoplados.
- **Jobs** para tareas automáticas.
- **Tests** para verificar el funcionamiento del sistema.

El objetivo es construir un backend organizado, mantenible y preparado para integrar el frontend y el sistema IoT de Hidro Smart.
