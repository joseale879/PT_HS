# Configuración de credenciales para Hidro Smart y Liquibase

## Usuarios y responsabilidades

| Usuario | Uso | Privilegios |
|---|---|---|
| `hidro_smart_admin` | Administración y provisioning inicial | Administrador de PostgreSQL |
| `hidro_smart_liquibase` | Migraciones | `CREATEROLE`, `CREATE` controlado y permisos de migración |
| `hidro_smart_app` | Backend | Grants explícitos, funciones y RLS |
| `hidro_smart_ingest` | Ingesta IoT | Inserción de lecturas y validación protegida |
| `hidro_smart_readonly` | Reportes | Lectura restringida |

El backend no debe conectarse como administrador ni como usuario de Liquibase.

## Archivos de entorno

- `.env.example`: plantilla sin secretos.
- `.env`: valores locales reales; no se versiona.
- `.env.shared`: solo valores compartidos no sensibles.
- `liquibase.properties.example`: plantilla de referencia.

Si no existe `.env`:

```powershell
Set-Location '<ruta-a-tu-proyecto>\PT_HS'
Copy-Item .env.example .env
notepad .env
```

Variables mínimas:

```dotenv
POSTGRES_DB=hidro_smart
POSTGRES_USER=hidro_smart_admin
POSTGRES_PASSWORD=CAMBIA_ESTA_CONTRASENA_ADMIN
POSTGRES_PORT=5433

LIQUIBASE_USER=hidro_smart_liquibase
LIQUIBASE_PASSWORD=CAMBIA_ESTA_CONTRASENA_LIQUIBASE

POSTGRES_INTERNAL_HOST=postgres
POSTGRES_INTERNAL_PORT=5432
POSTGRES_LOCAL_HOST=localhost
POSTGRES_LOCAL_PORT=5433
```

Las contraseñas de administrador y Liquibase deben ser diferentes. No guardes valores reales en este documento.

## Provisionamiento en una base limpia

Levanta PostgreSQL:

```powershell
docker compose --env-file .env -p hidro_smart up -d postgres
docker compose --env-file .env -p hidro_smart ps
```

Permite scripts para la sesión actual:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

Provisiona el rol de Liquibase con los valores locales de `.env`:

```powershell
.\scripts\provision-liquibase-role.ps1 `
  -AdminUser 'hidro_smart_admin' `
  -AdminPassword '<POSTGRES_PASSWORD_DE_TU_ENV>' `
  -LiquibaseUser 'hidro_smart_liquibase' `
  -LiquibasePassword '<LIQUIBASE_PASSWORD_DE_TU_ENV>' `
  -Database 'hidro_smart'
```

El script es idempotente: crea el rol si no existe o actualiza su contraseña si ya existe. También concede `USAGE, CREATE` sobre `public`, requerido por las tablas de control de Liquibase.

## Ejecución de Liquibase

```powershell
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase validate
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase update-sql
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase update
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase status --verbose
```

Estado verificado el 2026-09-03: `validate` y `update` fueron exitosos y `status` indicó que no había cambios pendientes.

## Actualización 2026-09-03

Después de la verificación anterior se aplicaron los changesets de auditoría administrativa. Ejecutar nuevamente `validate`, `status` y `update` después de recuperar una base local o cambiar de volumen. El backend continúa usando únicamente `hidro_smart_app`; la consulta de auditoría se realiza mediante una función autorizada y no mediante acceso directo a la tabla.

## Verificación de roles

```powershell
docker compose --env-file .env -p hidro_smart exec -T postgres psql `
  -U hidro_smart_admin `
  -d hidro_smart `
  -c "SELECT rolname, rolcanlogin, rolsuper, rolcreaterole FROM pg_roles WHERE rolname IN ('hidro_smart_admin','hidro_smart_liquibase','hidro_smart_app','hidro_smart_readonly','hidro_smart_ingest') ORDER BY rolname;"
```

## Conexión del backend

Desde Windows:

```dotenv
DB_HOST=localhost
DB_PORT=5433
DB_NAME=hidro_smart
DB_USER=hidro_smart_app
DB_PASSWORD=SECRET_DEL_BACKEND
```

Desde un contenedor del mismo Compose:

```dotenv
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hidro_smart
DB_USER=hidro_smart_app
DB_PASSWORD=SECRET_DEL_BACKEND
```

La contraseña de `hidro_smart_app` se configura dentro de PostgreSQL y no debe escribirse en los changelogs.

## Errores frecuentes

### `password authentication failed for hidro_smart_liquibase`

La contraseña de `.env` no coincide con la contraseña del rol. Repite el provisionamiento y usa el mismo valor en `LIQUIBASE_PASSWORD`.

### `role hidro_smart_admin does not exist`

El volumen fue inicializado con otro administrador. Cambiar `POSTGRES_USER` no crea un usuario nuevo en un volumen existente.

### `la ejecución de scripts está deshabilitada`

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

## Reglas de seguridad

- No subas `.env` al repositorio.
- No compartas contraseñas en chats, capturas o commits.
- No reutilices la contraseña del administrador para el backend.
- No uses `down -v` en una base que quieras conservar.
- Rota las contraseñas temporales antes de producción.
- Ejecuta `04_tcl` solo como operación manual revisada.
