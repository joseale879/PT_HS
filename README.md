# HidroSmart

HidroSmart es una plataforma local para monitoreo inteligente de consumo de agua. El repositorio se divide en base de datos, backend, frontend web y, próximamente, firmware ESP32.

## Estado verificado

Revisión: 2026-09-04.

- PostgreSQL y Liquibase están operativos; la base local está actualizada con 166 changesets.
- El backend Express está conectado a PostgreSQL y expone la API REST bajo `/api/v1`.
- El frontend React/Vite está compilado y servido por Nginx en Docker.
- Registro, autenticación, sesiones, hogares, dispositivos, consumo, alertas, metas, vacaciones, soporte, tarifas, roles y auditoría tienen rutas de backend implementadas.
- El transporte MQTT, el cliente, el subscriber, el parser y los handlers básicos están implementados y ya aceptan una telemetría de prueba.
- La persistencia de una lectura MQTT en `consumption.sensor_reading` todavía no está cerrada: falta resolver de forma segura `deviceCode -> device_id -> home_id`, conectar el caso de uso de ingestión y ajustar permisos/precisión.
- El código del ESP32 aún no forma parte de este repositorio; el protocolo documentado queda listo para compararlo cuando se entregue el firmware.

## Estructura

| Carpeta | Responsabilidad |
|---|---|
| `BD_HS` | PostgreSQL, Liquibase, tablas, funciones, vistas, RLS, roles y grants |
| `BK_HS` | API Node.js/Express, autenticación, casos de uso, repositorios, MQTT y Docker |
| `FT_HS/Web` | Frontend React/Vite, cliente HTTP, pantallas y Nginx |
| `FT_HS/mobile` | Cliente móvil/WebView en estado de preparación |
| `docker-compose.yml` | Orquestación local integrada |

## Servicios locales

| Servicio | Dirección desde Windows | Uso |
|---|---|---|
| Frontend | `http://localhost:5173` | Aplicación web |
| Backend | `http://localhost:3000` | API REST y health |
| Health backend | `http://localhost:3000/health` | Comprobación directa |
| Health frontend | `http://localhost:5173/health` | Comprobación a través de Nginx |
| PostgreSQL | `localhost:5433` | Acceso externo de desarrollo |
| Mailpit | `http://localhost:8025` | Bandeja de correo local |
| MQTT | `localhost:1883` | Broker Mosquitto sin TLS para desarrollo |

Dentro de Docker, el backend usa `postgres:5432`, `mailpit:1025` y `mosquitto:1883`. El navegador no accede directamente a PostgreSQL ni al broker: usa Nginx y la API.

## Inicio integrado

1. Copia `.env.example` a `.env` y completa únicamente valores locales. No publiques `.env` ni contraseñas.
2. Levanta la pila:

   ```powershell
   docker compose --env-file .env up -d --build
   ```

3. Verifica:

   ```powershell
   docker compose ps
   Invoke-WebRequest http://localhost:3000/health
   Invoke-WebRequest http://localhost:5173/health
   ```

El correo usa Mailpit por defecto. Gmail puede configurarse en el `.env` mediante `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`; las credenciales reales deben permanecer solo en archivos locales.

## Liquibase

Liquibase se ejecuta bajo demanda con el perfil `tooling`:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env --profile tooling run --rm liquibase update
```

`db-bootstrap` prepara el rol de aplicación `hidro_smart_app`. El servicio backend no debe conectarse con el administrador de Liquibase.

## API y frontend

El frontend centraliza las llamadas en `FT_HS/Web/src/shared/http/apiClient.ts`. En Docker se compila con `VITE_API_URL=/api/v1` y Nginx reenvía `/api/` al backend. En desarrollo directo puede usarse `VITE_API_URL=http://localhost:3000/api/v1`.

Los grupos REST montados son: `/auth`, `/homes`, `/devices`, `/consumption`, `/users`, `/tariffs`, `/alerts`, `/goals`, `/vacation`, `/roles`, `/support` y `/audit`. La lista detallada y los permisos están en `BK_HS/docs/03-endpoints.md` y `BK_HS/docs/endpoints-por-rol.md`.

La navegación actual del frontend es interna mediante estado de React; no hay todavía rutas URL/deep links con React Router. Algunas tarjetas visuales del dashboard siguen usando valores de presentación y deben sustituirse por datos reales antes de declarar esa pantalla completamente integrada.

## MQTT

El broker local es Mosquitto. El backend se suscribe a:

```text
hidrosmart/devices/+/telemetry
hidrosmart/devices/+/status
hidrosmart/devices/+/actuators/+/status
```

La telemetría mínima recomendada para el ESP32 es:

```json
{
  "flowRateLpm": 2.4,
  "consumptionLiters": 0.04,
  "totalLiters": 3.407,
  "pulses": 18,
  "signalQuality": -56,
  "timestamp": "2026-09-04T15:30:00Z"
}
```

El contrato completo, normalización y comandos de prueba están en `BK_HS/docs/14-mqtt-protocol.md`. La ruta MQTT actual termina en el parser y handler de lectura; aún no inserta automáticamente en PostgreSQL.

## Pruebas conocidas

- Backend: `npm test` — 82 pruebas unitarias aprobadas.
- Backend: `npm run check` — aprobado.
- Frontend: `npm run format:check` y `npm run build` — aprobados.
- Base de datos: `validate` y `status --verbose` — aprobados.
- MQTT: publicación local de telemetría válida recibida y normalizada por el backend — aprobada.
- Pruebas de integración externas: omitidas si no se configuran credenciales/`RUN_INTEGRATION`.

## Documentación principal

- Estado integral: `BK_HS/docs/00-estado-actual.md`.
- Integración BD/backend/frontend: `BK_HS/docs/00-integracion-front-back-bd.md`.
- Endpoints: `BK_HS/docs/03-endpoints.md`.
- MQTT: `BK_HS/docs/14-mqtt-protocol.md` y `BK_HS/docs/13-flujo-datos-iot.md`.
- Pendientes: `BK_HS/docs/pendientes-proyecto.md`.
- Diagnóstico de BD: `BD_HS/docs/diagnostico-actual.md`.
- Integración web: `FT_HS/Web/INTEGRACION.md`.

Los Compose individuales de `BD_HS` y `BK_HS` se conservan por compatibilidad. Para validar el sistema completo usa el Compose de esta raíz.
