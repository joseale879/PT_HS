# Estado general del proyecto Hidro Smart

## Estado actualizado

El flujo inicial de tickets ya está implementado: `HomeUser` crea, `Support` gestiona y `Guest` solo consulta. También están implementados prioridad, asignación, respuestas e historial protegido por RLS.

Estado operativo al 3 de septiembre de 2026: PostgreSQL/Liquibase y el backend están ejecutándose localmente y las rutas principales fueron validadas contra la BD real.

**Fecha de actualización:** 3 de septiembre de 2026  
**Estado:** Backend y base de datos integrados localmente; pruebas unitarias e integración básica ejecutadas correctamente.

Este documento resume qué se hizo, qué se cambió, qué está en progreso y qué falta por construir en `BK_HS` y `BD_HS`.

## Resumen actual

La solución está organizada como un monolito modular:

```text
Frontend
   |
   v
BK_HS - Node.js / Express
   |
   +-- Casos de uso y dominio
   +-- Repositorios PostgreSQL
   +-- JWT y autorización RBAC
   |
   v
BD_HS - PostgreSQL / Liquibase / RLS
```

El backend no accede directamente a la base de datos desde los controladores. Las operaciones pasan por DTOs, casos de uso, puertos de repositorio y adaptadores PostgreSQL.

## Backend: implementado

### Base de la aplicación

- Configuración por variables de entorno.
- Express con `helmet`, CORS y manejo centralizado de errores.
- Pool de PostgreSQL.
- Transacciones con `app.user_id` para que las políticas RLS identifiquen al usuario autenticado.
- Rutas `/`, `/health` y `/api/v1`.
- Dockerfile, `docker-compose.yml`, ejemplos de ambiente y script de inicio local.

### Autenticación

- Registro de usuario.
- Inicio de sesión.
- Hash de contraseñas con bcrypt.
- JWT para autenticación de las rutas.
- Registro y reinicio de intentos fallidos mediante repositorio.
- DTOs de entrada y salida.

### Hogares

- Crear hogar.
- Actualizar un hogar propio.
- Listar hogares del usuario autenticado.
- Consultar un hogar específico.
- Consultar miembros de un hogar.
- Agregar un miembro por correo.
- Cambiar el rol de un miembro.
- Retirar un miembro.
- Solicitar ingreso a un hogar.
- Consultar solicitudes de ingreso.
- Aprobar o rechazar solicitudes.

### Dispositivos y consumo

- Registrar dispositivos y asociarlos a un hogar en la misma transacción.
- Listar dispositivos asociados a los hogares del usuario.
- Consultar y actualizar dispositivos, incluyendo configuración de calibración.
- Consultar y cambiar el estado del dispositivo con auditoría en `device.device_history`.
- Desvincular un dispositivo de un hogar sin eliminar sus históricos.
- Consultar resumen de consumo por hogar y rango de fechas.
- Consultar consumo diario, horario y mensual por hogar.
- Calcular costo total de un periodo con la tarifa vigente.
- Consultar tarifa vigente por hogar y fecha.
- Crear, actualizar, eliminar y consultar progreso de metas de ahorro.
- Configurar, consultar y eliminar el modo vacaciones por hogar.
- Crear, listar, actualizar y eliminar reglas de alerta.
- Crear, consultar y eliminar umbrales diarios y mensuales.
- Consultar alertas pendientes y actualizar su estado.
- Validación de fechas, UUIDs y datos de entrada.

## Rutas disponibles

