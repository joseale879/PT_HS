# Endpoints de la API — Hidro Smart

## 1. Introducción

La API REST de Hidro Smart será utilizada para la comunicación entre el frontend, el backend y los diferentes módulos del sistema.

Todos los endpoints estarán versionados mediante:

```text
/api/v1
```

Ejemplo:

```text
/api/v1/auth/login
```

La API estará organizada por módulos funcionales.

---

# 2. Convenciones

## Métodos HTTP

| Método | Uso |
|---|---|
| GET | Consultar información |
| POST | Crear información o ejecutar una acción |
| PUT | Actualizar un recurso completo |
| PATCH | Actualizar parcialmente un recurso |
| DELETE | Eliminar o desactivar un recurso |

---

## Autenticación

Los endpoints protegidos utilizarán:

```text
Authorization: Bearer <access_token>
```

Los endpoints públicos serán principalmente los relacionados con:

- Registro.
- Inicio de sesión.
- Renovación de sesión.

---

# 3. Autenticación

Ruta base:

```text
/api/v1/auth
```

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/register` | Registrar usuario | No |
| POST | `/login` | Iniciar sesión | No |
| POST | `/change-password` | Cambiar contraseña | Sí |
| POST | `/request-password-reset` | Solicitar recuperación | No |
| POST | `/reset-password` | Restablecer contraseña con token | No |
| POST | `/refresh` | Renovar access token | No/Refresh Token |
| POST | `/logout` | Cerrar sesión | Sí |

### Ejemplo

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "usuario@example.com",
  "password": "********"
}
```

Caso de uso:

```text
LoginUser
```

---

# 4. Usuarios

Ruta base:

```text
/api/v1/users
```

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/me` | Obtener usuario autenticado |
| PUT | `/me` | Actualizar información del usuario |

### Obtener usuario actual

```http
GET /api/v1/users/me
```

Caso de uso:

```text
GetUser
```

### Actualizar usuario

```http
PUT /api/v1/users/me
```

Caso de uso:

```text
UpdateUser
```

# 5. Hogares

Ruta base:

```text
/api/v1/homes
```

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/` | Crear hogar |
| GET | `/` | Obtener hogares del usuario |
| GET | `/:homeId` | Obtener información de un hogar |
| PUT | `/:homeId` | Actualizar hogar |
| GET | `/:homeId/members` | Consultar miembros |
| POST | `/:homeId/members` | Agregar/invitar miembro |
| DELETE | `/:homeId/members/:memberUserId` | Retirar miembro |

### Crear hogar

```http
POST /api/v1/homes
```

Caso de uso:

```text
CreateHome
```

### Consultar hogar

```http
GET /api/v1/homes/:homeId
```

Caso de uso:

```text
GetHome
```

### Gestionar miembros

```http
GET /api/v1/homes/:homeId/members
```

y:

```http
POST /api/v1/homes/:homeId/members
```

Casos de uso: `ListHomeMembers`, `AddHomeMember`, `ChangeHomeMemberRole` y `RemoveHomeMember`.

El acceso deberá comprobar que el usuario pertenece al hogar y que tiene los permisos correspondientes.

---

# 6. Dispositivos IoT

Ruta base:

