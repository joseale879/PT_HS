# Estado integral de HidroSmart

Fecha de corte: 2026-09-14.

Este es el resumen transversal de la base de datos, backend, frontend, MQTT,
correo, Docker y firmware. Distingue lo que estÃ¡ implementado de lo que fue
comprobado en el entorno local y de lo que todavÃ­a requiere trabajo.

## Resumen ejecutivo

| Capa | Estado comprobado | Alcance actual |
|---|---|---|
| Base de datos | Operativa | PostgreSQL 16, Liquibase al día con 217 changesets, funciones, grants, RLS y datos de desarrollo |
| Backend | Operativo | API Express bajo `/api/v1`, autenticaciÃ³n, sesiones, dominios principales, SMTP, MQTT y persistencia IoT |
| Frontend web | Compila y se integra | React + TypeScript + Vite, rutas protegidas, cliente HTTP centralizado, roles e i18n |
| Frontend mÃ³vil | Bundle verificado | Expo + React Native + WebView, agrupado con Web bajo `FT_HS/frontend` |
| Docker | Operativo local | PostgreSQL, bootstrap, backend, frontend y Mosquitto |
| MQTT | Persistencia y control conectados | Telemetría, estados y comandos de actuadores pasan por broker; los ACK se correlacionan y persisten |
| SMTP | Gmail SMTP configurable | Nodemailer envÃ­a eventos mediante las variables `SMTP_*` del `.env`; la entrega real requiere credenciales locales válidas |
| Firmware | Estructura presente | Existe `firmware/`; la compilaciÃ³n con hardware real y su seguimiento en Git todavÃ­a deben confirmarse |

## Evidencia ejecutada

- Liquibase `validate`: aprobado.
- Liquibase `status --verbose`: `up to date`, 217 changesets aplicados.
- Backend `npm.cmd run check`: aprobado.
- Backend `npm.cmd test`: 156/156 pruebas unitarias aprobadas.
- Frontend `npm.cmd run typecheck`, `npm.cmd run lint` y `npm.cmd run build`: aprobados.
- Frontend mÃ³vil `npm.cmd run mobile:prepare`: aprobado; genera el bundle web para WebView.
- Frontend `npm.cmd audit --omit=dev`: 19 vulnerabilidades de dependencias reportadas por Expo/Metro/Vite; resolverlas requiere una actualización mayor y no se aplicó `npm audit fix --force` automáticamente.
- `FT_HS/frontend` no tiene pruebas automatizadas descubiertas actualmente; `npm test`
  finaliza con 0 pruebas, por lo que no equivale a cobertura funcional.
- Docker: `backend` saludable, `postgres` saludable, `frontend` y
  `mosquitto` levantados en la Ãºltima verificaciÃ³n.
- Health backend: `http://localhost:3000/health/ready` respondiÃ³ HTTP 200.
- Health frontend: `http://localhost:5173/health` respondiÃ³ HTTP 200.
- La integraciÃ³n local autenticada, RLS y MQTT quedÃ³ ejecutada con 6/6 pruebas
  aprobadas. RLS usa un hogar temporal aislado y lo elimina al terminar.
- La matriz de `Administrator`, `Support`, `HomeUser` y `Guest` en
  `BK_HS/tests/integration/roles-permissions.test.js` se prepara con
  `BK_HS/scripts/seed-integration-users.js`; para producciÃ³n deben repetirse
  las pruebas con cuentas y datos no sintÃ©ticos.

## Base de datos

### Implementado

- Esquemas de usuarios, preferencias, hogares, dispositivos, consumo, tarifas,
  alertas, metas, vacaciones, soporte, auditorÃ­a, recomendaciones y analÃ­tica.
- Liquibase con changesets y rollbacks separados; no se deben editar changesets
  que ya fueron aplicados.
- Roles tÃ©cnicos separados: `hidro_smart_admin`, `hidro_smart_liquibase`,
  `hidro_smart_app`, `hidro_smart_ingest` y `hidro_smart_readonly`.
- Funciones protegidas para autenticaciÃ³n, sesiones, ciclo de cuenta, contexto de
  autorizaciÃ³n, auditorÃ­a e ingesta MQTT.
