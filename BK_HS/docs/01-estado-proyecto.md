# Estado del proyecto HidroSmart

Fecha de revisión: 2026-09-15.

## Estado actual

> Actualización 2026-09-15: el flujo de dispositivos ya persiste `location`, `hardwareId`, `wifi_ssid`, `last_ip` y estados de aprovisionamiento; permite editar nombre/ubicación/umbral, registrar y vincular por código MQTT, consultar historial y provisionar por BLE. Las consultas avanzadas de consumo ya están versionadas y conectadas a Dashboard, Consumo y Reportes. Liquibase tiene 223 changesets aplicados y el backend tiene 163 pruebas unitarias aprobadas.

| Área | Estado |
|---|---|
| Docker integrado | Compose configurado; requiere Docker Desktop activo para ejecutar |
| PostgreSQL/Liquibase | 223 changesets aplicados; `validate/update/status` exitosos en la última verificación |
| Autenticación y sesiones | Implementado | Registro pendiente hasta verificar correo; JWT y sesiones activas después de verificar |
| Hogares y miembros | Rutas implementadas; validar cada pantalla |
| Dispositivos | Rutas implementadas y vinculadas al modelo BD |
| Consumo y costos | Rutas implementadas sobre agregados BD; series avanzadas por día, hora, mes y ubicación |
| Alertas | Rutas de reglas, umbrales, historial y estado implementadas |
| Metas/vacaciones | Rutas implementadas |
| Soporte | Rutas de tickets y respuestas implementadas |
| Roles/auditoría | Rutas protegidas implementadas |
| Frontend | Build, cliente HTTP centralizado y rutas principales conectadas; quedan pruebas funcionales y estados visuales |
| MQTT | Transporte, parser, persistencia, estados e idempotencia implementados |
| Actuadores | API REST, comandos MQTT, persistencia de estado y ACK implementados |

## Qué ya funciona

- La API está montada bajo `/api/v1` y el health está en `/health`.
- Los agregados de consumo, costos y reportes PDF/Excel rechazan periodos mayores a 366 días para proteger consultas grandes.
- La base de datos aplica funciones, roles, grants y RLS.
- El frontend usa Nginx y `/api/v1` en Docker.
- El backend conecta con Mosquitto y recibe telemetría en los topics vigentes; el payload del ESP32 con RSSI negativo ya se normaliza y persiste.
- El firmware versionado genera el `hardwareId` del eFuse, activa BLE con nombre `HidroSmart-XXXXXX`, guarda hasta cinco perfiles Wi-Fi/MQTT y publica `mqttMessageId`.
- El frontend web y el development build móvil pueden leer la identidad BLE y enviar la configuración sin enviar la contraseña a la API.
- La configuración del dispositivo reúne datos generales, red Wi-Fi, IP, RSSI,
  estado Bluetooth y el historial en un único apartado; la opción BLE se oculta
  al confirmarse la conexión Wi-Fi.
- El registro, login, refresh, logout, cambio y recuperación de contraseña están conectados al backend.
- El registro envía verificación de correo, devuelve `202` y no abre sesión hasta
  que la cuenta pase de `Pending` a `Active`.
- El perfil persiste avatar JPG/PNG/WebP de hasta 2 MB y teléfonos de hasta 60
  caracteres.

## Brechas actuales

1. La ingesta MQTT base ya está conectada mediante pool y roles técnicos separados; la prueba con el payload del ESP32 ya pasó y falta probar la placa física completa.
2. El firmware nuevo envía `mqttMessageId`; el backend mantiene compatibilidad temporal para el firmware anterior y evita duplicados por QoS 1.
3. La precisión de consumo ya está versionada en `NUMERIC(14,3)` para litros y `NUMERIC(14,6)` para m³; falta validarla con mediciones del hardware real.
4. El frontend aún tiene textos directos, estados visuales y pruebas manuales de roles por completar.
5. React Router ya está montado y las subrutas autenticadas cargan el layout; quedan pruebas de deep links y navegación por permiso.
6. Los comandos MQTT de actuadores ya parten de una operación REST, se persisten, vencen sin ACK y dejan auditoría; falta probar confirmación con un ESP32 real y asegurar Mosquitto para producción.

## Evidencia

- Backend: 163 pruebas unitarias, `npm run check`, `npm run lint`, MQTT local y flujo auth real aprobados.
- Frontend: formato y build aprobados.
- BD: rutas de changelog corregidas, migraciones aplicadas y conexión `hidro_smart_app` → PostgreSQL verificada.
- Integración autenticada externa: se ejecuta solo con credenciales de prueba configuradas.

## Documentos que prevalecen

- API: `03-endpoints.md`.
- Integración: `00-integracion-front-back-bd.md`.
- MQTT: `14-mqtt-protocol.md` y `13-flujo-datos-iot.md`.
- Pendientes: `pendientes-proyecto.md`.
