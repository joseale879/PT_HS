# Rutas de pantalla e integraciÃ³n API

Ãšltima revisiÃ³n: 2026-09-14.

## Rutas del navegador

`App.tsx` define las rutas pÃºblicas y una ruta protegida para la aplicaciÃ³n.

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesiÃ³n y recuperaciÃ³n de contraseÃ±a | PÃºblico |
| `/register` | Registro de usuario | PÃºblico |
| `/privacy` | TÃ©rminos y consentimiento del registro | PÃºblico, requiere borrador del registro |
| `/app` | Dashboard | Autenticado |
| `/app/homes` | Hogares y miembros | Autenticado |
| `/app/devices` | Dispositivos, estados y actuadores del hogar activo | Autenticado; la vista usa paginaciÃ³n, ordenamiento y permisos del backend |
| `/app/consumption` | Consumo diario, horario y resumen del hogar | Autenticado y permiso `consumption.read` |
| `/app/reports` | Reportes y anÃ¡lisis disponibles | Autenticado |
| `/app/goals` | Metas de ahorro | Autenticado y permiso `homes.manage` |
| `/app/recommendations` | Tarjetas informativas de ahorro de agua | Autenticado y permiso `reports.read` |
| `/app/alerts` | Alertas del hogar activo | Solo `Administrator`/`Support` con `alerts.manage`; no se muestra a `HomeUser`/`Guest` |
| `/app/support` | Tickets propios, detalle, historial y respuestas (compatibilidad) | Solo `Administrator`/`Support` con `tickets.manage`; no se muestra a `HomeUser`/`Guest` |
| `/app/support/management` | Bandeja de tickets, detalle, respuestas y actualizaciÃ³n de estado | `Administrator`/`Support` con `tickets.manage` |
| `/app/settings` | Perfil, seguridad, preferencias y cuenta | Autenticado |
| `/app/admin` | Panel administrativo | `Administrator` con `roles.manage` |
| `/app/users` | GestiÃ³n de usuarios y roles | `Administrator` con `users.manage`/`roles.manage`; bÃºsqueda, filtro, paginaciÃ³n, estados y roles |
| `/app/audit` | AuditorÃ­a | `Administrator` con `audit.read` |

## Acceso por rol

El acceso se obtiene iniciando sesiÃ³n con una cuenta cuyo rol funcional ya exista en
`GET /api/v1/users/me`. El frontend no permite elegir ni falsificar el rol: utiliza los
roles y permisos devueltos por el backend, y la base de datos/RLS vuelve a validarlos.

- `Administrator`: al iniciar sesiÃ³n entra a `/app/admin`; su menÃº solo contiene
  Panel Administrador, GestiÃ³n de Usuarios, AuditorÃ­a y ConfiguraciÃ³n.
- `Support`: al iniciar sesiÃ³n entra a `/app/support/management`; su menÃº solo
  contiene Panel de Soporte y ConfiguraciÃ³n.
- `HomeUser`: conserva las vistas de hogares, dispositivos, consumo, reportes, metas y
  configuraciÃ³n; ya no ve Soporte ni Notificaciones.
- `Guest`: conserva las vistas de consulta autorizada y configuraciÃ³n; ya no ve Soporte
  ni Notificaciones.

Las vistas que no pertenecen al menÃº del rol tambiÃ©n quedan bloqueadas al intentar
abrirlas directamente por URL. La asignaciÃ³n de `Administrator` o `Support` se hace desde
`POST /api/v1/roles/users/:userId` con una cuenta que tenga `roles.manage`; despuÃ©s hay
que cerrar sesiÃ³n e iniciar sesiÃ³n nuevamente para renovar los permisos.

Las rutas `/app/*` se protegen en el cliente y cargan el layout autenticado; las rutas pÃºblicas redirigen a `/app` si ya existe una sesiÃ³n. El menÃº lateral puede colapsarse en escritorio y se abre como panel hamburguesa en pantallas pequeÃ±as.

## Cliente HTTP

En ejecuciÃ³n directa, `VITE_API_URL` debe apuntar a `http://localhost:3000/api/v1`. En Docker, el navegador usa `/api/v1` y Nginx redirige internamente al servicio backend.

Todas las APIs se encuentran en `frontend/src/shared/http/apiClient.ts` y `httpClient.ts` solo reexporta sus contratos.

### Auth

| API frontend | Endpoint |
|---|---|
| `authApi.login` | `POST /auth/login` |
| `authApi.register` | `POST /auth/register` |
| `authApi.refresh` | `POST /auth/refresh` |
| `authApi.logout` | `POST /auth/logout` |
| `authApi.listSessions` | `GET /auth/sessions` |
| `authApi.revokeSession` | `DELETE /auth/sessions/:sessionId` |
| `authApi.revokeOtherSessions` | `POST /auth/sessions/revoke-others` |
| `authApi.revokeAllSessions` | `POST /auth/sessions/revoke-all` |
| `authApi.changePassword` | `POST /auth/change-password` |
| `authApi.requestPasswordReset` | `POST /auth/request-password-reset` |
| `authApi.passwordResetContext` | `GET /auth/password-reset-context?resetToken=...` |
| `authApi.resetPassword` | `POST /auth/reset-password` |

