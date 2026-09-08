# Endpoints accesibles por rol

Fecha de revisión: 2026-09-07.

La ruta exacta de cada método está en `03-endpoints.md`. Este documento resume el control de acceso real y no incluye endpoints de actuadores que todavía no están montados.

## Públicos

- `GET /`
- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`

## Cualquier usuario autenticado

- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `GET/PUT /api/v1/users/me`
- `GET/PUT /api/v1/users/me/preferences`
- `GET /api/v1/homes` y consultas de hogares autorizados.
- `GET /api/v1/devices` y consultas de dispositivos autorizados.
- Lecturas de consumo, tarifas, alertas, metas, vacaciones y soporte según autorización de datos/RLS.

## Permisos de escritura

| Permiso | Operaciones principales |
|---|---|
| `homes.manage` | crear/actualizar hogares, miembros, solicitudes, metas y vacaciones |
| `devices.manage` | registrar, configurar, actualizar estado, desactivar y desvincular dispositivos |
| gestión de alertas | crear/actualizar/eliminar reglas y umbrales, cambiar estados |
| `roles.manage` | listar, asignar y quitar roles globales |
| `audit.read` | consultar `GET /api/v1/audit/logs` |
| soporte/tickets | actualizar tickets y publicar respuestas |

La ruta también comprueba pertenencia al hogar, propiedad o autorización del recurso. Un permiso global por sí solo no permite acceder a datos de otro hogar.

## Roles globales

- `Administrator`: administración global, roles y auditoría; puede operar según los permisos asignados.
- `Support`: soporte y operaciones necesarias para atención; no debe recibir acceso de propietario de hogar por defecto.
- `HomeUser`: administra hogares y dispositivos que le corresponden.
- `Guest`: solo lectura autorizada.

## Soporte

Las rutas reales son `GET /support/catalogs`, `GET/POST /support/tickets`, `GET /support/tickets/:ticketId`, `GET/POST /support/tickets/:ticketId/responses` y `PATCH /support/tickets/:ticketId`, siempre con el prefijo `/api/v1` y sus guardas correspondientes. No están pendientes de creación; lo pendiente es terminar su consumo en las pantallas.

## Auditoría

`GET /api/v1/audit/logs` requiere `audit.read`. El backend consulta la función protegida de PostgreSQL; no entrega `SELECT` directo de `audit.audit_log` al cliente de aplicación.

## MQTT

MQTT no tiene permisos HTTP por rol. El backend mantiene la conexión técnica con Mosquitto. La futura orden de actuador deberá validar el permiso de negocio y auditarse antes de publicar.

Para el detalle completo, consulta `03-endpoints.md`, `00-estado-actual.md` y `14-mqtt-protocol.md`.