```text
/api/v1/devices
```

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/` | Registrar dispositivo |
| GET | `/` | Listar dispositivos |
| GET | `/:deviceId` | Consultar dispositivo |
| PUT | `/:deviceId` | Actualizar dispositivo |
| GET | `/:deviceId/status` | Consultar estado |
| PUT | `/:deviceId/config` | Configurar dispositivo |
| PATCH | `/:deviceId/status` | Cambiar estado y registrar auditoría |
| POST | `/:deviceId/deactivate` | Desactivar dispositivo con baja lógica |
| DELETE | `/:deviceId/home/:homeId` | Desvincular dispositivo del hogar |

Implementados actualmente: todas las rutas listadas, incluyendo desactivación y desvinculación.

### Registrar ESP32

```http
POST /api/v1/devices
```

Caso de uso:

```text
RegisterDevice
```

Payload mínimo actual:

```json
{
  "homeId": "uuid-del-hogar",
  "code": "ESP32-001",
  "name": "Medidor principal",
  "type": "YF-S201"
}
```

El backend registra el dispositivo y crea su asociación activa con el hogar en la misma transacción. La asociación requiere el permiso `devices.manage` y propiedad del hogar.

El dispositivo registrado representará el ESP32 utilizado por Hidro Smart.

---

## Estado del dispositivo

```http
GET /api/v1/devices/:deviceId/status
```

La respuesta se obtiene mediante el caso de uso `GetDevice` y expone solo los campos de estado.

### Cambiar estado

```http
PATCH /api/v1/devices/:deviceId/status
```

Body para suspender:

```json
{
  "status": "Suspended",
  "reason": "Mantenimiento preventivo"
}
```

Los estados permitidos son `Active`, `Suspended` y `Low`. La suspensión exige un motivo. PostgreSQL actualiza el dispositivo y registra el cambio en `device.device_history` dentro de la misma operación.

La desactivación se solicita mediante `POST /api/v1/devices/:deviceId/deactivate` con un `reason` obligatorio. Es una baja lógica: cambia el estado a `Suspended`, conserva el dispositivo y mantiene sus históricos.

### Desvincular dispositivo

```http
DELETE /api/v1/devices/:deviceId/home/:homeId
```

La operación elimina únicamente la asociación en `home.home_device`. El dispositivo y sus históricos se conservan. Requiere `devices.manage` y que el usuario sea propietario del hogar.

La información del estado podrá provenir de los mensajes MQTT recibidos desde el dispositivo.

---

## Configuración

```http
PUT /api/v1/devices/:deviceId/config
```

Caso de uso: `UpdateDeviceConfig`.

---

# 7. Consumo

Ruta base:

```text
/api/v1/consumption
```

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/summary` | Consultar resumen de consumo |
| GET | `/daily` | Consultar consumo diario |
| GET | `/hourly` | Consultar consumo horario |
| GET | `/cost` | Calcular costo total de un periodo |
| GET | `/monthly` | Consultar consumo mensual |

### Resumen

```http
GET /api/v1/consumption/summary
```

Caso de uso:

```text
GetConsumptionSummary
```

### Consumo diario, horario y mensual

```http
GET /api/v1/consumption/daily?homeId=:homeId&date=YYYY-MM-DD
GET /api/v1/consumption/hourly?homeId=:homeId
GET /api/v1/consumption/monthly?homeId=:homeId&year=YYYY&month=MM
```

---

# 8. Recepción de lecturas IoT

Las lecturas provenientes del ESP32 no necesariamente entrarán mediante un endpoint HTTP.

El flujo principal será MQTT:

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
PostgreSQL
```

Por esta razón:

```text
ReceiveReading
```

es un caso de uso del backend, pero **no necesariamente un endpoint REST público**.

El procesamiento MQTT estará documentado en:

```text
08-mqtt-iot.md
```

---

# 9. Alertas

Ruta base:

```text
/api/v1/alerts
```

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/home/:homeId/pending` | Consultar resumen de alertas pendientes de un hogar |
| PATCH | `/:alertId/status` | Marcar una alerta como leída o descartada |
| POST | `/home/:homeId/rules` | Crear regla de alerta |
| GET | `/home/:homeId/rules` | Listar reglas de alerta |
| PATCH | `/rules/:ruleId` | Actualizar regla de alerta |
| DELETE | `/rules/:ruleId` | Eliminar regla de alerta |
| GET | `/home/:homeId/thresholds` | Consultar límites del hogar |
| PUT | `/home/:homeId/thresholds` | Crear o actualizar límites del hogar |
| DELETE | `/home/:homeId/thresholds` | Eliminar límites del hogar |

### Consultar alertas

```http
GET /api/v1/alerts/home/:homeId/pending
```

Caso de uso:

```text
GetPendingAlerts
```

### Resolver alerta

```http
PATCH /api/v1/alerts/:alertId/status
```

Caso de uso:

```text
UpdateAlertStatus
```

Las alertas se evalúan automáticamente mediante `alert_rate.fn_generate_alert_events(date)`, ejecutada periódicamente por el job del backend. La generación de un evento requiere reglas activas y lecturas reales asociadas a un dispositivo.

Ejemplo:

