# Application — Hidro Smart

## 1. Introducción

La capa `application` contiene los casos de uso de Hidro Smart.

Su responsabilidad principal es **coordinar las operaciones que puede realizar el sistema**, utilizando las entidades y reglas definidas en `domain`.

No debe encargarse directamente de:

- Recibir peticiones HTTP.
- Ejecutar SQL.
- Conectarse directamente al broker MQTT.
- Controlar físicamente el ESP32.
- Manejar detalles específicos de Express.

La Application coordina estas operaciones mediante **Ports**.

---

# 2. Ubicación

```text
src/
└── core/
    └── application/
        ├── use-cases/
        ├── ports/
        │   ├── repositories/
        │   └── services/
        └── dtos/
            ├── requests/
            └── responses/
```

---

# 3. Estructura general

```text
application/
│
├── use-cases/
│   ├── auth/
│   ├── user/
│   ├── home/
│   ├── device/
│   ├── consumption/
│   ├── alert/
│   ├── actuator/
│   ├── tariff/
│   ├── goal/
│   └── vacation/
│
├── ports/
│   ├── repositories/
│   └── services/
│
└── dtos/
    ├── requests/
    └── responses/
```

---

# 4. Responsabilidad de Application

La capa Application responde principalmente a:

> **¿Qué operación quiere realizar el sistema?**

Por ejemplo:

```text
Registrar usuario
Iniciar sesión
Crear hogar
Registrar dispositivo
Consultar consumo
Abrir electroválvula
Cerrar electroválvula
Encender hidrobomba
Apagar hidrobomba
Consultar alertas
```

El flujo general será:

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
```

---

# 5. Use Cases

Ubicación:

```text
src/core/application/use-cases/
```

Cada caso de uso representa una operación concreta.

No se debe crear un único servicio gigante con todas las operaciones.

Por ejemplo, es preferible:

```text
OpenValve.js
CloseValve.js
StartPump.js
StopPump.js
```

en lugar de:

```text
ActuatorService.js
```

con toda la lógica mezclada.

---

# 6. Auth

Ubicación:

```text
use-cases/auth/
```

Archivos:

```text
RegisterUser.js
LoginUser.js
RefreshToken.js
LogoutUser.js
```

## RegisterUser

Responsabilidad:

```text
Registrar un nuevo usuario
```

Flujo:

```text
Request
 ↓
RegisterUser
 ↓
Validar información
 ↓
Crear User
 ↓
Guardar mediante IUserRepository
 ↓
Response
```

---

## LoginUser

Responsabilidad:

```text
Autenticar un usuario
```

Flujo conceptual:

```text
Email + Password
       ↓
LoginUser
       ↓
Buscar usuario
       ↓
Verificar credenciales
       ↓
Generar sesión/token
       ↓
Respuesta
```

La implementación concreta de JWT y almacenamiento de sesión no pertenece al caso de uso como detalle técnico.

---

## RefreshToken

Permite obtener un nuevo Access Token utilizando el mecanismo de renovación definido por el sistema.

---

## LogoutUser

Finaliza la sesión del usuario y ejecuta las operaciones necesarias para invalidarla.

---

# 7. User

Ubicación:

```text
use-cases/user/
```

Archivos:

```text
GetUser.js
UpdateUser.js
DeleteUser.js
```

## GetUser

Obtiene la información del usuario autenticado.

```text
Controller
 ↓
GetUser
 ↓
IUserRepository
 ↓
PostgresUserRepository
```

---

## UpdateUser

Actualiza información permitida del usuario.

La validación de los datos debe realizarse antes de modificar la entidad.

---

## DeleteUser

Gestiona la eliminación o desactivación de la cuenta de acuerdo con las reglas definidas para Hidro Smart.

El caso de uso no debe ejecutar directamente:

```sql
DELETE FROM ...
```

Debe utilizar el Repository correspondiente.

---

# 8. Home

Ubicación:

```text
use-cases/home/
```

Archivos:

```text
CreateHome.js
GetHome.js
UpdateHome.js
ManageMembers.js
```

## CreateHome

Crea un hogar y establece la relación correspondiente con el usuario.

```text
Usuario
 ↓
