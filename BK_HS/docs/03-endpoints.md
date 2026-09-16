# Endpoints reales de la API — HidroSmart

Fecha de revisión: 2026-09-15.

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
| GET | `/api/v1/auth/sessions` | autenticado; solo sesiones propias |
| DELETE | `/api/v1/auth/sessions/:sessionId` | autenticado; solo una sesion propia |
| POST | `/api/v1/auth/sessions/revoke-others` | autenticado; conserva la sesion actual |
| POST | `/api/v1/auth/sessions/revoke-all` | autenticado; cierra todas las sesiones |
| POST | `/api/v1/auth/change-password` | autenticado |
| POST | `/api/v1/auth/request-password-reset` | público |
| GET | `/api/v1/auth/password-reset-context?resetToken=...` | público con token vigente; devuelve solo el correo asociado |
| POST | `/api/v1/auth/reset-password` | público con token de un solo uso |
| POST | `/api/v1/auth/resend-verification` | público; reenvía un enlace de verificación con respuesta neutra |
| POST | `/api/v1/auth/verify-email` | público con token de verificación de un solo uso |

`GET /auth/sessions` nunca devuelve hashes ni tokens. `DELETE /auth/sessions/:sessionId` responde `204` al cerrar una sesion propia; una sesion inexistente, ajena o ya cerrada responde `404`. Las operaciones masivas devuelven `{ data: { revokedCount } }`.

## Users — `/users`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/users/me` | autenticado |
| GET | `/api/v1/users` | `users.manage`; búsqueda, estado, paginación y ordenamiento |
| PUT | `/api/v1/users/me` | autenticado |
| GET | `/api/v1/users/me/preferences` | autenticado |
| PUT | `/api/v1/users/me/preferences` | autenticado |
| GET | `/api/v1/users/me/notifications` | autenticado; preferencias propias de avisos por correo |
| PUT | `/api/v1/users/me/notifications` | autenticado; guarda avisos de consumo, alertas, dispositivos y canal Gmail |
| PATCH | `/api/v1/users/:userId/status` | `users.manage` |
| DELETE | `/api/v1/users/:userId` | `users.manage`; eliminación lógica |

El correo y el documento se mantienen inmutables en la actualización de perfil según el caso de uso actual. El perfil permite actualizar `fullName`, `city`, `phone` (máximo 60 caracteres) y `avatarDataUrl` (JPG, PNG o WebP en base64, máximo 2 MB).

## Homes — `/homes`

| Método | Ruta completa | Acceso |
|---|---|---|
| POST | `/api/v1/homes` | `homes.manage` |
| GET | `/api/v1/homes` | autenticado |
| GET | `/api/v1/homes/:homeId` | autenticado y con acceso al hogar |
| PUT | `/api/v1/homes/:homeId` | `homes.manage` |
| GET | `/api/v1/homes/:homeId/members` | autenticado y con acceso al hogar |
| POST | `/api/v1/homes/:homeId/members` | `homes.manage`; agrega una cuenta activa y envía el aviso de acceso por SMTP |
| PATCH | `/api/v1/homes/:homeId/members/:memberUserId/role` | `homes.manage` |
| DELETE | `/api/v1/homes/:homeId/members/:memberUserId` | `homes.manage` |
| POST | `/api/v1/homes/:homeId/membership-requests` | autenticado |
| GET | `/api/v1/homes/:homeId/membership-requests` | autenticado y con acceso al hogar |
| PATCH | `/api/v1/homes/membership-requests/:requestId` | `homes.manage` |

`POST /api/v1/homes/:homeId/members` recibe `{ "email": "persona@correo.com", "homeRole": "Member" | "Guest" }`.
El correo debe corresponder a una cuenta activa. PostgreSQL mantiene la
validación de propietario, permiso y duplicados; después de confirmar el alta,
el backend envía el aviso de acceso mediante el SMTP configurado y responde
con `notification.sent` y `notification.configured`. Si SMTP no está
disponible, el miembro permanece agregado y `notification.sent` queda en
`false`.

## Devices — `/devices`