```text
ReadingReceived
       ↓
Analizar consumo
       ↓
Detectar condición anormal
       ↓
AlertTriggered
       ↓
Crear alerta
```

---

# 10. Tarifas

Ruta base:

```text
/api/v1/tariffs
```

La consulta de tarifa vigente está implementada. La administración avanzada de tarifas históricas queda pendiente.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/home/:homeId` | Consultar tarifa vigente de un hogar |

Implementado actualmente: `GET /api/v1/tariffs/home/:homeId`. Acepta `date=YYYY-MM-DD` opcional; si no se envía, consulta la fecha actual. PostgreSQL aplica RLS y solo devuelve tarifas del hogar al que pertenece el usuario autenticado.

---

# 11. Metas

Ruta base:

```text
/api/v1/goals
```

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/` | Crear meta |
| GET | `/` | Consultar metas |
| GET | `/:goalId` | Consultar una meta |
| PUT | `/:goalId` | Actualizar meta |
| DELETE | `/:goalId` | Eliminar/desactivar meta |

Casos de uso:

```text
CreateGoal
GetGoals
GetGoal
UpdateGoal
DeleteGoal
```

Los nombres de los casos de uso podrán ajustarse cuando se defina completamente el dominio de metas.

---

# 12. Modo vacaciones

Ruta base:

```text
/api/v1/vacation
```

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/activate` | Activar modo vacaciones |
| POST | `/deactivate` | Desactivar modo vacaciones |
| GET | `/status` | Consultar estado |

Casos de uso:

```text
ActivateVacation
DeactivateVacation
GetVacationStatus
```

El modo vacaciones podrá afectar el comportamiento automático de los dispositivos y actuadores según las reglas de negocio que se definan.

---

# 13. Actuadores

Este módulo es especialmente importante para la parte IoT de Hidro Smart.

Ruta base:

```text
/api/v1/actuators
```

Los actuadores contemplados son:

```text
Electroválvula
Hidrobomba
```

---

## Electroválvula

| Método | Endpoint | Acción |
|---|---|---|
| POST | `/:actuatorId/valve/open` | Abrir electroválvula |
| POST | `/:actuatorId/valve/close` | Cerrar electroválvula |

### Abrir

```http
POST /api/v1/actuators/:actuatorId/valve/open
```

Caso de uso:

```text
OpenValve
```

### Cerrar

```http
POST /api/v1/actuators/:actuatorId/valve/close
```

Caso de uso:

```text
CloseValve
```

---

# 14. Hidrobomba

| Método | Endpoint | Acción |
|---|---|---|
| POST | `/:actuatorId/pump/start` | Encender bomba |
| POST | `/:actuatorId/pump/stop` | Apagar bomba |

### Encender

```http
POST /api/v1/actuators/:actuatorId/pump/start
```

Caso de uso:

```text
StartPump
```

### Apagar

```http
POST /api/v1/actuators/:actuatorId/pump/stop
```

Caso de uso:

```text
StopPump
```

---

# 15. Estado de los actuadores

```http
GET /api/v1/actuators/:actuatorId/status
```

Caso de uso:

```text
GetActuatorStatus
```

El estado real deberá poder sincronizarse con el ESP32 mediante MQTT.

Flujo:

```text
ESP32
   ↓
MQTT
   ↓
actuator-status.handler.js
   ↓
Backend
   ↓
Estado del actuador
```

---

# 16. Seguridad para actuadores

Los endpoints de actuadores deben tener controles adicionales.

No será suficiente con comprobar que el usuario esté autenticado.

El backend deberá comprobar:

```text
Usuario autenticado
        ↓
Tiene acceso al hogar
        ↓
Tiene acceso al dispositivo
        ↓
Tiene permiso para controlar actuadores
        ↓
Comando permitido
        ↓
Enviar MQTT
```

Esto evita que un usuario pueda controlar una electroválvula o hidrobomba perteneciente a otro hogar.

La seguridad y el aislamiento entre hogares son puntos importantes de la revisión actual de la BD.

---

# 17. Flujo de un comando hacia el ESP32

Ejemplo: abrir la electroválvula.

```text
Frontend
   │
   │ POST
   ▼
/api/v1/actuators/123/valve/open
   │
   ▼
