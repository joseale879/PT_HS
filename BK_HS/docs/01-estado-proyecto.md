# Estado del proyecto HidroSmart

Fecha de revisión: 2026-09-14.

## Estado actual

| Área | Estado |
|---|---|
| Docker integrado | Compose configurado; requiere Docker Desktop activo para ejecutar |
| PostgreSQL/Liquibase | 206 changesets aplicados; `validate/update/status` exitosos en la última verificación |
| Autenticación y sesiones | Implementado |
| Hogares y miembros | Rutas implementadas; validar cada pantalla |
| Dispositivos | Rutas implementadas y vinculadas al modelo BD |
| Consumo y costos | Rutas implementadas sobre agregados BD |
| Alertas | Rutas de reglas, umbrales, historial y estado implementadas |
| Metas/vacaciones | Rutas implementadas |
| Soporte | Rutas de tickets y respuestas implementadas |
| Roles/auditoría | Rutas protegidas implementadas |
| Frontend | Build, cliente HTTP centralizado y rutas principales conectadas; quedan pruebas funcionales y estados visuales |
| MQTT | Transporte, parser, persistencia e idempotencia implementados |
| Actuadores | API REST, comandos MQTT, persistencia de estado y ACK implementados |

## Qué ya funciona

- La API está montada bajo `/api/v1` y el health está en `/health`.
- Los agregados de consumo, costos y reportes PDF/Excel rechazan periodos mayores a 366 días para proteger consultas grandes.
- La base de datos aplica funciones, roles, grants y RLS.
- El frontend usa Nginx y `/api/v1` en Docker.
- El backend conecta con Mosquitto y recibe telemetría en los topics vigentes.
- El registro, login, refresh, logout, cambio y recuperación de contraseña están conectados al backend.

## Brechas actuales

1. La ingesta MQTT base ya está conectada mediante pool y roles técnicos separados; falta probarla con un ESP32 real y confirmar la precisión requerida por el firmware.
2. `mqttMessageId` es obligatorio para persistir y evita duplicados por QoS 1.
3. La columna de consumo usa `NUMERIC(10,2)`; si se requieren muestras menores a 0.01 L debe planificarse una migración específica de precisión.
4. El frontend aún tiene textos directos, estados visuales y pruebas manuales de roles por completar.
5. React Router ya está montado y las subrutas autenticadas cargan el layout; quedan pruebas de deep links y navegación por permiso.
6. Los comandos MQTT de actuadores ya parten de una operación REST, se persisten, vencen sin ACK y dejan auditoría; falta probar confirmación con un ESP32 real y asegurar Mosquitto para producción.

## Evidencia

- Backend: 131 pruebas unitarias, `npm run check`, `npm run lint`, MQTT local y flujo auth real aprobados.
- Frontend: formato y build aprobados.
- BD: rutas de changelog corregidas, migraciones aplicadas y conexión `hidro_smart_app` → PostgreSQL verificada.
- Integración autenticada externa: se ejecuta solo con credenciales de prueba configuradas.

## Documentos que prevalecen

- API: `03-endpoints.md`.
- Integración: `00-integracion-front-back-bd.md`.
- MQTT: `14-mqtt-protocol.md` y `13-flujo-datos-iot.md`.
- Pendientes: `pendientes-proyecto.md`.
