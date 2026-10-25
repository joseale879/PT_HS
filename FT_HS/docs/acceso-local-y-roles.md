# Acceso local y paneles por rol — Hidro Smart

Última revisión: 2026-09-14.

Este documento explica cómo iniciar el proyecto, entrar al frontend y acceder a
los paneles de `Administrator`, `Support`, `HomeUser` y `Guest`.

## 1. Iniciar el entorno

Ejecuta los comandos desde la raíz `PT_HS` con Docker Desktop iniciado:

```powershell
docker compose --env-file .env up -d --build
docker compose ps
```

Comprobaciones rápidas:

```powershell
Invoke-WebRequest http://localhost:5173/health
Invoke-WebRequest http://localhost:3000/health/ready
```

URLs locales:

| Servicio | URL |
| --- | --- |
| Frontend web | <http://localhost:5173> |
| Backend API | <http://localhost:3000> |
| Salud del frontend | <http://localhost:5173/health> |
| Salud del backend | <http://localhost:3000/health/ready> |
| Mailpit | <http://localhost:8025> |

## 2. Iniciar sesión

1. Abre <http://localhost:5173/login>.
2. Escribe el correo o usuario y la contraseña de una cuenta existente.
3. El frontend inicia sesión en `POST /api/v1/auth/login`.
4. Después consulta `GET /api/v1/users/me` para obtener el perfil, los roles y los permisos.
5. El menú se construye con esos permisos; el rol no se elige desde el frontend.

El navegador conserva el access token y el refresh token únicamente en el almacenamiento
de sesión de la aplicación. Para que un cambio de rol se refleje, cierra sesión y vuelve a
iniciar sesión.

## 3. Rutas por rol

| Rol | Cómo entrar | Pantallas disponibles |
| --- | --- | --- |
| `Administrator` | Iniciar sesión y abrir `/app/admin` | Panel administrativo, `/app/users` y `/app/audit` |
| `Support` | Iniciar sesión y abrir `/app/support/management` | Bandeja de tickets recibidos y actualización de estado |
| `HomeUser` | Iniciar sesión y abrir `/app` | Dashboard, hogares, dispositivos, consumo, reportes, recomendaciones, metas y configuración según permisos |
| `Guest` | Iniciar sesión y abrir `/app` | Dashboard y consultas autorizadas de solo lectura, incluidas recomendaciones |

Las rutas de Soporte y Notificaciones no aparecen para `HomeUser` ni `Guest`. Si esos
usuarios intentan abrir `/app/support` o `/app/alerts` manualmente, la vista muestra acceso
denegado. La autorización real también se verifica en el backend y en PostgreSQL/RLS.

## 4. Estado actual de la base local

Verificado el 2026-09-14:

```text
Administrator: 0
Support:       0
HomeUser:      5
Guest:         0
```

Por eso, con la base actual ningún usuario puede entrar todavía a los paneles de
Administrador o Support. Las pantallas sí están implementadas; falta asignar esos roles a
cuentas existentes.

## 5. Habilitar el primer Administrator

El primer administrador se asigna una sola vez mediante la función protegida de la base.
No edites directamente `user_account.user_role`.

Primero consulta el UUID de la cuenta que debe ser administrador:

```powershell
docker compose exec -T postgres psql -U hidro_smart_admin -d hidro_smart -c `
  "SELECT user_account_id, email FROM user_account.user_account WHERE deleted_at IS NULL ORDER BY created_at;"
```

Después reemplaza `<USER_ID>` por el UUID elegido:

```powershell
docker compose exec -T postgres psql -U hidro_smart_admin -d hidro_smart -c `
  "SELECT user_account.fn_bootstrap_first_administrator('<USER_ID>');"
```

Luego:

1. Abre <http://localhost:5173/login>.
2. Inicia sesión con esa cuenta.
3. Abre <http://localhost:5173/app/admin>.
4. Comprueba que también aparezcan `/app/users` y `/app/audit`.

La función rechaza el proceso si ya existe un `Administrator` activo.

## 6. Asignar el rol Support

Después de tener una sesión de administrador puedes abrir `/app/users`, localizar la cuenta
y usar los botones de `Roles funcionales` para agregar o retirar `Support`. Esa pantalla usa
el endpoint protegido de roles y actualiza la lista después de cada operación.

También puedes realizar la misma operación desde PowerShell si necesitas automatizar una
prueba. Identifica primero el UUID de la cuenta que será Support con la consulta anterior:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body (@{ login = "CORREO_DEL_ADMIN"; password = "CONTRASENA_DEL_ADMIN" } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/roles/users/<SUPPORT_USER_ID>" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{ roleName = "Support" } | ConvertTo-Json)
```

No guardes el correo, la contraseña ni el token en scripts versionados. Después de asignar
el rol, la cuenta Support debe cerrar sesión, volver a entrar y abrir:

```text
http://localhost:5173/app/support/management
```

## 7. Qué hacer si aparece acceso denegado

- Comprueba que la cuenta esté activa y no eliminada lógicamente.
- Cierra sesión y vuelve a iniciar sesión para renovar roles y permisos.
- Verifica que `GET /api/v1/users/me` devuelva `Administrator` o `Support` en `roles`.
- Confirma que el permiso requerido también esté presente:
  - Administrador: `roles.manage`, `users.manage` o `audit.read`.
  - Support: `tickets.manage`.
- Revisa que el backend responda en <http://localhost:3000/health/ready>.
- Si cambiaste el código del frontend con Docker activo, ejecuta nuevamente:

  ```powershell
  docker compose up -d --build frontend
  ```

## 8. Referencias

- [Rutas e integración API](./rutas-y-api-frontend.md)
- [Arquitectura del frontend](./arquitectura-frontend.md)
- [Pendientes del frontend](./pendientes-frontend.md)
- [Roles y permisos del backend](../../BK_HS/docs/00-roles-y-permisos.md)
- [Endpoints por rol](../../BK_HS/docs/endpoints-por-rol.md)
