# HidroSmart

HidroSmart es una plataforma local para monitoreo inteligente de consumo de agua. El repositorio se divide en base de datos, backend, frontend web y conexión IoT mediante ESP32 + MQTT.

## Estado actualizado

Revisión: 2026-09-09.

- PostgreSQL y Liquibase están operativos para la base local.
- El backend Express se conecta a PostgreSQL y expone la API REST bajo `/api/v1`.
- El frontend React/Vite se compila y se sirve por Nginx en Docker.
- Registro, autenticación, sesiones, hogares, dispositivos, consumo, alertas, metas, vacaciones, soporte, tarifas, roles y auditoría tienen rutas de backend implementadas.
- Mosquitto funciona como broker MQTT local de desarrollo.
- El backend tiene cliente MQTT, subscriber, parser y handlers para recibir telemetría del ESP32.
- La integración MQTT esperada queda así: `ESP32 -> Mosquitto -> Backend -> PostgreSQL -> API -> Frontend`.
- La lectura MQTT se persiste en `consumption.sensor_reading` usando `PostgresReadingIngestRepository`, siempre que exista un dispositivo activo, por ejemplo `ESP32-001`, asociado a un hogar activo.
- El ESP32 todavía no vive dentro del repositorio como firmware formal; se conecta publicando en el topic MQTT documentado.

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

Dentro de Docker, el backend usa `postgres:5432`, `mailpit:1025` y `mosquitto:1883`. El navegador no accede directamente a PostgreSQL ni al broker MQTT: usa Nginx y la API.

## Variables de entorno

Copia `.env.example` a `.env` y completa valores locales. No publiques `.env` ni contraseñas.

Variables mínimas importantes:

```env
NODE_ENV=development
POSTGRES_DB=hidro_smart
POSTGRES_USER=hidro_smart_admin
POSTGRES_PASSWORD=CAMBIA_ESTA_CONTRASENA_POSTGRES
POSTGRES_PORT=5433

DB_USER=hidro_smart_app
DB_PASSWORD=CAMBIA_ESTA_CONTRASENA_BACKEND
DB_INGEST_USER=hidro_smart_ingest
DB_INGEST_PASSWORD=CAMBIA_ESTA_CONTRASENA_INGEST
DB_INGEST_POOL_MAX=5

BACKEND_PORT=3000
FRONTEND_PORT=5173
CORS_ORIGIN=http://localhost:5173,http://localhost

JWT_SECRET=CAMBIA_ESTE_SECRETO_JWT_LARGO_Y_ALEATORIO
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=hidro-smart-api
JWT_AUDIENCE=hidro-smart-web

FRONTEND_URL=http://localhost:5173
PASSWORD_RESET_URL=http://localhost:5173

SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="HidroSmart <no-reply@localhost>"
MAILPIT_SMTP_PORT=1025
MAILPIT_UI_PORT=8025

MQTT_PORT=1883
MQTT_BROKER_URL=mqtt://mosquitto:1883
MQTT_CLIENT_ID=hidrosmart-backend
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_QOS=1
MQTT_RECONNECT_PERIOD_MS=3000
MQTT_CONNECT_TIMEOUT_MS=10000
```

## Inicio local recomendado

Desde la raíz del proyecto, donde está `docker-compose.yml`:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y cambia como mínimo:

```text
POSTGRES_PASSWORD
DB_PASSWORD
DB_INGEST_PASSWORD
JWT_SECRET
```

Levanta primero PostgreSQL, bootstrap, Mosquitto y Mailpit:

```powershell
docker compose --env-file .env up -d postgres db-bootstrap mosquitto mailpit
```

Valida Liquibase:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
```

Aplica migraciones:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase update
```

Levanta backend y frontend:

```powershell
docker compose --env-file .env up -d --build backend frontend
```

Verifica contenedores:

```powershell
docker compose --env-file .env ps
```

Verifica health:

```powershell
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:5173/health
```

## Comandos rápidos para correr todo

Si ya tienes `.env` listo y la base ya fue migrada:

```powershell
docker compose --env-file .env up -d --build
```

Ver logs del backend:

```powershell
docker compose --env-file .env logs -f backend
```

Ver logs filtrando MQTT:

```powershell
docker compose --env-file .env logs -f backend | findstr MQTT
```

Bajar servicios:

```powershell
docker compose --env-file .env down
```

Bajar servicios y borrar volumen de base de datos local:

```powershell
docker compose --env-file .env down -v
```

## Liquibase

