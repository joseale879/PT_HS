# Dominios de la base de datos Hidro Smart

Hidro Smart administra consumo de agua mediante nueve schemas funcionales y
los dominios asociados:

- `user_account`: usuarios, perfiles, autenticación, sesiones, credenciales, roles y políticas de contraseña.
- `preference`: idiomas, monedas, temas y preferencias personales.
- `home`: hogares, miembros, dispositivos asociados, vacaciones y metas de ahorro.
- `device`: dispositivos IoT, historial de estados, calibraciones, telemetría,
  estado actual de actuadores y ciclo de vida de comandos.
- `consumption`: lecturas de agua en litros/m³, resúmenes diarios, horarios, mensuales y predicciones.
- `alert_rate`: umbrales, reglas, eventos, notificaciones y tarifas por hogar.
- `analytics_support`: recomendaciones, reportes y tickets de soporte.
- `audit`: auditoría y errores del sistema.
- `privacy`: consentimiento y solicitudes ARCO.

El perfil de usuario puede guardar un avatar opcional en `user_profile.avatar_data_url`.
La columna `user_profile.phone` admite hasta 60 caracteres.

## Flujo principal

El backend autentica al usuario y establece `app.user_id`. Las políticas RLS usan ese valor para limitar hogares, dispositivos, lecturas, alertas, reportes y tickets.

La ingesta IoT utiliza el rol PostgreSQL separado `hidro_smart_ingest`, que solo
puede ejecutar la función protegida `device.fn_ingest_sensor_reading(...)`.
No tiene `INSERT` directo sobre `consumption.sensor_reading`. El backend usa
`hidro_smart_app` para las operaciones de aplicación.

El dominio de actuadores usa `device.actuator_state` para conservar el último
estado reportado por válvulas y bombas, y `device.actuator_command` para guardar
la solicitud, publicación, confirmación o fallo. La base valida que las órdenes
sean compatibles con el tipo de actuador y aplica RLS por hogar.

Para crear el primer propietario de un hogar se utiliza `home.fn_create_home_with_owner(...)`; así la creación del hogar y su primer registro `Owner` ocurre como una operación controlada.

## Integridad y negocio

### Ubicacion, registro y vinculacion IoT

`device.device.location` almacena el lugar visible del sensor, con un maximo de 120 caracteres y valor opcional para no romper dispositivos existentes. El registro con ubicacion se realiza mediante `device.fn_register_device_with_location(...)`. Para un dispositivo que ya existe pero aun no esta asociado a un hogar, `device.fn_link_device_to_home(code, home_id)` valida `devices.manage`, la titularidad del hogar y crea o reactiva la relacion unica en `home.home_device`.

- Cada lectura valida que la pareja `(home_id, device_id)` exista en `home.home_device`.
- `home.tier` representa el estrato vigente del hogar.
- `home_rate` conserva tarifas históricas por hogar, estrato y vigencia.
- `fixed_charge` debe tratarse como cargo de la tarifa del período, no como parte del costo de cada lectura individual.
- Las alertas de consumo se controlan por hogar y fecha; la repetición diaria es una decisión de negocio configurable.

La estructura física y su orden de despliegue están descritos en `docs/sql-layer-architecture.md`.
## Decisiones de integridad y retención

- home.home_device es una relación N:N: un dispositivo puede estar asociado a varios hogares, pero el par (home_id, device_id) es único.
- consumption.sensor_reading usa una FK compuesta (home_id, device_id) hacia home.home_device, por lo que cada lectura queda ligada a una asociación concreta.
- Lecturas, resúmenes, predicciones y historiales no se eliminan en cascada. Sus FK usan RESTRICT para conservar evidencia.
- Los tickets sobreviven a la eliminación de una cuenta; el autor puede quedar en NULL. Las respuestas no se eliminan al borrar el ticket.
## Flujos controlados de registro

El registro de usuario se realiza con `user_account.fn_register_user(...)`. La
función devuelve el UUID, crea la cuenta en estado `Pending` y asigna
automáticamente el rol de negocio `HomeUser`; el consumo de un token válido la
activa. No se concede `INSERT` directo sobre `user_account.user_role` al rol de
la aplicación.

El registro de dispositivos se realiza con `device.fn_register_device_with_location(...)`. Requiere el permiso RBAC `devices.manage`, guarda la ubicación visible y devuelve el UUID. El backend crea la asociación en `home.home_device` dentro de la misma transacción. Para un equipo que ya existe se utiliza `device.fn_link_device_to_home(...)`.

Estas funciones son `SECURITY DEFINER` y estan protegidas por grants de ejecucion especificos. Su rollback se encuentra en `05_rollbacks/01_ddl/06_functions/`.
## Estados del dispositivo

`device.status` conserva los valores `Active`, `Suspended` y `Low` por compatibilidad con el backend actual. `Low` representa batería o salud operativa baja; no exige `suspension_reason`. Solo `Suspended` exige motivo de suspensión. El trigger `trg_device_status_change` actualiza `changed_at_status` cuando cambia el estado.

La relación `home.home_device` se mantiene N:N: un dispositivo puede estar asociado a varios hogares y cada pareja `(home_id, device_id)` es única. Esta decisión debe mantenerse también en el backend y en las pruebas de integración.
## Costo por periodo

`consumption.fn_calculate_cost(...)` calcula solo el costo variable de una lectura. `consumption.fn_calculate_period_cost(...)` agrega el `fixed_charge` una vez por cada mes incluido en el rango, siempre que exista una tarifa vigente para ese mes.
## Estado de integración MQTT (2026-09-14)

La base contiene las tablas `device.device`, `device.home_device`, `consumption.sensor_reading` y `device.device_telemetry_history`, conectadas a la ingesta IoT protegida del backend. Las lecturas conservan métricas, `mqtt_message_id`, `measured_at` y `received_at`.

La escritura ya resuelve `deviceCode` contra `device.device.code`, comprueba la asociación activa con el hogar y usa grants versionados para la conexión de ingestión. La columna `consumption.sensor_reading.consumption_liters` usa `NUMERIC(14,3)` y la columna generada `consumption_m3` usa `NUMERIC(14,6)` para conservar muestras del ESP32 como `0.040 L`.
