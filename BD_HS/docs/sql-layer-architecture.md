# Arquitectura de la capa SQL

El despliegue parte de `changelog-master.yaml`:

1. `01_ddl`: extensiones, schemas, tablas, alteraciones, vistas materializadas, funciones, procedimientos, triggers e índices.
2. `02_dml`: catálogos y correcciones de datos.
3. `03_dcl`: roles PostgreSQL, grants y RLS.
4. `04_tcl`: bloques transaccionales, recuperaciones y tags.

Cada subcarpeta tiene un `0000changelog.yaml`. Los cambios posteriores a un despliegue se agregan como nuevos changesets con rollback; no se editan changesets ya ejecutados.

La autenticación final pertenece al backend. `hidro_smart_app` ejecuta operaciones normales, `hidro_smart_ingest` inserta lecturas IoT y `hidro_smart_readonly` consulta reportes. El backend establece `app.user_id` para que RLS filtre por usuario y hogar.

La integridad de lecturas se garantiza con la FK compuesta `sensor_reading(home_id, device_id) -> home_device(home_id, device_id)`.

## Rollbacks centralizados

Los cambios de avance viven en `01_ddl`, `02_dml`, `03_dcl` y `04_tcl`. Todos los archivos de reversa viven en `05_rollbacks/`, que mantiene el mismo arbol de subcarpetas:

```text
01_ddl/06_functions/018_fn_registration_flows.sql
05_rollbacks/01_ddl/06_functions/018_fn_registration_flows.rollback.sql
```

Cada referencia usa `relativeToChangelogFile: true` y rutas POSIX (`/`). Esto permite que el mismo changelog funcione en Windows, Docker y Liquibase local. No se deben crear archivos `.rollback.sql` dentro de las capas activas.
## Decisiones vigentes de dispositivos y alertas

- La asociación dispositivo-hogar es N:N y se identifica por la pareja única `(home_id, device_id)`.
- `Low` no se trata como suspensión; únicamente `Suspended` requiere `suspension_reason`.
- Las alertas `daily_limit` se deduplican por día, `monthly_limit` por mes y `leak_detected` por día operativo.
- Las actualizaciones de dispositivos se filtran por permiso RBAC y por asociación activa con un hogar del usuario.
Las operaciones de `04_tcl` son manuales: no forman parte del `update` normal. Los resumenes diarios deben ejecutarse mediante un job programado o una llamada controlada al procedimiento correspondiente.