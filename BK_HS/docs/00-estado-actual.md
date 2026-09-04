# Estado actual del backend

## Actualización de implementación

El backend actual también incluye metas, modo vacaciones, roles funcionales y tickets de soporte. `Administrator` gestiona el panel interno, `Support` gestiona tickets, `HomeUser` administra su hogar y `Guest` opera en modo solo lectura.

La integración local con PostgreSQL está validada; el backend está disponible en `http://localhost:3000`.

El backend inicial ya cuenta con una base ejecutable usando Node.js, Express y PostgreSQL.

## Implementado

- `GET /` y `GET /health`.
- `POST /api/v1/auth/register`.
- `POST /api/v1/auth/login`.
- `POST /api/v1/auth/refresh` y `POST /api/v1/auth/logout`.
- `POST /api/v1/auth/change-password`, `POST /api/v1/auth/request-password-reset` y `POST /api/v1/auth/reset-password`.
- `POST /api/v1/homes`.
- `GET /api/v1/homes`.
- `GET /api/v1/users/me`.
- `PUT /api/v1/users/me`.
- `POST /api/v1/devices` con asociación obligatoria a un hogar.
- `GET /api/v1/devices`.
- `GET`, `PUT` y `PATCH /api/v1/devices/:deviceId` para consulta, configuración, estado y auditoría.
- `GET /api/v1/consumption/summary`, `/daily`, `/hourly`, `/monthly` y `/cost`.
- `GET /api/v1/tariffs/home/:homeId` para consultar la tarifa vigente.
- Endpoints de reglas, umbrales y eventos básicos de alertas.
- `GET /api/v1/audit/logs` para auditoría administrativa protegida por `audit.read`.
- Pool PostgreSQL y transacciones con `app.user_id` para respetar RLS.
- JWT, refresh tokens persistentes, logout y revocación de sesiones.
- Jobs para refrescar vistas materializadas y generar eventos de alerta.

## Ultima revision general

- `npm test`: 75 pruebas unitarias aprobadas.
- `npm run check`: sintaxis base del backend aprobada.
- `npm run build` del frontend: aprobado.
- Docker: PostgreSQL y backend saludables; frontend disponible en `http://localhost:5173`.
- Liquibase: base de datos actualizada; función de auditoría paginada aplicada.
- Las rutas de autenticacion cuentan con rate limiting configurable y respuesta uniforme `429 TOO_MANY_REQUESTS`.
- Las pruebas de integracion con usuarios funcionales y RLS estan preparadas, pero no se ejecutan sin credenciales de prueba configuradas.

## Pendiente

MQTT/ESP32, notificaciones de alertas, reglas avanzadas de detección, reportes, auditoría completa y preparación productiva. El flujo inicial de metas, modo vacaciones y tickets ya está implementado.

## Ejecución local

```powershell
Copy-Item .env.example .env
# Editar .env con la contraseña de hidro_smart_app y un JWT_SECRET seguro.
npm install
npm run check
npm start
```

La base de datos debe estar levantada desde `../BD_HS` y publicada en `localhost:5433`.

No se ejecutan migraciones desde el arranque del backend; las migraciones pertenecen a `BD_HS`.

## Integración vigente con frontend y correo

- Frontend web: `http://localhost:5173`.
- API backend: `http://localhost:3000`.
- PostgreSQL: `localhost:5433` desde Windows y `postgres:5432` entre contenedores.
- El frontend usa `VITE_API_URL` y el backend usa JWT con refresh token persistente.
- El perfil consulta `GET /api/v1/users/me` y guarda cambios con `PUT /api/v1/users/me`.
- Las membresías usan solicitudes reales en PostgreSQL: crear, listar, aprobar y rechazar.
- El único canal externo habilitado es Gmail SMTP mediante Nodemailer.
- 2FA, SMS, FCM, Redis y BullMQ están fuera del alcance actual.