| Método | Ruta | Propósito |
| --- | --- | --- |
| GET | `/` | Información básica del servicio |
| GET | `/health` | Estado del servicio y conexión |
| POST | `/api/v1/auth/register` | Registrar usuario |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET | `/api/v1/users/me` | Consultar perfil autenticado |
| PUT | `/api/v1/users/me` | Actualizar perfil autenticado |
| POST | `/api/v1/homes` | Crear hogar |
| GET | `/api/v1/homes` | Listar hogares |
| GET | `/api/v1/homes/:homeId` | Consultar hogar |
| PUT | `/api/v1/homes/:homeId` | Actualizar hogar |
| GET | `/api/v1/homes/:homeId/members` | Listar miembros |
| POST | `/api/v1/homes/:homeId/members` | Agregar miembro |
| PATCH | `/api/v1/homes/:homeId/members/:memberUserId/role` | Cambiar rol |
| DELETE | `/api/v1/homes/:homeId/members/:memberUserId` | Retirar miembro |
| POST | `/api/v1/homes/:homeId/membership-requests` | Solicitar ingreso |
| GET | `/api/v1/homes/:homeId/membership-requests` | Consultar solicitudes |
| PATCH | `/api/v1/homes/membership-requests/:requestId` | Aprobar o rechazar solicitud |
| POST | `/api/v1/devices` | Registrar dispositivo |
| GET | `/api/v1/devices` | Listar dispositivos |
| GET | `/api/v1/devices/:deviceId` | Consultar dispositivo |
| PUT | `/api/v1/devices/:deviceId` | Actualizar dispositivo |
| GET | `/api/v1/devices/:deviceId/status` | Consultar estado |
| PATCH | `/api/v1/devices/:deviceId/status` | Cambiar estado |
| PUT | `/api/v1/devices/:deviceId/config` | Configurar dispositivo |
| POST | `/api/v1/devices/:deviceId/deactivate` | Desactivar dispositivo |
| DELETE | `/api/v1/devices/:deviceId/home/:homeId` | Desvincular dispositivo |
| GET | `/api/v1/consumption/summary` | Consultar resumen de consumo |
| GET | `/api/v1/consumption/daily` | Consultar consumo diario |
| GET | `/api/v1/consumption/hourly` | Consultar consumo horario |
| GET | `/api/v1/consumption/monthly` | Consultar consumo mensual |
| GET | `/api/v1/consumption/cost` | Calcular costo de un periodo |
| GET | `/api/v1/tariffs/home/:homeId` | Consultar tarifa vigente |
| GET | `/api/v1/alerts/home/:homeId/pending` | Consultar alertas pendientes |
| PATCH | `/api/v1/alerts/:alertId/status` | Marcar alerta como leída o descartada |
| POST | `/api/v1/alerts/home/:homeId/rules` | Crear regla de alerta |
| GET | `/api/v1/alerts/home/:homeId/rules` | Listar reglas de alerta |
| PATCH | `/api/v1/alerts/rules/:ruleId` | Actualizar regla de alerta |
| DELETE | `/api/v1/alerts/rules/:ruleId` | Eliminar regla de alerta |
| GET | `/api/v1/alerts/home/:homeId/thresholds` | Consultar umbrales |
| PUT | `/api/v1/alerts/home/:homeId/thresholds` | Guardar umbrales |
| DELETE | `/api/v1/alerts/home/:homeId/thresholds` | Eliminar umbrales |
| POST | `/api/v1/goals` | Crear meta de ahorro |
| GET | `/api/v1/goals` | Listar metas de ahorro |
| GET | `/api/v1/goals/:goalId/progress` | Consultar progreso de meta |
| PUT | `/api/v1/goals/:goalId` | Actualizar meta |
| DELETE | `/api/v1/goals/:goalId` | Eliminar meta |
| GET | `/api/v1/vacation/home/:homeId` | Consultar modo vacaciones |
| PUT | `/api/v1/vacation/home/:homeId` | Configurar modo vacaciones |
| DELETE | `/api/v1/vacation/home/:homeId` | Desactivar modo vacaciones |

## Base de datos: implementado o preparado

### Seguridad y autorización

- Roles técnicos de PostgreSQL: aplicación, ingestión y solo lectura.
- Roles funcionales: `Administrator`, `Support`, `HomeUser` y `Guest`.
- Roles dentro del hogar: `Owner`, `Member` y `Guest`.
- Permisos RBAC, entre ellos `homes.manage`, `devices.manage` y `consumption.read`.
- Funciones de seguridad para identificar al usuario actual.
- Políticas RLS para hogares, miembros, dispositivos, lecturas y consumo.
- Funciones `SECURITY DEFINER` para operaciones controladas de negocio.

### Nuevas funciones de hogares y miembros

- `home.fn_add_home_member`.
- `home.fn_change_home_member_role`.
- `home.fn_remove_home_member`.
- `home.fn_request_home_membership`.
- `home.fn_answer_home_membership_request`.
- Grants para `hidro_smart_app`.
- Rollbacks de Liquibase.
- Changelog actualizado con los nuevos changesets.

La base de datos continúa siendo la última barrera de seguridad. Aunque el backend valida permisos antes de ejecutar una operación, las funciones y políticas RLS vuelven a validar propietario, membresía y permisos.

## Patrones y buenas prácticas aplicados

