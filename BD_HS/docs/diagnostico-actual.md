# Diagnóstico actual de BD_HS

Fecha de revisión: 2026-09-14.

## Resultado ejecutivo

La configuración local de `hidro_smart` quedó verificada en la última ejecución con PostgreSQL 16 y Liquibase 5.0.2. El changelog actual contiene 206 changesets aplicados.

> Último estado comprobado: `validate`, `update` y `status` fueron exitosos; PostgreSQL estaba saludable, `hidro_smart_app` autenticaba correctamente y el backend respondía `/health` con HTTP 200. Si Docker Desktop no está iniciado, estas comprobaciones deben repetirse antes de aplicar cambios.

- PostgreSQL responde por `localhost:5433` desde Windows.
- Dentro de Docker la conexión es `postgres:5432`.
- El backend se conecta con el rol `hidro_smart_app`.
- Liquibase se ejecuta con el perfil `tooling` y el rol administrador correspondiente.
- Existen los roles `hidro_smart_admin`, `hidro_smart_liquibase`, `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly`.

## Comandos de verificación

Desde la raíz del repositorio:

```powershell
docker compose --env-file .env up -d postgres db-bootstrap
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env --profile tooling run --rm liquibase update
```

No se deben editar changesets ya aplicados. Cada cambio posterior debe crear un nuevo changeset con rollback revisado.

## Objetos relevantes para IoT

La base ya contiene objetos para:

- `device.device`: identidad y código del dispositivo.
- `device.home_device`: asociación del dispositivo con el hogar.
- `consumption.sensor_reading`: lecturas de consumo.
- `device.device_telemetry_history`: historial de salud/telemetría del dispositivo.
- funciones y vistas de consumo que alimentan la API.

Los conteos de dispositivos y lecturas dependen de los datos cargados en la base de desarrollo; una instalación limpia puede mostrar cero registros. La capacidad de persistencia se verifica mediante la función de ingesta y las pruebas del backend.

## Estado de ingestión MQTT

La infraestructura MQTT del backend recibe, normaliza y persiste mensajes mediante `IngestReading` y `PostgresTelemetryRepository`. La función SQL resuelve el dispositivo, valida su asociación y estado, aplica deduplicación y guarda las métricas. El rol `hidro_smart_ingest` tiene el permiso `EXECUTE` versionado por Liquibase sobre la función protegida y no tiene `INSERT` directo sobre la tabla.

Comprobaciones vigentes:

1. resolver `deviceCode` a `device_id` y `home_id`;
2. verificar dispositivo activo y relación con el hogar;
3. insertar la lectura mediante la función y el pool de ingesta;
4. guardar las métricas de telemetría incluidas en el contrato;
5. probar límites e idempotencia.

No se debe dar al backend permiso administrativo ni acceso amplio a todos los esquemas.

## Precisión de consumo

`consumption.sensor_reading.consumption_liters` está definido actualmente como `NUMERIC(10,2)`. El ESP32 puede producir muestras como `0.040 L`; almacenarlas con dos decimales elimina parte de la precisión. Además, las vistas y funciones que calculan acumulados en metros cúbicos se basan en `consumption_m3`.

Antes de ingerir lecturas por segundo se debe crear una migración Liquibase que defina la escala necesaria, revise la columna generada, funciones, vistas, índices y reportes, y agregue pruebas de regresión.

## RLS, roles y API

La API establece el contexto de usuario en la transacción para respetar las políticas RLS. Las funciones administrativas, auditoría e ingestión deben conservar permisos explícitos y mínimos. La documentación de dominios está en `01_dominios.md`, la de seguridad en `03_dcl.md` y la de ejecución en `guia-ejecucion-liquibase.md`.
