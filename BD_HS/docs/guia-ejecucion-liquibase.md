# Guía de ejecución de HidroSmart

Fecha de revisión: 2026-09-07.

Esta guía usa el `docker-compose.yml` de la raíz del repositorio. La base de datos se ejecuta en PostgreSQL y los cambios se administran con Liquibase mediante el servicio `tooling`.

## Estado verificado

- PostgreSQL 16 está saludable.
- Puerto externo: `5433`; puerto interno Docker: `5432`.
- Liquibase 5.0.2 está configurado en el servicio `tooling`; la última ejecución de `validate`, `update` y `status` fue exitosa.
- Hay 177 changesets aplicados y `status --verbose` reporta `up to date` en el último estado verificado.
- Existen los roles `hidro_smart_admin`, `hidro_smart_liquibase`, `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly`.
- El backend utiliza `hidro_smart_app`; el servicio Liquibase utiliza el administrador de PostgreSQL definido por `POSTGRES_USER` y `POSTGRES_PASSWORD`.

## Variables y roles

El archivo `.env` de la raíz controla el Compose integrado:

| Variable | Uso |
|---|---|
| `POSTGRES_DB` | base de datos, por defecto `hidro_smart` |
| `POSTGRES_USER` | administrador local de PostgreSQL |
| `POSTGRES_PASSWORD` | contraseña del administrador |
| `DB_USER` | usuario de aplicación, por defecto `hidro_smart_app` |
| `DB_PASSWORD` | contraseña del backend y del rol de aplicación |

`db-bootstrap` crea o actualiza la contraseña de `hidro_smart_app`. No se necesita `LIQUIBASE_PASSWORD` para el Compose actual: el servicio `liquibase` recibe `POSTGRES_USER` y `POSTGRES_PASSWORD` directamente.

No publiques `.env`, contraseñas ni archivos de configuración local.

## Inicio integrado

Desde `PT_HS`:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d postgres db-bootstrap
```

Continúa cuando PostgreSQL aparezca como `healthy` y `db-bootstrap` finalice correctamente.

## Validar y aplicar cambios

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env --profile tooling run --rm liquibase update-sql
docker compose --env-file .env --profile tooling run --rm liquibase update
```

`update-sql` solo genera el SQL. `update` aplica los changesets. Antes de un cambio delicado se debe revisar el SQL y definir el rollback.

## Reglas de cambios

- No modificar changesets ya aplicados.
- Crear un nuevo changeset para cada cambio posterior.
- Mantener los rollbacks bajo `05_rollbacks/`.
- Usar rutas `/` en los changelogs, no rutas Windows con `\`.
- Validar con `validate` y `update-sql` antes de aplicar.
- Revisar grants y políticas RLS cuando se agregue una operación de backend.

## Reinicio limpio de desarrollo

Este comando elimina los datos locales del volumen de PostgreSQL. Úsalo solo si se desea reconstruir la base:

```powershell
docker compose down --volumes --remove-orphans
docker compose --env-file .env up -d postgres db-bootstrap
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase update
```

## Relación con MQTT

Las tablas `device.device`, `device.home_device`, `consumption.sensor_reading` y `device.device_telemetry_history` ya existen para soportar IoT. La persistencia del subscriber MQTT todavía no está conectada.

Antes de activar esa persistencia se debe crear una migración para:

1. revisar la precisión de `consumption.sensor_reading.consumption_liters`, hoy `NUMERIC(10,2)`;
2. ajustar la columna generada `consumption_m3` y las funciones/vistas dependientes;

### Verificación de entorno

En la revisión del 2026-09-06 los dos archivos Compose pasaron `config --quiet`. PostgreSQL quedó saludable, Liquibase aplicó los cambios pendientes y el healthcheck del backend respondió HTTP 200.
3. versionar los grants mínimos de ingestión;
4. agregar pruebas de inserción, RLS e idempotencia.

El diagnóstico de la base está en `diagnostico-actual.md` y el flujo MQTT en `../../BK_HS/docs/14-mqtt-protocol.md`.
