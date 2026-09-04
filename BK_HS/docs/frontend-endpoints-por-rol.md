# Frontend HidroSmart: endpoints y roles

Fecha de revisión: 2026-09-04.

## Roles

El backend usa roles globales `Administrator`, `Support`, `HomeUser` y `Guest`. Dentro de un hogar existe además la relación de membresía, por ejemplo `Owner`, miembro o invitado. No se deben mezclar el rol global y la membresía del hogar.

- `Administrator`: administración global, roles y auditoría.
- `Support`: atención de tickets y operaciones autorizadas de soporte.
- `HomeUser`: gestión de sus hogares y recursos autorizados.
- `Guest`: lectura autorizada.

El backend es la autoridad final. El frontend solo puede ocultar o mostrar controles como ayuda visual.

## Integración actual

- El cliente vigente está en `FT_HS/Web/src/shared/http/apiClient.ts`.
- La base de URL viene de `VITE_API_URL`.
- Docker usa `/api/v1` detrás de Nginx; desarrollo directo usa `http://localhost:3000/api/v1`.
- Autenticación y restauración de sesión están conectadas.
- El dashboard usa consultas reales de resumen, consumo agregado, dispositivos y alertas, aunque conserva algunos indicadores visuales.
- Las demás pantallas deben validarse por estados de carga, vacío, error y permisos antes de retirar todos los datos de presentación.

## Acceso por módulo

| Módulo | Lectura | Escritura |
|---|---|---|
| Perfil | usuario autenticado | solo la cuenta propia |
| Hogares | usuario con acceso | `homes.manage` |
| Dispositivos | usuario autorizado | `devices.manage` |
| Consumo | `consumption.read` | no hay escritura REST general |
| Alertas | usuario con acceso al hogar | permiso de gestión de alertas |
| Metas | usuario autorizado | `homes.manage` |
| Vacaciones | usuario autorizado | `homes.manage` |
| Soporte | usuario autorizado | creación propia o permisos de soporte |
| Roles | `roles.manage` | `roles.manage` |
| Auditoría | `audit.read` | no aplica |

El inventario de rutas exactas está en `BK_HS/docs/03-endpoints.md` y la matriz de permisos en `BK_HS/docs/endpoints-por-rol.md`.

## Reglas para la interfaz

1. Obtener el `homeId` real desde `/api/v1/homes`.
2. No usar `CURRENT_USER_ID`, hogares, dispositivos ni membresías quemadas.
3. Consultar los endpoints de cada módulo mediante `apiClient`.
4. Mantener estados de carga, vacío, error y reintento.
5. No confiar en el rol local para autorizar una mutación.
6. No llamar a PostgreSQL, Mosquitto ni SMTP desde el navegador.
7. Mostrar MQTT solo después de que la lectura se persista y exista una consulta REST o canal de tiempo real.

## Estado de navegación

La navegación actual es interna por estado de React. No hay todavía un contrato de URL/deep links completo. El rol usado para construir parte del menú está fijado como `user` en varios puntos y debe reemplazarse por la sesión/rol real cuando se cierre el panel administrativo.
