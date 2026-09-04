# Estado del proyecto HidroSmart

Fecha de revisión: 2026-09-04.

## Estado actual

| Área | Estado |
|---|---|
| Docker integrado | Operativo |
| PostgreSQL/Liquibase | Operativo; 166 changesets actualizados |
| Autenticación y sesiones | Implementado |
| Hogares y miembros | Rutas implementadas; validar cada pantalla |
| Dispositivos | Rutas implementadas y vinculadas al modelo BD |
| Consumo y costos | Rutas implementadas sobre agregados BD |
| Alertas | Rutas de reglas, umbrales, historial y estado implementadas |
| Metas/vacaciones | Rutas implementadas |
| Soporte | Rutas de tickets y respuestas implementadas |
| Roles/auditoría | Rutas protegidas implementadas |
| Frontend | Build y cliente HTTP centralizado aprobados; integración por pantalla en curso |
| MQTT | Transporte, parser y handlers implementados; persistencia pendiente |
| Actuadores | Publisher preparado; rutas y casos de uso pendientes |

## Qué ya funciona

- La API está montada bajo `/api/v1` y el health está en `/health`.
- La base de datos aplica funciones, roles, grants y RLS.
- El frontend usa Nginx y `/api/v1` en Docker.
- El backend conecta con Mosquitto y recibe telemetría en los topics vigentes.
- El registro, login, refresh, logout, cambio y recuperación de contraseña están conectados al backend.

## Brechas actuales

1. MQTT recibe y normaliza, pero `reading.handler` todavía no llama a un caso de uso de ingestión ni a un repositorio.
2. La lectura MQTT aún no se resuelve contra `device.device.code` ni se guarda en `consumption.sensor_reading`.
3. La columna de consumo usa `NUMERIC(10,2)` y debe ganar precisión antes de almacenar muestras de `0.040 L`.
4. El frontend conserva algunas pantallas/indicadores de presentación y el rol de navegación está fijado como `user` en varios puntos.
5. No hay rutas URL/deep links completas; la navegación actual se controla con estado de React.
6. Los comandos MQTT de actuadores todavía no parten de una operación REST/caso de uso.

## Evidencia

- Backend: 82 pruebas unitarias, `npm run check` y MQTT local aprobados.
- Frontend: formato y build aprobados.
- BD: Liquibase `validate` y `status --verbose` aprobados.
- Integración autenticada externa: se ejecuta solo con credenciales de prueba configuradas.

## Documentos que prevalecen

- API: `03-endpoints.md`.
- Integración: `00-integracion-front-back-bd.md`.
- MQTT: `14-mqtt-protocol.md` y `13-flujo-datos-iot.md`.
- Pendientes: `pendientes-proyecto.md`.
