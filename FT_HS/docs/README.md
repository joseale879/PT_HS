# Documentación del frontend — HidroSmart

Esta carpeta documenta el proyecto frontend único ubicado en `../frontend`.
La aplicación Web y el adaptador Mobile comparten `src`, configuración,
dependencias y lockfile.

Para el estado transversal de base de datos, backend, frontend, MQTT, correo y
pendientes globales consulta
[`../../docs/estado-integral.md`](../../docs/estado-integral.md).

## Documentos

- [Estado y arquitectura](./arquitectura-frontend.md)
- [Acceso local y paneles por rol](./acceso-local-y-roles.md)
- [Rutas de pantalla e integración API](./rutas-y-api-frontend.md)
- [Pendientes exclusivos del frontend](./pendientes-frontend.md)

## Proyecto unificado

El cliente Web es una aplicación React + TypeScript + Vite y entra por
`FT_HS/frontend/index.html`. El cliente Mobile es un adaptador Expo/React
Native con entrada en `FT_HS/frontend/index.js`; carga el bundle web generado
por `npm run mobile:prepare`.

Ambos clientes usan el mismo `FT_HS/frontend/package.json`,
`FT_HS/frontend/package-lock.json` y código de aplicación en
`FT_HS/frontend/src`. No existen instalaciones ni manifests separados para
Web y Mobile.
- Bitácora transversal de cambios del 2026-09-14: `../../docs/cambios-2026-09-14.md`.
