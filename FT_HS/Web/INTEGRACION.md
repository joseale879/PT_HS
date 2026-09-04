# Integración del frontend web

Fecha de revisión: 2026-09-04.

## Conexión

- Docker: el navegador abre `http://localhost:5173`.
- Nginx sirve la aplicación y reenvía `/api/` a `http://backend:3000/api/`.
- El frontend se compila con `VITE_API_URL=/api/v1`.
- Desarrollo directo sin Docker: `VITE_API_URL=http://localhost:3000/api/v1`.
- El frontend nunca se conecta directamente a PostgreSQL ni a MQTT.

El punto único para llamadas de negocio es `src/shared/http/apiClient.ts`; `httpClient.ts` conserva la exportación común. Las vistas no deben construir URLs completas ni usar datos de conexión propios.

## API disponible para el frontend

| Módulo | Prefijo | Operaciones principales |
|---|---|---|
| Auth | `/auth` | registro, login, refresh, logout, cambio y recuperación de contraseña |
| Perfil | `/users` | usuario actual y preferencias |
| Hogares | `/homes` | CRUD básico, miembros y solicitudes |
| Dispositivos | `/devices` | alta, listado, detalle, configuración, estado, desactivar y desvincular |
| Consumo | `/consumption` | summary, daily, hourly, monthly y cost |
| Tarifas | `/tariffs` | tarifa por hogar |
| Alertas | `/alerts` | pendientes, reglas, umbrales, historial y estados |
| Metas | `/goals` | CRUD y progreso |
| Vacaciones | `/vacation` | consulta, actualización y eliminación |
| Soporte | `/support` | catálogos, tickets y respuestas |
| Auditoría | `/audit` | logs para permiso `audit.read` |
| Roles | `/roles` | administración para permiso `roles.manage` |

La ruta completa usa el prefijo `/api/v1`; por ejemplo, el resumen es `GET /api/v1/consumption/summary`.

## Estado por flujo

| Flujo | Situación actual |
|---|---|
| Registro/login | Cliente API y validaciones de formulario preparados; el backend es la validación final. |
| Sesión | Refresh ante `401`, logout y limpieza de sesión implementados en el cliente. |
| Perfil | Consume `/users/me` y preferencias según la vista. |
| Dashboard | Consulta resumen, agregados horarios/diarios, dispositivos y alertas; algunos indicadores visuales todavía son valores de presentación. |
| Hogares | Cliente API disponible; verificar en cada pantalla carga, vacío, error y permisos. |
| Dispositivos | Cliente API disponible; `homeId` no se envía en el listado porque el backend devuelve los autorizados al usuario. |
| Consumo/reportes | Endpoints disponibles; la vista debe mostrar claramente que son agregados de BD, no telemetría instantánea. |
| Alertas/metas/vacaciones/soporte | Rutas y clientes disponibles; terminar validación visual por estado. |
| Auditoría | Endpoint backend protegido; la pantalla todavía requiere consumirlo completamente. |
| MQTT | No hay llamada HTTP desde el frontend: el camino correcto es ESP32 -> broker -> backend -> BD -> API. |

## Reglas de rutas

- No poner `localhost` en el código de producción del navegador cuando se usa Docker; usar `/api/v1`.
- No apuntar el navegador al puerto de PostgreSQL ni al puerto MQTT.
- No duplicar endpoints en cada página; agregar la operación al cliente API común.
- Los permisos se validan en backend aunque la interfaz oculte botones.
- Las respuestas y errores del backend deben conservar el contrato común `{ data, meta }` o `{ error }`.

## Pendientes frontend

- Conectar las pantallas que todavía muestran datos de demostración.
- Eliminar indicadores hardcodeados del dashboard.
- Obtener roles reales de la sesión para no depender del rol fijo `user`.
- Decidir si se agregan rutas URL/deep links; la navegación actual es por estado de React.
- Crear una pantalla de telemetría después de completar la persistencia MQTT en PostgreSQL.

## Verificación local

```powershell
docker compose --env-file .env up -d --build
Invoke-WebRequest http://localhost:5173/health
Invoke-WebRequest http://localhost:3000/health
```

Para una ejecución sin Docker, revisa el `.env.example` de `Web` y ejecuta `npm run dev` desde `FT_HS/Web`.
