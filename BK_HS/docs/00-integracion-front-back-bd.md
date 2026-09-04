# Integración vigente: base de datos, backend y frontend

Fecha de revisión: 2026-09-04.

## Topología local

```text
Navegador -> Frontend/Nginx :5173 -> Backend :3000 -> PostgreSQL :5432
                                      |              (contenedor postgres)
                                      +-> Mosquitto :1883
                                      +-> Mailpit :1025
```

Desde Windows, PostgreSQL se publica como `localhost:5433`, el backend como `localhost:3000`, el frontend como `localhost:5173`, Mailpit como `localhost:8025` y Mosquitto como `localhost:1883`.

Dentro de Docker no se deben usar `localhost` entre servicios: los nombres son `postgres`, `backend`, `frontend`, `mailpit` y `mosquitto`.

## Variables de entorno

| Capa | Variable principal | Valor de Docker |
|---|---|---|
| Frontend | `VITE_API_URL` | `/api/v1` |
| Backend | `DB_HOST` | `postgres` |
| Backend | `DB_PORT` | `5432` |
| Backend | `DB_NAME` | `hidro_smart` |
| Backend | `DB_USER` | `hidro_smart_app` |
| Backend | `MQTT_BROKER_URL` | `mqtt://mosquitto:1883` |
| Backend | `SMTP_HOST` | `mailpit` por defecto |
| Backend | `SMTP_PORT` | `1025` por defecto |

El archivo `.env` de la raíz gobierna el Compose integrado. `BK_HS/.env` sirve para ejecutar el backend fuera de Docker y `FT_HS/Web/.env*` para el frontend directo. Ningún archivo con secretos debe subirse al repositorio.

## Cadena REST

El frontend no se conecta a PostgreSQL. Todas las llamadas pasan por `FT_HS/Web/src/shared/http/apiClient.ts`, que usa el cliente HTTP común, agrega el access token y maneja la renovación de sesión.

Los prefijos montados en Express son:

- `/api/v1/auth`: `register`, `login`, `refresh`, `logout`, cambio y recuperación de contraseña.
- `/api/v1/users`: perfil y preferencias.
- `/api/v1/homes`: hogares, miembros y solicitudes de membresía.
- `/api/v1/devices`: alta, consulta, configuración, estado, desactivación y desvinculación.
- `/api/v1/consumption`: `summary`, `daily`, `hourly`, `monthly`, `cost`.
- `/api/v1/tariffs`: tarifa del hogar.
- `/api/v1/alerts`: pendientes, reglas, umbrales, historial y estados.
- `/api/v1/goals`: CRUD y progreso de metas.
- `/api/v1/vacation`: consulta, actualización y eliminación de vacaciones.
- `/api/v1/roles`: administración protegida por `roles.manage`.
- `/api/v1/support`: catálogos, tickets y respuestas.
- `/api/v1/audit`: logs protegidos por `audit.read`.

La URL pública del navegador es `/api/v1/...`; Nginx reenvía `/api/` al backend dentro de Docker.

## Cadena de autenticación

1. Registro y login devuelven la sesión que consume el frontend.
2. Las rutas protegidas requieren Bearer token.
3. Ante un `401`, el cliente intenta `POST /api/v1/auth/refresh` una sola vez.
4. Si el refresh falla, limpia la sesión y devuelve al flujo de login.
5. Logout revoca la sesión en backend y limpia el almacenamiento local.

El backend valida además permisos funcionales y el acceso al hogar/dispositivo mediante la base de datos y RLS cuando corresponde.

## Correo

El backend usa Nodemailer para recuperación y notificaciones de contraseña. Mailpit es el transporte local recomendado:

- Docker: `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, `SMTP_SECURE=false`.
- Backend directo: `SMTP_HOST=localhost`, `SMTP_PORT=1025`.
- Gmail: se configura solo en el `.env` local con `SMTP_HOST=smtp.gmail.com`, puerto y credenciales de aplicación apropiadas.

No se documentan ni se almacenan aquí credenciales reales. Para probar el correo local se revisa `http://localhost:8025`.

## Cadena MQTT

```text
ESP32 -> Mosquitto -> MqttSubscriber -> message-parser -> handler
                                                   |
                                                   +-> logs actuales
                                                   +-> persistencia PostgreSQL (pendiente)
```

Topics actuales:

- `hidrosmart/devices/{deviceCode}/telemetry`
- `hidrosmart/devices/{deviceCode}/status`
- `hidrosmart/devices/{deviceCode}/actuators/{actuator}/status`

La telemetría no entra por un endpoint HTTP. El backend ya recibe, valida y normaliza el mensaje, pero falta conectar el handler con el caso de uso y repositorio de ingestión.

## Estado de pantallas web

- Autenticación, perfil y varias consultas de dashboard ya tienen cliente API centralizado.
- Las pantallas de hogares, dispositivos, consumo, reportes, alertas, metas, vacaciones, soporte y auditoría deben verificarse por pantalla con sus estados de carga, vacío y error; tener un método en `apiClient` no significa que la vista ya lo consuma.
- El frontend fija el rol de navegación como `user` en varios puntos; la lectura de roles reales debe cerrarse antes del panel administrativo.
- El dashboard todavía muestra algunos indicadores de presentación, entre ellos tarjetas porcentuales y un valor de consumo que no equivale a caudal MQTT en tiempo real.

## Validación de extremo a extremo

```powershell
docker compose --env-file .env up -d --build
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:5173/health
docker compose --env-file .env --profile tooling run --rm liquibase validate
```

Para la prueba MQTT, usa un cliente contra `localhost:1883` y publica el payload descrito en `14-mqtt-protocol.md`. La confirmación actual se observa en los logs del backend; la confirmación de inserción en PostgreSQL todavía no aplica porque la persistencia no está conectada.
