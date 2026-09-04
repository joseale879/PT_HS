# Infrastructure — Hidro Smart

## 1. Introducción

La capa `infrastructure` contiene las implementaciones concretas que permiten que Hidro Smart se comunique con sistemas externos.

Mientras que `Domain` contiene las reglas del negocio y `Application` define qué necesita el sistema, `Infrastructure` se encarga de **cómo se realizan esas operaciones realmente**.

En Hidro Smart esta capa principalmente conecta:

- PostgreSQL.
- MQTT.
- Redis.
- Servicios de notificación.
- Event Bus.
- Mappers.

---

# 2. Ubicación

```text
src/
└── core/
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

# 3. Estructura

```text
infrastructure/
│
├── repositories/
│   └── postgres/
│       ├── PostgresUserRepository.js
│       ├── PostgresHomeRepository.js
│       ├── PostgresDeviceRepository.js
│       ├── PostgresReadingRepository.js
│       ├── PostgresConsumptionRepository.js
│       └── PostgresAlertRepository.js
│
├── services/
│   ├── mqtt/
│   │   ├── MqttClient.js
│   │   ├── MqttPublisher.js
│   │   └── MqttSubscriber.js
│   │
│   ├── notification/
│   ├── cache/
│   └── event-bus/
│
└── mappers/
    ├── UserMapper.js
    ├── HomeMapper.js
    ├── DeviceMapper.js
    ├── ReadingMapper.js
    └── AlertMapper.js
```

---

# 4. Responsabilidad de Infrastructure

Infrastructure responde principalmente a:

> **¿Cómo se conecta Hidro Smart con el mundo exterior?**

Por ejemplo:

```text
Application necesita guardar un usuario
        ↓
IUserRepository
        ↓
PostgresUserRepository
        ↓
PostgreSQL
```

O:

```text
Application necesita abrir una válvula
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

# 5. Repository Pattern

Los repositories implementan los Ports definidos en Application.

Ejemplo:

```text
Application
│
└── ports/repositories/
        │
        └── IUserRepository
                  ▲
                  │ implementa
                  │
Infrastructure
│
└── repositories/postgres/
        │
        └── PostgresUserRepository
```

Esto permite cambiar PostgreSQL por otra tecnología sin modificar los casos de uso.

---

# 6. PostgreSQL

La base de datos principal de Hidro Smart será PostgreSQL.

La Infrastructure será responsable de:

- Crear conexiones.
- Ejecutar consultas.
- Insertar información.
- Actualizar información.
- Consultar información.
- Eliminar o desactivar registros.
- Manejar transacciones.

La Application no debe ejecutar SQL directamente.

---

# 7. PostgresUserRepository

Archivo:

```text
src/core/infrastructure/repositories/postgres/PostgresUserRepository.js
```

Implementa:

```text
IUserRepository
```

Su responsabilidad es realizar las operaciones de usuarios sobre PostgreSQL.

Ejemplo conceptual:

```text
RegisterUser
     ↓
IUserRepository
     ↓
PostgresUserRepository
     ↓
PostgreSQL
```

---

# 8. PostgresHomeRepository

Archivo:

```text
PostgresHomeRepository.js
```

Implementa las operaciones necesarias para trabajar con los hogares.

Puede encargarse de:

```text
Crear hogar
Consultar hogar
Actualizar hogar
Consultar miembros
```

Las operaciones definitivas deben corresponder al modelo final de la base de datos.

---

# 9. PostgresDeviceRepository

Archivo:

```text
PostgresDeviceRepository.js
```

Gestiona la persistencia de los dispositivos IoT.

Por ejemplo:

```text
Registrar ESP32
Consultar dispositivo
Actualizar configuración
Consultar estado
```

El Repository guarda información en PostgreSQL, pero **no controla físicamente el ESP32**.

---

# 10. PostgresReadingRepository

Archivo:

```text
PostgresReadingRepository.js
```

Gestiona las lecturas provenientes de los dispositivos.

Flujo:

```text
YF-S201
   ↓
ESP32
   ↓
MQTT
   ↓
Backend
   ↓
PostgresReadingRepository
   ↓
PostgreSQL
```

Su función es persistir las lecturas que el sistema necesita conservar.

---

# 11. PostgresConsumptionRepository

Archivo:

```text
PostgresConsumptionRepository.js
```

Gestiona las consultas y operaciones relacionadas con el consumo.

Puede trabajar con:

```text
Consumo actual
Historial
Resúmenes
Consultas por período
```

Las consultas pesadas pueden utilizar estructuras de resumen previamente calculadas si la base de datos las contempla.

---

# 12. PostgresAlertRepository

Archivo:

```text
PostgresAlertRepository.js
```

Gestiona la persistencia de las alertas.

Ejemplos:

```text
Crear alerta
Consultar alertas
Actualizar estado
Resolver alerta
```

---

# 13. Mappers

Ubicación:

```text
src/core/infrastructure/mappers/
```

Archivos:

```text
UserMapper.js
HomeMapper.js
DeviceMapper.js
ReadingMapper.js
AlertMapper.js
```

Los mappers convierten los datos entre diferentes representaciones.

Por ejemplo:

```text
PostgreSQL
    ↓
Mapper
    ↓
Domain Entity
```

Y en sentido contrario:

```text
Domain Entity
    ↓
Mapper
    ↓
PostgreSQL
```

---

# 14. UserMapper

Convierte los datos de usuario entre el modelo de PostgreSQL y la entidad `User`.

Ejemplo conceptual:

```text
Database User
      ↓
UserMapper
      ↓
User Entity
```

También ayuda a evitar que detalles específicos de la base de datos se filtren hacia el dominio.

---

# 15. HomeMapper

Realiza la conversión entre los registros de PostgreSQL y la entidad `Home`.

---

# 16. DeviceMapper

Realiza la conversión entre los registros de dispositivos almacenados en PostgreSQL y la entidad `Device`.

---

# 17. ReadingMapper

Convierte una lectura almacenada o recibida en la representación utilizada por el dominio.

---

# 18. AlertMapper

Convierte los registros de alertas entre PostgreSQL y la entidad correspondiente.

---

# 19. MQTT

MQTT es una parte fundamental de Infrastructure porque permite la comunicación entre el backend y los dispositivos IoT.

El flujo general es:

```text
ESP32
   ↕
MQTT Broker
   ↕
Backend
```

Infrastructure contiene la implementación de esta comunicación.

---

# 20. MqttClient

Archivo:

```text
src/core/infrastructure/services/mqtt/MqttClient.js
```

Se encarga de gestionar la conexión del backend con el broker MQTT.

Responsabilidades:

```text
Conectar
Desconectar
Mantener conexión
Gestionar errores
```

No debe contener reglas del negocio.

---

# 21. MqttPublisher

Archivo:

```text
MqttPublisher.js
```

Se encarga de publicar mensajes MQTT.

Será especialmente importante para enviar comandos al ESP32.

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

# 22. MqttSubscriber

Archivo:

```text
MqttSubscriber.js
```

Se encarga de suscribirse a los topics MQTT que utiliza Hidro Smart.

Por ejemplo, puede recibir información relacionada con:

```text
Lecturas
Estado del dispositivo
Estado de actuadores
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
   ↓
Application
```

---

# 23. Comunicación con el ESP32

La Infrastructure será el puente entre el backend y el ESP32.

```text
                 HIDRO SMART BACKEND
                         │
                         ▼
                   Infrastructure
                         │
                         ▼
                    MQTT Broker
                    ↙          ↘
                   ↙            ↘
              ESP32              ESP32
                │
         ┌──────┴──────┐
         ▼             ▼
      Sensores       Actuadores
         │             │
         ▼             ▼
       YF-S201    Electroválvula
                    Hidrobomba
```

---

# 24. Recepción de datos

Cuando el ESP32 envía una lectura:

```text
YF-S201
   ↓
ESP32
   ↓
MQTT
   ↓
MqttSubscriber
   ↓
MQTT Handler
   ↓
ReceiveReading
   ↓
ReadingRepository
   ↓
PostgreSQL
```

Infrastructure se encarga de la comunicación.

Application se encarga del caso de uso.

Domain se encarga de las reglas.

---

# 25. Envío de comandos

Cuando el usuario quiere controlar un actuador:

```text
Frontend
   ↓
API
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
StartPump
   ↓
MqttPublisher
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

# 26. Importante: Infrastructure no controla directamente el hardware

El backend no debe intentar ejecutar:

```text
GPIO HIGH
GPIO LOW
```

Eso pertenece al firmware del ESP32.

El backend solamente envía un comando mediante MQTT.

Por ejemplo:

```json
{
  "command": "OPEN_VALVE"
}
```

El ESP32 interpreta ese comando y realiza la operación física correspondiente.

---

# 27. Notification Service

Ubicación:

```text
src/core/infrastructure/services/notification/
```

Su función será integrar los mecanismos de notificación que utilice Hidro Smart.

Por ejemplo:

```text
Alerta
  ↓
NotificationService
  ↓
Correo / Push / otro canal
```

La Application solamente conoce:

```text
INotificationService
```

y no la implementación concreta.

---

# 28. Cache Service

Ubicación:

```text
src/core/infrastructure/services/cache/
```

Puede utilizar Redis para almacenar información temporal.

Ejemplos:

```text
Estado reciente del dispositivo
Consultas frecuentes
Información de consumo reciente
```

Flujo:

```text
Application
     ↓
ICacheService
     ↓
RedisCacheService
     ↓
Redis
```

La caché no debe convertirse en la fuente principal de verdad de los datos permanentes.

---

# 29. Event Bus

Ubicación:

```text
src/core/infrastructure/services/event-bus/
```

Permite distribuir eventos internos entre diferentes componentes.

Ejemplo:

```text
ReadingReceived
       ↓
Event Bus
       ├── ConsumptionHandler
       ├── AlertHandler
       └── otros handlers
