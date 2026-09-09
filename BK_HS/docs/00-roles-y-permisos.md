# Roles y permisos

Fecha de revisión: 2026-09-07.

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

## Flujo operativo para Administrator y Support

El registro público asigna únicamente `HomeUser`. Para convertir una cuenta existente en personal de la plataforma, un usuario autenticado que ya tenga `roles.manage` debe usar las rutas administrativas:

```http
POST /api/v1/roles/users/:userId
Content-Type: application/json

{ "roleName": "Support" }
```

o:

```http
POST /api/v1/roles/users/:userId
Content-Type: application/json

{ "roleName": "Administrator" }
```

Para revocar un rol se usa:

```http
DELETE /api/v1/roles/users/:userId?roleName=HomeUser
```

Las asignaciones son acumulativas: añadir `Support` no elimina automáticamente `HomeUser`. Si la cuenta debe ser exclusivamente de soporte, primero se asigna `Support`, se comprueba el acceso y después se revoca `HomeUser`. Nunca se debe editar `user_account.user_role` directamente ni crear un rol técnico PostgreSQL para una persona.

Después del cambio, el usuario debe renovar la sesión o volver a iniciar sesión. El frontend llama a `GET /api/v1/users/me`, recibe `roles` y `permissions` calculados por `user_account.fn_get_my_authorization_context()` y actualiza sus menús. La base de datos mantiene RLS como control definitivo incluso si alguien intenta invocar una URL manualmente.

## Permisos funcionales actuales

| Rol funcional | Permisos activos |
| --- | --- |
| `Administrator` | `users.manage`, `roles.manage`, `homes.manage`, `devices.manage`, `consumption.read`, `reports.read`, `alerts.manage`, `tickets.manage`, `audit.read`, `mfa.manage`, `credentials.manage` |
| `Support` | `devices.manage`, `consumption.read`, `alerts.manage`, `tickets.manage` |
| `HomeUser` | `homes.manage`, `devices.manage`, `consumption.read`, `reports.read`, `alerts.manage` |
| `Guest` | `consumption.read`, `reports.read` |

`mfa.manage` y las estructuras MFA que permanecen en la base son legado de
seguridad. Actualmente no hay rutas MFA montadas en `src/app.js` ni flujo MFA
activo en el frontend; el flujo vigente de recuperación usa correo SMTP.
