# DCL: roles, permisos y RLS

La capa `03_dcl` controla acceso al motor PostgreSQL, objetos y filas.

## Roles PostgreSQL

- `hidro_smart_app`: backend y operaciones normales.
- `hidro_smart_ingest`: ingesta IoT; solo conecta y ejecuta `INSERT` sobre `consumption.sensor_reading`.
- `hidro_smart_readonly`: consultas y reportes de solo lectura.

Los roles de negocio `Administrator`, `Support`, `HomeUser` y `Guest` viven en `user_account.role`. El backend los interpreta; no se mezclan automáticamente con roles PostgreSQL.

## Registro y hogares

El backend registra usuarios mediante:

```sql
SELECT user_account.fn_register_user('usuario', 'correo@dominio.com');
```

La función devuelve el UUID sin exigir `app.user_id` durante el registro. Para crear el primer propietario:

```sql
SELECT home.fn_create_home_with_owner('Casa', 'Dirección', 'Ciudad', 3, '<UUID_USUARIO>');
```

## RLS

El backend establece el usuario actual por conexión:

```sql
SELECT set_config('app.user_id', '<UUID_USUARIO>', true);
```

Las políticas limitan hogares, dispositivos, lecturas, alertas, reportes, recomendaciones y tickets. La ingesta usa un rol separado y una política exclusiva de inserción.

El rol readonly no tiene acceso directo a las tablas operativas: sus privilegios efectivos quedan limitados a las cinco vistas materializadas agregadas de reportes. Si se requiere un usuario de reportes por hogar, debe crearse otra politica con filtro por membresia y una vista o funcion especifica.

## Buenas prácticas

- Mantener contraseñas fuera del changelog.
- No conceder superusuario.
- Revisar grants de nuevas tablas.
- Probar RLS con una sesión autenticada y otra sin `app.user_id`.
## Seguridad efectiva de la aplicación

hidro_smart_app no recibe CRUD global. El changeset 20260825-explicit-app-table-privileges revoca los privilegios heredados y concede acceso tabla por tabla.

El backend (`hidro_smart_app`) no consulta directamente las vistas materializadas; debe usar las funciones seguras. El rol técnico `hidro_smart_readonly` sí puede consultar únicamente esas cinco vistas agregadas para reportes internos:

- consumption.fn_get_home_monthly_consumption(uuid)
- consumption.fn_get_home_hourly_consumption(uuid)
- alert_rate.fn_get_home_pending_alerts(uuid)
- device.fn_get_home_active_devices(uuid)
- analytics_support.fn_get_home_recommendation_summary(uuid)

Cada función exige el permiso RBAC correspondiente y membresía activa en el hogar indicado.
## Registro seguro y rollbacks

`hidro_smart_app` ejecuta los flujos controlados, pero no recibe CRUD global sobre tablas sensibles ni `INSERT` directo para asignar roles o registrar dispositivos:

```sql
SELECT user_account.fn_register_user('usuario', 'correo@dominio.com');
SELECT device.fn_register_device('DEV-001', 'Medidor principal', 'WaterMeter');
```

El primer flujo asigna `HomeUser`. El segundo exige `devices.manage`; despues de obtener el UUID, el backend debe asociar el dispositivo a un hogar mediante `home.home_device`.

Los grants de estos flujos estan en `03_dcl/01_grants/012_grant_registration_flows.sql` y su rollback en `05_rollbacks/03_dcl/01_grants/012_grant_registration_flows.rollback.sql`.
## Alcance de actualización de dispositivos

Para actualizar un dispositivo, `hidro_smart_app` necesita simultáneamente:

1. el permiso RBAC `devices.manage`; y
2. pertenecer a un hogar activo que tenga una asociación activa con ese dispositivo.

La política `device_backend_update` aplica ambas condiciones mediante `device.fn_can_manage_device(...)`. Por esto, tener el permiso por sí solo no permite modificar dispositivos de otros hogares.

El rol `hidro_smart_readonly` quedó limitado a las cinco vistas materializadas agregadas para reportes. No tiene acceso directo a las tablas operativas ni a datos sensibles de autenticación, tokens, MFA, consentimiento o auditoría.

## Consulta administrativa de auditoría

La aplicación no recibe `SELECT` sobre `audit.audit_log`. El acceso administrativo se expone mediante `user_account.fn_list_audit_logs(...)`, una función `SECURITY DEFINER` con filtros por acción, tabla y rango de fechas, paginación y orden descendente por fecha.

El backend ejecuta esa función a través de `GET /api/v1/audit/logs`. El permiso `audit.read` está asignado únicamente al rol funcional `Administrator`; la función vuelve a verificarlo usando el contexto `app.user_id`. El changeset de la función es `20260903-fn-list-audit-logs` y su grant es `20260903-audit-read-function-grant`.
## RLS adicional para datos privados

Ademas de los hogares, dispositivos y consumos, el changeset `20260827-private-domain-rls` protege perfiles, funciones de miembros, solicitudes de ingreso, historiales IoT, consentimientos y solicitudes ARCO.

Las funciones SECURITY DEFINER de calculo exigen permiso RBAC y membresia activa cuando la llamada proviene de `hidro_smart_app`. Las llamadas internas del rol `hidro_smart_ingest` se mantienen para que la ingesta pueda generar alertas sin exponer consultas directas al backend.

Los consentimientos son append-only desde la aplicacion y las solicitudes ARCO no se pueden borrar directamente.
## Acceso seguro a vistas materializadas

El changeset 20260827-secure-materialized-view-access revoca el SELECT directo de hidro_smart_app y hidro_smart_readonly sobre las cinco vistas materializadas, porque contienen agregados de varios hogares. El backend debe usar las funciones filtradas por p_home_id:

- consumption.fn_get_home_monthly_consumption(uuid)
- consumption.fn_get_home_hourly_consumption(uuid)
- alert_rate.fn_get_home_pending_alerts(uuid)
- device.fn_get_home_active_devices(uuid)
- analytics_support.fn_get_home_recommendation_summary(uuid)

El rollback correspondiente restaura el SELECT directo únicamente como reversión explícita.
## Correcciones del flujo IoT y registro de dispositivos

El changeset 20260828-ingest-references otorga únicamente REFERENCES sobre home.home_device al rol hidro_smart_ingest. Esto permite que PostgreSQL valide el FK compuesto de sensor_reading durante la ingesta, sin concederle lectura ni escritura general sobre home_device.

El changeset 20260828-homeuser-device-permission asigna devices.manage al rol funcional HomeUser. El usuario normal puede registrar un dispositivo mediante device.fn_register_device, pero la asociación y las actualizaciones continúan limitadas por permisos, membresía activa y RLS.
## Estado de permisos para MQTT (2026-09-04)

El rol `hidro_smart_ingest` tiene permisos parciales para la futura ingesta de lecturas. La infraestructura MQTT del backend todavía no escribe en PostgreSQL, por lo que no se deben ampliar grants de forma manual.

Antes de activar `reading.handler` deben versionarse en Liquibase los permisos mínimos para insertar `consumption.sensor_reading` y, si aplica, `device.device_telemetry_history`, manteniendo la resolución segura de `deviceCode`, la asociación `home_device`, RLS y la separación respecto de `hidro_smart_app`.

La documentación de diagnóstico y el checklist de implementación registran este bloqueo: `diagnostico-actual.md` y `../../BK_HS/docs/pendientes-proyecto.md`.
