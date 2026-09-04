# Frontend HidroSmart: pantallas, endpoints y roles

## 1. Alcance

Este documento describe el frontend que existe actualmente en:

`FT_HS/Web`

También define el contrato de integración con el backend de `BK_HS` para los tres perfiles funcionales del producto:

- **Usuario normal / miembro:** puede consultar la información del hogar al que pertenece.
- **Usuario titular / Owner:** es quien crea el hogar y administra sus recursos y miembros.
- **Usuario invitado / Guest:** solo visualiza información; no modifica datos.

> Importante: esta clasificación corresponde al rol dentro de un hogar. No debe confundirse con los roles globales del backend (`Administrator`, `Support`, `HomeUser`, `Guest`), que se utilizan para paneles y permisos del sistema.

## 2. Estado real de integración

### Resultado de la revisión

Actualmente el frontend tiene conectada la autenticación mediante un cliente HTTP centralizado. Las pantallas de negocio todavía no consumen la API.

Se agregaron `src/services/apiClient.ts` y `.env.example` con `VITE_API_URL`. El cliente centraliza `fetch`, `Authorization`, refresh token y errores comunes.

Las operaciones actuales son demostraciones locales:

- Estado en memoria mediante `useState`.
- Hogares, dispositivos, miembros, reportes, notificaciones y tickets definidos como datos locales.
- Login, registro, logout, refresh, solicitud de recuperación, confirmación de recuperación y cambio de contraseña ya tienen integración con el backend. Gmail queda pendiente únicamente como proveedor de envío del correo.
- Los tokens de autenticación llegan del backend y se guardan temporalmente en `sessionStorage`.
- Los cambios se pierden al recargar la página.
- Los mensajes de éxito no confirman una operación en PostgreSQL.

Por tanto, el estado de cada endpoint se marca así:

| Estado | Significado |
|---|---|
| `Backend listo` | Existe una ruta implementada y protegida en `BK_HS`. |
| `Frontend pendiente` | El frontend todavía debe consumir esa ruta. |
| `Frontend simulado` | La pantalla muestra o modifica datos locales. |
| `No aplica al rol` | El endpoint no debe exponerse a ese perfil. |

## 3. Pantallas actuales del frontend

La navegación se controla desde `src/app/components/DashboardLayout.tsx` y actualmente contempla estas vistas:

| Vista | Componente | Función |
|---|---|---|
| Inicio | `DashboardHome.tsx` | Resumen de consumo, dispositivos y alertas visuales. |
| Hogares | `HomeManagement.tsx` | Crear, editar, suspender, reactivar, eliminar hogares y gestionar miembros. |
| Dispositivos | `DeviceManagement.tsx` | Vincular dispositivos, cambiar umbral y desvincular/eliminar dispositivo. |
| Reportes | `ReportsAnalytics.tsx` | Consultas de consumo, tarifa y exportación visual de reportes. |
| Metas | `GoalsConfig.tsx` | Configurar meta de consumo y presupuesto. |
| Notificaciones | `NotificationsPanel.tsx` | Consultar y configurar notificaciones. |
| Soporte | `SupportTickets.tsx` | Consultar y crear tickets de soporte. |
| Configuración | `AccountSettings.tsx` | Perfil, contraseña, sesiones, preferencias y modo vacaciones. |
| Panel administrador | `AdminPanel.tsx`, `AuditLog.tsx` | Vista técnica existente en el prototipo. No corresponde al usuario del hogar. |
| Panel técnico | `TechnicianPanel.tsx` | Vista técnica existente en el prototipo. No corresponde al usuario del hogar. |

Las pantallas de administrador y técnico existen en el prototipo, pero no forman parte de los tres perfiles funcionales del frontend del hogar solicitados para esta etapa.

## 4. Endpoints de autenticación y sesión

Estos endpoints son comunes para los usuarios que pueden iniciar sesión.

| Acción del frontend | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Iniciar sesión | `POST /api/v1/auth/login` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Registrar usuario | `POST /api/v1/auth/register` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Renovar token | `POST /api/v1/auth/refresh` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Cerrar sesión | `POST /api/v1/auth/logout` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Cambiar contraseña | `POST /api/v1/auth/change-password` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Solicitar recuperación | `POST /api/v1/auth/request-password-reset` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Confirmar recuperación | `POST /api/v1/auth/reset-password` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Consultar perfil | `GET /api/v1/users/me` | Sí | Sí | Sí | Backend listo / Frontend pendiente |

El frontend no debe crear tokens con `Math.random()` en producción. Debe recibir el `accessToken` y `refreshToken` del backend, renovarlos y borrar la sesión al cerrar sesión.

## 5. Hogares y miembros

