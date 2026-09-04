# Roles y permisos

El backend utiliza los roles funcionales definidos en PostgreSQL. La autorización se consulta mediante `user_account.fn_app_has_permission`, usando el usuario autenticado en `app.user_id`.

## Tres niveles diferentes

1. `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly` son roles técnicos de PostgreSQL.
2. `Administrator`, `Support`, `HomeUser` y `Guest` son roles funcionales del sistema.
3. `Owner`, `Member` y `Guest` son roles de un usuario dentro de un hogar.

No se deben mezclar. Un usuario puede ser `HomeUser` globalmente y `Member` en un hogar concreto.

## Permisos iniciales

| Operación | Permiso |
| --- | --- |
| Crear hogar | `homes.manage` |
| Registrar dispositivo | `devices.manage` |
| Consultar consumo | `consumption.read` |

La base de datos continúa siendo la última barrera: sus funciones y políticas RLS también validan permisos y pertenencia al hogar. El middleware evita que la petición llegue innecesariamente al caso de uso cuando el permiso global ya fue denegado.

## Implementación actual

Las rutas protegidas consultan el permiso con un adaptador de infraestructura. Así, los casos de uso no conocen Express, JWT ni PostgreSQL y se mantiene la separación por capas.
## Administración de roles funcionales

Las rutas administrativas están protegidas por `roles.manage`:

- `GET /api/v1/roles/users/:userId`
- `POST /api/v1/roles/users/:userId`
- `DELETE /api/v1/roles/users/:userId`

La asignación y revocación pasan por casos de uso, repositorio PostgreSQL y funciones controladas de PostgreSQL. No se otorga escritura directa sobre `user_account.user_role` al backend.
