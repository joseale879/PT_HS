# TCL: operación y recuperación

La capa `04_tcl` contiene bloques transaccionales, recuperaciones manuales y tags de release.

## Contenido actual

- Resumen diario de consumo dentro de un bloque controlado.
- Recuperación manual documentada.
- Tag de release `1.0.0`.

Liquibase administra el orden y la transacción de cada changeset. Los scripts TCL no deben ejecutar `COMMIT` o `ROLLBACK` internos que interfieran con Liquibase.

## Rollback

Antes de revertir:

```powershell
docker compose --profile tooling run --rm liquibase rollback-count --count=1
```

Usa rollback por changeset solo después de revisar el SQL generado y tener respaldo. Las operaciones DML destructivas requieren recuperación manual o restauración del respaldo.

## Prueba del refresco concurrente

El procedimiento `analytics_support.prc_refresh_materialized_views()` utiliza `REFRESH MATERIALIZED VIEW CONCURRENTLY`. Las cinco MVs conservan un índice único sin filtro para que la operación sea válida. El procedimiento debe ejecutarse como una llamada independiente:

```sql
CALL analytics_support.prc_refresh_materialized_views();
```

No lo ejecutes dentro de `BEGIN`/`COMMIT` manuales. Si una MV fue creada recientemente y aún no está poblada, realiza primero un `REFRESH MATERIALIZED VIEW` normal una sola vez.
## Ejecucion controlada de TCL

Los cambiosets de `04_tcl` usan el contexto `04_tcl_manual` y no se ejecutan durante un `liquibase update` normal. Esto evita recalcular resúmenes diarios o crear metadatos de release como parte de cada despliegue.

Para ejecutar una operacion TCL de forma intencional, revisa primero el SQL y usa el contexto manual:

```powershell
docker compose -p hidro_smart --profile tooling run --rm liquibase --changeLogFile=04_tcl/changelog.yaml --context-filter=04_tcl_manual update
```

Para los releases normales, usa el mecanismo nativo de Liquibase:

```powershell
docker compose -p hidro_smart --profile tooling run --rm liquibase tag --tag=bd01_stable
```