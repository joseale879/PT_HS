# Plan de trabajo y pendientes — HidroSmart

Última revisión: 2026-09-06.

Este documento es el mapa operativo del proyecto. Distingue lo construido de lo que falta integrar, probar o endurecer. Las reglas protegidas por PostgreSQL no deben duplicarse en Node.js.

## Estado actual

| Área | Estado | Nota |
|---|---|---|
| Base de datos | Operativa | Liquibase aplicado: 177 changesets; sin cambios pendientes |
| Backend HTTP | Base funcional | Rutas, JWT, RLS y RBAC implementados |
| Frontend web | Base funcional | Consume `/api/v1`; quedan pantallas por conectar |
| MQTT | Transporte listo | Topics, parser y handlers reciben telemetría; falta persistencia |
| IoT real | Pendiente | Falta contrato definitivo, ingesta y pruebas con PostgreSQL |
| SMTP | Base lista | Gmail/Mailpit configurables; faltan eventos automáticos adicionales |
| Pruebas | Unitarias aprobadas | Backend: 82/82; falta integración real y E2E |

## Ya construido y verificado

- [x] PostgreSQL, Liquibase, backend, frontend, Mailpit y Mosquitto en Docker Compose.
- [x] Roles técnicos `hidro_smart_admin`, `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly`.
- [x] Roles funcionales `Administrator`, `Support`, `HomeUser` y `Guest`.
- [x] Grants, RLS, funciones controladas, triggers, índices, auditoría y alertas.
- [x] Registro, login, JWT, refresh token, logout, cambio y recuperación de contraseña.
- [x] Hogares, miembros, dispositivos, consumo histórico, tarifas, alertas, metas, vacaciones, tickets, roles y auditoría.
- [x] Cliente HTTP del frontend y proxy Nginx hacia `/api/v1`.
- [x] Cliente MQTT, topics `hidrosmart/devices/{deviceCode}/...`, parser y handlers.
- [x] Contrato inicial compatible con ESP32: `deviceId`, `flowRateLpm`, `consumptionLiters`, `totalLiters`, `pulses`, `sampleIntervalSeconds`, `wifiRssiDbm` y `timestamp`.
- [x] Prueba de humo MQTT con `HS_ESP32_001`: Mosquitto recibió el mensaje y el backend lo validó/normalizó.
- [x] Backend compilable y 82 pruebas unitarias aprobadas.

## Fase BK-01 — seguridad y contratos HTTP

- [x] Impedir que `req.body` sobrescriba `userId`, `homeId`, `ruleId`, `goalId` o IDs de JWT/params.
- [x] Alinear unidades de alertas con la BD: `m3_day`, `m3_month` y `minutes`.
- [x] Separar el intervalo del job de alertas del refresco de vistas materializadas.
- [x] Permitir tickets propios sin exigir `homes.manage`; reservar `tickets.manage` para administración.
- [ ] Integrar `fn_get_my_authorization_context()` en `/me`, login o restauración de sesión.
- [x] Corregir validación específica de actualización de metas sin exigir `homeId` innecesariamente.
- [x] Hacer que recuperación de contraseña tenga respuesta indistinguible para correos existentes y no existentes.
- [x] Vincular logout con `userId` y `sessionId`, no solo con un refresh token recibido.

## Fase BK-02 — autorización, sesiones y cuenta

- [ ] Listar, revocar una, revocar otras o revocar todas las sesiones.
- [ ] Definir validación de `sid` activo para access tokens después del logout.
- [ ] Confirmar o crear funciones SQL controladas para suspender, reactivar y eliminar cuentas.
- [ ] Crear casos de uso administrativos sin `UPDATE` genérico de campos sensibles.
- [ ] Conectar correos de bienvenida, cambio de contraseña y cambios de cuenta sin revertir el evento principal si SMTP falla.

## Fase BK-03 — MQTT e ingesta PostgreSQL

### Contrato del dispositivo

- [x] Confirmar el formato del identificador MQTT como `device.code` (por ejemplo `HS_ESP32_001`), no MAC ni UUID.
- [ ] Añadir `messageId` o `sequence` monotónico para soportar QoS 1 y mensajes repetidos.
- [ ] Mantener `timestamp` en UTC ISO 8601; usar hora de recepción solo como fallback controlado.
- [ ] Documentar que `consumptionLiters` es el consumo del intervalo y `totalLiters` solo diagnóstico.
- [ ] Verificar que el GPIO del ESP32 no reciba directamente una señal de 5 V del YF-S201.

### Backend y BD

