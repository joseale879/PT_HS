# Documentacion de la base de datos - Hidro Smart

Fecha de revision: 2026-09-07.

Esta carpeta documenta el modelo PostgreSQL, las migraciones Liquibase, los
roles tecnicos, RLS y la integracion con el backend. La fuente de verdad del
esquema son los changesets SQL/YAML de `BD_HS`; esta documentacion no reemplaza
una migracion.

## Estado actual

- PostgreSQL 16 y Liquibase 5.0.2 estan definidos en `BD_HS/docker-compose.yml`.
- El changelog contiene 177 changesets aplicados en el ultimo estado verificado.
- El backend usa el rol tecnico `hidro_smart_app`.
- La ingesta IoT esta separada en `hidro_smart_ingest`.
- RLS y RBAC funcional estan implementados para los dominios protegidos.
- La persistencia del mensaje MQTT normalizado aun debe conectarse al caso de
  uso de ingesta y a `consumption.sensor_reading`.

## Schemas funcionales

| Schema | Responsabilidad |
|---|---|
| `user_account` | usuarios, perfiles, sesiones, credenciales, roles y politica de contrasena |
| `preference` | idiomas, monedas, temas y preferencias |
| `home` | hogares, miembros, solicitudes, vacaciones y metas |
| `device` | dispositivos, asociaciones, estados e historial de telemetria |
| `consumption` | lecturas, agregados diarios, horarios y mensuales |
| `alert_rate` | reglas, umbrales, eventos, notificaciones y tarifas |
| `analytics_support` | reportes, recomendaciones y tickets de soporte |
| `audit` | eventos de auditoria y errores |
| `privacy` | consentimientos y solicitudes de privacidad |

## Orden de migraciones

El changelog raiz incluye las capas en este orden:

1. `01_ddl`: extensiones, schemas, tipos, tablas, alteraciones, vistas,
   funciones, procedimientos, triggers e indices.
2. `02_dml`: catalogos, roles funcionales, permisos, politicas y datos base.
3. `03_dcl`: roles PostgreSQL, grants y politicas RLS.
4. `04_tcl`: bloques transaccionales, recuperaciones manuales y tags.

Los scripts de `05_rollbacks` son referencia de rollback y no se ejecutan como
parte del flujo normal de `update`.

## Roles y seguridad

- `hidro_smart_admin`: administracion local de PostgreSQL y Liquibase.
- `hidro_smart_liquibase`: ejecucion versionada de migraciones, cuando se usa
  el flujo separado.
- `hidro_smart_app`: operaciones normales del backend.
- `hidro_smart_ingest`: escritura minima para ingesta IoT.
- `hidro_smart_readonly`: consultas agregadas de reportes.

Los roles de negocio (`Administrator`, `Support`, `HomeUser`, `Guest`) viven en
`user_account.role`. El backend establece `app.user_id` dentro de la
transaccion y PostgreSQL aplica RLS como barrera final. Nunca se deben poner
credenciales reales en un changeset ni en la documentacion versionada.

## Ejecucion local

Desde `PT_HS`:

```powershell
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml up -d postgres
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml run --rm liquibase validate
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml run --rm liquibase status --verbose
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml run --rm liquibase update
```

Si se usa el Compose integrado del backend, deben respetarse los valores de
conexion interna (`postgres:5432`) y no los puertos publicados para Windows.
Revisar `guia-ejecucion-liquibase.md` antes de aplicar cambios.

## Integracion con el backend

El backend consulta la base mediante `hidro_smart_app`, invoca funciones de
negocio para operaciones sensibles y usa transacciones con contexto de usuario.
Las lecturas de consumo que llegan por API se consultan desde los agregados de
PostgreSQL. MQTT no es una ruta REST: su persistencia sigue pendiente de cerrar
con validacion de `device.code`, asociacion activa hogar-dispositivo,
idempotencia y precision suficiente para muestras pequenas.

## Documentos de referencia

- `01_dominios.md`: modelo funcional y reglas de negocio.
- `03_dcl.md`: roles, grants y RLS.
- `guia-ejecucion-liquibase.md`: ejecucion y verificacion.
- `diagnostico-actual.md`: estado comprobado y brechas conocidas.
- `configuracion-credenciales-liquibase.md`: variables locales sin secretos.
- `sql-layer-architecture.md`: arquitectura por capas SQL.
