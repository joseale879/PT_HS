# Endpoints reales de la API — HidroSmart

Fecha de revisión: 2026-09-07.

Este documento refleja las rutas montadas actualmente en `BK_HS/src/app.js`. La URL base pública es `http://localhost:3000/api/v1` en desarrollo directo y `/api/v1` desde el frontend servido por Nginx.

## Convenciones

- Las rutas protegidas requieren `Authorization: Bearer <access_token>`.
- Los identificadores de ruta son UUID salvo que el backend indique otra cosa.
- Los permisos se verifican en backend; ocultar un botón en frontend no reemplaza esa verificación.
- Las respuestas exitosas usan el envoltorio de datos definido por el backend y los errores usan el contrato común de error.
- `GET /` y `GET /health` son públicos y no pertenecen a `/api/v1`.

## Auth — `/auth`

| Método | Ruta completa | Acceso |
|---|---|---|
| POST | `/api/v1/auth/register` | público |
| POST | `/api/v1/auth/login` | público |
| POST | `/api/v1/auth/refresh` | público con refresh token |
| POST | `/api/v1/auth/logout` | autenticado |
| POST | `/api/v1/auth/change-password` | autenticado |
| POST | `/api/v1/auth/request-password-reset` | público |
| POST | `/api/v1/auth/reset-password` | público con token de un solo uso |

## Users — `/users`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/users/me` | autenticado |
| PUT | `/api/v1/users/me` | autenticado |
| GET | `/api/v1/users/me/preferences` | autenticado |
| PUT | `/api/v1/users/me/preferences` | autenticado |

El correo y el documento se mantienen inmutables en la actualización de perfil según el caso de uso actual.

## Homes — `/homes`

| Método | Ruta completa | Acceso |
|---|---|---|
| POST | `/api/v1/homes` | `homes.manage` |
| GET | `/api/v1/homes` | autenticado |
| GET | `/api/v1/homes/:homeId` | autenticado y con acceso al hogar |
| PUT | `/api/v1/homes/:homeId` | `homes.manage` |
| GET | `/api/v1/homes/:homeId/members` | autenticado y con acceso al hogar |
| POST | `/api/v1/homes/:homeId/members` | `homes.manage` |
| PATCH | `/api/v1/homes/:homeId/members/:memberUserId/role` | `homes.manage` |
| DELETE | `/api/v1/homes/:homeId/members/:memberUserId` | `homes.manage` |
| POST | `/api/v1/homes/:homeId/membership-requests` | autenticado |
| GET | `/api/v1/homes/:homeId/membership-requests` | autenticado y con acceso al hogar |
| PATCH | `/api/v1/homes/membership-requests/:requestId` | `homes.manage` |

## Devices — `/devices`

| Método | Ruta completa | Acceso |
|---|---|---|
| POST | `/api/v1/devices` | `devices.manage` |
| GET | `/api/v1/devices` | autenticado; lista dispositivos autorizados |
| GET | `/api/v1/devices/:deviceId` | autenticado y con acceso al dispositivo |
| GET | `/api/v1/devices/:deviceId/status` | autenticado y con acceso al dispositivo |
| PUT | `/api/v1/devices/:deviceId` | `devices.manage` |
| PUT | `/api/v1/devices/:deviceId/config` | `devices.manage` |
| PATCH | `/api/v1/devices/:deviceId/status` | `devices.manage` |
| POST | `/api/v1/devices/:deviceId/deactivate` | `devices.manage` |
| DELETE | `/api/v1/devices/:deviceId/home/:homeId` | `devices.manage` |

El `device.code` de este módulo es el identificador que debe aparecer en el topic MQTT como `{deviceCode}`. Registrar el dispositivo por REST no genera por sí solo una lectura MQTT.

## Consumption — `/consumption`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/consumption/summary` | `consumption.read` |
| GET | `/api/v1/consumption/daily` | `consumption.read` |
| GET | `/api/v1/consumption/monthly` | `consumption.read` |
| GET | `/api/v1/consumption/hourly` | `consumption.read` |
| GET | `/api/v1/consumption/cost` | `consumption.read` |

