# Arquitectura Frontend Web

La Web usa una arquitectura **Feature-First**. Mobile continúa consumiendo esta Web mediante WebView, por lo que no duplica módulos de negocio.

## Estructura canónica

- `src/app`: ensamblaje, layouts y proveedores globales.
- `src/features`: módulos de dominio; cada uno contiene sus páginas, API, hooks y esquemas.
- `src/shared`: infraestructura transversal: HTTP, sesión, validadores, configuración, UI e i18n.
- `src/assets`: destino para activos propios. Hasta completar esa migración, `src/imports` se conserva por compatibilidad.

## Infraestructura

| Ubicación                          | Responsabilidad                                     |
| ---------------------------------- | --------------------------------------------------- |
| `shared/http/httpClient.ts`        | Cliente HTTP común; no define endpoints de negocio. |
| `shared/storage/sessionStorage.ts` | Adaptador de tokens de sesión.                      |
| `shared/lib/validators.ts`         | Validaciones compartidas.                           |
| `shared/config/env.ts`             | URL base de API.                                    |
| `app/providers/QueryProvider.tsx`  | Base de TanStack Query para datos remotos.          |
| `features/*/api`                   | Contratos por dominio hacia el backend.             |

## Estado de la migración

La migración física de las pantallas existentes está completada: `app/components` quedó vacío, las páginas están en `features`, el layout está en `app/layouts` y los componentes reutilizables en `shared/ui`.

Como evolución funcional quedan la activación gradual de rutas URL con React Router, hooks de TanStack Query por feature y pruebas de cada flujo con el backend. La autorización final sigue siendo responsabilidad del backend y PostgreSQL.
## Estado de integración (2026-09-04)

Las llamadas de negocio se centralizan en `src/shared/http/apiClient.ts` y se configuran con `VITE_API_URL`. En Docker el build usa `/api/v1` y Nginx reenvía `/api/` al backend. El frontend nunca se conecta directamente a PostgreSQL o MQTT.

La navegación actual es interna mediante estado de React; React Router y los deep links quedan como evolución. El backend sigue siendo la autoridad para autenticación, roles, permisos y acceso a hogares/dispositivos.

El dashboard ya consulta agregados de consumo, dispositivos y alertas, pero conserva algunos valores visuales de presentación. La telemetría MQTT no se mostrará como dato real hasta conectar la persistencia MQTT -> PostgreSQL y exponer una consulta adecuada.
