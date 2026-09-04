# Limpieza segura de carpetas

## Se pueden eliminar ahora

| Ruta | Motivo | Recuperación |
|---|---|---|
| `dist/` | Salida generada por Vite. | `npm run build` o `docker compose up -d --build frontend`. |
| `node_modules/` | Dependencias instaladas localmente. | `npm ci`. |
| `src/app/components/` | Ya está vacía: sus pantallas migraron a `features`, el layout a `app/layouts` y la UI a `shared/ui`. | No se requiere. |
| `src/contexts/` | Está vacía: el tema vive en `app/providers/ThemeContext.tsx`. | No se requiere. |
| `src/i18n/` y `src/locales/` | Están vacías: i18n vive en `shared/i18n/`. | No se requiere. |
| `src/services/validation.ts` y después `src/services/` | Es código legado sin importaciones activas; los validadores están en `shared/lib/validators.ts`. | No se requiere. |

No elimines a la vez `node_modules/` y el acceso a la caché de npm si necesitas compilar sin conexión.

## No eliminar todavía

| Ruta | Dependencia activa | Requisito previo |
|---|---|---|
| `src/imports/` | Contiene imágenes utilizadas por pantallas activas. | Migrar activos a `src/assets/` y actualizar sus imports. |
| `src/styles/` | Estilos globales activos. | Ninguno. |

## Orden de limpieza

1. Ejecutar `npm run build` (ya validado correctamente).
2. Eliminar las rutas de la primera tabla.
3. Volver a ejecutar `npm run build`.
4. Migrar los assets de `src/imports/` a `src/assets/` antes de eliminar esa carpeta.