Estas rutas consultan agregados de PostgreSQL. No son un endpoint de entrada MQTT ni representan por sí mismas caudal instantáneo.

## Tariffs — `/tariffs`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/tariffs/home/:homeId` | autenticado y con acceso al hogar |

## Alerts — `/alerts`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/alerts/home/:homeId/pending` | autenticado y con acceso al hogar |
| PATCH | `/api/v1/alerts/:alertId/status` | permiso de gestión de alertas |
| POST | `/api/v1/alerts/home/:homeId/rules` | permiso de gestión de alertas |
| GET | `/api/v1/alerts/home/:homeId/rules` | autenticado y con acceso al hogar |
| GET | `/api/v1/alerts/home/:homeId/history` | autenticado y con acceso al hogar |
| PATCH | `/api/v1/alerts/rules/:ruleId` | permiso de gestión de alertas |
| DELETE | `/api/v1/alerts/rules/:ruleId` | permiso de gestión de alertas |
| GET | `/api/v1/alerts/home/:homeId/thresholds` | autenticado y con acceso al hogar |
| PUT | `/api/v1/alerts/home/:homeId/thresholds` | permiso de gestión de alertas |
| DELETE | `/api/v1/alerts/home/:homeId/thresholds` | permiso de gestión de alertas |

## Goals — `/goals`

| Método | Ruta completa | Acceso |
|---|---|---|
| POST | `/api/v1/goals` | `homes.manage` |
| GET | `/api/v1/goals` | autenticado |
| GET | `/api/v1/goals/:goalId` | autenticado y autorizado |
| GET | `/api/v1/goals/:goalId/progress` | autenticado y autorizado |
| PUT | `/api/v1/goals/:goalId` | `homes.manage` |
| DELETE | `/api/v1/goals/:goalId` | `homes.manage` |

## Vacation — `/vacation`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/vacation/home/:homeId` | autenticado y con acceso al hogar |
| PUT | `/api/v1/vacation/home/:homeId` | `homes.manage` |
| DELETE | `/api/v1/vacation/home/:homeId` | `homes.manage` |

## Roles — `/roles`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/roles/users/:userId` | `roles.manage` |
| POST | `/api/v1/roles/users/:userId` | `roles.manage` |
| DELETE | `/api/v1/roles/users/:userId` | `roles.manage` |

## Support — `/support`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/support/catalogs` | autenticado |
| GET | `/api/v1/support/tickets` | autenticado |
| GET | `/api/v1/support/tickets/:ticketId` | autenticado y autorizado |
| GET | `/api/v1/support/tickets/:ticketId/responses` | autenticado y autorizado |
| POST | `/api/v1/support/tickets` | autenticado; crea un ticket propio |
| PATCH | `/api/v1/support/tickets/:ticketId` | soporte |
| POST | `/api/v1/support/tickets/:ticketId/responses` | soporte |

## Audit — `/audit`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/audit/logs` | `audit.read` |

Parámetros de consulta disponibles para auditoría: `action`, `tableName`, `from`, `to`, `page` y `pageSize`.

## Corrección de permisos de Support

`POST /api/v1/support/tickets` requiere únicamente autenticación. La creación de tickets propios no requiere `homes.manage`.

`POST /api/v1/support/tickets/:ticketId/responses` requiere autenticación y la autorización final de la fila se aplica mediante RLS. La administración de tickets (`PATCH`) sí requiere `tickets.manage`.

## MQTT no es REST

Actualmente no están montadas rutas como `/api/v1/telemetry` ni `/api/v1/actuators`. La telemetría entra por Mosquitto y se procesa con `MqttSubscriber`, `message-parser` y los handlers descritos en `14-mqtt-protocol.md`.

`MqttPublisher` ya existe, pero las rutas/casos de uso para comandos de válvula y bomba son una tarea futura. Las secciones de actuadores de documentos conceptuales anteriores deben considerarse propuesta, no API disponible.

## Comprobación rápida

```powershell
Invoke-WebRequest http://localhost:3000/health

# Con token obtenido en login:
curl.exe -H "Authorization: Bearer <access_token>" http://localhost:3000/api/v1/users/me
```
