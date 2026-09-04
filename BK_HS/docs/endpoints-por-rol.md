# Endpoints accesibles por rol

Matriz basada en las rutas actuales de `BK_HS/src/api` y en los permisos activos de PostgreSQL.

## Significado funcional de cada rol

| Rol | Responsabilidad |
| --- | --- |
| `Administrator` | Panel interno de los desarrolladores y dueños del proyecto. Administra usuarios, roles, permisos, auditoría y configuración global. |
| `Support` | Atiende los tickets creados por los usuarios y consulta la información necesaria para brindar soporte. |
| `HomeUser` | Dueño del hogar. Administra sus hogares, miembros, dispositivos, alertas y metas autorizadas. |
| `Guest` | Invitado de solo lectura. Puede visualizar información autorizada, pero no crear, modificar, eliminar ni administrar recursos. |

## Resumen de roles

| Rol | Permisos funcionales |
| --- | --- |
| `Administrator` | Todos los permisos administrativos y operativos del panel interno |
| `Support` | Atención de tickets, alertas, consumo y dispositivos necesarios para soporte |
| `HomeUser` | Gestión de sus hogares, dispositivos, alertas, metas y consultas |
| `Guest` | Consultas de solo lectura sobre recursos autorizados |

## Endpoints públicos

Estos endpoints no requieren rol ni token:

| Método | Endpoint | Acción |
| --- | --- | --- |
| GET | `/` | Estado básico de la API |
| GET | `/health` | Health check |
| POST | `/api/v1/auth/register` | Registrar cuenta; asigna `HomeUser` por defecto |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/refresh` | Renovar sesión |
| POST | `/api/v1/auth/request-password-reset` | Solicitar recuperación |
| POST | `/api/v1/auth/reset-password` | Restablecer contraseña con token |

## Endpoints de cualquier usuario autenticado

Requieren token Bearer. La respuesta final también depende de pertenencia al hogar, propiedad del recurso y RLS. Para `Guest`, los endpoints de modificación deben quedar bloqueados aunque exista autenticación.

| Método | Endpoint | Acción |
| --- | --- | --- |
| POST | `/api/v1/auth/logout` | Cerrar sesión y revocar refresh token |
| POST | `/api/v1/auth/change-password` | Cambiar contraseña propia |
| GET | `/api/v1/users/me` | Consultar perfil propio |
| PUT | `/api/v1/users/me` | Actualizar perfil propio |
| GET | `/api/v1/homes` | Listar hogares propios |
| GET | `/api/v1/homes/:homeId` | Consultar un hogar autorizado |
| GET | `/api/v1/homes/:homeId/members` | Consultar miembros autorizados |
| POST | `/api/v1/homes/:homeId/membership-requests` | Solicitar ingreso a un hogar |
| GET | `/api/v1/homes/:homeId/membership-requests` | Consultar solicitudes autorizadas |
| GET | `/api/v1/devices` | Listar dispositivos visibles |
| GET | `/api/v1/devices/:deviceId` | Consultar dispositivo visible |
| GET | `/api/v1/devices/:deviceId/status` | Consultar estado del dispositivo |
| GET | `/api/v1/tariffs/home/:homeId` | Consultar tarifa vigente del hogar |
| GET | `/api/v1/goals` | Listar metas propias/autorizadas |
| GET | `/api/v1/goals/:goalId` | Consultar una meta autorizada |
| GET | `/api/v1/goals/:goalId/progress` | Consultar progreso de una meta |
| GET | `/api/v1/vacation/home/:homeId` | Consultar modo vacaciones |

## Endpoints según permiso

### `consumption.read`

Lo tienen los cuatro roles:

| Método | Endpoint |
| --- | --- |
| GET | `/api/v1/consumption/summary` |
| GET | `/api/v1/consumption/daily` |
| GET | `/api/v1/consumption/hourly` |
| GET | `/api/v1/consumption/monthly` |
| GET | `/api/v1/consumption/cost` |

### `homes.manage`

Lo tienen `Administrator` y `HomeUser`:

| Método | Endpoint |
| --- | --- |
| POST | `/api/v1/homes` |
| PUT | `/api/v1/homes/:homeId` |
| POST | `/api/v1/homes/:homeId/members` |
| PATCH | `/api/v1/homes/:homeId/members/:memberUserId/role` |
| DELETE | `/api/v1/homes/:homeId/members/:memberUserId` |
| PATCH | `/api/v1/homes/membership-requests/:requestId` |

### `devices.manage`

Lo tienen `Administrator`, `Support` y `HomeUser`:

| Método | Endpoint |
| --- | --- |
| POST | `/api/v1/devices` |
| PUT | `/api/v1/devices/:deviceId` |
| PUT | `/api/v1/devices/:deviceId/config` |
| PATCH | `/api/v1/devices/:deviceId/status` |
| POST | `/api/v1/devices/:deviceId/deactivate` |
| DELETE | `/api/v1/devices/:deviceId/home/:homeId` |

### `roles.manage`

Solo lo tiene `Administrator`:

| Método | Endpoint |
| --- | --- |
| GET | `/api/v1/roles/users/:userId` |
| POST | `/api/v1/roles/users/:userId` |
| DELETE | `/api/v1/roles/users/:userId` |

### `audit.read`

Solo lo tiene `Administrator`. La aplicación no lee `audit.audit_log` directamente; consulta la función protegida de PostgreSQL:

| Método | Endpoint | Filtros |
| --- | --- | --- |
| GET | `/api/v1/audit/logs` | `action`, `tableName`, `from`, `to`, `page`, `pageSize` |

### `alerts.manage`

Lo tienen `Administrator`, `Support` y `HomeUser`. Las consultas exigen autenticación y las mutaciones exigen además este permiso; la autorización final también se valida según el hogar y el recurso:

| Método | Endpoint |
| --- | --- |
| GET | `/api/v1/alerts/home/:homeId/pending` |
| PATCH | `/api/v1/alerts/:alertId/status` |
| POST | `/api/v1/alerts/home/:homeId/rules` |
| GET | `/api/v1/alerts/home/:homeId/rules` |
| PATCH | `/api/v1/alerts/rules/:ruleId` |
| DELETE | `/api/v1/alerts/rules/:ruleId` |
| GET | `/api/v1/alerts/home/:homeId/thresholds` |
| PUT | `/api/v1/alerts/home/:homeId/thresholds` |
| DELETE | `/api/v1/alerts/home/:homeId/thresholds` |

### Gestión de metas y modo vacaciones

Las operaciones de escritura requieren `homes.manage`, disponible para `Administrator` y `HomeUser`:

| Método | Endpoint |
| --- | --- |
| POST | `/api/v1/goals` |
| PUT | `/api/v1/goals/:goalId` |
| DELETE | `/api/v1/goals/:goalId` |
| PUT | `/api/v1/vacation/home/:homeId` |
| DELETE | `/api/v1/vacation/home/:homeId` |

## Soporte y tickets

`Support` recibe y gestiona los tickets de soporte de los usuarios. `HomeUser` puede crear tickets propios y `Guest` únicamente consultar los que RLS le permita. La gestión de estado y respuestas exige `tickets.manage`.

Endpoints pendientes del módulo:

| Método | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/v1/support/tickets` | Listar tickets propios o todos para soporte |
| GET | `/api/v1/support/catalogs` | Consultar categorías activas |
| GET | `/api/v1/support/tickets/:ticketId` | Consultar un ticket autorizado |
| POST | `/api/v1/support/tickets` | Crear ticket; `HomeUser` y `Administrator` |
| PATCH | `/api/v1/support/tickets/:ticketId` | Cambiar estado, prioridad o asignación; `Support` y `Administrator` |
| POST | `/api/v1/support/tickets/:ticketId/responses` | Responder; `Support` y `Administrator` |
| GET | `/api/v1/support/tickets/:ticketId/responses` | Consultar historial autorizado |

`Guest` conserva acceso de solo lectura y no puede crear, modificar ni responder tickets; sí puede consultar el catálogo y sus tickets autorizados.

## Permisos sin endpoint público propio

Estos permisos están definidos en la base de datos, pero todavía no tienen un módulo HTTP específico:

| Permiso | Rol |
| --- | --- |
| `audit.read` | `Administrator`; expuesto por `/api/v1/audit/logs` |
| `credentials.manage` | `Administrator` |
| `mfa.manage` | Legado de BD; fuera del alcance actual porque 2FA fue retirado |
| `reports.read` | `Administrator`, `HomeUser`, `Guest` |
| `tickets.manage` | `Administrator`, `Support` |
| `users.manage` | `Administrator` |

## Nota sobre la matriz

Tener un permiso no reemplaza la autorización por datos. PostgreSQL y RLS siguen comprobando que el usuario esté activo y que tenga acceso al hogar, miembro, dispositivo, alerta o meta solicitada.
