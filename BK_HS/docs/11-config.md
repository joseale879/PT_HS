# ConfiguraciÃ³n actual del backend

Fecha de revisiÃ³n: 2026-09-14.

Este documento refleja los nombres de variables y archivos que existen en el backend actual. Redis no forma parte de la pila integrada actual; no se debe agregar como dependencia hasta que exista una decisiÃ³n y un servicio real.

## Archivos reales

- `src/config/env.js`: carga y normaliza variables de entorno.
- `src/config/mqtt.js`: configuraciÃ³n MQTT.
- `src/infrastructure/db.js`: pool PostgreSQL.
- `src/app.js`: creaciÃ³n de Express y montaje de rutas.
- `server.js`: arranque del servidor y servicios de infraestructura.

## Variables HTTP y aplicaciÃ³n

| Variable | Uso |
|---|---|
| `NODE_ENV` | entorno de ejecuciÃ³n |
| `PORT` | puerto HTTP del backend |
| `CORS_ORIGIN` | orÃ­genes permitidos |
| `APP_TIMEZONE` | zona horaria de negocio |
| `FRONTEND_URL` | URL pÃºblica del frontend |
| `PASSWORD_RESET_URL` | base de enlaces de recuperaciÃ³n |
| `MATERIALIZED_VIEWS_REFRESH_MS` | intervalo de refresco de vistas |
| `AUTH_RATE_LIMIT_WINDOW_MS` | ventana del rate limit de auth |
| `AUTH_RATE_LIMIT_MAX` | mÃ¡ximo de solicitudes de auth |

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

## SMTP de Gmail

El backend utiliza Nodemailer para enviar los eventos de correo mediante Gmail.
Configura únicamente en el `.env` local:

| Variable | Valor local |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` (STARTTLS) |
| `SMTP_USER` | tu cuenta Gmail |
| `SMTP_PASSWORD` | contraseña de aplicación de Gmail |
| `SMTP_FROM` | remitente permitido por la cuenta |

No se deben guardar credenciales reales en documentación, ejemplos ni código.

## MQTT

| Variable | Docker integrado | Backend directo |
|---|---|---|
| `MQTT_BROKER_URL` | `mqtt://mosquitto:1883` | `mqtt://localhost:1883` |
| `MQTT_CLIENT_ID` | `hidrosmart-backend` | valor local equivalente |
| `MQTT_USERNAME` | vacÃ­o en broker local | segÃºn broker |
| `MQTT_PASSWORD` | vacÃ­o en broker local | segÃºn broker |
| `MQTT_QOS` | `1` | `1` |
| `MQTT_RECONNECT_PERIOD_MS` | `3000` | configurable |
| `MQTT_CONNECT_TIMEOUT_MS` | `10000` | configurable |

El subscriber usa los topics definidos en `src/mqtt/topics.js`. La configuraciÃ³n del broker local estÃ¡ en `BK_HS/docker/mosquitto/mosquitto.conf` y permite anÃ³nimo solo para desarrollo.

## Frontend

El frontend usa `VITE_API_URL`:

- Docker: `/api/v1`, con Nginx como proxy hacia `backend:3000`.
- Desarrollo directo: `http://localhost:3000/api/v1`.

El navegador nunca debe usar `postgres:5432`, `localhost:5433` o `localhost:1883` como API de negocio.

## Archivos de entorno

- RaÃ­z: `.env` para el Compose integrado.
- Backend: `BK_HS/.env` para ejecuciÃ³n independiente.
- Web: `FT_HS/frontend/.env` para ejecuciÃ³n independiente.
- `.env.example` contiene plantillas sin secretos.

Los valores reales deben mantenerse fuera de Git.
