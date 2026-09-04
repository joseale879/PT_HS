# Archivos SQL y estado de activación

## Activos en Liquibase

- `01_ddl/07_procedures/004_prc_archive_closed_tickets.sql`: activo. Usa `archived_at` y conserva `closed_at`.

## Inactivos intencionalmente

- `01_ddl/08_triggers/004_trg_after_alert_insert.sql`: solo contiene una función placeholder; el trigger que refrescaría vistas materializadas no se activa dentro de una transacción.
- `01_ddl/08_triggers/005_trg_after_reading_update_mv.sql`: el trigger está comentado porque las vistas materializadas se actualizan mediante `prc_refresh_materialized_views()`.

Estos archivos no deben agregarse al changelog hasta que exista un mecanismo seguro y probado de refresco diferido.
