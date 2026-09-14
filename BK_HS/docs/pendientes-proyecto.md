# Plan de trabajo y pendientes â€” HidroSmart

Ãšltima revisiÃ³n: 2026-09-14.

Este documento es el mapa operativo del proyecto. Distingue lo construido de lo que falta integrar, probar o endurecer. Las reglas protegidas por PostgreSQL no deben duplicarse en Node.js.

## Estado actual

| Ãrea | Estado | Nota |
|---|---|---|
| Base de datos | Operativa | Liquibase aplicado: 206 changesets; sin cambios pendientes |
| Backend HTTP | Base funcional | Rutas, JWT, RLS y RBAC implementados |
| Frontend web | Base funcional | Consume `/api/v1`; quedan estados visuales, pruebas de rol y cobertura frontend |
| MQTT | Ingesta local operativa | Topics, parser, deduplicaciÃ³n e ingesta PostgreSQL controlada |
| IoT real | Parcial | Estructura de firmware y contrato presentes; falta confirmar seguimiento en Git y probar placa/sensor real |
| SMTP | Integrado | Gmail/Mailpit configurables; eventos de cuenta aislados de la operaciÃ³n principal |
| Pruebas | Backend aprobadas | Backend: 131 unitarias + integración local 6/6; quedan E2E de producción y pruebas con hardware real |

## Ya construido y verificado

- [x] PostgreSQL, Liquibase, backend, frontend, Mailpit y Mosquitto en Docker Compose.
- [x] Roles tÃ©cnicos `hidro_smart_admin`, `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly`.
- [x] Roles funcionales `Administrator`, `Support`, `HomeUser` y `Guest`.
- [x] Grants, RLS, funciones controladas, triggers, Ã­ndices, auditorÃ­a y alertas.
- [x] Registro, login, JWT, refresh token, logout, cambio y recuperaciÃ³n de contraseÃ±a.
- [x] Hogares, miembros, dispositivos, consumo histÃ³rico, tarifas, alertas, metas, vacaciones, recomendaciones, tickets, roles y auditorÃ­a.
- [x] Cliente HTTP del frontend y proxy Nginx hacia `/api/v1`.
- [x] Cliente MQTT, topics `hidrosmart/devices/{deviceCode}/...`, parser y handlers.
- [x] Contrato inicial compatible con ESP32: `deviceId`, `flowRateLpm`, `consumptionLiters`, `totalLiters`, `pulses`, `sampleIntervalSeconds`, `wifiRssiDbm` y `timestamp`.
- [x] Prueba de humo MQTT con `HS_ESP32_001`: Mosquitto recibiÃ³ el mensaje y el backend lo validÃ³/normalizÃ³.
- [x] Backend compilable, lint y 131 pruebas unitarias aprobadas.

## Fase BK-01 â€” seguridad y contratos HTTP

- [x] Impedir que `req.body` sobrescriba `userId`, `homeId`, `ruleId`, `goalId` o IDs de JWT/params.
- [x] Alinear unidades de alertas con la BD: `m3_day`, `m3_month` y `minutes`.
- [x] Separar el intervalo del job de alertas del refresco de vistas materializadas.
- [x] Permitir tickets propios sin exigir `homes.manage`; reservar `tickets.manage` para administraciÃ³n.
- [x] Integrar `fn_get_my_authorization_context()` en `/me`, login o restauraciÃ³n de sesiÃ³n.
- [x] Corregir validaciÃ³n especÃ­fica de actualizaciÃ³n de metas sin exigir `homeId` innecesariamente.
- [x] Hacer que recuperaciÃ³n de contraseÃ±a tenga respuesta indistinguible para correos existentes y no existentes.
- [x] Validar el contexto del enlace de recuperaciÃ³n antes de mostrar el formulario mediante `/auth/password-reset-context`.
- [x] Vincular logout con `userId` y `sessionId`, no solo con un refresh token recibido.

## Fase BK-02 â€” autorizaciÃ³n, sesiones y cuenta

- [x] Listar, revocar una, revocar otras o revocar todas las sesiones mediante funciones SQL con control de propietario.
- [x] Definir validaciÃ³n de `sid` activo para access tokens despuÃ©s del logout.
- [x] Crear funciones SQL controladas para suspender, reactivar, bloquear y eliminar lÃ³gicamente cuentas; las operaciones no activas revocan sesiones y tokens.
- [x] Crear servicio administrativo y funciones controladas para listar, suspender, reactivar, bloquear y eliminar lÃ³gicamente cuentas sin `UPDATE` genÃ©rico de campos sensibles.
- [x] Conectar correos de bienvenida, cambio de contraseÃ±a y cambios de cuenta (incluido perfil) sin revertir el evento principal si SMTP falla.