### Usuario y preferencias

| API frontend | Endpoint |
|---|---|
| `userApi.me` | `GET /users/me` |
| `userApi.updateMe` | `PUT /users/me` |
| `userApi.preferences` | `GET /users/me/preferences` |
| `userApi.updatePreferences` | `PUT /users/me/preferences` |
| `userApi.listManagedUsers` | `GET /users` con bÃºsqueda, estado, paginaciÃ³n y ordenamiento |
| `userApi.changeUserStatus` | `PATCH /users/:userId/status` |
| `userApi.deleteUser` | `DELETE /users/:userId` |

### Hogares, dispositivos y consumo

`/app/devices` consulta `GET /devices?homeId=...&page=...&pageSize=12&sort=...&order=...`. La pantalla muestra estados de carga, error con reintento y vacÃ­o; las acciones de registrar, editar umbral y desvincular solo se muestran con `devices.manage`. La autorizaciÃ³n de backend y RLS sigue siendo la barrera final.

La pantalla `/app/consumption` consulta directamente las lecturas persistidas del backend. Usa `summary` para el perÃ­odo de siete dÃ­as, `daily` para cada dÃ­a, `hourly` para el promedio por hora y deja `monthly`/`cost` disponibles para reportes. El frontend solo convierte litros a mÂ³ para presentaciÃ³n; los cÃ¡lculos de negocio permanecen en PostgreSQL.

| API frontend | Endpoints principales |
|---|---|
| `homesApi` | `/homes`, `/homes/:homeId`, miembros y solicitudes de membresÃ­a |
| `devicesApi` | `/devices`, estado, configuraciÃ³n, desactivaciÃ³n y desvinculaciÃ³n |
| `actuatorsApi` | estados, historial de comandos y `POST /actuators/:deviceId/:actuator/commands` |
| `consumptionApi` | `/consumption/summary`, `daily`, `hourly`, `monthly` y `cost` |
| `tariffApi` | `GET /tariffs/home/:homeId` |

### Alertas, metas y vacaciones

| API frontend | Endpoints principales |
|---|---|
| `alertsApi` | pendientes, historial, reglas, umbrales y actualizaciÃ³n de estado |
| `goalsApi` | listado, creaciÃ³n, actualizaciÃ³n, eliminaciÃ³n y `/goals/:goalId/progress` |
| `vacationApi` | `GET`, `PUT` y `DELETE /vacation/home/:homeId` |

### Recomendaciones

La pantalla presenta tarjetas informativas de referencia. No consume el dominio
dinámico de recomendaciones, no muestra métricas quemadas y no permite cambiar
estados ni registrar acciones. El dominio backend `/recommendations` queda
disponible para una futura decisión de producto.

### Soporte, roles y auditorÃ­a

| API frontend | Endpoints principales |
|---|---|
| `supportApi` | catÃ¡logo, tickets, detalle/historial, respuestas y gestiÃ³n de estado |
| `rolesApi` | `GET`, `POST` y `DELETE /roles/users/:userId` |
| `auditApi` | `GET /audit/logs` |

### Privacidad y ARCO

| API frontend | Endpoint |
|---|---|
| `privacyApi.exportData` | `GET /privacy/export` â€” descarga JSON propio sin hashes ni tokens |
| `privacyApi.consents` | `GET /privacy/consents` |
| `privacyApi.createRequest` | `POST /privacy/requests` |
| `privacyApi.requests` | `GET /privacy/requests` â€” solicitudes propias paginadas |
| `privacyApi.getRequest` | `GET /privacy/requests/:requestId` |
| `privacyApi.manageRequests` | `GET /privacy/requests/manage` â€” administraciÃ³n |
| `privacyApi.updateRequest` | `PATCH /privacy/requests/:requestId` â€” administraciÃ³n |

### Reportes

| API frontend | Endpoint |
|---|---|
| `reportsApi.downloadConsumptionPdf` | `GET /reports/consumption.pdf` â€” descarga y registra un PDF resumido del perÃ­odo y hogar seleccionado |
| `reportsApi.downloadConsumptionExcel` | `GET /reports/consumption.xlsx` â€” descarga y registra un Excel resumido del perÃ­odo y hogar seleccionado |
| `reportsApi.history` | `GET /reports/history?homeId={uuid}` â€” historial propio paginado |
| `reportsApi.downloadStored` | `GET /reports/{reportId}/download` â€” descarga un reporte propio guardado |

## Pantallas sin endpoint actualmente

El frontend no ofrece acciones ficticias para estas funciones:

- Tiempo real MQTT y automatizaciÃ³n de recomendaciones.
- Configurar tarifas desde la interfaz.
- Solicitar eliminaciÃ³n definitiva de cuenta; actualmente se puede registrar una solicitud ARCO de cancelaciÃ³n.
- Guardar permisos de privacidad analÃ­tica.
- Subir foto de perfil.
- Tiempo real MQTT y automatizaciÃ³n de recomendaciones.

Estas funciones se incorporarÃ¡n cuando exista un contrato API verificable.
