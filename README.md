# HidroSmart

HidroSmart es una plataforma local para monitoreo inteligente de consumo de agua. El repositorio se divide en base de datos, backend, frontend unificado Web/Mobile y firmware ESP32.

## Estado verificado

RevisiÃ³n: 2026-09-14.

- PostgreSQL y Liquibase están operativos; la base local está actualizada con 217 changesets.
- El backend Express estÃ¡ conectado a PostgreSQL y expone la API REST bajo `/api/v1`.
- El frontend React/Vite estÃ¡ compilado y servido por Nginx en Docker.
- Registro, autenticaciÃ³n, sesiones, hogares, dispositivos, consumo, alertas, metas, vacaciones, soporte, tarifas, roles y auditorÃ­a tienen rutas de backend implementadas.
- El transporte MQTT, el cliente, el subscriber, el parser y los handlers bÃ¡sicos estÃ¡n implementados y ya aceptan una telemetrÃ­a de prueba.
- La persistencia MQTT en `consumption.sensor_reading` estÃ¡ conectada mediante funciÃ³n SQL protegida, `mqttMessageId`, mÃ©tricas validadas y timestamps de mediciÃ³n/recepciÃ³n.
- Privacy/ARCO estÃ¡ disponible en `/api/v1/privacy` y el resumen de consumo se puede descargar en PDF o Excel desde `/api/v1/reports`.
- La navegaciÃ³n autenticada usa `/app/*`; el menÃº lateral es colapsable en escritorio y hamburguesa en mÃ³vil.
- La estructura base del firmware ESP32 estÃ¡ presente en `firmware/`; la compilaciÃ³n con hardware real y su seguimiento formal en Git aÃºn deben confirmarse.

## Estructura

| Carpeta | Responsabilidad |
|---|---|
| `BD_HS` | PostgreSQL, Liquibase, tablas, funciones, vistas, RLS, roles y grants |
| `BK_HS` | API Node.js/Express, autenticaciÃ³n, casos de uso, repositorios, MQTT y Docker |
| `FT_HS/frontend` | Frontend React/Vite, cliente HTTP, pantallas y Nginx |
| `firmware` | Estructura base para ESP32, MQTT, sensores, actuadores y OTA |
| `docker-compose.yml` | OrquestaciÃ³n local integrada |

## Servicios locales

| Servicio | DirecciÃ³n desde Windows | Uso |
|---|---|---|
| Frontend | `http://localhost:5173` | AplicaciÃ³n web |
| Backend | `http://localhost:3000` | API REST y health |
| Health backend | `http://localhost:3000/health` | ComprobaciÃ³n directa |
| Health frontend | `http://localhost:5173/health` | ComprobaciÃ³n a travÃ©s de Nginx |
| PostgreSQL | `localhost:5433` | Acceso externo de desarrollo |
| MQTT | `localhost:1883` | Broker Mosquitto sin TLS para desarrollo |

Dentro de Docker, el backend usa `postgres:5432` y `mosquitto:1883`. El navegador no accede directamente a PostgreSQL ni al broker: usa Nginx y la API.

## Inicio desde cero con Docker

Ejecuta los comandos desde `PT_HS`. Requiere Docker Desktop iniciado.

1. Si aÃºn no existe el archivo raÃ­z, crÃ©alo desde la plantilla:

   ```powershell
   Copy-Item .env.example .env
   ```

   Revisa los valores locales de `.env`. No publiques ese archivo ni sus contraseÃ±as.

2. Comprueba Docker y la configuraciÃ³n:

   ```powershell
   docker version
   docker compose --env-file .env config --quiet
   ```

3. Levanta PostgreSQL, el bootstrap del usuario de aplicaciÃ³n y Mosquitto:

   ```powershell
   docker compose --env-file .env up -d postgres db-bootstrap mosquitto
   ```

4. Valida y aplica las migraciones antes de iniciar la aplicaciÃ³n:

   ```powershell
   docker compose --env-file .env --profile tooling run --rm liquibase validate
   docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
   docker compose --env-file .env --profile tooling run --rm liquibase update
   ```

5. Construye y levanta backend y frontend:

   ```powershell
   docker compose --env-file .env up -d --build backend frontend
   ```

6. Comprueba el estado y las URLs:

   ```powershell
   docker compose --env-file .env ps
   Invoke-WebRequest http://localhost:3000/health
   Invoke-WebRequest http://localhost:5173/health
   ```

El correo usa Gmail si el `.env` contiene las variables `SMTP_*`. Las credenciales reales
deben permanecer Ãºnicamente en archivos locales.

## Inicio normal

Cuando la base ya fue aplicada, basta con ejecutar:

```powershell
docker compose --env-file .env up -d
```

Si agregas nuevos changesets, ejecuta nuevamente `validate`, `status` y `update`
antes de reiniciar el backend.