| Método | Ruta completa | Acceso |
|---|---|---|
| POST | `/api/v1/devices` | `devices.manage` |
| POST | `/api/v1/devices/link` | `devices.manage`; vinculación por código técnico y titularidad del hogar |
| GET | `/api/v1/devices` | autenticado; lista dispositivos autorizados con `homeId`, `page`, `pageSize`, `sort` y `order` |
| GET | `/api/v1/devices/:deviceId` | autenticado y con acceso al dispositivo |
| GET | `/api/v1/devices/:deviceId/status` | autenticado y con acceso al dispositivo |
| GET | `/api/v1/devices/:deviceId/telemetry` | autenticado y con acceso al dispositivo; historial paginado con filtros `from`, `to`, `sort` y `order` |
| GET | `/api/v1/devices/:deviceId/telemetry/latest` | autenticado y con acceso al dispositivo; devuelve la ultima lectura o `null` |
| PUT | `/api/v1/devices/:deviceId` | `devices.manage` |
| PUT | `/api/v1/devices/:deviceId/config` | `devices.manage` |
| PATCH | `/api/v1/devices/:deviceId/status` | `devices.manage` |
| PATCH | `/api/v1/devices/:deviceId/provisioning` | `devices.manage`; actualiza identidad y estado de aprovisionamiento |
| POST | `/api/v1/devices/:deviceId/deactivate` | `devices.manage` |
| DELETE | `/api/v1/devices/:deviceId/home/:homeId` | `devices.manage` |

El `device.code` de este módulo es el identificador que debe aparecer en el topic MQTT como `{deviceCode}`. Si el alta no recibe `code`, el backend genera uno con el formato `ESP32-XXXXXXXXXXXX`; así el usuario no tiene que escribir identificadores técnicos. Registrar el dispositivo por REST no genera por sí solo una lectura MQTT.
El `hardwareId` se completa después, al descubrir la placa por BLE y ejecutar `POST /api/v1/devices/{deviceId}/claim-hardware`. La contraseña Wi-Fi solo viaja por BLE y nunca se guarda en PostgreSQL. La vinculación de un dispositivo ya existente usa `{ homeId, code }` en `POST /api/v1/devices/link`.

## Actuators — `/actuators`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/actuators/states?homeId={uuid}` | autenticado; estados de actuadores de hogares autorizados |
| GET | `/api/v1/actuators/:deviceId/status` | autenticado y con acceso al dispositivo |
| GET | `/api/v1/actuators/commands?homeId={uuid}&status={status}` | autenticado; comandos del hogar autorizado, con paginación |
| POST | `/api/v1/actuators/:deviceId/:actuator/commands` | `actuators.manage`; `actuator` es `valve` o `pump` |

El cuerpo del comando acepta `command` (`OPEN`/`CLOSED` para `VALVE`, `ON`/`OFF` para `PUMP`) y un `correlationId` UUID opcional. Si no se envía, el backend lo genera. La respuesta `202` deja el comando en `Published` cuando Mosquitto lo acepta; si el broker falla, el registro queda en `Failed` y la API responde `503`.

```json
{
  "command": "OPEN",
  "correlationId": "33333333-3333-4333-8333-333333333333"
}
```

El estado reportado por el dispositivo actualiza `device.actuator_state`. Si el payload MQTT incluye el mismo `correlationId`, el comando pasa a `Acknowledged`. Los comandos `Pending` o `Published` sin ACK se marcan automáticamente como `TimedOut` y la transición queda en `audit.audit_log`.

## Consumption — `/consumption`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/consumption/summary` | `consumption.read` |
| GET | `/api/v1/consumption/daily` | `consumption.read` |
| GET | `/api/v1/consumption/monthly` | `consumption.read` |
| GET | `/api/v1/consumption/hourly` | `consumption.read` |
| GET | `/api/v1/consumption/cost` | `consumption.read` |
| GET | `/api/v1/consumption/advanced` | `consumption.read`; series agrupadas por `daily`, `hourly`, `monthly` o `location` |

Estas rutas consultan agregados de PostgreSQL. No son un endpoint de entrada MQTT ni representan por sí mismas caudal instantáneo. Para proteger consultas grandes, `summary` y `cost` aceptan periodos de máximo 366 días; los reportes PDF/Excel aplican el mismo límite.

`GET /api/v1/consumption/advanced` recibe `homeId`, `from`, `to` y `groupBy`. Devuelve puntos con fecha/hora o ubicación, litros, m³, cantidad de lecturas, flujo promedio y flujo máximo. La autorización del hogar se comprueba en el caso de uso y nuevamente en `consumption.fn_get_consumption_series(...)`.

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
| POST | `/api/v1/support/tickets/:ticketId/responses` | autenticado y autorizado por RLS; propio o `tickets.manage` |

## Audit — `/audit`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/audit/logs` | `audit.read` |

Parámetros de consulta disponibles para auditoría: `action`, `tableName`, `from`, `to`, `page` y `pageSize`.

## Privacy/ARCO — `/privacy`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/privacy/consents` | autenticado; consentimientos propios |
| GET | `/api/v1/privacy/export` | autenticado; exportación JSON propia sin secretos |
| POST | `/api/v1/privacy/consents` | autenticado; agrega un consentimiento aceptado |
| POST | `/api/v1/privacy/requests` | autenticado; crea una solicitud propia |
| GET | `/api/v1/privacy/requests` | autenticado; solicitudes propias, paginadas |
| GET | `/api/v1/privacy/requests/:requestId` | autenticado; solicitud propia o autorizada por RLS |
| GET | `/api/v1/privacy/requests/manage` | `users.manage`; bandeja administrativa paginada |
| PATCH | `/api/v1/privacy/requests/:requestId` | `users.manage`; estado y respuesta |

