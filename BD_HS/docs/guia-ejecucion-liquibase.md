# Guía de ejecución de Hidro Smart

Esta guía explica cómo levantar PostgreSQL, provisionar el usuario de migraciones y ejecutar Liquibase desde PowerShell. Ejecuta todos los comandos desde la carpeta que contiene `docker-compose.yml` y `changelog-master.yaml`.

## Estado operativo verificado

Última verificación: 2026-09-03.

- PostgreSQL 16 está levantado como `hidro_smart-postgres-1` y en estado `healthy`.
- El puerto local es `5433` y el puerto interno de Docker es `5432`.
- Liquibase 5.0.2 ejecutó correctamente `validate` y `update`.
- Hay 166 changesets aplicados.
- `liquibase status` confirma que la base está `up to date`.
- Los roles `hidro_smart_admin`, `hidro_smart_liquibase`, `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly` existen.
- La política segura de ingesta IoT valida la pareja dispositivo-hogar mediante una función `SECURITY DEFINER`, sin `SELECT` global para `hidro_smart_ingest`.

El `docker-compose.yml` de la raíz levanta PostgreSQL, backend y frontend; Liquibase permanece como servicio de tooling bajo el perfil `tooling`.

## 1. Preparar el entorno

```powershell
Set-Location '<ruta-a-tu-proyecto>\PT_HS'

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

notepad .env
```

Configura localmente `POSTGRES_PASSWORD` y `LIQUIBASE_PASSWORD`. No guardes contraseñas reales en `.env.example`, `.env.shared`, `liquibase.properties.example` ni en el repositorio.

Docker Compose carga `.env` automáticamente desde la raíz, pero se recomienda hacerlo explícito:

```powershell
docker compose --env-file .env -p hidro_smart config --quiet
```

## 2. Levantar PostgreSQL

```powershell
docker compose --env-file .env -p hidro_smart up -d postgres
docker compose --env-file .env -p hidro_smart ps
```

Continúa solo cuando PostgreSQL aparezca como `healthy`.

## 3. Provisionar Liquibase

En una base nueva, `hidro_smart_liquibase` debe existir antes de ejecutar Liquibase. Permite el script solo para la ventana actual de PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

Ejecuta el provisionador usando los valores reales de `.env`, sin publicarlos:

```powershell
.\scripts\provision-liquibase-role.ps1 `
  -AdminUser 'hidro_smart_admin' `
  -AdminPassword '<POSTGRES_PASSWORD_DE_TU_ENV>' `
  -LiquibaseUser 'hidro_smart_liquibase' `
  -LiquibasePassword '<LIQUIBASE_PASSWORD_DE_TU_ENV>' `
  -Database 'hidro_smart'
```

El script crea o actualiza el rol de Liquibase, le concede `CREATEROLE`, `CREATE` sobre la base y `USAGE, CREATE` sobre `public`, que necesita para crear `databasechangelog`.

## 4. Validar y ejecutar Liquibase

```powershell
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase validate
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase update-sql
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase update
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase status --verbose
```

`update-sql` solo genera el SQL. `update` aplica los changesets. El resultado esperado de `status` es:

```text
is up to date
```

## 5. Verificar PostgreSQL

```powershell
docker compose --env-file .env -p hidro_smart exec -T postgres psql `
  -U hidro_smart_admin `
  -d hidro_smart `
  -c "SELECT current_database(), current_user; SELECT COUNT(*) AS changesets FROM public.databasechangelog;"
```

Para entrar manualmente al contenedor:

```powershell
docker compose --env-file .env -p hidro_smart exec -it postgres psql `
  -U hidro_smart_admin `
  -d hidro_smart
```

## 6. Usuarios de conexión

- `hidro_smart_admin`: administración y provisioning; no debe usarlo el backend.
- `hidro_smart_liquibase`: migraciones Liquibase.
- `hidro_smart_app`: conexión del backend, con grants por tabla, funciones y RLS.
- `hidro_smart_ingest`: servicio IoT, limitado a insertar lecturas válidas.
- `hidro_smart_readonly`: reportes restringidos; no recibe acceso directo a MVs multi-hogar.

El backend local utiliza `localhost:5433`; un backend dentro de Compose utiliza `postgres:5432`.

## Verificación de auditoría administrativa

La auditoría se consulta desde el backend con `GET /api/v1/audit/logs`. Liquibase debe tener aplicados los changesets `20260903-fn-list-audit-logs` y `20260903-audit-read-function-grant`.

La función exige el permiso funcional `audit.read`, que actualmente solo posee `Administrator`. El rol `hidro_smart_app` ejecuta la función, pero no recibe lectura directa sobre `audit.audit_log`.

## 7. RLS y contexto de usuario

Cada petición autenticada debe ejecutar `app.user_id` dentro de la misma transacción que consulta o modifica datos:

```sql
SELECT set_config('app.user_id', '<UUID_DEL_USUARIO>', true);
```

El tercer parámetro `true` hace que el contexto sea local a la transacción. No uses el `user_id` enviado por el cliente; debe provenir de un JWT validado por el backend.

## 8. Ingesta IoT

El servicio IoT se conecta como `hidro_smart_ingest`. La política actual valida mediante `device.fn_can_ingest_reading(device_id, home_id)` que:

- el dispositivo exista;
- esté activo;
- esté asignado al hogar indicado;
- el vínculo del hogar esté activo.

No ejecutes manualmente los SQL de `Downloads`; la versión activa está integrada en los changelogs de `01_ddl` y `03_dcl`.

## 9. Rollback

Vista previa del rollback del último changeset:

```powershell
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase rollback-count-sql --count=1
```

Rollback controlado:

```powershell
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase rollback-count --count=1
docker compose --env-file .env -p hidro_smart --profile tooling run --rm liquibase update
```

No uses `down -v` sobre una base que quieras conservar. Ese comando elimina el volumen y sus datos.

## 10. Problemas frecuentes

### `la ejecución de scripts está deshabilitada`

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

### `password authentication failed for hidro_smart_liquibase`

La contraseña de `.env` no coincide con la registrada en PostgreSQL. Ejecuta nuevamente el provisionador con la contraseña correcta del administrador y configura el mismo valor en `LIQUIBASE_PASSWORD`.

### `role ... does not exist`

En un volumen existente, `POSTGRES_USER` solo tuvo efecto durante la primera inicialización. Usa las credenciales originales del volumen para provisionar los roles.

### El contenedor no aparece como `healthy`

```powershell
docker compose --env-file .env -p hidro_smart logs --tail=100 postgres
```

## 11. TCL manual

`04_tcl` no forma parte del `update` normal. Sus operaciones deben ejecutarse únicamente como acciones manuales revisadas y con el contexto documentado.
