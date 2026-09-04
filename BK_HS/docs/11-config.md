# Configuración actual del backend

Fecha de revisión: 2026-09-04.

Este documento refleja los nombres de variables y archivos que existen en el backend actual. Redis no forma parte de la pila integrada actual; no se debe agregar como dependencia hasta que exista una decisión y un servicio real.

## Archivos reales

- `src/config/env.js`: carga y normaliza variables de entorno.
- `src/config/mqtt.js`: configuración MQTT.
- `src/infrastructure/db.js`: pool PostgreSQL.
- `src/app.js`: creación de Express y montaje de rutas.
- `server.js`: arranque del servidor y servicios de infraestructura.

## Variables HTTP y aplicación

| Variable | Uso |
|---|---|
| `NODE_ENV` | entorno de ejecución |
| `PORT` | puerto HTTP del backend |
| `CORS_ORIGIN` | orígenes permitidos |
| `APP_TIMEZONE` | zona horaria de negocio |
| `FRONTEND_URL` | URL pública del frontend |
| `PASSWORD_RESET_URL` | base de enlaces de recuperación |
| `MATERIALIZED_VIEWS_REFRESH_MS` | intervalo de refresco de vistas |
| `AUTH_RATE_LIMIT_WINDOW_MS` | ventana del rate limit de auth |
| `AUTH_RATE_LIMIT_MAX` | máximo de solicitudes de auth |

## PostgreSQL

| Variable | Docker integrado | Backend directo desde Windows |
|---|---|---|
| `DB_HOST` | `postgres` | `localhost` |
| `DB_PORT` | `5432` | `5433` |
| `DB_NAME` | `hidro_smart` | `hidro_smart` |
| `DB_USER` | `hidro_smart_app` | `hidro_smart_app` |
| `DB_PASSWORD` | secreto local | secreto local |
| `DB_POOL_MAX` | `10` por defecto | configurable |

El backend usa un pool y transacciones. No debe usar `hidro_smart_admin` para operaciones normales. El contexto `app.user_id` se establece para que PostgreSQL aplique RLS.

## JWT y sesiones

| Variable | Valor de desarrollo habitual |
|---|---|
| `JWT_SECRET` | secreto largo local |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `JWT_ISSUER` | `hidro-smart-api` |
| `JWT_AUDIENCE` | `hidro-smart-web` |

No se deben escribir secretos reales en el repositorio ni en `VITE_*`.

## SMTP

| Variable | Mailpit en Docker | Gmail u otro SMTP |
|---|---|---|
| `SMTP_HOST` | `mailpit` | host del proveedor |
| `SMTP_PORT` | `1025` | puerto del proveedor |
| `SMTP_SECURE` | `false` | según TLS del proveedor |
| `SMTP_USER` | vacío | usuario local |
| `SMTP_PASSWORD` | vacío | secreto local |
| `SMTP_FROM` | remitente local | remitente permitido |

El backend utiliza Nodemailer. En desarrollo se revisan los mensajes en `http://localhost:8025`; las credenciales SMTP reales solo se configuran en `.env` local.

## MQTT

| Variable | Docker integrado | Backend directo |
|---|---|---|
| `MQTT_BROKER_URL` | `mqtt://mosquitto:1883` | `mqtt://localhost:1883` |
| `MQTT_CLIENT_ID` | `hidrosmart-backend` | valor local equivalente |
| `MQTT_USERNAME` | vacío en broker local | según broker |
| `MQTT_PASSWORD` | vacío en broker local | según broker |
| `MQTT_QOS` | `1` | `1` |
| `MQTT_RECONNECT_PERIOD_MS` | `3000` | configurable |
| `MQTT_CONNECT_TIMEOUT_MS` | `10000` | configurable |

El subscriber usa los topics definidos en `src/mqtt/topics.js`. La configuración del broker local está en `BK_HS/docker/mosquitto/mosquitto.conf` y permite anónimo solo para desarrollo.

## Frontend

El frontend usa `VITE_API_URL`:

- Docker: `/api/v1`, con Nginx como proxy hacia `backend:3000`.
- Desarrollo directo: `http://localhost:3000/api/v1`.

El navegador nunca debe usar `postgres:5432`, `localhost:5433` o `localhost:1883` como API de negocio.

## Archivos de entorno

- Raíz: `.env` para el Compose integrado.
- Backend: `BK_HS/.env` para ejecución independiente.
- Web: `FT_HS/Web/.env` para ejecución independiente.
- `.env.example` contiene plantillas sin secretos.

Los valores reales deben mantenerse fuera de Git.