- RLS y controles de membresÃ­a para limitar el acceso por hogar.
- Ingesta MQTT mediante `device.fn_ingest_sensor_reading(...)`, sin `INSERT`
  directo del rol de ingesta sobre `consumption.sensor_reading`.
- Idempotencia por `mqttMessageId`, validaciÃ³n de dispositivo activo, separaciÃ³n
  entre `measured_at` y `received_at` y control de timestamps.
- Las funciones y vistas de consumo alimentan los endpoints agregados del backend.
- `consumption.fn_get_consumption_series(...)` entrega series diarias, horarias,
  mensuales y por ubicación con autorización de hogar, métricas de flujo y
  conteo de lecturas.
- El registro crea cuentas en estado `Pending`; el consumo de un token válido de
  verificación marca `email_verified_at` y activa la cuenta.
- `user_profile.avatar_data_url` permite una foto opcional validada por backend
  (JPG, PNG o WebP, máximo 2 MB) y `phone` admite hasta 60 caracteres.
- `consumption.sensor_reading` conserva litros con `NUMERIC(14,3)` y m³ con
  `NUMERIC(14,6)`, incluida la precisión de muestras de `0.040 L` del
  caudalímetro.

### Datos de desarrollo observados

Los conteos funcionales de roles en la base local durante la verificaciÃ³n fueron:

| Rol funcional | Usuarios observados |
|---|---:|
| `Administrator` | 2 |
| `Support` | 2 |
| `HomeUser` | 6 |
| `Guest` | 1 |

La base local ya contiene cuentas para probar los paneles administrativo y de
soporte. Estas cuentas son de desarrollo y no deben usarse como credenciales de
producción.

### Pendientes de BD

- La precisiÃ³n de `consumption.sensor_reading` ya estÃ¡ versionada: litros en
  `NUMERIC(14,3)` y m3 generado en `NUMERIC(14,6)`.
- La auditorÃ­a se consulta por funciÃ³n SQL y endpoint administrativo protegido;
  no se concede acceso directo a la tabla al rol de aplicaciÃ³n. La matriz de
  roles ya verifica `200` para administraciÃ³n y `403` para los demÃ¡s roles.
- Probar la persistencia de `online/offline` y `last_seen` con el contrato final
  del dispositivo real.
- El modelo, ACK, timeout y auditoría de comandos de actuadores ya están versionados;
  falta probar el contrato completo con el firmware real.
- Preparar backups, restauraciÃ³n y una instalaciÃ³n limpia como validaciÃ³n de
  entrega, no solo como flujo local de desarrollo.

## Backend

### Implementado

- API Express bajo `/api/v1` y health pÃºblico/operativo.
- Registro, login, access token, refresh token rotativo, logout, revocaciÃ³n de
  sesiones, cambio de contraseÃ±a, recuperaciÃ³n y restablecimiento.
- La verificación de correo se envía al registrarse, el reenvío invalida tokens
  anteriores y una cuenta `Pending` no puede iniciar sesión.
- VerificaciÃ³n y reenvÃ­o de correo, con Nodemailer y transporte configurable.
- Perfil, preferencias de idioma/moneda, hogares, miembros, solicitudes,
  dispositivos, consumo, tarifas, alertas, metas, vacaciones, recomendaciones,
  soporte, roles, auditorÃ­a, privacidad/ARCO y reportes PDF/Excel.
- Recomendaciones: listado propio, resumen por hogar y actualizaciÃ³n de estado o
  utilidad; el acceso queda respaldado por `reports.read` y RLS.
- ValidaciÃ³n compartida de rangos de consumo con mÃ¡ximo de 366 dÃ­as para resumen,
  costo y reportes PDF/Excel.
- `GET /api/v1/consumption/advanced` expone la serie agrupada para las pantallas
  de Dashboard, Consumo y Reportes.
- AutorizaciÃ³n por permiso y acceso al hogar/dispositivo; la visibilidad del
  frontend no reemplaza las guardas del backend ni RLS.
- MQTT con subscriber, parser, handlers, lÃ­mites de payload, persistencia SQL e
  idempotencia.