Liquibase se ejecuta bajo demanda con el perfil `tooling`:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env --profile tooling run --rm liquibase update
```

El servicio `db-bootstrap` prepara los roles de aplicación e ingesta:

```text
hidro_smart_app
hidro_smart_ingest
```

El backend no debe conectarse con el usuario administrador de Liquibase.

## MQTT

El broker local es Mosquitto. El backend se suscribe a:

```text
hidrosmart/devices/+/telemetry
hidrosmart/devices/+/status
hidrosmart/devices/+/actuators/+/status
```

El ESP32 debe publicar telemetría en:

```text
hidrosmart/devices/ESP32-001/telemetry
```

Payload recomendado:

```json
{
  "deviceId": "ESP32-001",
  "flowRateLpm": 2.4,
  "consumptionLiters": 0.04,
  "totalLiters": 3.407,
  "pulses": 18,
  "sampleIntervalSeconds": 1,
  "signalQuality": -56,
  "timestamp": "2026-09-09T15:30:00Z"
}
```

Flujo esperado:

```text
ESP32 -> Mosquitto -> Backend MQTT -> PostgresReadingIngestRepository -> consumption.sensor_reading
```

Para que la lectura se guarde, el código del dispositivo del topic debe existir en la base:

```text
ESP32-001
```

Y debe estar asociado a un hogar activo.

## Prueba MQTT sin ESP32

Terminal 1: dejar viendo logs del backend.

```powershell
docker compose --env-file .env logs -f backend
```

Terminal 2: publicar telemetría de prueba en Mosquitto.

```powershell
docker compose --env-file .env exec mosquitto mosquitto_pub -h localhost -p 1883 -t "hidrosmart/devices/ESP32-001/telemetry" -m '{"deviceId":"ESP32-001","flowRateLpm":2.4,"consumptionLiters":0.04,"totalLiters":3.407,"pulses":18,"sampleIntervalSeconds":1,"signalQuality":-56}'
```

En los logs del backend debe aparecer:

```text
[MQTT] Lectura de telemetría recibida
[MQTT] Lectura de telemetría persistida
```

Si aparece `Lectura recibida pero no persistida`, falta inyectar `PostgresReadingIngestRepository` en `BK_HS/server.js`.

Si aparece `No existe un dispositivo activo vinculado a un hogar activo`, falta crear o asociar el dispositivo `ESP32-001`.

## Verificar datos guardados en PostgreSQL

Entrar a PostgreSQL:

```powershell
docker compose --env-file .env exec postgres psql -U hidro_smart_admin -d hidro_smart
```

Consultar últimas lecturas:

```sql
SELECT
  reading_id,
  device_id,
  home_id,
  recorded_at,
  consumption_liters,
  consumption_m3,
  flow_rate_lpm,
  total_liters,
  pulses,
  sample_interval_seconds,
  created_at
FROM consumption.sensor_reading
ORDER BY recorded_at DESC
LIMIT 10;
```

También puedes ejecutar la consulta directa desde PowerShell:

```powershell
docker compose --env-file .env exec postgres psql -U hidro_smart_admin -d hidro_smart -c "SELECT reading_id, device_id, home_id, recorded_at, consumption_liters, flow_rate_lpm, total_liters, pulses FROM consumption.sensor_reading ORDER BY recorded_at DESC LIMIT 10;"
```

## Conexión desde ESP32

En el código del ESP32 usa:

```cpp
const char* DEVICE_CODE = "ESP32-001";
const char* MQTT_TELEMETRY_TOPIC = "hidrosmart/devices/ESP32-001/telemetry";
```

El broker no debe ser `localhost`. Desde el ESP32 debes poner la IP local de tu PC.

En Windows:

```powershell
ipconfig
```

Busca:

```text
Dirección IPv4
```

Ejemplo:

```cpp
const char* MQTT_SERVER = "192.168.1.105";
const int MQTT_PORT = 1883;
```

## API y frontend

El frontend centraliza las llamadas en:

```text
FT_HS/Web/src/shared/http/apiClient.ts
```

En Docker se compila con:

```text
VITE_API_URL=/api/v1
```

Nginx reenvía `/api/` al backend. En desarrollo directo puede usarse:

```text
VITE_API_URL=http://localhost:3000/api/v1
```

Los grupos REST montados son:

```text
/auth
/homes
/devices
/consumption
/users
/tariffs
/alerts
/goals
/vacation
/roles
/support
/audit
```

El frontend no debe conectarse directamente a MQTT ni a PostgreSQL. Debe leer datos por la API del backend.

## Pruebas conocidas

Comandos útiles del backend:

```powershell
cd BK_HS
npm install
npm test
npm run check
```

Comandos útiles del frontend:

```powershell
cd FT_HS/Web
npm install
npm run format:check
npm run build
```

Comandos útiles de base de datos:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
```

## Documentación principal

- Estado integral: `BK_HS/docs/00-estado-actual.md`.
- Integración BD/backend/frontend: `BK_HS/docs/00-integracion-front-back-bd.md`.
- Endpoints: `BK_HS/docs/03-endpoints.md`.
- MQTT: `BK_HS/docs/14-mqtt-protocol.md` y `BK_HS/docs/13-flujo-datos-iot.md`.
- Pendientes: `BK_HS/docs/pendientes-proyecto.md`.
- Diagnóstico de BD: `BD_HS/docs/diagnostico-actual.md`.
- Integración web: `FT_HS/Web/INTEGRACION.md`.

Los Compose individuales de `BD_HS` y `BK_HS` se conservan por compatibilidad. Para validar el sistema completo usa el Compose de la raíz del proyecto.