| Acción de pantalla | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Listar hogares del usuario | `GET /api/v1/homes` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Consultar hogar | `GET /api/v1/homes/:homeId` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Crear hogar | `POST /api/v1/homes` | No | Sí | No | Backend listo / Frontend simulado |
| Actualizar hogar | `PATCH /api/v1/homes/:homeId` | No | Sí | No | Backend listo / Frontend simulado |
| Actualizar datos del hogar | `PUT /api/v1/homes/:homeId` | No | Sí | No | Backend listo / Frontend simulado |
| Ver miembros | `GET /api/v1/homes/:homeId/members` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Invitar/agregar miembro | `POST /api/v1/homes/:homeId/members` | No | Sí | No | Backend listo / Frontend simulado |
| Cambiar rol del miembro | `PATCH /api/v1/homes/:homeId/members/:memberUserId/role` | No | Sí | No | Backend listo / Frontend simulado |
| Desvincular miembro | `DELETE /api/v1/homes/:homeId/members/:memberUserId` | No | Sí | No | Backend listo / Frontend simulado |
| Solicitar pertenencia | `POST /api/v1/homes/:homeId/membership-requests` | Sí | Sí | No | Backend listo / Frontend pendiente |
| Listar solicitudes | `GET /api/v1/homes/:homeId/membership-requests` | No | Sí | No | Backend listo / Frontend pendiente |
| Responder solicitud | `PATCH /api/v1/homes/membership-requests/:requestId` | No | Sí | No | Backend listo / Frontend pendiente |

El titular se identifica por su membresía `Owner`. El frontend no debe decidir este permiso únicamente con una variable local; debe obtenerlo del backend y el backend debe volver a validarlo con RLS/permisos.

## 6. Dispositivos

| Acción de pantalla | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Listar dispositivos | `GET /api/v1/devices?homeId=:homeId` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Consultar dispositivo | `GET /api/v1/devices/:deviceId` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Vincular dispositivo | `POST /api/v1/devices` | No | Sí | No | Backend listo / Frontend simulado |
| Actualizar dispositivo | `PUT /api/v1/devices/:deviceId` | No | Sí | No | Backend listo / Frontend pendiente |
| Actualizar configuración | `PUT /api/v1/devices/:deviceId/config` | No | Sí | No | Backend listo / Frontend simulado |
| Cambiar estado | `PATCH /api/v1/devices/:deviceId/status` | No | Sí | No | Backend listo / Frontend pendiente |
| Desactivar dispositivo | `POST /api/v1/devices/:deviceId/deactivate` | No | Sí | No | Backend listo / Frontend pendiente |
| Desvincular dispositivo | `DELETE /api/v1/devices/:deviceId/home/:homeId` | No | Sí | No | Backend listo / Frontend simulado |

El usuario normal y el invitado pueden consultar dispositivos asociados a hogares donde tienen acceso. Ninguno de los dos debe vincular, configurar, desactivar ni desvincular dispositivos.

## 7. Consumo, dashboard y reportes

| Uso en frontend | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Resumen del dashboard | `GET /api/v1/consumption/summary?homeId=:homeId` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Consumo diario | `GET /api/v1/consumption/daily?homeId=:homeId&from=:date&to=:date` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Consumo horario | `GET /api/v1/consumption/hourly?homeId=:homeId&date=:date` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Consumo mensual | `GET /api/v1/consumption/monthly?homeId=:homeId&from=:month&to=:month` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Costo estimado | `GET /api/v1/consumption/cost?homeId=:homeId&from=:date&to=:date` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Consultar tarifa | `GET /api/v1/tariffs/home/:homeId` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Actualizar tarifa | — | No | Sí | No | Backend pendiente; hoy solo existe consulta |

Las exportaciones PDF/Excel que aparecen en `ReportsAnalytics.tsx` son actualmente acciones visuales; deben conectarse a un endpoint de reportes o a la generación controlada en frontend cuando se defina el formato oficial.

## 8. Alertas y notificaciones

| Acción | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Consultar alertas pendientes | `GET /api/v1/alerts/home/:homeId/pending` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Consultar estado de alerta | `GET /api/v1/alerts/:alertId` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Actualizar estado de alerta | `PATCH /api/v1/alerts/:alertId/status` | No | Sí | No | Backend listo / Frontend pendiente |
| Consultar reglas | `GET /api/v1/alerts/home/:homeId/rules` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Crear regla | `POST /api/v1/alerts/home/:homeId/rules` | No | Sí | No | Backend listo / Frontend pendiente |
| Actualizar/eliminar regla | `PATCH/DELETE /api/v1/alerts/rules/:ruleId` | No | Sí | No | Backend listo / Frontend pendiente |
| Consultar umbral | `GET /api/v1/alerts/home/:homeId/thresholds` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Guardar/eliminar umbral | `PUT/DELETE /api/v1/alerts/home/:homeId/thresholds` | No | Sí | No | Backend listo / Frontend pendiente |

Las notificaciones que hoy se muestran en `NotificationsPanel.tsx` son datos locales. La generación automática de alertas pertenece al backend y el frontend solo debe consultarlas y presentar su estado.

## 9. Metas y modo vacaciones

