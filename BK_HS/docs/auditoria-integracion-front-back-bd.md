# AuditorÃ­a de integraciÃ³n Frontend -> Backend -> Base de datos

Fecha de revisiÃ³n: 2026-09-14.

## Resultado general

| Circuito | Resultado |
|---|---|
| Frontend -> backend | Centralizado y funcional para autenticaciÃ³n, sesiÃ³n y mÃ³dulos principales |
| Backend -> PostgreSQL | Rutas, repositorios y funciones alineados para los mÃ³dulos REST implementados |
| Backend -> permisos/RLS | Protegido por middleware, permisos PostgreSQL y acceso al hogar/recurso |
| Frontend -> API -> BD | Conectado en los mÃ³dulos principales; faltan estados visuales uniformes, pruebas manuales y E2E |
| MQTT -> PostgreSQL | Persistencia de telemetrÃ­a conectada mediante funciÃ³n protegida e idempotencia |

## Cliente HTTP real

La ubicaciÃ³n vigente es `FT_HS/frontend/src/shared/http/apiClient.ts`.
`FT_HS/frontend/src/shared/http/httpClient.ts` conserva el cliente comÃºn. La capa
centralizada resuelve la URL desde `VITE_API_URL`, agrega autorizaciÃ³n, procesa
errores y reintenta la renovaciÃ³n de sesiÃ³n ante un `401`.

## Flujos conectados

- Registro: `POST /api/v1/auth/register`.
- Login: `POST /api/v1/auth/login`.
- Refresh: `POST /api/v1/auth/refresh`.
- Logout: `POST /api/v1/auth/logout`.
- RecuperaciÃ³n: `POST /api/v1/auth/request-password-reset`,
  `GET /api/v1/auth/password-reset-context?resetToken=...` y
  `POST /api/v1/auth/reset-password`.
- Perfil y preferencias: `GET/PUT /api/v1/users/me` y
  `GET/PUT /api/v1/users/me/preferences`.
- Dashboard: resumen, consumo horario/diario, dispositivos y alertas.
- Hogares, miembros, dispositivos, consumo, tarifas, alertas, metas, vacaciones,
  soporte, privacidad, reportes PDF/Excel y administraciÃ³n.

## Contratos que deben conservarse

- RecuperaciÃ³n usa `{ resetToken, newPassword }`.
- El listado de dispositivos es `GET /api/v1/devices?homeId={uuid}&page={n}&pageSize={n}`;
  el backend valida el UUID, filtra por hogar autorizado y entrega paginaciÃ³n.
- El frontend debe usar UUID como texto para `userId`, `homeId` y `deviceId`.
- La autorizaciÃ³n del backend prevalece sobre cualquier rol local de la interfaz.
- El navegador no accede directamente a PostgreSQL, Mosquitto ni SMTP.

## MQTT

El circuito IoT es `ESP32 -> Mosquitto -> MqttSubscriber -> parser -> handler ->
IngestReading -> PostgreSQL`. La recepciÃ³n, normalizaciÃ³n, persistencia e
idempotencia estÃ¡n conectadas. Falta completar tiempo real del frontend, probar
con firmware fÃ­sico y cerrar la precisiÃ³n de `consumption_liters`.

## ConclusiÃ³n

La autenticaciÃ³n recorre el circuito completo. La API REST y la base estÃ¡n
alineadas en los mÃ³dulos implementados, y la persistencia MQTT estÃ¡ cerrada en
backend/BD para el alcance local. La matriz local de roles/RLS ya estÃ¡ probada;
el siguiente cierre es validar estados del frontend, Gmail real y el flujo con
firmware real.
