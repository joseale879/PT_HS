# Auditoría de integración Frontend -> Backend -> Base de datos

Fecha de revisión: 2026-09-04.

## Resultado general

| Circuito | Resultado |
|---|---|
| Frontend -> backend | Centralizado y funcional para autenticación, sesión y consultas usadas por el dashboard |
| Backend -> PostgreSQL | Rutas/repositorios alineados para los módulos REST implementados |
| Backend -> permisos/RLS | Protegido por middleware, permisos PostgreSQL y acceso al hogar/recurso |
| Frontend -> API -> BD completo | Parcial por pantallas aún no migradas y por persistencia MQTT pendiente |

## Cliente HTTP real

La ubicación vigente es `FT_HS/Web/src/shared/http/apiClient.ts`. `FT_HS/Web/src/shared/http/httpClient.ts` conserva el cliente común. La documentación antigua que menciona `src/services/apiClient.ts` ya no describe la estructura actual.

La capa centralizada resuelve la URL base desde `VITE_API_URL`, agrega autorización, procesa errores y reintenta la renovación de sesión ante un `401`.

## Flujos conectados

- Registro: `POST /api/v1/auth/register`.
- Login: `POST /api/v1/auth/login`.
- Refresh: `POST /api/v1/auth/refresh`.
- Logout: `POST /api/v1/auth/logout`.
- Recuperación: `POST /api/v1/auth/request-password-reset` y `POST /api/v1/auth/reset-password`.
- Perfil: `GET/PUT /api/v1/users/me`.
- Dashboard: resumen, consumo horario/diario, dispositivos y alertas mediante el cliente API.

## Módulos que requieren verificación por pantalla

Los métodos de API existen para hogares, miembros, dispositivos, consumo, tarifas, alertas, metas, vacaciones, soporte y auditoría. Cada pantalla debe comprobar que use el `homeId` real y maneje carga, vacío, error, permisos y actualización posterior.

Tener el método declarado en `apiClient` no demuestra que la vista ya esté conectada. El dashboard aún contiene indicadores visuales de presentación y no debe interpretarse como telemetría en tiempo real.

## Correcciones de contrato que deben conservarse

- Recuperación usa `{ resetToken, newPassword }`.
- El listado de dispositivos es `GET /api/v1/devices`; no se debe asumir que `?homeId=` filtra hasta que el backend lo implemente formalmente.
- El frontend debe usar UUID como texto para `userId`, `homeId` y `deviceId`.
- La autorización del backend prevalece sobre cualquier rol local de la interfaz.

## MQTT

El circuito IoT es `ESP32 -> Mosquitto -> MqttSubscriber -> parser -> handler`. La recepción y normalización están verificadas. La persistencia en `consumption.sensor_reading` y `device.device_telemetry_history` todavía no está conectada; por ello aún no existe un circuito `MQTT -> BD -> API -> frontend` comprobable.

## Conclusión

La autenticación ya recorre el circuito completo. La API REST y la base están alineadas en los módulos implementados, pero la integración visual debe terminarse pantalla por pantalla. La siguiente integración técnica es cerrar la persistencia MQTT después de resolver identidad del dispositivo, permisos, idempotencia y precisión.
