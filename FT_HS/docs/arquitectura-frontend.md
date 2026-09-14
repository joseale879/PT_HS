# Estado y arquitectura del frontend

Ãšltima revisiÃ³n: 2026-09-14.

## Estado actual

`FT_HS/frontend` es una aplicaciÃ³n React + TypeScript + Vite organizada por responsabilidad:

```text
frontend/src/
â”œâ”€â”€ app/          composiciÃ³n, rutas, layouts y providers
â”œâ”€â”€ features/     mÃ³dulos funcionales de HidroSmart
â”œâ”€â”€ shared/       HTTP, i18n, autorizaciÃ³n, almacenamiento y UI reutilizable
â”œâ”€â”€ services/     validaciones compartidas
â”œâ”€â”€ styles/       estilos globales y temas
â”œâ”€â”€ imports/      imÃ¡genes usadas por la aplicaciÃ³n
â””â”€â”€ main.tsx      punto de entrada
```

La aplicaciÃ³n compila correctamente con `npm run build`. El build de producciÃ³n se genera en `frontend/dist`.

## Mobile dentro del mismo proyecto

El cliente móvil no es otro proyecto: comparte `package.json`, `package-lock.json`
y `src` con Web. Expo entra por `frontend/index.js` y usa el adaptador ubicado
en `frontend/src/mobile`. Antes de iniciar Expo, `npm run mobile:prepare`
compila la aplicación Web en `.web-dist` y genera `src/mobile/webBundle.js`.

```powershell
Set-Location FT_HS/frontend
npm ci
npm run mobile:start
```

## ComposiciÃ³n de la aplicaciÃ³n

El Ã¡rbol principal de providers es:

```text
BrowserRouter
â””â”€â”€ QueryProvider
    â””â”€â”€ ThemeProvider
        â””â”€â”€ AuthProvider
            â””â”€â”€ App
                â””â”€â”€ ActiveHomeProvider (solo en rutas autenticadas)
                    â””â”€â”€ DashboardLayout
```

### Providers

- `AuthProvider`: login, registro, refresh token, logout, recuperaciÃ³n de contraseÃ±a, sesiÃ³n actual y permisos.
- `ActiveHomeProvider`: hogares visibles y hogar seleccionado durante la sesiÃ³n.
- `ThemeProvider`: tema visual local de la aplicaciÃ³n.
- `QueryProvider`: configuraciÃ³n de React Query.

### Features conectadas

La feature `features/recommendations` muestra tarjetas informativas de
presentación. No consulta recomendaciones dinámicas, no muestra métricas
inventadas y no permite cambiar estados ni registrar acciones.

## Datos reales

Las métricas de hogares, consumo, tarifas y reportes se renderizan únicamente
con respuestas del backend y PostgreSQL. Cuando no hay registros, se conserva
el estado vacío; no existe un fallback de datos quemados ni una variable de
demostración que altere el bundle.

## AutenticaciÃ³n y sesiÃ³n

Las credenciales se envÃ­an mediante `shared/http/apiClient.ts`. Los tokens se guardan en `sessionStorage`:

- `hidrosmart_access_token`
- `hidrosmart_refresh_token`

Cuando una solicitud devuelve `401`, el cliente intenta renovar el access token una sola vez. Si la renovaciÃ³n falla, limpia la sesiÃ³n y redirige al inicio de sesiÃ³n.

El backend devuelve en `/users/me` el usuario, sus roles funcionales, permisos y preferencias. El frontend no interpreta roles antiguos como `admin`, `technician` o `user`.

## AutorizaciÃ³n en interfaz

Los roles funcionales reconocidos son:

- `Administrator`
- `Support`
- `HomeUser`
- `Guest`

La visibilidad de opciones usa permisos recibidos del backend. Esto solo mejora la experiencia; la autorizaciÃ³n real sigue correspondiendo al backend y a PostgreSQL/RLS.

## InternacionalizaciÃ³n

Idiomas disponibles:

- EspaÃ±ol (`es` / moneda predeterminada `COP`)
- English (`en` / `USD`)
- PortuguÃªs (`pt` / `BRL`)
- Italiano (`it` / `EUR`)

El cambio de idioma guarda idioma y moneda en `/users/me/preferences` antes de cambiar la interfaz. Los textos histÃ³ricos con codificaciÃ³n daÃ±ada se reparan en el procesador de traducciones.

## Reglas de mantenimiento

1. Las llamadas HTTP deben pasar por `apiClient.ts` y sus APIs por feature.
2. No se deben colocar tokens, credenciales ni datos de prueba en componentes.
3. No se deben simular respuestas exitosas de operaciones que no tengan endpoint.
4. Las pantallas deben consumir el `homeId` activo cuando la operaciÃ³n dependa de un hogar.
5. Las validaciones de UX no sustituyen las validaciones del backend.
6. No modificar `frontend/dist` manualmente; se genera mediante el build.