- [ ] Crear `IngestReading` y el puerto `TelemetryRepository`.
- [ ] Crear `PostgresTelemetryRepository` separado del handler MQTT.
- [ ] Crear pool de ingesta con `hidro_smart_ingest`, separado del pool HTTP `hidro_smart_app`.
- [ ] Crear función SQL controlada para resolver `device.code → device_id → home_id`, validar estado y guardar la lectura.
- [ ] Añadir a `sensor_reading` caudal, intervalo, pulsos y clave de mensaje si el modelo actual no los contiene.
- [ ] Crear constraint/índice único por dispositivo y `messageId`.
- [ ] Actualizar `last_seen` sin mezclarlo con el estado administrativo `Active/Inactive`.
- [ ] Rechazar dispositivos inexistentes, inactivos, no asignados o mensajes fuera de rango.
- [ ] Probar lectura válida, inválida, duplicada, timestamp inválido y dispositivo no autorizado.

Flujo objetivo: `ESP32 → Mosquitto → subscriber → parser → IngestReading → función SQL → hidro_smart_ingest → sensor_reading`.

## Fase BK-04 — alertas, consumo y tiempo real

- [ ] Confirmar que el job llama únicamente a `alert_rate.fn_generate_alert_events(...)`.
- [ ] No recalcular en Node límites diarios, mensuales, vacaciones, fugas ni deduplicación.
- [ ] Probar los cinco tipos de alerta y su comportamiento durante vacaciones.
- [ ] Conectar el frontend a lecturas persistidas, consumo reciente y estado del dispositivo.
- [ ] Agregar tiempo real solo después de estabilizar la ingesta MQTT.

## Fase BK-05 — soporte, privacidad y reportes

- [ ] Separar casos de uso de tickets propios y administración de Support.
- [ ] Crear módulo Privacy/ARCO: solicitudes propias, administración, respuesta y estado.
- [ ] Implementar exportación de datos únicamente del usuario autenticado.
- [ ] Crear reportes: generar, listar, consultar, completar/fallar y descargar primero CSV.
- [ ] Probar RLS de tickets, respuestas, ARCO y `generated_report` con Usuario A vs Usuario B.

## Fase BK-06 — dispositivos y actuadores

- [ ] Definir provisioning físico y credenciales MQTT por dispositivo.
- [ ] Persistir estados `ONLINE/OFFLINE` y `last_seen` reales.
- [ ] Crear comandos de actuadores con permisos, `correlationId`, ACK, timeout y auditoría.
- [ ] Antes de producción, agregar autenticación, ACL por topic y TLS en Mosquitto.

## Operación y calidad

- [ ] Agregar `auditCleanupJob` usando `audit.prc_clean_old_audit_logs(...)`.
- [ ] Agregar readiness separado de liveness para PostgreSQL y MQTT.
- [ ] Añadir `requestId` y logging estructurado sin secretos.
- [ ] Limitar rangos de consumo, paginación, filtros y ordenamiento en consultas grandes.
- [ ] Ejecutar integración con PostgreSQL real, E2E, backup y restore.
- [ ] Reordenar carpetas solo después de estabilizar comportamiento y pruebas.

## Rectificación frontend — 2026-09-07

Estas observaciones ya fueron atendidas en `FT_HS/Web`:

- [x] El hogar activo se centraliza en el layout autenticado y se comparte con dashboard, dispositivos, reportes, metas, alertas y vacaciones.
- [x] Metas consulta `GET /api/v1/goals/:goalId/progress`; el porcentaje ya no se calcula con el consumo mensual del navegador.
- [x] Alertas consulta pendientes, historial y umbrales desde el backend; los límites se muestran en m³.
- [x] Configuración carga perfil, fecha de registro, hogares y dispositivos desde la API.
- [x] Configuración dejó de mostrar sesiones, tokens, exportación, eliminación, foto y switches de privacidad ficticios, porque esas rutas todavía no existen en BK_HS.
- [x] Reportes dejó de ofrecer exportación y administración de tarifas ficticias; mantiene únicamente consultas disponibles.
- [x] Idioma y moneda se guardan juntos en `/users/me/preferences` antes de cambiar la interfaz.
- [x] Se añadió corrección de textos históricos con codificación dañada para evitar mostrar `Ã`, `Â` o `â`.

Pendientes que siguen siendo reales y no se marcaron como terminados: revocación de sesiones remotas, Privacy/ARCO, exportación de datos, reportes descargables, persistencia MQTT y tiempo real. No se deben volver a simular en el frontend hasta publicar sus endpoints.

## Orden recomendado

1. Contexto de autorización y sesiones.
2. Recuperación de contraseña y logout seguro.
3. Metas, alertas y tickets alineados con BD.
4. Pruebas RLS/RBAC con usuarios reales.
5. Contrato `messageId` y migración IoT.
6. Ingesta MQTT con `hidro_smart_ingest`.
7. Estados reales de dispositivos y consumo reciente.
8. Privacy/ARCO, reportes y eventos SMTP.
9. Actuadores y endurecimiento de Mosquitto.
10. E2E, backup/restore y reorganización final.