- Jobs de alertas, limpieza de auditoría, timeout de actuadores y actualización de
  vistas materializadas.
- Pruebas unitarias especÃ­ficas para validar guardar, consultar y eliminar el modo
  vacaciones, incluyendo fechas, objetivo diario y notificaciÃ³n de retorno.
- ValidaciÃ³n de correspondencia entre tipo y unidad de alerta, validaciÃ³n de la
  fecha opcional al consultar el modo vacaciones y normalizaciÃ³n estricta de
  timestamps MQTT a UTC.

### Rutas principales

`/api/v1/auth`, `/api/v1/users`, `/api/v1/homes`, `/api/v1/devices`,
`/api/v1/consumption`, `/api/v1/tariffs`, `/api/v1/alerts`, `/api/v1/goals`,
`/api/v1/vacation`, `/api/v1/support`, `/api/v1/roles`, `/api/v1/audit`,
`/api/v1/privacy`, `/api/v1/reports`, `/api/v1/recommendations` y
`/api/v1/actuators`.
La lista completa de mÃ©todos y permisos estÃ¡ en
[`BK_HS/docs/03-endpoints.md`](../BK_HS/docs/03-endpoints.md).

El alta IoT esta conectada mediante `POST /api/v1/devices`: crea el dispositivo y
la asignacion al hogar en una transaccion. La solicitud admite `location` para
identificar el lugar visible del sensor. Un equipo ya registrado se vincula con
`POST /api/v1/devices/link` usando su codigo MQTT exacto. La ultima muestra se
consulta con `GET /api/v1/devices/:deviceId/telemetry/latest`, protegido por
membresia.

La guia operativa completa para registrar, vincular, editar y comprobar equipos
esta en [`docs/dispositivos-iot.md`](dispositivos-iot.md).

### Pendientes de backend

- Completar las pruebas manuales de los cuatro roles contra la base real; la
  matriz automatizada local ya cubre Administrator, Support, HomeUser y Guest.
- Definir los cinco tipos de alerta de producto y completar la semÃ¡ntica del modo
  vacaciones segÃºn las reglas finales.
- Validar comandos, timeout, ACK y auditoría de actuadores con un ESP32 real.
- Aplicar paginaciÃ³n, filtros y ordenamiento en todas las consultas que lo
  necesiten, no solo en las que ya tienen respuesta paginada.
- Endurecer Mosquitto para un entorno real: autenticaciÃ³n, ACL por dispositivo,
  TLS y rotaciÃ³n de credenciales.
- Resolver la advertencia de `npm audit` sobre `qs`/Express mediante una decisiÃ³n
  explÃ­cita de migraciÃ³n a Express 5 o mitigaciÃ³n aprobada; no se cambia de major
  automÃ¡ticamente.

## Frontend web

### Implementado

- React Router con rutas pÃºblicas y protegidas bajo `/app/*`.
- `AuthProvider`, hogar activo, almacenamiento de sesiÃ³n y renovaciÃ³n ante `401`.
- Login, registro, recuperaciÃ³n/restablecimiento, logout y cambio de contraseÃ±a.
- Consumo del perfil `/users/me`, preferencias de idioma/moneda y permisos del
  backend.
- Perfil con avatar opcional persistido y teléfono de hasta 60 caracteres,
  sincronizado con el encabezado y la sesión actual.
- Dashboard, hogares, dispositivos, consumo, reportes PDF/Excel, alertas, metas,
  vacaciones, soporte, privacidad y administraciÃ³n consumen las APIs disponibles;
  recomendaciones se presenta como contenido visual informativo.
- Dashboard, Consumo y Reportes consultan series avanzadas del backend para no
  calcular agregados con cifras quemadas en el navegador.
- Dashboard consulta el historial real de alertas pendientes y ya no fabrica una
  alerta sintética a partir del contador.
- Hogares presenta sus tarjetas en un carrusel horizontal responsive.
- NavegaciÃ³n por roles `Administrator`, `Support`, `HomeUser` y `Guest`; guardas
  tambiÃ©n al entrar directamente por URL.
