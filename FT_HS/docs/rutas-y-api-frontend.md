# Rutas de pantalla e integración API

Última revisión: 2026-09-07.

## Rutas del navegador

`App.tsx` define las rutas públicas y una ruta protegida para la aplicación.

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesión y recuperación de contraseña | Público |
| `/register` | Registro de usuario | Público |
| `/privacy` | Términos y consentimiento del registro | Público, requiere borrador del registro |
| `/app` | Dashboard | Autenticado |
| `/app/homes` | Hogares y miembros | Autenticado |
| `/app/devices` | Dispositivos del hogar activo | Autenticado |
| `/app/reports` | Reportes y análisis disponibles | Autenticado |
| `/app/goals` | Metas de ahorro | Autenticado y permiso `homes.manage` |
| `/app/alerts` | Alertas del hogar activo | Autenticado y permiso `alerts.manage` |
| `/app/support` | Tickets propios | Autenticado |
| `/app/support/management` | Gestión de soporte | Permiso `tickets.manage` |
| `/app/settings` | Perfil, seguridad, preferencias y cuenta | Autenticado |
| `/app/admin` | Panel administrativo | Permiso `roles.manage` |
| `/app/users` | Gestión de usuarios | Permiso `users.manage`; vista pendiente de implementar |
| `/app/audit` | Auditoría | Permiso `audit.read` |

Las rutas `/app/*` se protegen en el cliente y las rutas públicas redirigen a `/app` si ya existe una sesión.

## Cliente HTTP

En ejecución directa, `VITE_API_URL` debe apuntar a `http://localhost:3000/api/v1`. En Docker, el navegador usa `/api/v1` y Nginx redirige internamente al servicio backend.

Todas las APIs se encuentran en `Web/src/shared/http/apiClient.ts` y `httpClient.ts` solo reexporta sus contratos.

### Auth

| API frontend | Endpoint |
|---|---|
| `authApi.login` | `POST /auth/login` |
| `authApi.register` | `POST /auth/register` |
| `authApi.refresh` | `POST /auth/refresh` |
| `authApi.logout` | `POST /auth/logout` |
| `authApi.changePassword` | `POST /auth/change-password` |
| `authApi.requestPasswordReset` | `POST /auth/request-password-reset` |
| `authApi.resetPassword` | `POST /auth/reset-password` |

### Usuario y preferencias

| API frontend | Endpoint |
|---|---|
| `userApi.me` | `GET /users/me` |
| `userApi.updateMe` | `PUT /users/me` |
| `userApi.preferences` | `GET /users/me/preferences` |
| `userApi.updatePreferences` | `PUT /users/me/preferences` |

### Hogares, dispositivos y consumo

| API frontend | Endpoints principales |
|---|---|
| `homesApi` | `/homes`, `/homes/:homeId`, miembros y solicitudes de membresía |
| `devicesApi` | `/devices`, estado, configuración, desactivación y desvinculación |
| `consumptionApi` | `/consumption/summary`, `daily`, `hourly`, `monthly` y `cost` |
| `tariffApi` | `GET /tariffs/home/:homeId` |

### Alertas, metas y vacaciones

| API frontend | Endpoints principales |
|---|---|
| `alertsApi` | pendientes, historial, reglas, umbrales y actualización de estado |
| `goalsApi` | listado, creación, actualización, eliminación y `/goals/:goalId/progress` |
| `vacationApi` | `GET`, `PUT` y `DELETE /vacation/home/:homeId` |

### Soporte, roles y auditoría

| API frontend | Endpoints principales |
|---|---|
| `supportApi` | catálogo, tickets, respuestas y gestión de tickets |
| `rolesApi` | `GET`, `POST` y `DELETE /roles/users/:userId` |
| `auditApi` | `GET /audit/logs` |

## Pantallas sin endpoint actualmente

El frontend no ofrece acciones ficticias para estas funciones:

- Exportar reportes PDF/Excel.
- Configurar tarifas desde la interfaz.
- Enumerar o revocar sesiones remotas.
- Exportar datos personales.
- Solicitar eliminación de cuenta.
- Guardar permisos de privacidad analítica.
- Subir foto de perfil.
- Tiempo real MQTT, actuadores y comandos IoT.

Estas funciones se incorporarán cuando exista un contrato API verificable.