Route
   │
   ▼
Authentication Middleware
   │
   ▼
Authorization Middleware
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
MQTT Publisher
   │
   ▼
ESP32
   │
   ▼
MOSFET
   │
   ▼
Electroválvula 12 V
```

---

# 18. Respuesta de operaciones sobre actuadores

Una respuesta inicial podría utilizar la siguiente estructura:

```json
{
  "success": true,
  "message": "Comando enviado correctamente",
  "data": {
    "actuatorId": "123",
    "command": "OPEN"
  }
}
```

El estado físico final deberá confirmarse mediante la respuesta/telemetría del dispositivo cuando corresponda.

Por lo tanto:

```text
Comando enviado
        ≠
Actuador físicamente confirmado
```

El backend debe distinguir ambos estados.

---

# 19. Resumen de endpoints

## Auth

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

## Users

```text
GET    /api/v1/users/me
PUT    /api/v1/users/me
```

## Homes

```text
POST   /api/v1/homes
GET    /api/v1/homes
GET    /api/v1/homes/:homeId
PUT    /api/v1/homes/:homeId

GET    /api/v1/homes/:homeId/members
POST   /api/v1/homes/:homeId/members
DELETE /api/v1/homes/:homeId/members/:memberUserId
```

## Devices

```text
POST   /api/v1/devices
GET    /api/v1/devices
GET    /api/v1/devices/:deviceId
PUT    /api/v1/devices/:deviceId
GET    /api/v1/devices/:deviceId/status
PUT    /api/v1/devices/:deviceId/config
PATCH  /api/v1/devices/:deviceId/status
POST   /api/v1/devices/:deviceId/deactivate
DELETE /api/v1/devices/:deviceId/home/:homeId
```

## Consumption

```text
GET    /api/v1/consumption/summary
GET    /api/v1/consumption/daily
GET    /api/v1/consumption/hourly
GET    /api/v1/consumption/monthly
GET    /api/v1/consumption/cost
```

## Alerts

```text
GET    /api/v1/alerts/home/:homeId/pending
PATCH  /api/v1/alerts/:alertId/status
POST   /api/v1/alerts/home/:homeId/rules
GET    /api/v1/alerts/home/:homeId/rules
PATCH  /api/v1/alerts/rules/:ruleId
DELETE /api/v1/alerts/rules/:ruleId
GET    /api/v1/alerts/home/:homeId/thresholds
PUT    /api/v1/alerts/home/:homeId/thresholds
DELETE /api/v1/alerts/home/:homeId/thresholds
```

## Tariffs

```text
GET    /api/v1/tariffs/home/:homeId
```

## Goals

```text
POST   /api/v1/goals
GET    /api/v1/goals?homeId=:homeId
GET    /api/v1/goals/:goalId
GET    /api/v1/goals/:goalId/progress
PUT    /api/v1/goals/:goalId
DELETE /api/v1/goals/:goalId
```

## Vacation

```text
GET    /api/v1/vacation/home/:homeId
PUT    /api/v1/vacation/home/:homeId
DELETE /api/v1/vacation/home/:homeId
```

## Actuators

```text
POST   /api/v1/actuators/:actuatorId/valve/open
POST   /api/v1/actuators/:actuatorId/valve/close

POST   /api/v1/actuators/:actuatorId/pump/start
POST   /api/v1/actuators/:actuatorId/pump/stop