## Fase BK-03 â€” MQTT e ingesta PostgreSQL

### Contrato del dispositivo

- [x] Confirmar el formato del identificador MQTT como `device.code` (por ejemplo `HS_ESP32_001`), no MAC ni UUID.
- [x] AÃ±adir `mqttMessageId` para soportar QoS 1 y mensajes repetidos.
- [x] Mantener `timestamp` en UTC ISO 8601; rechazar fechas sin zona horaria y usar hora de recepciÃ³n solo como fallback controlado.
- [x] Documentar que `consumptionLiters` es el consumo del intervalo y `totalLiters` solo diagnÃ³stico.
- [ ] Verificar que el GPIO del ESP32 no reciba directamente una seÃ±al de 5 V del YF-S201.

### Backend y BD

- [x] Crear `IngestReading` y el puerto `TelemetryRepository`.
- [x] Crear `PostgresTelemetryRepository` separado del handler MQTT.
- [x] Crear pool de ingesta separado del pool HTTP; usa `DB_INGEST_USER`/`DB_INGEST_PASSWORD` y ejecuta la funciÃ³n protegida.
- [x] Crear funciÃ³n SQL controlada para resolver `device.code â†’ device_id â†’ home_id`, validar estado y guardar la lectura.
- [x] AÃ±adir a `sensor_reading` la clave de mensaje, caudal, intervalo, pulsos y mÃ©tricas de telemetrÃ­a.
- [x] Crear constraint/Ã­ndice Ãºnico por dispositivo y `mqttMessageId`.
- [x] Actualizar `last_seen` sin mezclarlo con el estado administrativo `Active/Inactive`.
- [x] Rechazar dispositivos inexistentes, inactivos, no asignados o mensajes fuera de rango.
- [x] Probar lectura vÃ¡lida, invÃ¡lida, duplicada, timestamp invÃ¡lido y dispositivo no autorizado.

Flujo objetivo: `ESP32 â†’ Mosquitto â†’ subscriber â†’ parser â†’ IngestReading â†’ funciÃ³n SQL â†’ hidro_smart_ingest â†’ sensor_reading`.

## Fase BK-04 â€” alertas, consumo y tiempo real

- [x] Confirmar que el job llama Ãºnicamente a `alert_rate.fn_generate_alert_events(...)`.
- [x] No recalcular en Node lÃ­mites diarios, mensuales, vacaciones, fugas ni deduplicaciÃ³n.
- [ ] Probar los cinco tipos de alerta y su comportamiento durante vacaciones con datos funcionales reales; la validaciÃ³n de tipo/unidad ya estÃ¡ cubierta en backend.
- [x] Cubrir con pruebas unitarias la validaciÃ³n y delegaciÃ³n de guardar, consultar y eliminar el modo vacaciones.
- [x] Conectar el frontend a lecturas persistidas, consumo reciente y estado del dispositivo en dashboard, reportes y `/app/consumption`.
- [ ] Agregar tiempo real solo despuÃ©s de estabilizar la ingesta MQTT.

## Fase BK-05 â€” soporte, privacidad y reportes

- [x] Separar operaciones de tickets propios y administraciÃ³n de Support mediante casos de uso y permisos distintos.
- [x] Crear mÃ³dulo Privacy/ARCO: consentimientos, solicitudes propias, administraciÃ³n, respuesta, estado y paginaciÃ³n.
- [x] Implementar exportaciÃ³n JSON del usuario autenticado sin hashes, tokens ni secretos y descarga resumida del consumo en PDF/Excel.
- [x] Implementar recomendaciones propias: listado filtrable, resumen por hogar y actualizaciÃ³n de estado/utilidad protegidos por `reports.read` y RLS.
- [x] Persistir reportes: generar, listar, consultar, completar/fallar y conservar archivos PDF/Excel en `generated_report`; el historial se consulta con paginaciÃ³n y filtros.
- [x] Probar RLS de tickets, respuestas, ARCO y `generated_report` con un usuario contextual aislado; la integración PostgreSQL valida visibilidad propia y cero filas sin contexto.

## Fase BK-06 â€” dispositivos y actuadores

