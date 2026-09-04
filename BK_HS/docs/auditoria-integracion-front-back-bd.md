# Auditoría de integración Frontend → Backend → Base de datos

Fecha de revisión: 2026-09-03

## Resultado general

| Capa | Resultado |
|---|---|
| Frontend → Backend | Parcial. Autenticación conectada; módulos de negocio todavía usan datos locales. |
| Backend → Base de datos | Correcto en las funciones revisadas. Las funciones llamadas por los repositorios tienen definición en `BD_HS/01_ddl`. |
| Backend → permisos/RLS | Implementado en rutas, casos de uso y funciones PostgreSQL; debe continuar validándose con pruebas por usuario real. |
| Circuito completo Front → API → BD | Funciona para autenticación; aún no está completo para hogares, dispositivos, consumo, alertas, metas, vacaciones y soporte. |

## 1. Frontend → Backend

### Conectado actualmente

El cliente HTTP está en:

`FT_HS/Web/src/services/apiClient.ts`

Actualmente las pantallas usan estas operaciones reales:

| Funcionalidad | Endpoint | Estado |
|---|---|---|
| Login | `POST /api/v1/auth/login` | Conectado |
| Registro | `POST /api/v1/auth/register` | Conectado |
| Validar sesión | `GET /api/v1/users/me` | Conectado al restaurar sesión |
| Refresh | `POST /api/v1/auth/refresh` | Conectado en el interceptor y al iniciar |
| Logout | `POST /api/v1/auth/logout` | Conectado |
| Solicitar recuperación | `POST /api/v1/auth/request-password-reset` | Conectado |
| Confirmar recuperación | `POST /api/v1/auth/reset-password` | Conectado; usa `resetToken` y `newPassword` |
| Cambiar contraseña | `POST /api/v1/auth/change-password` | Conectado desde configuración |

### Preparado pero no usado por las pantallas

El cliente ya declara métodos para hogares, miembros, dispositivos, consumo y alertas, pero las pantallas continúan trabajando con `useState` y arreglos locales.

| Módulo | Estado actual |
|---|---|
| Hogares y miembros | Cliente preparado; `HomeManagement.tsx` aún usa hogares, usuarios y membresías quemados. |
| Dispositivos | Cliente preparado; `DeviceManagement.tsx` aún usa dispositivos y hogares quemados. |
| Consumo | Cliente preparado; dashboard y reportes aún usan puntos y totales quemados. |
| Alertas | Cliente preparado; `NotificationsPanel.tsx` aún usa notificaciones locales. |
| Metas | Falta declarar/usar `goalsApi` desde la pantalla. |
| Vacaciones | Falta declarar/usar `vacationApi` desde la pantalla. |
| Soporte | Falta declarar/usar `supportApi` desde la pantalla. |
| Tarifa | Solo existe consulta en backend; no debe documentarse actualización hasta crear esa ruta. |
| Roles globales | No deben conectarse al flujo del hogar; son para administración del sistema. |

## 2. Rutas Backend → Base de datos

Se compararon los nombres de funciones PostgreSQL invocados desde los repositorios de `BK_HS` contra las definiciones SQL de `BD_HS/01_ddl`.

Resultado: **no se encontraron funciones de repositorio sin definición en los DDL**.

Los dominios revisados fueron:

- Autenticación, sesiones y contraseñas.
- Hogares y membresías.
- Dispositivos.
- Consumo diario, horario, mensual y costos.
- Alertas y umbrales.
- Metas.
- Vacaciones.
- Roles y permisos.
- Funciones auxiliares RLS.

El backend usa funciones PostgreSQL desde repositorios, por ejemplo:

- `user_account.fn_get_credential_for_login`
- `user_account.fn_create_session`
- `user_account.fn_rotate_refresh_token`
- `user_account.fn_change_password_hash`
- `user_account.fn_create_password_reset_token`
- `home.fn_create_home_with_owner`
- `home.fn_add_home_member`
- `device.fn_register_device`
- `device.fn_update_device_status`
- `consumption.fn_get_daily_consumption`
- `consumption.fn_get_monthly_consumption`
- `consumption.fn_get_home_hourly_consumption`
- `consumption.fn_calculate_period_cost`
- `alert_rate.fn_get_home_pending_alerts`
- `analytics_support.fn_get_goal_progress`

## 3. Inconsistencias corregidas

### Recuperación de contraseña

El frontend enviaba:

```json
{ "token": "...", "password": "..." }
```

El backend espera:

```json
{ "resetToken": "...", "newPassword": "..." }
```

El cliente fue corregido para enviar el contrato real del backend.

### Métodos de consumo

El backend espera:

- Resumen: `homeId`, `from`, `to`.
- Diario: `homeId`, `date`.
- Horario: `homeId`.
- Mensual: `homeId`, `year`, `month`.
- Costo: `homeId`, `from`, `to`.

El frontend todavía no invoca estos métodos desde las gráficas, por lo que debe migrarse respetando esos parámetros.

### Dispositivos

La lista del backend es:

`GET /api/v1/devices`

El controlador actualmente lista los dispositivos accesibles del usuario y no utiliza `homeId` como filtro de query. La pantalla frontend no debe asumir que `?homeId=` filtra resultados hasta que el backend agregue formalmente ese filtro.

## 4. Rutas disponibles en backend y pendientes de conexión

