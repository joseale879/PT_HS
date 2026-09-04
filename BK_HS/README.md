# HidroSmart Backend

Backend Node.js/Express con arquitectura modular y PostgreSQL.

## Estado actual

- API REST montada bajo `/api/v1`.
- Autenticación, sesiones, hogares, dispositivos, consumo, alertas, metas, vacaciones, soporte, roles y auditoría implementados.
- Cliente MQTT, subscriber, parser y handlers implementados.
- Persistencia de lecturas MQTT y comandos de actuadores todavía pendientes.

## Ejecución

Para la integración completa usa el Compose de la raíz:

```powershell
docker compose --env-file .env up -d --build
```

El backend usa `postgres:5432`, `mosquitto:1883` y `mailpit:1025` dentro de Docker. Ejecutado directamente desde Windows usa las variables de `BK_HS/.env.example`.

## Documentación

Empieza en `docs/README.md`, `docs/00-estado-actual.md`, `docs/03-endpoints.md` y `docs/14-mqtt-protocol.md`.