## Reinicio completamente limpio

Este comando elimina el volumen local de PostgreSQL y los datos de desarrollo.
Ãšsalo solo para reconstruir la base desde cero:

```powershell
docker compose --env-file .env down --volumes --remove-orphans
```

DespuÃ©s repite el flujo de inicio desde cero. No uses este comando para una
actualizaciÃ³n normal.

## Liquibase

Liquibase se ejecuta bajo demanda con el perfil `tooling`:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env --profile tooling run --rm liquibase update
```

`db-bootstrap` prepara el rol de aplicaciÃ³n `hidro_smart_app`. El servicio backend no debe conectarse con el administrador de Liquibase.

## API y frontend

El frontend centraliza las llamadas en `FT_HS/frontend/src/shared/http/apiClient.ts`. En Docker se compila con `VITE_API_URL=/api/v1` y Nginx reenvÃ­a `/api/` al backend. En desarrollo directo puede usarse `VITE_API_URL=http://localhost:3000/api/v1`.

Los grupos REST montados son: `/auth`, `/homes`, `/devices`, `/consumption`, `/users`, `/tariffs`, `/alerts`, `/goals`, `/vacation`, `/roles`, `/support`, `/audit`, `/privacy`, `/reports` y `/recommendations`. La lista detallada y los permisos estÃ¡n en `BK_HS/docs/03-endpoints.md` y `BK_HS/docs/endpoints-por-rol.md`.

La navegaciÃ³n actual del frontend usa React Router y los mÃ³dulos principales consumen las APIs disponibles. El indicador de flujo actual del dashboard representa el Ãºltimo punto agregado horario; no es caudal MQTT en tiempo real. La matriz de roles ya estÃ¡ automatizada; quedan pruebas manuales/E2E y ajustes visuales puntuales.

## MQTT

El broker local es Mosquitto. El backend se suscribe a:

```text
hidrosmart/devices/+/telemetry
hidrosmart/devices/+/status
hidrosmart/devices/+/actuators/+/status
```

La telemetrÃ­a mÃ­nima recomendada para el ESP32 es:

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

El contrato completo, normalizaciÃ³n y comandos de prueba estÃ¡n en `BK_HS/docs/14-mqtt-protocol.md`. La telemetrÃ­a y los estados MQTT pasan por parser, handler y funciones SQL protegidas; los comandos de actuadores salen por la API REST y sus ACK se correlacionan con `correlationId`.

## Pruebas conocidas

- Backend: `npm test` — 156 pruebas unitarias aprobadas en la última ejecución.
- Backend: `npm run check` y `npm run lint` â€” aprobados.
- Frontend: `npm run lint`, `npm run typecheck` y `npm run build` â€” aprobados. `npm test` finaliza con 0 pruebas porque aÃºn no hay suite automatizada frontend.
- Base de datos: `validate` y `status --verbose` â€” aprobados.
- MQTT: publicaciÃ³n local de telemetrÃ­a vÃ¡lida recibida y normalizada por el backend â€” aprobada.
- Pruebas de integraciÃ³n: `npm run seed:integration` prepara las cuatro cuentas
  de prueba y `npm run test:integration` ejecuta health, autorizaciÃ³n, RLS y MQTT.
  Sin esas variables de entorno, las pruebas autenticadas se omiten.

## DocumentaciÃ³n principal

- Estado integral transversal: `docs/estado-integral.md`.
- GuÃ­a para levantar cada proyecto o toda la pila: `docs/guia-ejecucion-local.md`.
- ValidaciÃ³n de integraciÃ³n y usuarios de prueba: `docs/validacion-integracion.md`.
- GuÃ­a de dispositivos IoT: `docs/dispositivos-iot.md`.

- Estado operativo del backend: `BK_HS/docs/00-estado-actual.md`.
- IntegraciÃ³n BD/backend/frontend: `BK_HS/docs/00-integracion-front-back-bd.md`.
- Endpoints: `BK_HS/docs/03-endpoints.md`.
- MQTT: `BK_HS/docs/14-mqtt-protocol.md` y `BK_HS/docs/13-flujo-datos-iot.md`.
- Pendientes: `BK_HS/docs/pendientes-proyecto.md`.
- AuditorÃ­a P2: `BK_HS/docs/auditoria-p2-correcciones.md`.
- DiagnÃ³stico de BD: `BD_HS/docs/diagnostico-actual.md`.
- IntegraciÃ³n web: `FT_HS/frontend/INTEGRACION.md`.

Los Compose individuales de `BD_HS` y `BK_HS` se conservan por compatibilidad. Para validar el sistema completo usa el Compose de esta raÃ­z.
- Bitácora de cambios verificados del 2026-09-14: `docs/cambios-2026-09-14.md`.
