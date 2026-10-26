# Auditoria P1 â€” estado de correcciones

Fecha: 2026-09-13.

## Corregido en esta revision

| Hallazgo | Estado |
|---|---|
| Asignacion activa duplicada de un dispositivo | Corregido con indice unico parcial por `device_id`. |
| Asignaciones IoT ambiguas | La funcion de ingesta rechaza mas de una relacion activa. |
| Validacion fisica de sensores | Corregida en parser y restricciones SQL: caudal, pulsos, intervalos, RSSI, bateria, voltaje, temperatura y porcentajes. |
| Timestamps IoT | `measured_at` y `received_at` se conservan por separado; lecturas futuras mayores a 5 minutos se rechazan y las antiguas quedan marcadas como sospechosas. |
| Metricas MQTT no persistidas | La ingesta guarda flujo, total, pulsos, intervalo, RSSI, calidad, bateria, voltaje y temperatura. |
| Estado administrativo/conectividad | `status` conserva el estado administrativo y `connectivity_status` registra ONLINE/OFFLINE/DEGRADED/UNKNOWN. |
| Payload MQTT ilimitado | Se limita a 16 KiB por defecto mediante `MQTT_MAX_PAYLOAD_BYTES`. |
| Jobs duplicados | Refresh de vistas y alertas usan advisory locks de PostgreSQL. |
| Verificacion de correo | La pantalla muestra exito, expiracion, invalidez, error temporal y reenvio. |
| Rutas `/app` desconocidas | Ahora muestran 404 en lugar de renderizar el Dashboard. |
| Calidad y dependencias frontend | `typecheck`, `lint` y build definidos; React Router alineado a 7.18.3; npm es el unico gestor; paquete renombrado a `@hidrosmart/web`. |

## Verificacion

- Liquibase: `validate` y `update` correctos; 217 changesets aplicados.
- Backend: `npm run check` correcto y 156/156 pruebas unitarias exitosas.
- Frontend: `npm run typecheck` y `npm run build` correctos.
- Docker: PostgreSQL, backend, frontend y Mosquitto activos.
- Ingesta bajo `hidro_smart_ingest`: primera lectura insertada y repeticiÃ³n ignorada por `mqttMessageId`.

## P1 que continua pendiente

- Retencion/particionamiento mensual de telemetria y archivado.
- Flujo Privacy/ARCO implementado en backend; exportaciÃ³n JSON y reportes PDF/Excel disponibles. La rectificaciÃ³n/eliminaciÃ³n completa sigue pendiente de cerrar el flujo de producto.
- Generación, almacenamiento, historial y descarga de reportes PDF/Excel ya implementados y probados en Docker.
- Persistencia de reintentos y dead-letter para comandos de actuadores; el envío, estado y ACK básico ya están implementados.
- Backend de administraciÃ³n de usuarios y sesiones ya implementado; la gestiÃ³n visual del frontend tambiÃ©n quedÃ³ conectada en `FT_HS/frontend`.
- Healthcheck detallado, logs estructurados y metricas operativas.
- Pruebas de integración reproducibles contra PostgreSQL/Mosquitto; la matriz actual ejecuta 6 pruebas sin omisiones cuando se siembran las cuentas de integración.
- Completar pantallas administrativas, quitar el formulario de registro muerto y terminar i18n/DTOs.
- Migrar refresh token a cookie HttpOnly y access token a memoria para produccion.
