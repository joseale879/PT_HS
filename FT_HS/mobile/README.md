# HidroSmart Mobile

Cliente Expo que carga el bundle del frontend web mediante WebView; no duplica las rutas de negocio.

## Estructura

- `index.js`: registra la app en Expo.
- `src/App.jsx`: raíz mobile.
- `src/components/HidroSmartWebView.jsx`: WebView.
- `src/config/webView.js`: URL/configuración del WebView.
- `src/webBundle.js`: bundle generado desde `../Web`.

## Ejecución

```powershell
npm install
npm start
```

Para desarrollo local, la URL que carga el WebView debe ser accesible desde el dispositivo móvil. `localhost` dentro del teléfono no apunta al equipo de desarrollo; usa la IP local del equipo y el puerto web publicado, por ejemplo `http://<IP_DEL_EQUIPO>:5173`.

La API continúa siendo `/api/v1` a través del frontend/Nginx; mobile no accede directamente a PostgreSQL ni a MQTT.
