# IntegraciÃ³n vigente: base de datos, backend y frontend

Fecha de revisiÃ³n: 2026-09-14.

## TopologÃ­a local

```text
Navegador -> Frontend/Nginx :5173 -> Backend :3000 -> PostgreSQL :5432
                                      |              (contenedor postgres)
                                      +-> Mosquitto :1883
```

Desde Windows, PostgreSQL se publica como `localhost:5433`, el backend como `localhost:3000`, el frontend como `localhost:5173` y Mosquitto como `localhost:1883`. El correo sale por Gmail SMTP y no expone un puerto local.

Dentro de Docker no se deben usar `localhost` entre servicios: los nombres son `postgres`, `backend`, `frontend` y `mosquitto`.

## Variables de entorno

| Capa | Variable principal | Valor de Docker |
|---|---|---|
| Frontend | `VITE_API_URL` | `/api/v1` |
| Backend | `DB_HOST` | `postgres` |
| Backend | `DB_PORT` | `5432` |
| Backend | `DB_NAME` | `hidro_smart` |
| Backend | `DB_USER` | `hidro_smart_app` |
| Backend | `MQTT_BROKER_URL` | `mqtt://mosquitto:1883` |
| Backend | `SMTP_HOST` | `smtp.gmail.com` por defecto |
| Backend | `SMTP_PORT` | `587` por defecto |

El archivo `.env` de la raÃ­z gobierna el Compose integrado. `BK_HS/.env` sirve para ejecutar el backend fuera de Docker y `FT_HS/frontend/.env*` para el frontend directo. NingÃºn archivo con secretos debe subirse al repositorio.

## Cadena REST

El frontend no se conecta a PostgreSQL. Todas las llamadas pasan por `FT_HS/frontend/src/shared/http/apiClient.ts`, que usa el cliente HTTP comÃºn, agrega el access token y maneja la renovaciÃ³n de sesiÃ³n.

Los prefijos montados en Express son:

- `/api/v1/auth`: `register`, `login`, `refresh`, `logout`, cambio y recuperaciÃ³n de contraseÃ±a; tambiÃ©n `resend-verification` y `verify-email`.
- `/api/v1/users`: perfil y preferencias; `/users/me` persiste `avatarDataUrl` y `phone` con mÃ¡ximo de 60 caracteres.
- `/api/v1/homes`: hogares, miembros y solicitudes de membresÃ­a.
- `/api/v1/devices`: alta con ubicación, consulta, vinculación por código,
  edición, configuración, estado, desactivación y desvinculación.
- `/api/v1/consumption`: `summary`, `daily`, `hourly`, `monthly`, `cost` y
  `advanced` para series agrupadas por día, hora, mes o ubicación.
- `/api/v1/tariffs`: tarifa del hogar.
- `/api/v1/alerts`: pendientes, reglas, umbrales, historial y estados.
- `/api/v1/goals`: CRUD y progreso de metas.
- `/api/v1/vacation`: consulta, actualizaciÃ³n y eliminaciÃ³n de vacaciones.
- `/api/v1/roles`: administraciÃ³n protegida por `roles.manage`.
- `/api/v1/support`: catÃ¡logos, tickets y respuestas.
- `/api/v1/audit`: logs protegidos por `audit.read`.
- `/api/v1/privacy`: consentimientos, solicitudes ARCO y exportaciÃ³n propia.
- `/api/v1/reports`: descarga de consumo en PDF y Excel, registro persistente,
  historial paginado y descarga posterior.
- `/api/v1/recommendations`: listado propio, resumen por hogar y actualizaciÃ³n
  de estado/utilidad con `reports.read` y RLS.

La URL pÃºblica del navegador es `/api/v1/...`; Nginx reenvÃ­a `/api/` al backend dentro de Docker.

## Correo de acceso a hogares

El formulario **Agregar Miembro** de `/app/homes` solo agrega cuentas activas.
Una vez confirmada la membresÃ­a en PostgreSQL, el backend envÃ­a un aviso de
acceso mediante Nodemailer y devuelve `notification.sent`. Si SMTP no estÃ¡
disponible, la membresÃ­a no se revierte; el resultado queda visible para el
frontend y el correo se entrega mediante Gmail SMTP.

## Cadena de autenticaciÃ³n

1. El registro crea la cuenta como `Pending`, genera y envÃ­a el enlace de
   verificaciÃ³n y responde `202`; el login solo crea sesiÃ³n despuÃ©s de activar
   el correo.
2. Las rutas protegidas requieren Bearer token.
3. Ante un `401`, el cliente intenta `POST /api/v1/auth/refresh` una sola vez.
4. Si el refresh falla, limpia la sesiÃ³n y devuelve al flujo de login.
5. Logout revoca la sesiÃ³n en backend y limpia el almacenamiento local.

El backend valida ademÃ¡s permisos funcionales y el acceso al hogar/dispositivo mediante la base de datos y RLS cuando corresponde.

## Correo

El backend usa Nodemailer para recuperación y notificaciones de contraseña. Gmail
se configura solo en el `.env` local con `SMTP_HOST=smtp.gmail.com`,
`SMTP_PORT=587`, `SMTP_SECURE=false` y una contraseña de aplicación. No se
documentan ni se almacenan aquí credenciales reales.

## Cadena MQTT

```text
ESP32 -> Mosquitto -> MqttSubscriber -> message-parser -> handler
                                                   |
                                                   +-> logs actuales
                                                   +-> persistencia PostgreSQL (funciÃ³n protegida e idempotente)
```

Topics actuales:

- `hidrosmart/devices/{deviceCode}/telemetry`
- `hidrosmart/devices/{deviceCode}/status`
- `hidrosmart/devices/{deviceCode}/actuators/{actuator}/status`

La telemetrÃ­a no entra por un endpoint HTTP. El backend recibe, valida,
normaliza y persiste el mensaje mediante `IngestReading`,
`PostgresTelemetryRepository` y la funciÃ³n SQL protegida.

## Estado de pantallas web

- AutenticaciÃ³n, perfil, dashboard, hogares, dispositivos, consumo, reportes,
  alertas, metas, vacaciones, soporte, privacidad y administraciÃ³n tienen
  consumo de API en las pantallas principales. Recomendaciones se presenta
  actualmente como contenido visual informativo.
- El menÃº y las rutas directas usan los roles y permisos recibidos del backend;
  `Administrator` y `Support` tienen paneles separados y `HomeUser`/`Guest` no
  acceden a soporte ni notificaciones.
- TodavÃ­a deben uniformarse estados de carga, vacÃ­o, error y reintento, y deben
  ejecutarse pruebas manuales con los cuatro roles.
- El dashboard obtiene sus tarjetas de agregados del backend; el indicador de
  flujo actual es el Ãºltimo punto horario disponible, no caudal MQTT en tiempo real.

## ValidaciÃ³n de extremo a extremo

```powershell
docker compose --env-file .env up -d --build
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:5173/health
docker compose --env-file .env --profile tooling run --rm liquibase validate
```

Para la prueba MQTT, usa un cliente contra `localhost:1883` y publica el payload descrito en `14-mqtt-protocol.md`. El backend persiste la lectura mediante `device.fn_ingest_sensor_reading`; `mqtt_message_id` evita insertar dos veces el mismo evento.
