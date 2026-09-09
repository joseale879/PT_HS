# HidroSmart Web

Frontend React/Vite con arquitectura Feature-First.

## Ejecución local

Integrado con Docker desde la raíz:

```powershell
docker compose --env-file .env up -d --build
```

Abre `http://localhost:5173`.

Sin Docker:

```powershell
npm install
npm run dev
```

En ejecución directa, `VITE_API_URL` debe apuntar a `http://localhost:3000/api/v1`. En Docker el build usa `/api/v1` y Nginx hace el proxy al servicio `backend`.

Consulta la documentación centralizada en `../docs/README.md`, `../docs/arquitectura-frontend.md` y `../docs/rutas-y-api-frontend.md` antes de cambiar rutas o conexiones.
