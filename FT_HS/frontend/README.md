# Frontend HidroSmart

Web y Mobile viven en este único proyecto frontend.

```text
frontend/
├── src/                  # Fuente principal React + TypeScript + Vite
│   ├── app/
│   ├── features/
│   └── mobile/           # Adaptador Expo/React Native que carga el build web
├── index.html            # Entrada Web/Vite
├── index.js              # Entrada Expo
├── package.json          # Dependencias y scripts de Web + Mobile
├── vite.config.js
├── app.json
└── scripts/
    └── prepare-mobile-bundle.mjs
```

## Web

Desde `FT_HS/frontend`:

```powershell
npm ci
npm run dev
```

Abre `http://localhost:5173`. Para producción usa `npm run build`.

## Mobile

Desde la misma carpeta:

```powershell
npm ci
npm run mobile:start
```

El script compila la aplicación Web y genera el HTML embebido que Expo carga
en el WebView. Para ejecutar una plataforma específica:

```powershell
npm run mobile:android
npm run mobile:ios
npm run mobile:web
```

No hay dependencias ni instalaciones separadas para Web y Mobile. La UI,
rutas, autenticación y llamadas al backend salen del mismo código Web.

## Datos y recomendaciones

Las métricas de hogares, consumo, tarifas y reportes se muestran únicamente
con datos devueltos por la API. Si la base no tiene registros, la interfaz
muestra el estado vacío y no inventa valores locales.

La pantalla de recomendaciones contiene tarjetas informativas de presentación.
No tienen estados, botones de acción ni persistencia en la base de datos.

## Docker

El servicio `frontend` del Compose raíz construye este directorio:

```powershell
docker compose --env-file .env up -d --build frontend
```

La ejecución integrada de toda la solución se realiza desde la raíz del
repositorio:

```powershell
docker compose --env-file .env up -d --build
```

La documentación específica está en `FT_HS/docs` y la guía general en
`docs/guia-ejecucion-local.md`.