- Arquitectura por capas y módulos.
- Separación entre dominio, aplicación, infraestructura y API.
- Programación orientada a objetos en entidades, casos de uso, repositorios y servicios.
- Patrón Repository mediante puertos y adaptadores.
- DTOs de entrada y DTOs de salida.
- Inyección de dependencias en controladores y casos de uso.
- Validaciones en el caso de uso, no en el repositorio.
- SQL parametrizado.
- Transacciones para operaciones que modifican datos.
- Manejo centralizado de errores HTTP.
- RLS y RBAC como defensa en profundidad.
- No se exponen directamente entidades internas en las respuestas HTTP.

## Trabajo en progreso

### Validación de compatibilidad BD-backend

Ya se verificó en la base local:

- Los nombres de funciones y columnas usados por las rutas.
- Los grants de las funciones nuevas.
- Que `HomeUser` tenga `devices.manage` y `alerts.manage`.
- Que RLS limite hogares, miembros y dispositivos al usuario contextual.

La validación específica de `Administrator`, `Support` y `Guest` queda pendiente hasta disponer de usuarios locales con esos roles.

## Pendiente por hacer

### Prioridad alta

1. Completar detección avanzada de alertas con lecturas reales.
2. Implementar notificaciones de alertas.
3. Definir MQTT y telemetría real.

### Prioridad media

1. Eliminar o desactivar la cuenta desde un endpoint protegido.
2. Probar los endpoints de roles con una cuenta local `Administrator` funcional.
3. Administrar permisos y asignaciones de roles.
4. Configurar metas de ahorro y modo vacaciones.
5. Completar generación de alertas por fugas y desconexiones.
6. Crear reportes y generación de archivos.
7. Implementar paginación, filtros y respuestas de error más uniformes.

### Prioridad posterior

1. Integración MQTT/TLS con ESP32.
2. Parser y validación de telemetría.
3. Event Bus para lecturas y alertas.
4. Notificaciones push, correo y SMS.
5. Jobs asíncronos con Redis/Bull.
6. Generación de PDF/Excel y almacenamiento en S3.
7. Observabilidad, auditoría completa y métricas.

## Pruebas actuales

Hay pruebas unitarias para:

- Entidades `Home` y `Device`.
- Casos de uso de hogares.
- Resumen de consumo.
- Autorización por permisos.
- Agregar miembros.
- Cambiar roles.
- Retirar miembros.
- Solicitudes de ingreso.

Las pruebas unitarias del backend pasan correctamente: 75 pruebas en verde. La integración local valida salud HTTP, conexión con PostgreSQL como `hidro_smart_app`, rechazo de rutas protegidas sin Bearer y RLS de `HomeUser`.

## Estado por componente

| Componente | Estado |
| --- | --- |
| Arquitectura backend | Implementada |
| Configuración local | Preparada |
| Autenticación básica | Implementada |
| JWT persistido y refresh | Implementado |
| Hogares | Implementado |
| Miembros y roles del hogar | Implementado |
| Solicitudes de ingreso | Implementado; validación avanzada por rol pendiente |
| Dispositivos | Implementado y validado contra PostgreSQL local |
| Consumo | Implementado y validado en sus endpoints disponibles |
| RBAC del backend | Implementado; gestión de roles funcionales protegida por `roles.manage` |
| Auditoría administrativa | Implementada mediante `GET /api/v1/audit/logs`, permiso `audit.read` y función PostgreSQL controlada |
| RLS de PostgreSQL | Implementado y validado para `HomeUser` |
| MQTT y telemetría | Pendiente |
| Alertas y notificaciones | Reglas, umbrales y generación automática de eventos implementados; canales de notificación pendientes |
| Metas y vacaciones | CRUD, progreso y configuración implementados; recomendaciones e integración física pendientes |
| Reportes y trabajos asíncronos | Pendiente |
| Pruebas de integración | Implementadas para conexión, rutas protegidas y RLS de `HomeUser` |

## Actualización 2026-09-03

La consulta administrativa de auditoría ya está implementada. `Administrator` puede consultar los registros con filtros por acción, tabla y rango de fechas, además de paginación. `Support`, `HomeUser` y `Guest` no tienen `audit.read` y son rechazados.

La función `user_account.fn_list_audit_logs(...)` está definida como `SECURITY DEFINER`. `hidro_smart_app` tiene únicamente `EXECUTE` sobre esa función y no tiene `SELECT` directo sobre `audit.audit_log`.

## Próximo paso recomendado

El siguiente paso técnico es conectar lecturas reales mediante MQTT y completar las detecciones avanzadas y notificaciones de alertas.

Docker, PostgreSQL y el backend ya fueron levantados y validados en el entorno local.
