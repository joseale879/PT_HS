# Estado integral de HidroSmart

Fecha de corte: 2026-09-14.

Este es el resumen transversal de la base de datos, backend, frontend, MQTT,
correo, Docker y firmware. Distingue lo que estÃ¡ implementado de lo que fue
comprobado en el entorno local y de lo que todavÃ­a requiere trabajo.

## Resumen ejecutivo

| Capa | Estado comprobado | Alcance actual |
|---|---|---|
| Base de datos | Operativa | PostgreSQL 16, Liquibase al día con 206 changesets, funciones, grants, RLS y datos de desarrollo |
| Backend | Operativo | API Express bajo `/api/v1`, autenticaciÃ³n, sesiones, dominios principales, SMTP, MQTT y persistencia IoT |
| Frontend web | Compila y se integra | React + TypeScript + Vite, rutas protegidas, cliente HTTP centralizado, roles e i18n |
| Frontend mÃ³vil | Bundle verificado | Expo + React Native + WebView, agrupado con Web bajo `FT_HS/frontend` |
| Docker | Operativo local | PostgreSQL, bootstrap, backend, frontend, Mailpit y Mosquitto |
| MQTT | Persistencia y control conectados | Telemetría, estados y comandos de actuadores pasan por broker; los ACK se correlacionan y persisten |
| SMTP | Mailpit local disponible | Gmail estÃ¡ soportado por Nodemailer, pero el envÃ­o real con una cuenta Gmail debe verificarse con credenciales locales |
| Firmware | Estructura presente | Existe `firmware/`; la compilaciÃ³n con hardware real y su seguimiento en Git todavÃ­a deben confirmarse |

## Evidencia ejecutada

- Liquibase `validate`: aprobado.
- Liquibase `status --verbose`: `up to date`, 206 changesets aplicados.
- Backend `npm.cmd run check`: aprobado.
- Backend `npm.cmd test`: 131/131 pruebas unitarias aprobadas.
- Frontend `npm.cmd run typecheck`, `npm.cmd run lint` y `npm.cmd run build`: aprobados.
- Frontend mÃ³vil `npm.cmd run mobile:prepare`: aprobado; genera el bundle web para WebView.
- Frontend `npm.cmd audit --omit=dev`: 0 vulnerabilidades de producciÃ³n.
- `FT_HS/frontend` no tiene pruebas automatizadas descubiertas actualmente; `npm test`
  finaliza con 0 pruebas, por lo que no equivale a cobertura funcional.
- Docker: `backend` saludable, `postgres` saludable, `frontend`, `mailpit` y
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

### Datos de desarrollo observados

Los conteos funcionales de roles en la base local durante la verificaciÃ³n fueron:

| Rol funcional | Usuarios observados |
|---|---:|
| `Administrator` | 0 |
| `Support` | 0 |
| `HomeUser` | 5 |
| `Guest` | 0 |

Esto significa que la estructura RBAC existe, pero la prueba funcional de paneles
administrativo y de soporte requiere crear o configurar usuarios de prueba.

### Pendientes de BD

- Migrar la precisiÃ³n de `consumption.sensor_reading.consumption_liters`, hoy
  `NUMERIC(10,2)`, si el firmware conservarÃ¡ muestras como `0.040 L`.
- Revisar la columna generada `consumption_m3`, funciones, vistas, reportes e
  Ã­ndices dependientes de esa precisiÃ³n.
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
- VerificaciÃ³n y reenvÃ­o de correo, con Nodemailer y transporte configurable.
- Perfil, preferencias de idioma/moneda, hogares, miembros, solicitudes,
  dispositivos, consumo, tarifas, alertas, metas, vacaciones, recomendaciones,
  soporte, roles, auditorÃ­a, privacidad/ARCO y reportes PDF/Excel.
- Recomendaciones: listado propio, resumen por hogar y actualizaciÃ³n de estado o
  utilidad; el acceso queda respaldado por `reports.read` y RLS.
- ValidaciÃ³n compartida de rangos de consumo con mÃ¡ximo de 366 dÃ­as para resumen,
  costo y reportes PDF/Excel.
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
- Dashboard, hogares, dispositivos, consumo, reportes PDF/Excel, alertas, metas,
  vacaciones, soporte, privacidad y administraciÃ³n consumen las APIs disponibles;
  recomendaciones se presenta como contenido visual informativo.
- NavegaciÃ³n por roles `Administrator`, `Support`, `HomeUser` y `Guest`; guardas
  tambiÃ©n al entrar directamente por URL.
- Panel administrativo y panel de soporte separados. `HomeUser` y `Guest` no
  muestran ni pueden abrir Soporte o Notificaciones.
- Soporte con detalle, historial, respuestas y actualizaciÃ³n de estado.
- Sidebar colapsable/hamburguesa, responsive base e internacionalizaciÃ³n en
  espaÃ±ol, inglÃ©s, portuguÃ©s e italiano.

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
- Implementar eliminaciÃ³n/seguimiento completo de solicitudes ARCO, foto de
  perfil y pruebas de comandos de actuadores cuando el contrato lo cierre.
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

Mailpit sirve para pruebas locales en `http://localhost:8025`. Gmail se configura
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
- Mailpit: `http://localhost:8025`
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
5. Verificar Gmail real y dejar Mailpit como transporte local reproducible.
6. Extender la validaciÃ³n continua ya existente con una suite frontend
   automatizada y pruebas E2E.
- Bitácora de cambios verificados del 2026-09-14: `cambios-2026-09-14.md`.
