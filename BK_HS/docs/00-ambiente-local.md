# Ambiente local

Fecha de revisión: 2026-09-04.

La pila oficial de desarrollo se ejecuta desde el `docker-compose.yml` de la raíz. Los Compose individuales de BD y backend se conservan solo por compatibilidad.

## Servicios

| Servicio | Windows | Dentro de Docker |
|---|---|---|
| PostgreSQL | `localhost:5433` | `postgres:5432` |
| Backend | `localhost:3000` | `backend:3000` |
| Frontend | `localhost:5173` | `frontend:80` |
| Mailpit SMTP | `localhost:1025` | `mailpit:1025` |
| Mailpit UI | `localhost:8025` | `mailpit:8025` |
| Mosquitto | `localhost:1883` | `mosquitto:1883` |

## Preparación

Desde la raíz del proyecto:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build
```

El backend usa `DB_HOST=postgres`, `DB_PORT=5432`, `DB_USER=hidro_smart_app`, `MQTT_BROKER_URL=mqtt://mosquitto:1883` y Mailpit por defecto. Si se ejecuta el backend fuera de Docker, usa los valores de `BK_HS/.env.example`: PostgreSQL en `localhost:5433` y MQTT en `localhost:1883`.

## Verificación

```powershell
docker compose ps
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:5173/health
```

Liquibase se ejecuta bajo el perfil `tooling`; consulta `BD_HS/docs/guia-ejecucion-liquibase.md`.

## Correo

Mailpit es el proveedor local recomendado. Gmail se configura solo en el `.env` local mediante SMTP y sus credenciales no deben aparecer en la documentación, ejemplos ni código.

## MQTT

Mosquitto está configurado sin autenticación, sin TLS y sin persistencia para pruebas locales. El contrato vigente está en `BK_HS/docs/14-mqtt-protocol.md`.
