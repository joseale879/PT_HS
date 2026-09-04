# Hidro Smart

El proyecto se ejecuta desde esta raiz con un solo archivo de Compose. Las carpetas se mantienen separadas por responsabilidad:

- `BD_HS`: PostgreSQL, Liquibase y scripts de base de datos.
- `BK_HS`: API Node.js/Express.
- `FT_HS/Web`: aplicacion web.

## Inicio local

1. Copia `.env.example` a `.env` y configura las contrasenas y el secreto JWT locales.
2. Desde esta carpeta ejecuta:

   ```powershell
   docker compose --env-file .env up -d --build
   ```

3. Abre `http://localhost:5173`.

El frontend consume `/api/v1` mediante Nginx; Nginx lo reenvia al backend por la red interna de Docker. PostgreSQL no se expone entre contenedores por una URL local: el backend se conecta al servicio `postgres` en el puerto interno `5432`.

Para validar el estado:

```powershell
docker compose ps
Invoke-WebRequest http://localhost:5173/health
```

Para ejecutar Liquibase bajo demanda:

```powershell
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase update
```

No uses los Compose individuales de `BD_HS` o `BK_HS` para el flujo integrado: se conservan solo para compatibilidad y pueden crear una pila separada.

## Publicacion en GitHub

- Sube unicamente los archivos `.env.example`; los archivos `.env` locales estan excluidos.
- `node_modules`, `dist`, logs, llaves y certificados tambien estan excluidos.
- El Compose integrado usa el `.env` de esta raiz y no depende de `BK_HS/.env`.
- Antes de publicar, rota cualquier credencial que haya sido usada localmente y revisa el historial de Git si el repositorio ya tuvo commits.
- Para iniciar desde un clon, copia `.env.example` a `.env`, completa los valores locales y ejecuta `docker compose --env-file .env up -d --build`.