```

Esto ayuda a reducir el acoplamiento entre módulos.

---

# 30. Transacciones

Cuando una operación requiere varias modificaciones relacionadas, Infrastructure puede gestionar una transacción de PostgreSQL.

Ejemplo:

```text
Registrar dispositivo
       ↓
INSERT device
       ↓
INSERT relación con home
       ↓
INSERT historial
```

Si una operación falla:

```text
ROLLBACK
```

Si todas funcionan:

```text
COMMIT
```

La forma concreta de manejar las transacciones dependerá del driver PostgreSQL utilizado.

---

# 31. Configuración de Infrastructure

Las conexiones externas no deben estar escritas directamente en el código.

Ejemplo:

```text
.env
```

Puede contener:

```text
DATABASE_URL
MQTT_BROKER_URL
MQTT_USERNAME
MQTT_PASSWORD
REDIS_URL
JWT_SECRET
```

Los nombres definitivos se establecerán al configurar el proyecto.

Nunca se deben subir secretos reales al repositorio.

---

# 32. Manejo de errores

Infrastructure debe detectar errores técnicos como:

```text
PostgreSQL no disponible
MQTT desconectado
Redis no disponible
Timeout
Error de conexión
```

Estos errores deben transformarse en errores que las capas superiores puedan manejar correctamente.

---

# 33. Diferencia entre Domain, Application e Infrastructure

| Capa | Pregunta que responde | Ejemplo |
|---|---|---|
| Domain | ¿Cuál es la regla del negocio? | Un actuador puede abrirse |
| Application | ¿Qué operación debe realizarse? | OpenValve |
| Infrastructure | ¿Cómo se ejecuta? | Publicar MQTT |
| API | ¿Cómo llega la solicitud? | HTTP |
| ESP32 | ¿Cómo se ejecuta físicamente? | GPIO/MOSFET |

---

# 34. Ejemplo completo: abrir electroválvula

```text
                    FRONTEND
                       │
                       ▼
                  HTTP Request
                       │
                       ▼
                 ActuatorController
                       │
                       ▼
                   OpenValve
                       │
                       ▼
                 IMqttService
                       │
                       ▼
                  MqttPublisher
                       │
                       ▼
                   MQTT Broker
                       │
                       ▼
                      ESP32
                       │
                       ▼
                     MOSFET
                       │
                       ▼
                 Electroválvula
```

Cada parte tiene una responsabilidad diferente.

---

# 35. Ejemplo completo: lectura de consumo

```text
YF-S201
   │
   ▼
ESP32
   │
   ▼
MQTT Broker
   │
   ▼
MqttSubscriber
   │
   ▼
reading.handler
   │
   ▼
ReceiveReading
   │
   ▼
Reading Entity
   │
   ▼
IReadingRepository
   │
   ▼
PostgresReadingRepository
   │
   ▼
PostgreSQL
```

Después:

```text
ReadingReceived
      │
      ├── ConsumptionHandler
      │
      └── AlertHandler
```

---

# 36. Regla de dependencia

La dirección recomendada de dependencias es:

```text
API
 ↓
Application
 ↓
Domain
```

Infrastructure se conecta mediante los Ports:

```text
Application
    ↓
   Ports
    ▲
    │
Infrastructure
```

Por lo tanto, los casos de uso no deben importar directamente:

```text
pg
mqtt
redis
express
```

---

# 37. Qué pertenece a Infrastructure

Sí pertenece:

```text
PostgreSQL
MQTT
Redis
HTTP clients externos
Servicios de correo
Implementaciones de repositories
Mappers
Event Bus
Conexiones externas
Transacciones
```

No pertenece:

```text
Reglas principales del negocio
Entidades
Casos de uso
Controllers
Routes
Validadores HTTP
```

---

# 38. Relación con la estructura completa

```text
src/
│
├── api/
│
├── core/
│   │
│   ├── domain/
│   │
│   ├── application/
│   │
│   └── infrastructure/
│       │
│       ├── repositories/
│       ├── services/
│       └── mappers/
│
├── mqtt/
│
├── events/
│
├── jobs/
│
├── shared/
│
└── config/
```

---

# 39. Objetivo final

Infrastructure debe permitir que el núcleo de Hidro Smart funcione sin estar acoplado directamente a las tecnologías externas.

La idea principal es:

```text
                 HIDRO SMART
                      │
                 ┌────┴────┐
                 │         │
              DOMAIN   APPLICATION
                 │         │
                 └────┬────┘
                      │
                    PORTS
                      │
                      ▼
               INFRASTRUCTURE
                │      │      │
                ▼      ▼      ▼
             PostgreSQL MQTT  Redis
                         │
                         ▼
                       ESP32
                         │
                  ┌──────┴──────┐
                  ▼             ▼
             Electroválvula  Hidrobomba
```

De esta manera, si posteriormente se cambia PostgreSQL, el broker MQTT o incluso el hardware IoT, las reglas principales de Hidro Smart no necesitan ser reconstruidas desde cero.