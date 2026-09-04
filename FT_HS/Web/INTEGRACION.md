# Estado de integración del frontend web

Fecha de revisión: 2026-09-03.

## Conectado y validado

| Pantalla o flujo | Endpoint | Validación de interfaz |
|---|---|---|
| Registro | `POST /api/v1/auth/register` | Nombre, correo, documento CC/CE numérico de 1 a 10 dígitos, contraseña de 8 a 128 caracteres con mayúscula, minúscula, número y símbolo, y confirmación. |
| Inicio de sesión | `POST /api/v1/auth/login` | Correo válido y contraseña obligatoria. La validación final corresponde al backend. |
| Restauración de sesión | `GET /api/v1/users/me`, `POST /api/v1/auth/refresh` | Tokens de sesión y reintento único ante 401. |
| Cierre de sesión | `POST /api/v1/auth/logout` | Envía el refresh token autenticado y limpia la sesión local. |
| Cambio de contraseña | `POST /api/v1/auth/change-password` | Debe contrastarse con la política vigente del backend. |
| Recuperación | `POST /api/v1/auth/request-password-reset`, `POST /api/v1/auth/reset-password` | Correo válido, token de al menos 40 caracteres y contraseña segura. El envío de correo requiere SMTP. |

## Cliente API preparado, aún no usado por pantalla

- Hogares: `/homes` y miembros.
- Dispositivos: `/devices`.
- Consumo: `/consumption/summary`, `/daily`, `/hourly`, `/monthly`, `/cost`.
- Alertas: pendientes, reglas, umbrales y estado.
- Auditoría administrativa: `GET /api/v1/audit/logs`, únicamente para `Administrator` con `audit.read`.

El listado de dispositivos ya no envía `homeId`: el backend actual lista los dispositivos autorizados del usuario y no implementa ese filtro.

## Auditoría disponible en backend

El endpoint administrativo ya existe y está documentado en `BK_HS/docs/endpoints-por-rol.md`. La pantalla web de auditoría todavía no lo consume; por eso conserva datos de demostración hasta implementar su estado de carga, vacío y error. No debe mostrarse a `Support`, `HomeUser` ni `Guest`.

Parámetros disponibles: `action`, `tableName`, `from`, `to`, `page` y `pageSize`.

## Datos locales pendientes de conectar

Los paneles de hogares, dispositivos, consumo, reportes, alertas, soporte, vacaciones, metas, administración y auditoría todavía contienen datos de demostración. No se retiraron para evitar dejar pantallas vacías: deben sustituirse gradualmente cuando se conecte cada pantalla al endpoint y se manejen sus estados de carga, vacío y error.

## Docker

El servicio `frontend` se construye desde `FT_HS/Web` y se publica en `http://localhost:5173`. La variable de compilación es `VITE_API_URL=/api/v1`; Nginx reenvía esa ruta al servicio `backend` de la misma red Docker.