GET    /api/v1/actuators/:actuatorId/status
```

---

# 20. Relación Endpoint → Controller → Use Case

| Módulo | Controller | Use Case |
|---|---|---|
| Auth | `AuthController.js` | `RegisterUser`, `LoginUser`, `AuthSessionService`, `ChangePassword`, `RequestPasswordReset`, `ResetPassword` |
| User | `UserController.js` | `GetCurrentUser`, `UpdateCurrentUser` |
| Home | `HomeController.js` | `CreateHome`, `GetHome`, `UpdateHome`, `ListUserHomes`, gestión de miembros y solicitudes |
| Device | `DeviceController.js` | `RegisterDevice`, `UpdateDevice`, `GetDevice`, `UpdateDeviceStatus`, `DeactivateDevice`, `UnlinkDeviceFromHome`, `UpdateDeviceConfig` |
| Consumption | `ConsumptionController.js` | `GetConsumptionSummary`, `GetDailyConsumption`, `GetHourlyConsumption`, `GetMonthlyConsumption`, `GetPeriodCost` |
| Alert | `AlertController.js` | `GetPendingAlerts`, `UpdateAlertStatus`, reglas y umbrales |
| Actuator | `actuator.controller.js` | `OpenValve`, `CloseValve`, `StartPump`, `StopPump`, `GetActuatorStatus` |
| Tariff | `tariff.controller.js` | Casos de uso de tarifas |
| Goal | `goal.controller.js` | Casos de uso de metas |
| Vacation | `vacation.controller.js` | Casos de uso de modo vacaciones |

---

# 21. Flujo general de un endpoint

Todos los endpoints protegidos seguirán aproximadamente este flujo:

```text
HTTP Request
     ↓
Route
     ↓
Rate Limit
     ↓
Authentication
     ↓
Authorization
     ↓
Validation
     ↓
Controller
     ↓
Use Case
     ↓
Domain
     ↓
Repository / Service
     ↓
Database / MQTT
     ↓
Response
```

---

# 22. Regla importante

Los endpoints no deben contener la lógica principal del sistema.

Incorrecto:

```text
Controller
    ↓
SQL directamente
    ↓
MQTT directamente
```

Correcto:

```text
Controller
    ↓
Use Case
    ↓
Port
    ↓
Infrastructure
```

Esto mantiene la API desacoplada y facilita las pruebas y el mantenimiento.

---

# 23. Administración de roles funcionales

Estas rutas requieren autenticación y el permiso global `roles.manage`. El middleware las restringe antes del controlador y las funciones controladas de PostgreSQL vuelven a comprobar el permiso.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/roles/users/:userId` | Lista los roles funcionales activos de un usuario |
| POST | `/api/v1/roles/users/:userId` | Asigna un rol; body: `{ "roleName": "Support" }` |
| DELETE | `/api/v1/roles/users/:userId` | Retira un rol; body o query: `roleName` |

La base de datos impide asignar roles inexistentes o usuarios inactivos y evita que el último `Administrator` se retire a sí mismo. La administración de permisos individuales no está expuesta todavía.

---

# 24. Soporte y tickets

| Método | Endpoint | Acceso |
| --- | --- | --- |
| GET | `/api/v1/support/tickets` | Usuario autenticado; Support ve los tickets permitidos por RLS |
| GET | `/api/v1/support/tickets/:ticketId` | Ticket autorizado |
| POST | `/api/v1/support/tickets` | `HomeUser` y `Administrator` |
| PATCH | `/api/v1/support/tickets/:ticketId` | `Support` y `Administrator`; estado, prioridad y asignación |
| POST | `/api/v1/support/tickets/:ticketId/responses` | `Support` y `Administrator` |
| GET | `/api/v1/support/tickets/:ticketId/responses` | Historial autorizado |

`Guest` conserva acceso de solo lectura y no puede crear ni gestionar tickets.

---

# 25. Estado del documento

## Actualización implementada 2026-09-03

Se agregó el endpoint administrativo de auditoría:

| Método | Endpoint | Acceso | Parámetros |
| --- | --- | --- | --- |
| GET | `/api/v1/audit/logs` | `Administrator` con `audit.read` | `action`, `tableName`, `from`, `to`, `page`, `pageSize` |

La ruta exige `Bearer`, aplica autorización en el backend y consulta PostgreSQL mediante `user_account.fn_list_audit_logs(...)`. El rol de aplicación no consulta directamente `audit.audit_log`.

Este documento representa la **propuesta inicial de endpoints** para Hidro Smart.

Antes de considerar la API como definitiva se deberá comprobar cada endpoint contra:

1. Modelo definitivo de PostgreSQL.
2. Casos de uso.
3. Reglas de negocio.
4. Sistema de autenticación.
5. Sistema de autorización.
6. Comunicación MQTT.
7. Integración con el ESP32.
8. Requerimientos del frontend.

Especialmente, los módulos de **tarifas, metas, vacaciones y actuadores** deberán revisarse junto con sus modelos definitivos antes de implementar todos sus endpoints.