CreateHome
 ↓
Home
 ↓
IHomeRepository
```

---

## GetHome

Consulta la información de un hogar al que el usuario tiene acceso.

---

## UpdateHome

Actualiza información permitida del hogar.

---

## ManageMembers

Gestiona las operaciones relacionadas con los miembros del hogar.

Debe comprobar las reglas de autorización correspondientes.

---

# 9. Device

Ubicación:

```text
use-cases/device/
```

Archivos:

```text
RegisterDevice.js
UpdateDevice.js
GetDevice.js
GetDeviceStatus.js
ConfigureDevice.js
```

## RegisterDevice

Registra un dispositivo IoT dentro del sistema.

En Hidro Smart estará especialmente relacionado con el ESP32.

```text
ESP32
 ↓
Device
 ↓
Home
```

---

## UpdateDevice

Actualiza información configurable del dispositivo.

---

## GetDevice

Obtiene información del dispositivo.

---

## GetDeviceStatus

Consulta el último estado conocido del dispositivo.

El estado puede actualizarse mediante información recibida por MQTT.

---

## ConfigureDevice

Gestiona la configuración permitida del dispositivo.

---

# 10. Consumption

Ubicación:

```text
use-cases/consumption/
```

Archivos:

```text
ReceiveReading.js
GetCurrentConsumption.js
GetConsumptionHistory.js
GetConsumptionSummary.js
```

Esta sección es una de las más importantes de Hidro Smart porque conecta las lecturas IoT con el consumo.

---

# 11. ReceiveReading

Responsabilidad:

```text
Procesar una lectura recibida desde un dispositivo.
```

La lectura normalmente llegará mediante MQTT.

El flujo será:

```text
YF-S201
   ↓
ESP32
   ↓
MQTT
   ↓
Backend
   ↓
ReceiveReading
   ↓
Reading
   ↓
Guardar lectura
```

El caso de uso no debe conocer los detalles de la conexión MQTT.

Para eso utilizará los mecanismos definidos en Infrastructure.

---

# 12. GetCurrentConsumption

Permite consultar el consumo actual o más reciente disponible.

```text
Frontend
 ↓
GET /consumption/current
 ↓
Controller
 ↓
GetCurrentConsumption
 ↓
IConsumptionRepository
 ↓
PostgreSQL
```

---

# 13. GetConsumptionHistory

Obtiene el historial de consumo.

Puede recibir filtros como:

```text
Fecha inicial
Fecha final
Dispositivo
Hogar
```

Los parámetros definitivos dependerán del modelo final de la base de datos.

---

# 14. GetConsumptionSummary

Obtiene información resumida del consumo.

Puede utilizar información previamente calculada para evitar realizar consultas pesadas continuamente.

---

# 15. Alert

Ubicación:

```text
use-cases/alert/
```

Archivos:

```text
GetPendingAlerts.js
UpdateAlertStatus.js
CreateAlertRule.js
ListAlertRules.js
UpdateAlertRule.js
DeleteAlertRule.js
```

---

## Generación automática de eventos

Crea una alerta cuando se detecta una condición definida por las reglas del sistema.

Ejemplo:

```text
Lectura
 ↓
Análisis
 ↓
Consumo anormal
 ↓
fn_generate_alert_events
 ↓
Alert
```

---

## GetPendingAlerts

Obtiene las alertas disponibles para el usuario/hogar correspondiente.

---

## UpdateAlertStatus

Cambia una alerta al estado `Read` o `Dismissed`.

---

# 16. Actuator

Ubicación:

```text
use-cases/actuator/
```

Archivos:

```text
OpenValve.js
CloseValve.js
StartPump.js
StopPump.js
GetActuatorStatus.js
```

Esta capa será fundamental para el control IoT.

---

# 17. OpenValve

Responsabilidad:

```text
Solicitar la apertura de la electroválvula.
```

Flujo:

```text
Frontend
 ↓
Controller
 ↓
OpenValve
 ↓