| Acción | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Listar metas | `GET /api/v1/goals?homeId=:homeId` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Crear meta | `POST /api/v1/goals` | No | Sí | No | Backend listo / Frontend simulado |
| Actualizar meta | `PUT /api/v1/goals/:goalId` | No | Sí | No | Backend listo / Frontend simulado |
| Eliminar meta | `DELETE /api/v1/goals/:goalId` | No | Sí | No | Backend listo / Frontend pendiente |
| Consultar progreso | `GET /api/v1/goals/:goalId/progress` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Consultar modo vacaciones | `GET /api/v1/vacation/home/:homeId` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Activar modo vacaciones | `PUT /api/v1/vacation/home/:homeId` | No | Sí | No | Backend listo / Frontend simulado |
| Desactivar modo vacaciones | `DELETE /api/v1/vacation/home/:homeId` | No | Sí | No | Backend listo / Frontend simulado |

El componente `VacationMode.tsx` mantiene actualmente el estado en memoria. Para producción debe recibir el `homeId` seleccionado y sincronizar cada cambio con PostgreSQL mediante el backend.

## 10. Soporte

| Acción | Método y endpoint | Normal | Titular | Invitado | Estado |
|---|---|:---:|:---:|:---:|---|
| Consultar catálogos | `GET /api/v1/support/catalogs` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Listar mis tickets | `GET /api/v1/support/tickets` | Sí | Sí | Sí | Backend listo / Frontend simulado |
| Consultar ticket | `GET /api/v1/support/tickets/:ticketId` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Crear ticket | `POST /api/v1/support/tickets` | Sí | Sí | No | Backend listo / Frontend simulado |
| Consultar respuestas | `GET /api/v1/support/tickets/:ticketId/responses` | Sí | Sí | Sí | Backend listo / Frontend pendiente |
| Responder ticket | `POST /api/v1/support/tickets/:ticketId/responses` | No | No | No | Backend listo / Solo Support |

El endpoint de respuesta está reservado al rol global `Support`; el titular y el usuario normal crean y consultan sus propios tickets. El invitado solo debe consultar si se decide habilitar esa vista.

## 11. Matriz resumida por rol

| Módulo | Normal | Titular / Owner | Invitado / Guest |
|---|---|---|---|
| Inicio y consumo | Ver | Ver | Ver |
| Hogares | Ver hogares asociados | Crear y administrar sus hogares | Ver hogares invitados |
| Miembros | Ver | Invitar, cambiar rol y desvincular | Ver |
| Dispositivos | Ver | Vincular, configurar, desactivar y desvincular | Ver |
| Reportes | Ver | Ver; la administración de tarifa requiere endpoint backend | Ver |
| Alertas | Ver | Configurar umbrales y estados permitidos | Ver |
| Metas | Ver | Crear y administrar | Ver |
| Modo vacaciones | Ver | Activar y desactivar | Ver |
| Soporte | Crear y consultar propios | Crear y consultar propios | Consultar según autorización; no crear |
| Perfil y sesión | Administrar su cuenta | Administrar su cuenta | Administrar su cuenta |

## 12. Diferencias que deben corregirse antes de conectar el frontend

1. `App.tsx` actualmente recibe roles `admin`, `technician` y `user`; debe recibir el rol global y la membresía del hogar por separado.
2. `DashboardLayout.tsx` filtra el menú con esos roles globales, pero no contempla `Owner`, `Member` ni `Guest` como roles del hogar.
3. `HomeManagement.tsx`, `DeviceManagement.tsx` y `ReportsAnalytics.tsx` usan `CURRENT_USER_ID = 1` y membresías quemadas.
4. El rol local `admin` usado en los componentes debe reemplazarse por `Owner` cuando se refiera al titular del hogar. `Administrator` debe reservarse para el panel global de desarrolladores.
5. Los botones de crear, editar, eliminar, configurar y activar deben depender de permisos entregados por el backend, no solo de ocultarse en la interfaz.
6. Debe agregarse un cliente HTTP único, interceptor de autorización, manejo de `401`, refresh token, logout y estados de carga/error.
7. Debe agregarse selección de `homeId` desde la respuesta real de `/api/v1/homes` y propagarla a dashboard, consumo, dispositivos, alertas, metas, vacaciones y soporte.

## 13. Orden recomendado para conectar el frontend

1. Autenticación real: login, registro, refresh, logout y perfil.
2. Carga de hogares y membresías; resolver `Owner`, `Member` y `Guest`.
3. Dashboard y consumo diario, horario y mensual.
4. Dispositivos con permisos del titular.
5. Alertas y notificaciones.
6. Metas y modo vacaciones.
7. Tickets de soporte.
8. Cambio/recuperación de contraseña, sesiones y pruebas por rol.
9. Revisión visual final y actualización de documentación de contrato.

## 14. Conclusión

El frontend tiene una base visual amplia y las pantallas principales del producto, pero todavía funciona como prototipo desconectado de la base de datos. El backend ya dispone de las rutas necesarias para iniciar la integración. El siguiente trabajo técnico es sustituir los datos locales por llamadas al backend y aplicar la autorización real de `Member`, `Owner` y `Guest` en cada pantalla.
