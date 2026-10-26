# IntegraciÃ³n vigente del frontend web

Fecha de revisiÃ³n: 2026-09-14.

Este documento describe el cliente `FT_HS/frontend` frente al backend y no sustituye
el inventario completo de rutas de `FT_HS/docs/rutas-y-api-frontend.md`.

## TopologÃ­a

```text
Navegador -> Frontend/Nginx :5173 -> Backend :3000 -> PostgreSQL :5432
                                      |              (contenedor postgres)
                                      +-> Mosquitto :1883
```

En Docker el navegador consume `/api/v1`; Nginx reenvÃ­a `/api/` al servicio
`backend`. En ejecuciÃ³n directa se usa `VITE_API_URL=http://localhost:3000/api/v1`.
El frontend nunca se conecta directamente a PostgreSQL ni a MQTT.

## Flujos conectados

| Flujo | Contrato usado | Estado |
|---|---|---|
| Registro | `POST /api/v1/auth/register` | Conectado; valida documento, correo, contraseÃ±a y consentimientos |
| Login | `POST /api/v1/auth/login` | Conectado; crea la sesiÃ³n del frontend |
| RenovaciÃ³n | `POST /api/v1/auth/refresh` | Conectado; reintenta una sola vez ante `401` |
| Logout | `POST /api/v1/auth/logout` | Conectado; revoca sesiÃ³n y limpia storage |
| Cambio/recuperaciÃ³n de contraseÃ±a | `/auth/change-password`, `/auth/request-password-reset`, `/auth/reset-password` | Conectado; el correo requiere SMTP |
| Perfil y preferencias | `/users/me`, `/users/me/preferences` | Conectado |
| Dashboard y consumo | `/consumption/*`, `/alerts/home/:homeId/pending`, `/devices` | Conectado a datos del backend |
| Hogares y miembros | `/homes/*` | Conectado con permisos y hogar activo |
| Dispositivos | `/devices/*` | Conectado con paginaciÃ³n del contrato actual |
| Reportes | `/reports/consumption.pdf`, `/reports/consumption.xlsx` | Descargas PDF y Excel conectadas |
| Alertas, metas y vacaciones | `/alerts/*`, `/goals/*`, `/vacation/*` | Conectado a las operaciones disponibles |
| Soporte | `/support/tickets/*` | Detalle, historial, respuestas y estado conectados |
| Privacidad | `/privacy/*` | ExportaciÃ³n propia y solicitudes ARCO base conectadas |
| AdministraciÃ³n | `/users`, `/roles`, `/audit/logs` | Protegido para `Administrator`; gestiÃ³n de usuarios/roles y auditorÃ­a consumen API |

## AutenticaciÃ³n y autorizaciÃ³n

`AuthProvider` obtiene la sesiÃ³n y permisos del backend. El cliente HTTP agrega
el access token y, ante un `401`, intenta renovar el refresh token una vez. Si la
renovaciÃ³n falla, borra la sesiÃ³n y vuelve al login.

Los roles funcionales son `Administrator`, `Support`, `HomeUser` y `Guest`.
El frontend oculta opciones y bloquea accesos directos sin permiso, pero la
autorizaciÃ³n real permanece en el backend y PostgreSQL/RLS.

- `Administrator`: panel administrativo, usuarios, roles y auditorÃ­a.
- `Support`: panel de tickets recibidos y atenciÃ³n de soporte.
- `HomeUser`: gestiÃ³n de hogares/dispositivos y operaciones de su hogar.
- `Guest`: consultas de solo lectura autorizadas.

`HomeUser` y `Guest` no muestran ni pueden abrir Soporte o Notificaciones.

## Datos y estados de pantalla

Las pantallas principales usan `apiClient.ts` y APIs por feature. No se debe
retirar un valor de presentaciÃ³n sin que exista un contrato de backend equivalente.
Los pendientes de interfaz son uniformar carga, vacÃ­o, error, reintento,
paginaciÃ³n, filtros, ordenamiento e i18n en las pantallas que aÃºn tienen textos
directos.

El â€œflujo actualâ€ del dashboard usa el Ãºltimo promedio horario disponible. No es
un stream MQTT en tiempo real. El tiempo real se podrÃ¡ conectar cuando se defina
el contrato estable de eventos y estados del dispositivo.

## Correo

El backend usa Nodemailer y Gmail SMTP. El frontend nunca se conecta directamente al proveedor de correo:

- SMTP: `smtp.gmail.com:587` mediante las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASSWORD`.
- Gmail: variables `SMTP_*` en el `.env` local y clave de aplicaciÃ³n.

La prueba con Gmail real, las plantillas definitivas y sus enlaces de expiraciÃ³n
son tareas de verificaciÃ³n; ninguna credencial se documenta aquÃ­.

## Comandos de validaciÃ³n

Desde `PT_HS`:

```powershell
docker compose --env-file .env up -d --build
Invoke-WebRequest http://localhost:3000/health/ready
Invoke-WebRequest http://localhost:5173/health
```

Desde `FT_HS/frontend`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
```

`npm test` termina correctamente, pero actualmente no descubre pruebas frontend.
El build termina correctamente, aunque Vite todavÃ­a advierte que el chunk
principal supera 500 kB despuÃ©s de minificar.

## Pendientes que dependen del backend o del producto

- Pruebas manuales con usuarios reales de los cuatro roles y escenarios RLS.
- Estados MQTT en tiempo real, actuadores y ACK/timeout.
- Reportes persistidos PDF/Excel y fotografÃ­a de perfil.
- Flujo completo de eliminaciÃ³n/seguimiento ARCO.
- Pruebas visuales reales en iPhone/Android y accesibilidad.
