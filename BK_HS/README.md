# HidroSmart Backend

Backend Node.js/Express con arquitectura modular y PostgreSQL.

## Estado actual

- API REST montada bajo `/api/v1`.
- Autenticación, sesiones, hogares, dispositivos, consumo, alertas, metas, vacaciones, soporte, roles y auditoría implementados.
- Cliente MQTT, subscriber, parser y handlers implementados.
- Persistencia de lecturas MQTT implementada con métricas, timestamps e idempotencia; los comandos de actuadores siguen pendientes.

## Ejecución integrada

Desde `PT_HS`, usa el flujo documentado en el README raíz. Para una base nueva:

```powershell
docker compose --env-file .env up -d postgres db-bootstrap mosquitto mailpit
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase update
docker compose --env-file .env up -d --build backend frontend
```

El backend usa `postgres:5432`, `mosquitto:1883` y `mailpit:1025` dentro de
Docker. El frontend se consume por `/api/v1` a través de Nginx.

## Ejecución independiente del backend

Con PostgreSQL disponible en `localhost:5433` y `BK_HS/.env` configurado:

```powershell
docker compose --env-file BK_HS/.env -f BK_HS/docker-compose.yml up -d mosquitto mailpit
Set-Location BK_HS
npm.cmd run check
npm.cmd test
npm.cmd start
```

En esta modalidad el backend usa `MQTT_BROKER_URL=mqtt://localhost:1883` y
`DB_HOST=localhost`, `DB_PORT=5433`.

## Documentación

Empieza en `docs/README.md`, `docs/00-estado-actual.md`, `docs/03-endpoints.md` y `docs/14-mqtt-protocol.md`.
