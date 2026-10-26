# Frontend HidroSmart: endpoints y roles

Fecha de revisiÃ³n: 2026-09-14.

## Roles

El backend usa roles globales `Administrator`, `Support`, `HomeUser` y `Guest`. Dentro de un hogar existe ademÃ¡s la relaciÃ³n de membresÃ­a, por ejemplo `Owner`, miembro o invitado. No se deben mezclar el rol global y la membresÃ­a del hogar.

- `Administrator`: administraciÃ³n global, roles y auditorÃ­a.
- `Support`: atenciÃ³n de tickets y operaciones autorizadas de soporte.
- `HomeUser`: gestiÃ³n de sus hogares y recursos autorizados.
- `Guest`: lectura autorizada.

El backend es la autoridad final. El frontend solo puede ocultar o mostrar controles como ayuda visual.

## IntegraciÃ³n actual

- El cliente vigente estÃ¡ en `FT_HS/frontend/src/shared/http/apiClient.ts`.
- La base de URL viene de `VITE_API_URL`.
- Docker usa `/api/v1` detrÃ¡s de Nginx; desarrollo directo usa `http://localhost:3000/api/v1`.
- AutenticaciÃ³n y restauraciÃ³n de sesiÃ³n estÃ¡n conectadas.
- El dashboard usa consultas reales de resumen, consumo agregado, dispositivos y alertas; el indicador de flujo actual es el Ãºltimo agregado horario y no tiempo real MQTT.
- Las pantallas principales de hogares, dispositivos, consumo, reportes, alertas, metas, vacaciones, soporte, privacidad y administraciÃ³n ya consumen sus APIs; aÃºn deben uniformarse sus estados de carga, vacÃ­o, error y permisos.

## Acceso por mÃ³dulo

| MÃ³dulo | Lectura | Escritura |
|---|---|---|
| Perfil | usuario autenticado | solo la cuenta propia |
| Hogares | usuario con acceso | `homes.manage` |
| Dispositivos | usuario autorizado | `devices.manage` |
| Consumo | `consumption.read` | no hay escritura REST general |
| Alertas | usuario con acceso al hogar | permiso de gestiÃ³n de alertas |
| Metas | usuario autorizado | `homes.manage` |
| Vacaciones | usuario autorizado | `homes.manage` |
| Soporte | usuario autorizado | creaciÃ³n propia o permisos de soporte |
| Roles | `roles.manage` | `roles.manage` |
| AuditorÃ­a | `audit.read` | no aplica |

El inventario de rutas exactas estÃ¡ en `BK_HS/docs/03-endpoints.md` y la matriz de permisos en `BK_HS/docs/endpoints-por-rol.md`.

## Reglas para la interfaz

1. Obtener el `homeId` real desde `/api/v1/homes`.
2. No usar `CURRENT_USER_ID`, hogares, dispositivos ni membresÃ­as quemadas.
3. Consultar los endpoints de cada mÃ³dulo mediante `apiClient`.
4. Mantener estados de carga, vacÃ­o, error y reintento.
5. No confiar en el rol local para autorizar una mutaciÃ³n.
6. No llamar a PostgreSQL, Mosquitto ni SMTP desde el navegador.
7. Mostrar MQTT solo despuÃ©s de que la lectura se persista y exista una consulta REST o canal de tiempo real.

## Estado de navegaciÃ³n

La navegaciÃ³n usa React Router. El menÃº y las rutas protegidas consultan los
roles/permisos de la sesiÃ³n; `Administrator` y `Support` tienen paneles
separados y `HomeUser`/`Guest` no acceden a soporte ni notificaciones. Quedan
pruebas manuales de deep links y permisos con usuarios funcionales reales.
