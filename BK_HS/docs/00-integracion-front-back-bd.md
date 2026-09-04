# Integración vigente: BD, backend y frontend

## Servicios locales

| Componente | URL o conexión |
|---|---|
| Frontend web | `http://localhost:5173` |
| Backend REST | `http://localhost:3000` |
| Health | `GET http://localhost:3000/health` |
| PostgreSQL desde Windows | `localhost:5433` |
| PostgreSQL entre contenedores | `postgres:5432` |

El frontend se configura con `VITE_API_URL`. El backend se configura con variables `DB_*`, `JWT_*`, `CORS_ORIGINS` y `SMTP_*`. Los valores reales solo viven en archivos `.env` locales; los archivos `.env.example` no contienen secretos.

Los JWT de acceso usan algoritmo HS256 explícito, `issuer`, `audience`, `sub`, `sid`, `typ=access` y expiración corta. El refresh token no es un JWT: es aleatorio, se almacena únicamente como hash en PostgreSQL y rota en cada renovación.

## Autenticación y correo

Implementado: registro, inicio de sesión, JWT, refresh tokens, logout, revocación de sesiones, cambio de contraseña y recuperación mediante token de un solo uso.

El único canal de correo es Gmail SMTP usando Nodemailer:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER`
- `SMTP_PASSWORD` como clave de aplicación
- `SMTP_FROM`

No forman parte del alcance: 2FA, SMS, Twilio, FCM, Redis y BullMQ.

## Perfil de usuario

La pantalla de configuración obtiene la cuenta activa mediante `GET /api/v1/users/me`. El backend devuelve nombre, correo, tipo y número de documento, teléfono, ciudad y estado. `PUT /api/v1/users/me` actualiza nombre, teléfono y ciudad; correo y documento permanecen inmutables.

## Hogares y membresías

La BD aplica RLS y el backend establece `app.user_id` en cada transacción. El flujo de membresía usa:

- `POST /api/v1/homes/:homeId/membership-requests`: usuario autenticado solicita ingreso.
- `GET /api/v1/homes/:homeId/membership-requests`: consulta solicitudes autorizadas.
- `PATCH /api/v1/homes/membership-requests/:requestId` con `{ "status": "Approved" | "Rejected" }`: dueño responde.

Al aprobar, PostgreSQL crea la relación del usuario como `Member`. Los permisos de propietario y las políticas RLS se validan en la base de datos.

## Auditoría administrativa

`GET /api/v1/audit/logs` está disponible únicamente para `Administrator` mediante el permiso `audit.read`. Acepta filtros por acción, tabla y rango de fechas, además de `page` y `pageSize`. El backend ejecuta `user_account.fn_list_audit_logs(...)` con `SECURITY DEFINER`; el rol de aplicación no tiene lectura directa sobre `audit.audit_log`.

## Validación actual

- Backend: 75 pruebas unitarias exitosas.
- Frontend: build Vite exitoso.
- Docker: backend, frontend y PostgreSQL saludables.

## Contratos transversales de la API

Las rutas de autenticacion tienen limite configurable por IP mediante `AUTH_RATE_LIMIT_WINDOW_MS` y `AUTH_RATE_LIMIT_MAX`; al superar el limite responden `429 TOO_MANY_REQUESTS` manteniendo el mismo contrato de error.

Las respuestas de error usan `{ error: { code, message }, meta: { requestId } }` y también devuelven `X-Request-Id`. Las respuestas paginadas mantienen `data` como arreglo y agregan:

```json
{ "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }
```

Parámetros disponibles en listados: `page`, `pageSize` (1–100), `sort`, `order=asc|desc`. Los filtros habilitados dependen del recurso: solicitudes `status`, tickets `status` y `priority`.

Actualmente se aplican a hogares, miembros, solicitudes de membresía, dispositivos, metas y tickets.

El historial de alertas se consulta con `GET /api/v1/alerts/home/:homeId/history` y acepta `status`, `from`, `to`, `page`, `pageSize`, `sort` y `order`. Las reglas `leak_detected`, `excessive_consumption` y `no_reading` se evalúan mediante triggers y el job periódico para dispositivos activos.

## Verificacion general 2026-09-03

- Backend: `npm test` aprobado con 75 pruebas y `npm run check` aprobado.
- Frontend: `npm run build` aprobado; queda una advertencia no bloqueante por bundle principal grande (~1.2 MB).
- Contenedores: PostgreSQL y backend saludables; frontend publicado en `http://localhost:5173`.
- Proxy: `GET http://localhost:5173/api/v1/homes` llega al backend y devuelve `401` sin token, confirmando que la ruta y la proteccion estan activas.
- Base de datos: Liquibase `validate` y `update` aprobados; el esquema esta actualizado con la función de auditoria protegida.
- Integracion funcional y RLS: las pruebas estan preparadas, pero permanecen omitidas hasta configurar `RUN_INTEGRATION=1`, una URL de base de datos y usuarios de prueba reales.

## Fuera de alcance pendiente

MQTT/ESP32, verificación de correo para activación de cuenta, reglas avanzadas de alertas, telemetría física, reportes productivos y auditoría completa.

## Hallazgos de revisión general

El núcleo de autenticación, perfil, membresías, dispositivos, consumo, alertas, metas, vacaciones y soporte tiene rutas en backend. Aún requieren integración progresiva con API real —sin datos de demostración— las pantallas web de hogares, dispositivos, vacaciones, soporte, reportes y auditoría. Las traducciones históricas de 2FA permanecen como texto no utilizado; el módulo y sus controles fueron retirados de la interfaz.