Validación/autorización
 ↓
IMqttService
 ↓
MQTT
 ↓
ESP32
 ↓
MOSFET
 ↓
Electroválvula
```

El caso de uso **no controla directamente el GPIO**.

---

# 18. CloseValve

Responsabilidad:

```text
Solicitar el cierre de la electroválvula.
```

Flujo:

```text
CloseValve
 ↓
IMqttService
 ↓
MQTT
 ↓
ESP32
 ↓
Electroválvula
```

---

# 19. StartPump

Responsabilidad:

```text
Solicitar el encendido de la hidrobomba.
```

Flujo:

```text
StartPump
 ↓
IMqttService
 ↓
MQTT
 ↓
ESP32
 ↓
Controlador de potencia
 ↓
Hidrobomba
```

---

# 20. StopPump

Responsabilidad:

```text
Solicitar el apagado de la hidrobomba.
```

---

# 21. GetActuatorStatus

Obtiene el estado conocido del actuador.

Ejemplo:

```text
ON
OFF
OPEN
CLOSED
UNKNOWN
```

Los valores definitivos deberán establecerse de acuerdo con el modelo de datos y protocolo MQTT.

---

# 22. Tariff

Ubicación:

```text
use-cases/tariff/
```

Aquí se ubicarán los casos de uso relacionados con tarifas.

La implementación exacta se definirá según el modelo definitivo de la base de datos.

Posibles operaciones:

```text
GetTariff
GetHomeTariff
CalculateCost
```

No se deben crear casos de uso definitivos hasta confirmar las reglas y estructura final de tarifas.

---

# 23. Goal

Ubicación:

```text
use-cases/goal/
```

Contendrá las operaciones relacionadas con las metas de consumo/ahorro.

Ejemplos:

```text
CreateGoal
GetGoals
UpdateGoal
DeleteGoal
```

Las operaciones definitivas deberán coincidir con el modelo final de la BD.

---

# 24. Vacation

Ubicación:

```text
use-cases/vacation/
```

Gestionará el modo vacaciones.

Posibles operaciones:

```text
ActivateVacation
DeactivateVacation
GetVacationStatus
```

El comportamiento sobre los dispositivos dependerá de las reglas de negocio definitivas.

---

# 25. Ports

Ubicación:

```text
src/core/application/ports/
```

Los Ports son contratos.

Permiten que Application diga:

> "Necesito guardar un dispositivo."

sin tener que saber cómo PostgreSQL lo guarda.

---

# 26. Repository Ports

Ubicación:

```text
ports/repositories/
```

Archivos:

```text
IUserRepository.js
IHomeRepository.js
IDeviceRepository.js
IReadingRepository.js
IConsumptionRepository.js
IAlertRepository.js
```

Ejemplo:

```text
IDeviceRepository
```

define las operaciones necesarias para trabajar con dispositivos.

La implementación será:

```text
PostgresDeviceRepository
```

---

# 27. Services Ports

Ubicación:

```text
ports/services/
```

Archivos:

```text
IMqttService.js
INotificationService.js
ICacheService.js
```

Estos contratos permiten utilizar servicios externos sin acoplar los casos de uso a sus implementaciones.

---

# 28. IMqttService

Este Port será especialmente importante para Hidro Smart.

La Application podrá solicitar:

```text
Enviar comando al dispositivo
```

sin saber:

```text
qué broker se utiliza
qué librería MQTT se utiliza
cómo se establece la conexión
cómo se publica el mensaje
```

El flujo será:

```text
OpenValve
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

# 29. DTOs

Ubicación:

```text
src/core/application/dtos/
```

Estructura:

```text
dtos/
├── requests/
└── responses/
```

Los DTO definen los datos que entran y salen de los casos de uso.

---

# 30. Request DTO

Representa los datos necesarios para ejecutar una operación.

Ejemplo:

```text
RegisterUserRequest
```

Puede recibir:

```json
{
  "email": "usuario@example.com",
  "password": "********"
}
```

Otro ejemplo:

```text
RegisterDeviceRequest
```