Los consentimientos son append-only desde la aplicación. Las solicitudes ARCO nuevas reciben una fecha límite de 15 días y solo la administración puede modificar su estado, respuesta y trazabilidad; PostgreSQL/RLS aplica el alcance final.

## Reports — `/reports`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/reports/history?homeId={uuid}&type={pdf|excel}&status={Generating|Ready|Error}&page={n}&pageSize={n}` | `reports.read`; historial propio paginado y filtrable |
| GET | `/api/v1/reports/:reportId/download` | `reports.read`; descarga un reporte propio con estado `Ready` |
| GET | `/api/v1/reports/consumption.pdf?homeId={uuid}&from=YYYY-MM-DD&to=YYYY-MM-DD` | `reports.read`; PDF resumido del hogar autorizado; máximo 366 días |
| GET | `/api/v1/reports/consumption.xlsx?homeId={uuid}&from=YYYY-MM-DD&to=YYYY-MM-DD` | `reports.read`; Excel resumido del hogar autorizado; máximo 366 días |

Las descargas reutilizan `consumption.fn_calculate_consumption(...)`, no exponen hashes, tokens ni lecturas de otros hogares y generan el archivo a partir de datos autorizados. Cada archivo se registra en `analytics_support.generated_report`, se almacena en el volumen privado de reportes y puede consultarse o descargarse después mediante las dos rutas de historial.

## Recomendaciones — `/recommendations`

| Método | Ruta completa | Acceso |
|---|---|---|
| GET | `/api/v1/recommendations?homeId={uuid}&status={Pending|Read|Dismissed|Applied}` | `reports.read`; recomendaciones propias, filtradas por RLS |
| GET | `/api/v1/recommendations/home/:homeId/summary` | `reports.read`; resumen del hogar autorizado |
| PATCH | `/api/v1/recommendations/:userRecommendationId` | `reports.read`; actualiza `status` o `usefulness` de una recomendación propia |

El listado admite `page`, `pageSize`, `sort`, `order` y `category`. El backend no permite devolver una recomendación de otro usuario: la consulta se ejecuta con el contexto de usuario de PostgreSQL y la política RLS de `analytics_support.user_recommendation`. El estado inicial `Pending` no se puede restaurar desde la API; `Read`, `Dismissed` y `Applied` actualizan el registro, y `Read` conserva `read_at`.

## Corrección de permisos de Support

`POST /api/v1/support/tickets` requiere únicamente autenticación. La creación de tickets propios no requiere `homes.manage`.

`POST /api/v1/support/tickets/:ticketId/responses` requiere autenticación y la autorización final de la fila se aplica mediante RLS. La administración de tickets (`PATCH`) sí requiere `tickets.manage`.

## MQTT no es REST

Actualmente no existe una ruta REST de ingesta de telemetría: la telemetría entra por Mosquitto y se procesa con `MqttSubscriber`, `message-parser` y los handlers descritos en `14-mqtt-protocol.md`. Los comandos de actuadores sí tienen API REST y se publican por `MqttPublisher`; la confirmación de estado se persiste en PostgreSQL.

## Comprobación rápida

```powershell
Invoke-WebRequest http://localhost:3000/health

# Con token obtenido en login:
curl.exe -H "Authorization: Bearer <access_token>" http://localhost:3000/api/v1/users/me
```

## AsociaciÃ³n de hardware IoT (2026-09-15)

| MÃ©todo | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/devices/hardware/:hardwareId` | autenticado; solo devuelve un dispositivo accesible |
| POST | `/api/v1/devices/:deviceId/claim-hardware` | `devices.manage`; asocia un `hardwareId` Ãºnico |

El cuerpo del `POST` es `{ "hardwareId": "HS-141F47470968" }`. La asociaciÃ³n
se valida tambiÃ©n en `device.fn_claim_provisioned_device(...)`; un hardware ya
asociado a otro dispositivo devuelve `409`. La contraseÃ±a Wi-Fi no forma parte
de estas rutas.

Las respuestas de `GET /api/v1/devices`, `GET /api/v1/devices/:deviceId` y
`GET /api/v1/devices/:deviceId/status` pueden incluir `wifiSsid`, `lastIp` y
`wifiRssiDbm`, recibidos del estado MQTT del ESP32. `wifiSsid` se limita a 32
caracteres y `lastIp` a 45; ninguno contiene credenciales. El frontend usa
estos campos para el apartado **Configuración** y mantiene la contraseña como
un campo de reemplazo local enviado únicamente por BLE.
