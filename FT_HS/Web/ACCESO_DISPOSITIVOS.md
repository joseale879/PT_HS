# Acceso local al frontend HidroSmart

Fecha de revisión: 2026-09-04.

## Acceso desde el equipo donde corre Docker

- Aplicación web: `http://localhost:5173`
- Health del frontend: `http://localhost:5173/health`
- API directa: `http://localhost:3000/health`
- Bandeja de correo local: `http://localhost:8025`

## Acceso desde otro dispositivo de la red

Usa la IP local del equipo que ejecuta Docker, conservando el puerto publicado:

```text
http://<IP_DEL_EQUIPO>:5173
```

La IP concreta cambia según la red; no debe quedar quemada en la documentación ni en el frontend. Si no abre desde otro dispositivo, revisa el firewall de Windows, que Docker Desktop esté iniciado y que el puerto 5173 esté publicado por `docker compose ps`.

El dispositivo remoto solo necesita acceder al frontend. Las llamadas `/api/v1` se resuelven a través de Nginx y no requieren exponer PostgreSQL ni Mosquitto al navegador.

## Arranque

Desde la raíz del proyecto:

```powershell
docker compose --env-file .env up -d --build
docker compose ps
```

Para detener la pila sin borrar datos:

```powershell
docker compose down
```

No uses `docker compose down --volumes` salvo que quieras borrar los volúmenes locales y reconstruir la base desde cero.