representará la información necesaria para registrar un dispositivo.

---

# 31. Response DTO

Representa la información que el backend devuelve.

Ejemplo:

```text
DeviceResponse
```

Puede devolver información como:

```json
{
  "id": "device-id",
  "name": "Hidro Smart ESP32",
  "status": "ONLINE"
}
```

La respuesta real deberá coincidir con los campos definidos en el sistema.

---

# 32. Por qué usar DTO

Los DTO permiten evitar devolver directamente una entidad interna.

Incorrecto:

```text
Entity
 ↓
HTTP Response
```

Correcto:

```text
Entity
 ↓
Mapper
 ↓
Response DTO
 ↓
HTTP Response
```

Esto ayuda a evitar exponer información que no debería salir de la aplicación.

---

# 33. Flujo completo de Application

Ejemplo: registrar un dispositivo.

```text
HTTP Request
     ↓
Controller
     ↓
RegisterDevice
     ↓
Device Entity
     ↓
IDeviceRepository
     ↓
PostgresDeviceRepository
     ↓
PostgreSQL
     ↓
DeviceMapper
     ↓
DeviceResponse
     ↓
HTTP Response
```

---

# 34. Flujo de lectura IoT

```text
YF-S201
     ↓
ESP32
     ↓
MQTT
     ↓
MqttSubscriber
     ↓
ReceiveReading
     ↓
Reading
     ↓
IReadingRepository
     ↓
PostgreSQL
```

Después pueden ejecutarse otros procesos:

```text
ReadingReceived
       ↓
Actualizar consumo
       ↓
Analizar condiciones
       ↓
Generar alerta
```

---

# 35. Flujo de control de actuadores

```text
Frontend
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
Actuador
```

El mismo principio aplica para:

```text
CloseValve
StartPump
StopPump
```

---

# 36. Responsabilidades

| Elemento | Responsabilidad |
|---|---|
| Use Case | Coordinar una operación |
| Domain | Aplicar reglas del negocio |
| Repository Port | Definir acceso requerido a datos |
| Service Port | Definir servicios externos requeridos |
| Request DTO | Definir datos de entrada |
| Response DTO | Definir datos de salida |
| Infrastructure | Implementar Ports |
| Controller | Adaptar HTTP hacia Application |

---

# 37. Qué NO debe hacer Application

La Application no debe:

### Ejecutar SQL directamente

```text
Application → SELECT ...
```

### Controlar GPIO

```text
Application → GPIO
```

### Conectarse directamente a MQTT

```text
Application → mqtt.connect()
```

### Manejar Request/Response de Express

```text
Application → req/res
```

Debe utilizar las abstracciones correspondientes.

---

# 38. Regla principal

La Application debe depender de abstracciones:

```text
Application
    ↓
Ports
```

y no directamente de implementaciones:

```text
Application
    X
PostgreSQL
MQTT
Redis
```

Esto aplica el principio de inversión de dependencias.

---

# 39. Application dentro de Hidro Smart

La relación general será:

```text
                    API
                     │
                     ▼
               APPLICATION
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
    Use Cases       DTOs         Ports
       │                           │
       ▼                           ▼
    DOMAIN                  Infrastructure
                                   │
                         ┌─────────┼─────────┐
                         ▼         ▼         ▼
                     PostgreSQL   MQTT     Redis
                                    │
                                    ▼
                                  ESP32
```

---

# 40. Objetivo final

La capa Application debe permitir que Hidro Smart tenga operaciones claramente separadas y fáciles de probar.

Cada operación importante tendrá su propio caso de uso:

```text
RegisterUser
LoginUser
CreateHome
RegisterDevice
ReceiveReading
GetConsumptionHistory
CreateAlert
OpenValve
CloseValve
StartPump
StopPump
```

De esta forma, la lógica del sistema queda organizada y preparada para conectarse tanto con el frontend como con los dispositivos IoT.

La regla principal es:

```text
API recibe
     ↓
Application coordina
     ↓
Domain decide
     ↓
Ports abstraen
     ↓
Infrastructure ejecuta
```
