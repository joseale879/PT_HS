# Dependencias para BD, backend y frontend

Guía de instalación local de HidroSmart para Windows. La aplicación usa `npm` y los
lockfiles de npm; no es necesario instalar `pnpm`.

## 1. Requisitos comunes

Instala o inicia estos requisitos antes de levantar el proyecto:

| Requisito | Uso | Comprobación |
|---|---|---|
| Docker Desktop | PostgreSQL, Liquibase, Mosquitto, backend y frontend | `docker version` |
| Node.js 22.x | Ejecución directa de backend y frontend | `node --version` |
| npm | Instalar dependencias usando los lockfiles | `npm --version` |
| PowerShell | Scripts de validación del repositorio | `$PSVersionTable.PSVersion` |

Docker es obligatorio para la ejecución integrada. Node.js y npm solo son necesarios
si vas a ejecutar BK o FT fuera de sus contenedores, o si vas a correr sus validaciones
directamente en Windows.

## 2. Base de datos: `BD_HS`

### Qué se instala

BD no tiene `package.json` ni dependencias npm. Sus dependencias operativas son:

- PostgreSQL `16-alpine`, ejecutado en Docker.
- Liquibase `5.0.2`, ejecutado en un contenedor de tooling.
- Driver JDBC de PostgreSQL `42.7.8`, instalado dentro de la imagen de Liquibase.
- `psql`, incluido en la imagen de PostgreSQL usada por Compose.

No necesitas instalar PostgreSQL ni Liquibase localmente si usas Docker, que es el
flujo recomendado.

### Instalación y validación

Desde `PT_HS`:

```powershell
if (-not (Test-Path BD_HS/.env)) { Copy-Item BD_HS/.env.example BD_HS/.env }
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml up -d postgres db-bootstrap
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml --profile tooling build liquibase
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase validate
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase update
```

Si la base ya está levantada y solo cambiaste un changelog, normalmente basta con:

```powershell
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase validate
docker compose --env-file BD_HS/.env -f BD_HS/docker-compose.yml --profile tooling run --rm liquibase update
```

## 3. Backend: `BK_HS`

### Dependencias directas

El backend usa Node.js/CommonJS y guarda las versiones resueltas en
`BK_HS/package-lock.json`.

| Paquete | Función |
|---|---|
| `express` | API HTTP |
| `pg` | Conexión con PostgreSQL |
| `bcryptjs` | Hash de contraseñas |
| `jsonwebtoken` | Access y refresh tokens |
| `dotenv` | Variables de entorno |
| `cors` | Política CORS |
| `helmet` | Cabeceras de seguridad |
| `express-rate-limit` | Límite de solicitudes de autenticación |
| `mqtt` | Cliente y suscriptor Mosquitto |
| `nodemailer` | Envío de correo por Gmail SMTP |

### Instalación local

Desde `PT_HS`:

```powershell
if (-not (Test-Path BK_HS/.env)) { Copy-Item BK_HS/.env.example BK_HS/.env }
npm.cmd ci --prefix BK_HS
npm.cmd run check --prefix BK_HS
npm.cmd test --prefix BK_HS
```

Para ejecutarlo directamente:

```powershell
npm.cmd start --prefix BK_HS
```

En esta modalidad deben estar disponibles PostgreSQL en `localhost:5433` y
Mosquitto en `localhost:1883`. Configura `BK_HS/.env` sin subirlo a Git.

### Instalación mediante Docker

No instales `node_modules` en el host para el contenedor. El `Dockerfile` ejecuta
automáticamente `npm ci --omit=dev` al construir la imagen:

```powershell
docker compose --env-file .env up -d --build backend
```

## 4. Frontend Web + Mobile: `FT_HS/frontend`

Web y Mobile comparten el mismo proyecto, `package.json`, `package-lock.json` y
código fuente. No hay una instalación separada para cada plataforma.

### Dependencias principales

| Grupo | Paquetes principales |
|---|---|
| UI | React `19.1.4`, React DOM `19.1.4`, MUI, Radix UI, Tailwind CSS |
| Navegación y estado | React Router `7.18.3`, React Query `5`, React Hook Form |
| Gráficas e interacción | Recharts, date-fns, Embla Carousel, React DnD, Motion |
| API e idioma | i18next, react-i18next, cliente HTTP propio |
| Mobile | Expo `~54.0.0`, React Native `^0.81.5`, React Native WebView, `react-native-ble-plx`, `expo-dev-client`, `base-64` |
| Build y calidad | Vite `6.3.5`, TypeScript `^6.0.3`, Prettier, Tailwind CSS |

El listado completo y las versiones exactas están en
`FT_HS/frontend/package.json`; las versiones resueltas están en
`FT_HS/frontend/package-lock.json`.

### Instalación local

Desde `PT_HS`:

```powershell
if (-not (Test-Path FT_HS/frontend/.env)) { Copy-Item FT_HS/frontend/.env.example FT_HS/frontend/.env }
npm.cmd ci --prefix FT_HS/frontend
npm.cmd run typecheck --prefix FT_HS/frontend
npm.cmd run lint --prefix FT_HS/frontend
npm.cmd run build --prefix FT_HS/frontend
```

Para iniciar Web:

```powershell
npm.cmd run dev --prefix FT_HS/frontend
```

La aplicación web usa `VITE_API_URL=http://localhost:3000/api/v1` en ejecución
directa. En Docker usa `/api/v1` y Nginx redirige al backend.

### Mobile

Mobile usa las mismas dependencias instaladas para Web:

```powershell
npm.cmd run mobile:prepare --prefix FT_HS/frontend
npm.cmd run mobile:start --prefix FT_HS/frontend
```

El aprovisionamiento Bluetooth usa `react-native-ble-plx` y el puente de
`HidroSmartWebView.jsx`. Como BLE requiere código nativo, esta función no se
puede probar en Expo Go: usa un development build o ejecuta `expo run`.

```powershell
Push-Location FT_HS/frontend
npm.cmd install
npx.cmd expo prebuild --clean
npx.cmd expo run:android
# En macOS también: npx expo run:ios
Pop-Location
```

Desde **Dispositivos IoT → Registrar nuevo dispositivo → Descubrir por
Bluetooth**, la WebView recibe la identidad del ESP32, y desde
**Aprovisionamiento → Conectar por Bluetooth** envía SSID, contraseña, host y
puerto MQTT. La contraseña no se manda a la API.

Para Android se requiere Android Studio y un emulador o dispositivo conectado.
Para iOS se requiere macOS con Xcode; Windows puede preparar el bundle, pero no
puede ejecutar el simulador oficial de iPhone localmente.

## 5. Toda la solución con Docker

Este comando instala las dependencias dentro de las imágenes y levanta BD, backend,
frontend y Mosquitto:

```powershell
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build
```

Validación rápida:

```powershell
docker compose --env-file .env ps
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest http://localhost:5173/health
```

## 6. Reglas importantes

- Usa `npm ci`, no `npm install`, para respetar los lockfiles existentes.
- Si cambias `package.json`, actualiza el lockfile con `npm install` y revisa el
  diff antes de subirlo.
- No subas `.env`, `node_modules`, `dist` ni secretos de Gmail.
- El correo utiliza Gmail SMTP con `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
  `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM` definidos solo en el entorno local.
- Si Docker reconstruye una imagen con dependencias nuevas, usa `--build`.
- Para validar todo de una vez ejecuta:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-all.ps1
```
