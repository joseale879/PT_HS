# Diagnóstico actual de BD_HS

Fecha de revisión: 2026-09-03.

## Resultado ejecutivo

La instalación limpia de Hidro Smart fue ejecutada correctamente contra PostgreSQL 16.15 usando Liquibase 5.0.2.

El resultado actual es operativo:

- PostgreSQL está `healthy`.
- Liquibase `validate` terminó sin errores.
- Liquibase `update` terminó correctamente.
- Se aplicaron 166 changesets.
- Liquibase `status` indica que la base está actualizada.
- La base `hidro_smart` responde por el puerto local `5433`.

## Verificaciones realizadas

Se confirmó una conexión administrativa con:

```text
current_database = hidro_smart
current_user     = hidro_smart_admin
```

También se verificó que existen los roles:

- `hidro_smart_admin`
- `hidro_smart_liquibase`
- `hidro_smart_app`
- `hidro_smart_ingest`
- `hidro_smart_readonly`

La conexión real como `hidro_smart_app` también fue probada correctamente.

## Corrección del provisioning

El script `scripts/provision-liquibase-role.ps1` fue corregido en dos puntos:

1. Se escapó correctamente `DO $$ ... $$` para que PowerShell no elimine los delimitadores enviados a PostgreSQL.
2. Se agregó `GRANT USAGE, CREATE ON SCHEMA public`, necesario para crear las tablas `databasechangelog` y `databasechangeloglock`.

## Seguridad de ingesta IoT

La ingesta ya no depende de `SELECT` global sobre `device.device` ni `home.home_device`.

La solución activa incluye:

- `device.fn_can_ingest_reading(UUID, UUID)` como función `SECURITY DEFINER`.
- Política RLS que valida la relación dispositivo-hogar mediante esa función.
- `GRANT EXECUTE` únicamente a `hidro_smart_ingest`.
- `REFERENCES` y `USAGE` mínimos para validación de llaves foráneas.
- Revocación de `SELECT` global para el rol IoT.
- Rollbacks integrados en `05_rollbacks`.

## Liquibase y estructura

La cadena principal carga:

```text
01_ddl → 02_dml → 03_dcl
```

`04_tcl` permanece fuera del `update` normal y se ejecuta únicamente mediante procedimientos manuales documentados.

No se detectaron errores de rutas o IDs duplicados durante las verificaciones anteriores. Los cambios nuevos de ingesta quedaron incluidos en sus respectivos `0000changelog.yaml`.

## Estado del backend

La base está lista para conectarse desde el backend con `hidro_smart_app`.

- Desde Windows: `localhost:5433`.
- Desde otro contenedor del mismo Compose: `postgres:5432`.
- El backend debe establecer `app.user_id` por transacción.
- Liquibase no debe ejecutarse automáticamente desde el arranque del backend.
- El backend no debe utilizar `hidro_smart_admin`.

## Pendientes que no bloquean el arranque

- Ejecutar pruebas end-to-end desde el backend real.
- Probar una lectura IoT válida y otra inválida con dispositivos y hogares reales.
- Rotar las contraseñas temporales antes de producción.
- Definir y modelar actuadores físicos como electroválvulas e hidrobombas.
- Decidir si `consumption_prediction` permanece dentro del alcance.
- Completar la estrategia de auditoría para todas las tablas que requieran trazabilidad.
- MFA queda fuera del alcance funcional actual; el correo operativo se maneja únicamente por Gmail SMTP desde el backend.

## Conclusión

La base ya está desplegada correctamente en el entorno local y Liquibase está al día. El backend utiliza `hidro_smart_app` y las pruebas funcionales de permisos continúan ampliándose por módulo.

## Actualización 2026-09-03

Se aplicaron dos changesets nuevos para la consulta administrativa de auditoría:

- `20260903-fn-list-audit-logs`: función `user_account.fn_list_audit_logs(...)` con filtros y paginación.
- `20260903-audit-read-function-grant`: `EXECUTE` para `hidro_smart_app`, sin `SELECT` directo sobre `audit.audit_log`.

La verificación de permisos con usuarios funcionales reales permitió consultar únicamente con `Administrator`; `Support`, `HomeUser` y `Guest` fueron rechazados.