### Autenticación

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/change-password
POST /api/v1/auth/request-password-reset
POST /api/v1/auth/reset-password
```

### Usuario

```text
GET /api/v1/users/me
PUT /api/v1/users/me
```

### Hogares

```text
GET /api/v1/homes
GET /api/v1/homes/:homeId
POST /api/v1/homes
PUT /api/v1/homes/:homeId
GET /api/v1/homes/:homeId/members
POST /api/v1/homes/:homeId/members
PATCH /api/v1/homes/:homeId/members/:memberUserId/role
DELETE /api/v1/homes/:homeId/members/:memberUserId
POST /api/v1/homes/:homeId/membership-requests
GET /api/v1/homes/:homeId/membership-requests
PATCH /api/v1/homes/membership-requests/:requestId
```

### Dispositivos

```text
GET /api/v1/devices
GET /api/v1/devices/:deviceId
GET /api/v1/devices/:deviceId/status
POST /api/v1/devices
PUT /api/v1/devices/:deviceId
PUT /api/v1/devices/:deviceId/config
PATCH /api/v1/devices/:deviceId/status
POST /api/v1/devices/:deviceId/deactivate
DELETE /api/v1/devices/:deviceId/home/:homeId
```

### Consumo

```text
GET /api/v1/consumption/summary
GET /api/v1/consumption/daily
GET /api/v1/consumption/hourly
GET /api/v1/consumption/monthly
GET /api/v1/consumption/cost
```

### Alertas

```text
GET /api/v1/alerts/home/:homeId/pending
PATCH /api/v1/alerts/:alertId/status
POST /api/v1/alerts/home/:homeId/rules
GET /api/v1/alerts/home/:homeId/rules
PATCH /api/v1/alerts/rules/:ruleId
DELETE /api/v1/alerts/rules/:ruleId
GET /api/v1/alerts/home/:homeId/thresholds
PUT /api/v1/alerts/home/:homeId/thresholds
DELETE /api/v1/alerts/home/:homeId/thresholds
```

### Metas, vacaciones y soporte

Estas rutas están implementadas en backend y deben agregarse al cliente frontend antes de retirar sus datos locales:

```text
GET/POST /api/v1/goals
GET/PUT/DELETE /api/v1/goals/:goalId
GET /api/v1/goals/:goalId/progress
GET /api/v1/vacation/home/:homeId
PUT /api/v1/vacation/home/:homeId
DELETE /api/v1/vacation/home/:homeId
GET /api/v1/support/catalogs
GET /api/v1/support/tickets
GET /api/v1/support/tickets/:ticketId
GET /api/v1/support/tickets/:ticketId/responses
POST /api/v1/support/tickets
PATCH /api/v1/support/tickets/:ticketId
POST /api/v1/support/tickets/:ticketId/responses
GET /api/v1/audit/logs
```

### Auditoría administrativa

`GET /api/v1/audit/logs` requiere `Bearer` y el permiso global `audit.read`, asignado únicamente a `Administrator`. Acepta `action`, `tableName`, `from`, `to`, `page` y `pageSize`.

El repositorio ejecuta `user_account.fn_list_audit_logs(...)` mediante `hidro_smart_app`. La aplicación no tiene permiso `SELECT` directo sobre `audit.audit_log`; PostgreSQL vuelve a comprobar el permiso dentro de la función.

## 5. Orden recomendado de corrección

1. Hogares y miembros: obtener `homeId` y la membresía real.
2. Dispositivos: listar por acceso real y aplicar permisos del titular.
3. Dashboard: conectar resumen, diario y horario.
4. Reportes: conectar mensual, costo y tarifa de solo lectura.
5. Alertas: conectar pendientes, reglas y umbrales.
6. Metas y vacaciones.
7. Soporte.
8. Eliminar los datos quemados restantes únicamente después de verificar cada endpoint.

## Conclusión

La base de datos y el backend están alineados en las funciones revisadas. La principal brecha actual está entre las pantallas del frontend y la API: hay rutas preparadas, pero no todas se consumen todavía. La autenticación ya recorre el circuito completo; los demás módulos deben migrarse gradualmente respetando los contratos y permisos documentados aquí.

## Actualización 2026-09-03

La auditoría administrativa ya está alineada entre BD y backend. La función, el grant, el caso de uso, el repositorio, el controlador y la ruta fueron aplicados y verificados. La integración del panel frontend de auditoría queda pendiente hasta conectar esa pantalla con la API.

## Revisión prioritaria: registro e inicio de sesión

### Inicio de sesión

- Frontend: `POST /api/v1/auth/login` con `{ login, password }`.
- Backend: acepta `login` o `email`, valida la cuenta activa y la política de seguridad.
- Base de datos: consulta credenciales mediante `user_account.fn_get_credential_for_login`.
- Respuesta verificada: `200`, `userId` UUID, `accessToken` y `refreshToken`.
- Credenciales inválidas verificadas: `401`.

Resultado: **flujo alineado y funcional**.

### Registro

- Frontend: `POST /api/v1/auth/register` con `username`, `email`, `password` y `fullName`.
- Backend: valida usuario, correo y política de contraseña; crea la sesión inmediatamente.
- Base de datos: `user_account.fn_register_user` crea la cuenta y asigna el rol global `HomeUser`; luego se guarda el hash y el perfil.
- El frontend solicita `docType`, `docNumber` y consentimientos, pero esos campos no forman parte del contrato actual ni se guardan en la BD desde este endpoint.
- El `userId` devuelto es UUID; el tipo frontend fue ajustado de `number` a `string`.
- Registro inválido verificado: `400`.

Resultado: **alta técnica alineada**, pero documento y consentimientos requieren una decisión de diseño antes de declararlos persistentes.

### Validación de documento aplicada

Se agregó validación en frontend, backend y PostgreSQL para aceptar únicamente dígitos y un máximo de 10 caracteres en `CC` y `CE`. Se usa máximo —no exactamente 10— porque la Registraduría indica que el NUIP actual es de 10 dígitos, pero las cédulas de ciudadanía anteriores pueden conservar numeraciones de hasta 8 dígitos.
