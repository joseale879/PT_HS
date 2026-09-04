# HidroSmart Frontend

El frontend web vive en `Web` y el cliente móvil en `mobile`.

## Estado actual

- Web React/Vite organizada por features.
- Cliente HTTP centralizado en `Web/src/shared/http/apiClient.ts`.
- Imagen web servida por Nginx y conectada al backend mediante `/api/v1`.
- Mobile preparado para cargar el bundle web mediante WebView.

## Ejecución integrada

Desde la raíz:

```powershell
docker compose --env-file .env up -d --build
```

Abre `http://localhost:5173`. La guía de rutas y estado de las pantallas está en `Web/INTEGRACION.md`.