- Panel administrativo y panel de soporte separados. `HomeUser` y `Guest` no
  muestran ni pueden abrir Soporte o Notificaciones.
- Soporte con detalle, historial, respuestas y actualizaciÃ³n de estado.
- Sidebar colapsable/hamburguesa, responsive base e internacionalizaciÃ³n en
  espaÃ±ol, inglÃ©s, portuguÃ©s e italiano.

La pantalla de dispositivos muestra la conectividad MQTT real y las metricas de
la ultima lectura persistida; un equipo sin muestras queda en estado vacio.

### Limitaciones y pendientes de frontend

- Hacer pruebas manuales de login, registro, refresh, logout y navegaciÃ³n con los
  cuatro usuarios funcionales reales.
- Uniformar estados de carga, vacÃ­o, error y reintento en todas las pantallas.
- Completar paginaciÃ³n, filtros y ordenamiento visual donde el backend ya entrega
  metadata.
- Migrar textos directos que aÃºn no usan i18n y revisar accesibilidad con teclado,
  foco, lector de pantalla y contraste.
- Crear pruebas de componentes y rutas protegidas; actualmente no hay suite
  frontend automatizada.
- Reducir el chunk principal del build web, que todavÃ­a supera 500 kB despuÃ©s de
  minificar aunque el build termina correctamente.
- Verificar visualmente en iPhone/Android real o emulador.
- Conectar tiempo real MQTT cuando exista el contrato definitivo del producto.
- Implementar eliminación/seguimiento completo de solicitudes ARCO y pruebas de
  comandos de actuadores cuando el contrato lo cierre.
- El indicador â€œflujo actualâ€ del dashboard representa el Ãºltimo punto agregado
  horario disponible; no debe documentarse como caudal MQTT en tiempo real.

## MQTT, firmware y correo

### MQTT actual

```text
ESP32 -> Mosquitto -> MqttSubscriber -> parser -> handler -> IngestReading -> PostgreSQL
```

Topics de entrada:

- `hidrosmart/devices/{deviceCode}/telemetry`
- `hidrosmart/devices/{deviceCode}/status`
- `hidrosmart/devices/{deviceCode}/actuators/{valve|pump}/status`

El broker local es anÃ³nimo y sin TLS. La persistencia estÃ¡ conectada, pero no se
ha validado con un ESP32 fÃ­sico ni se ha cerrado la precisiÃ³n final del sensor.

### Firmware

Existe la carpeta `firmware/` con estructura para provisioning, Wi-Fi, MQTT,
sensores, actuadores, OTA, almacenamiento y pruebas. Falta confirmar compilaciÃ³n
con el hardware real, versionar formalmente los cambios y alinear el contrato de
telemetrÃ­a con la escala de consumo elegida.

### Correo

Gmail se configura
por SMTP con una clave de aplicaciÃ³n en el `.env` local; las credenciales reales
no pertenecen a ningÃºn documento ni commit. Falta verificar el envÃ­o real de cada
evento en una cuenta Gmail y revisar plantillas, enlaces y expiraciÃ³n en un
entorno controlado.

## EjecuciÃ³n y URLs locales

Desde la raÃ­z `PT_HS`:

```powershell
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Backend readiness: `http://localhost:3000/health/ready`
- Frontend health: `http://localhost:5173/health`
- PostgreSQL externo: `localhost:5433`
- MQTT: `localhost:1883`

Para validar la base:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
```

## Prioridad siguiente

1. Mantener las cuentas funcionales de prueba para `Administrator`, `Support`,
   `HomeUser` y `Guest`, y completar las pruebas manuales/E2E con evidencia.
2. Cerrar el contrato de precisiÃ³n MQTT y aplicar la migraciÃ³n de consumo si se
   confirma la necesidad de muestras menores a `0.01 L`.
3. Completar actuadores, estados reales del dispositivo y seguridad del broker.
4. Completar estados, pruebas y responsive del frontend.
5. Verificar la entrega real de Gmail con una cuenta de prueba controlada.
6. Extender la validaciÃ³n continua ya existente con una suite frontend
   automatizada y pruebas E2E.
- Bitácora de cambios verificados del 2026-09-14: `cambios-2026-09-14.md`.
