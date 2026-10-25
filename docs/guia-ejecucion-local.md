# GuÃ­a para levantar HidroSmart en local

Fecha de revisiÃ³n: 2026-09-14.

Esta guÃ­a explica cÃ³mo iniciar cada proyecto por separado y cÃ³mo iniciar la
pila completa. EstÃ¡ pensada para el caso en que se hayan eliminado los
contenedores, pero se conserven o se reconstruyan los archivos .env.

## 1. Requisitos

- Windows PowerShell.
- Docker Desktop iniciado.
- Node.js y npm para ejecutar backend o frontend fuera de Docker.
- El repositorio ubicado en C:\Users\User\Music\Hidro_Smart\PT_HS.

Comprueba las herramientas:

~~~powershell
docker version
docker compose version
node --version
npm --version
~~~

## 2. Archivos .env

Cada modo tiene su propio archivo. No mezcles los valores internos de Docker
con los valores usados por procesos ejecutados directamente en Windows.

| Archivo | Uso |
|---|---|
| .env | Compose integrado de toda la soluciÃ³n |
| BD_HS/.env | PostgreSQL y Liquibase independientes |
| BK_HS/.env | Backend directo y Compose independiente del backend |
| FT_HS/frontend/.env | Variables locales del frontend unificado Web + Mobile |
| FT_HS/frontend/.env.example | Plantilla unificada para Web, Expo y Mobile |
| .env.example y equivalentes | Plantillas sin credenciales reales |

Los .env locales ya estÃ¡n preparados con credenciales de desarrollo
coherentes entre PostgreSQL, el usuario de aplicaciÃ³n, el usuario de ingesta,
JWT y Gmail SMTP. TambiÃ©n se conserva la cuenta funcional de administrador y
soporte en BD_HS/docs/credenciales-locales.md.

No sobrescribas un .env local que ya funciona. Si falta alguno, crÃ©alo desde
su plantilla:

~~~powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path BD_HS/.env)) { Copy-Item BD_HS/.env.example BD_HS/.env }
if (-not (Test-Path BK_HS/.env)) { Copy-Item BK_HS/.env.local.example BK_HS/.env }
if (-not (Test-Path FT_HS/frontend/.env)) { Copy-Item FT_HS/frontend/.env.example FT_HS/frontend/.env }
~~~

Las plantillas no contienen una contraseÃ±a vÃ¡lida de producciÃ³n. Para correo
Gmail se necesita una contraseÃ±a de aplicaciÃ³n, no la contraseÃ±a normal de la
cuenta.

## 3. Puertos y regla importante

| Servicio | Puerto en Windows |
|---|---:|
| PostgreSQL | 5433 |
| Backend API | 3000 |
| Frontend | 5173 |
| Mailpit SMTP/UI | 1025 / 8025 |
| MQTT | 1883 |

Usa solo un modo a la vez si todos conservan estos puertos. Por ejemplo, no
levantes al mismo tiempo el Compose integrado y el Compose independiente de
BD, porque ambos intentan publicar PostgreSQL en 5433.

## 4. Levantar solamente la base de datos

Desde la raÃ­z del repositorio:

~~~powershell
docker compose --env-file BD_HS/.env -p hidro_smart_bd -f BD_HS/docker-compose.yml up -d postgres db-bootstrap
docker compose --env-file BD_HS/.env -p hidro_smart_bd -f BD_HS/docker-compose.yml ps
~~~

Cuando postgres estÃ© saludable y db-bootstrap haya terminado, valida y aplica
el esquema:

~~~powershell
docker compose --env-file BD_HS/.env -p hidro_smart_bd -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase validate
docker compose --env-file BD_HS/.env -p hidro_smart_bd -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase status --verbose
docker compose --env-file BD_HS/.env -p hidro_smart_bd -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase update
~~~

El db-bootstrap independiente crea o actualiza hidro_smart_app,
hidro_smart_ingest e hidro_smart_liquibase. El backend usa el usuario de
aplicaciÃ³n; Liquibase usa el usuario de migraciones.

Para detener solamente esta pila sin borrar datos:

~~~powershell
docker compose --env-file BD_HS/.env -p hidro_smart_bd -f BD_HS/docker-compose.yml down
~~~

## 5. Levantar solamente el backend

Primero debe estar disponible PostgreSQL en localhost:5433. Puedes usar la
base independiente anterior o el PostgreSQL del Compose integrado. Levanta
los servicios auxiliares del backend:

~~~powershell
docker compose --env-file BK_HS/.env -p hidro_smart_backend -f BK_HS/docker-compose.yml up -d mosquitto mailpit
~~~

Instala y verifica dependencias desde BK_HS:

~~~powershell
Set-Location BK_HS
npm.cmd ci
npm.cmd run check
npm.cmd test
npm.cmd start
~~~

La API queda en http://localhost:3000. En este modo BK_HS/.env usa
DB_HOST=localhost y MQTT_BROKER_URL=mqtt://localhost:1883.


DetÃ©n el backend directo si estaba corriendo y ejecuta desde la raÃ­z:

~~~powershell
docker compose --env-file BK_HS/.env -p hidro_smart_backend -f BK_HS/docker-compose.yml up -d --build
docker compose --env-file BK_HS/.env -p hidro_smart_backend -f BK_HS/docker-compose.yml ps
~~~

En este modo el contenedor usa DB_DOCKER_HOST=host.docker.internal para
conectarse al PostgreSQL publicado en 5433, y
MQTT_DOCKER_BROKER_URL=mqtt://mosquitto:1883 para conectarse al broker por
la red Docker.