- [ ] Definir provisioning fÃ­sico y credenciales MQTT por dispositivo.
- [x] Persistir estados `ONLINE/OFFLINE` y `last_seen` reales.
- [x] Crear comandos de actuadores con permiso `actuators.manage`, `correlationId`, ACK y trazabilidad de estado.
- [x] Agregar timeout automático y auditoría específica para comandos sin ACK mediante `device.fn_timeout_actuator_commands(...)` y un job con advisory lock.
- [ ] Antes de producciÃ³n, agregar autenticaciÃ³n, ACL por topic y TLS en Mosquitto.

## OperaciÃ³n y calidad

- [x] Agregar `auditCleanupJob` usando `audit.prc_clean_old_audit_logs(...)`.
- [x] Agregar readiness separado de liveness para PostgreSQL y MQTT.
- [x] AÃ±adir `requestId` y logging estructurado sin secretos.
- [x] Limitar a 366 dÃ­as los rangos de resumen, costo y reportes PDF/Excel; la paginaciÃ³n, filtros y ordenamiento restantes se mantienen por endpoint.
- [x] Ejecutar integraciÃ³n con PostgreSQL real y MQTT; quedan E2E, backup y restore.
- [ ] Reordenar carpetas solo despuÃ©s de estabilizar comportamiento y pruebas.

## RectificaciÃ³n frontend â€” 2026-09-13

Estas observaciones ya fueron atendidas en `FT_HS/frontend`:

- [x] El hogar activo se centraliza en el layout autenticado y se comparte con dashboard, dispositivos, reportes, metas, alertas y vacaciones.
- [x] Metas consulta `GET /api/v1/goals/:goalId/progress`; el porcentaje ya no se calcula con el consumo mensual del navegador.
- [x] Alertas consulta pendientes, historial y umbrales desde el backend; los lÃ­mites se muestran en mÂ³.
- [x] ConfiguraciÃ³n carga perfil, fecha de registro, hogares y dispositivos desde la API.
- [x] ConfiguraciÃ³n dejÃ³ de mostrar tokens, exportaciÃ³n, eliminaciÃ³n, foto y switches de privacidad ficticios; ahora la gestiÃ³n de sesiones consume el contrato backend y permite revocar sesiones.
- [x] La gestiÃ³n administrativa de usuarios consume `/users` con bÃºsqueda, filtros, paginaciÃ³n y acciones de estado.
- [x] Reportes dejÃ³ de ofrecer exportaciÃ³n y administraciÃ³n de tarifas ficticias; mantiene Ãºnicamente consultas disponibles.
- [x] Recomendaciones consume `GET /api/v1/recommendations`, el resumen por hogar y el cambio de estado sin datos quemados.
- [x] Idioma y moneda se guardan juntos en `/users/me/preferences` antes de cambiar la interfaz.
- [x] Se aÃ±adiÃ³ correcciÃ³n de textos histÃ³ricos con codificaciÃ³n daÃ±ada para evitar mostrar `Ãƒ`, `Ã‚` o `Ã¢`.

Pendientes que siguen siendo reales: generaciÃ³n automÃ¡tica de recomendaciones, pruebas manuales/E2E, tiempo real y validaciÃ³n con hardware. La pantalla de recomendaciones es actualmente informativa y visual; la exportaciÃ³n JSON, los reportes PDF/Excel directos y su historial persistido ya estÃ¡n disponibles. La auditorÃ­a se consulta mediante funciÃ³n SQL y endpoint administrativo protegido; no se concede acceso directo a la tabla al rol de aplicaciÃ³n. La persistencia MQTT de lecturas, estados de dispositivos y estados de actuadores ya estÃ¡ publicada y queda probarla con un ESP32 real.

## Orden recomendado

1. Contexto de autorizaciÃ³n y sesiones.
2. RecuperaciÃ³n de contraseÃ±a y logout seguro.
3. Metas, alertas y tickets alineados con BD.
4. Pruebas RLS/RBAC con usuarios reales.
5. Validar el contrato `messageId` con firmware real.
6. Completar estados reales de dispositivos y consumo reciente.
7. Reportes PDF/Excel persistidos, exportaciÃ³n avanzada y pruebas finales de eventos SMTP.
8. Actuadores reales y endurecimiento de Mosquitto.
9. E2E, backup/restore y reorganizaciÃ³n final.
- Corte y cambios verificados del 2026-09-14: `../../docs/cambios-2026-09-14.md`.
