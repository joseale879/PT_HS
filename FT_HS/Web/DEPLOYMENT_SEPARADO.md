# Despliegue separado

Cada componente puede vivir en un repositorio, máquina o proveedor distinto. Solo se comunican por URLs y variables de entorno.

## Base de datos

Publica `BD_HS` primero. El backend debe poder alcanzar PostgreSQL mediante `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. No expongas PostgreSQL a Internet; permite únicamente la red o IP del backend.

## Backend

En `BK_HS/.env`, define la URL de la base de datos y la URL pública del frontend:

```ini
DB_HOST=host_privado_de_postgres
DB_PORT=5432
DB_NAME=hidro_smart
DB_USER=hidro_smart_app
DB_PASSWORD=valor_secreto
CORS_ORIGIN=https://app.tu-dominio.com
FRONTEND_URL=https://app.tu-dominio.com
PASSWORD_RESET_URL=https://app.tu-dominio.com
```

Inicia con `docker compose --env-file .env up -d --build`. La API queda publicada, por ejemplo, como `https://api.tu-dominio.com/api/v1`.

## Frontend

En `FT_HS/Web/.env`, configura la URL pública completa de la API:

```ini
VITE_API_URL=https://api.tu-dominio.com/api/v1
FRONTEND_PORT=5173
```

Inicia con `docker compose --env-file .env up -d --build`. Esta imagen no requiere que exista un contenedor llamado `backend`; el navegador llamará directamente a la API pública.

## Desarrollo integrado

El `docker-compose.yml` de la raíz se conserva para desarrollo local. Usa `/api/v1` y el proxy Nginx interno, por eso no se debe usar para despliegues separados.
## Nota para el desarrollo actual

El flujo recomendado hoy es el Compose integrado de la raíz, con frontend en `http://localhost:5173`, backend en `http://localhost:3000`, PostgreSQL en `localhost:5433`, Mailpit en `localhost:8025` y Mosquitto en `localhost:1883`.

El despliegue separado es una guía futura. Si se utiliza fuera de Docker, el backend debe apuntar a la base y al broker mediante sus nombres/URLs reales, y el frontend debe usar una URL pública de API. Nunca se deben publicar secretos en `VITE_*`.
