# Estado y arquitectura del frontend

Última revisión: 2026-09-07.

## Estado actual

`FT_HS/Web` es una aplicación React + TypeScript + Vite organizada por responsabilidad:

```text
Web/src/
├── app/          composición, rutas, layouts y providers
├── features/     módulos funcionales de HidroSmart
├── shared/       HTTP, i18n, autorización, almacenamiento y UI reutilizable
├── services/     validaciones compartidas
├── styles/       estilos globales y temas
├── imports/      imágenes usadas por la aplicación
└── main.tsx      punto de entrada
```

La aplicación compila correctamente con `npm run build`. El build de producción se genera en `Web/dist`.

## Composición de la aplicación

El árbol principal de providers es:

```text
BrowserRouter
└── QueryProvider
    └── ThemeProvider
        └── AuthProvider
            └── App
                └── ActiveHomeProvider (solo en rutas autenticadas)
                    └── DashboardLayout
```

### Providers

- `AuthProvider`: login, registro, refresh token, logout, recuperación de contraseña, sesión actual y permisos.
- `ActiveHomeProvider`: hogares visibles y hogar seleccionado durante la sesión.
- `ThemeProvider`: tema visual local de la aplicación.
- `QueryProvider`: configuración de React Query.

## Autenticación y sesión

Las credenciales se envían mediante `shared/http/apiClient.ts`. Los tokens se guardan en `sessionStorage`:

- `hidrosmart_access_token`
- `hidrosmart_refresh_token`

Cuando una solicitud devuelve `401`, el cliente intenta renovar el access token una sola vez. Si la renovación falla, limpia la sesión y redirige al inicio de sesión.

El backend devuelve en `/users/me` el usuario, sus roles funcionales, permisos y preferencias. El frontend no interpreta roles antiguos como `admin`, `technician` o `user`.

## Autorización en interfaz

Los roles funcionales reconocidos son:

- `Administrator`
- `Support`
- `HomeUser`
- `Guest`

La visibilidad de opciones usa permisos recibidos del backend. Esto solo mejora la experiencia; la autorización real sigue correspondiendo al backend y a PostgreSQL/RLS.

## Internacionalización

Idiomas disponibles:

- Español (`es` / moneda predeterminada `COP`)
- English (`en` / `USD`)
- Português (`pt` / `BRL`)
- Italiano (`it` / `EUR`)

El cambio de idioma guarda idioma y moneda en `/users/me/preferences` antes de cambiar la interfaz. Los textos históricos con codificación dañada se reparan en el procesador de traducciones.

## Reglas de mantenimiento

1. Las llamadas HTTP deben pasar por `apiClient.ts` y sus APIs por feature.
2. No se deben colocar tokens, credenciales ni datos de prueba en componentes.
3. No se deben simular respuestas exitosas de operaciones que no tengan endpoint.
4. Las pantallas deben consumir el `homeId` activo cuando la operación dependa de un hogar.
5. Las validaciones de UX no sustituyen las validaciones del backend.
6. No modificar `Web/dist` manualmente; se genera mediante el build.