Para detenerlo sin eliminar la base independiente:

~~~powershell
docker compose --env-file BK_HS/.env -p hidro_smart_backend -f BK_HS/docker-compose.yml down
~~~

## 6. Levantar solamente el frontend

### Opción A: frontend directo con Vite


El backend debe estar disponible en http://localhost:3000.

~~~powershell
Set-Location FT_HS/frontend
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run dev -- --host 0.0.0.0
~~~

Abre http://localhost:5173. El archivo FT_HS/frontend/.env apunta directamente a
http://localhost:3000/api/v1.

### Opción B: frontend dentro de Docker

~~~powershell
docker compose --env-file FT_HS/frontend/.env -p hidro_smart_frontend -f FT_HS/frontend/docker-compose.yml up -d --build
docker compose --env-file FT_HS/frontend/.env -p hidro_smart_frontend -f FT_HS/frontend/docker-compose.yml ps
~~~

Abre http://localhost:5173. El Compose independiente compila el frontend
con la URL pÃºblica definida en VITE_API_URL; no necesita acceso directo a
PostgreSQL.



### Opción C: cliente móvil Expo

El cliente móvil comparte el mismo proyecto, código fuente, dependencias y
lockfile que Web. La entrada nativa es `FT_HS/frontend/index.js` y el adaptador
está en `FT_HS/frontend/src/mobile`.

Desde la raíz:

~~~powershell
Set-Location FT_HS/frontend
npm.cmd ci
npm.cmd run mobile:prepare
npm.cmd run mobile:start
~~~

Para Android o iOS usa `npm.cmd run mobile:android` o
`npm.cmd run mobile:ios`. No copies `node_modules` entre clientes.

## 7. Levantar todo en conjunto (recomendado)

Ejecuta todo desde PT_HS usando el Compose de la raÃ­z.

### Primera instalaciÃ³n o reconstrucciÃ³n

~~~powershell
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d postgres db-bootstrap mosquitto mailpit
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase status --verbose
docker compose --env-file .env --profile tooling run --rm liquibase update
docker compose --env-file .env up -d --build backend frontend
docker compose --env-file .env ps
~~~

### Inicio normal, si el esquema ya existe

~~~powershell
docker compose --env-file .env up -d
docker compose --env-file .env ps
~~~

Direcciones:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health backend: http://localhost:3000/health
- Health de preparaciÃ³n: http://localhost:3000/health/ready
- PostgreSQL desde Windows: localhost:5433
- Mailpit: http://localhost:8025
- MQTT: localhost:1883

Dentro del Compose integrado el backend usa postgres:5432,
mosquitto:1883 y las rutas internas de Docker. El navegador solo consume la
API; no se conecta directamente a PostgreSQL ni a MQTT.

## 8. VerificaciÃ³n rÃ¡pida

Desde PowerShell:

~~~powershell
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:3000/health/ready
Invoke-WebRequest http://localhost:5173/health
docker compose --env-file .env ps
~~~

Para validar el cÃ³digo sin modificar datos:

~~~powershell
Set-Location BK_HS
npm.cmd run check
npm.cmd test
Set-Location ..\FT_HS\frontend
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
Set-Location ..\..
docker compose --env-file .env --profile tooling run --rm liquibase validate
~~~

## 9. Detener y reconstruir

Detener la pila integrada conservando PostgreSQL:

~~~powershell
docker compose --env-file .env down --remove-orphans
~~~

Recrear imÃ¡genes despuÃ©s de cambios de backend o frontend:

~~~powershell
docker compose --env-file .env up -d --build backend frontend
~~~

Solo si se desea borrar todos los datos locales y empezar con una base vacÃ­a:

~~~powershell
docker compose --env-file .env down --volumes --remove-orphans
~~~

--volumes elimina el volumen local de PostgreSQL y no debe usarse para un
reinicio normal.

## 10. Problemas habituales

- Puerto ocupado: ejecuta docker compose ps y detÃ©n la pila que estÃ© usando
  5433, 3000, 5173, 1025, 8025 o 1883.
- Backend no conecta a BD: directo con Node debe usar DB_HOST=localhost;
  dentro de Docker debe usar DB_DOCKER_HOST=host.docker.internal cuando la
  BD estÃ¡ en otro Compose.
- MQTT no conecta: directo usa localhost; dentro del Compose del backend
  usa mosquitto.
- Liquibase falla en una BD vacÃ­a: asegÃºrate de iniciar db-bootstrap antes
  de ejecutar el perfil tooling.
- Correo no llega: revisa SMTP_USER, SMTP_PASSWORD y que la clave sea una
  contraseÃ±a de aplicaciÃ³n de Gmail. En local tambiÃ©n puedes revisar
  http://localhost:8025 si configuras SMTP contra Mailpit.
- Si cambiaste una contraseÃ±a con el volumen existente, actualiza el rol de
  PostgreSQL y el .env al mismo tiempo. Cambiar solamente
  POSTGRES_PASSWORD no modifica por sÃ­ solo una base ya inicializada.

## 11. Seguridad antes de publicar

- Nunca subas .env, claves de Gmail, secretos JWT ni
  BD_HS/docs/credenciales-locales.md.
- Usa secretos nuevos para producciÃ³n y una cuenta SMTP separada.
- No publiques PostgreSQL, MQTT ni Mailpit en Internet.
- Cambia las credenciales de los usuarios funcionales locales antes de usar
  cualquier ambiente compartido.
