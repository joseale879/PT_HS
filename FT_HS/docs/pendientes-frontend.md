# Pendientes exclusivos del frontend

Última revisión: 2026-09-07.

Este archivo contiene únicamente trabajo del cliente `FT_HS/Web`. Las tareas de backend, base de datos, SMTP, MQTT e IoT se documentan en sus respectivos proyectos.

## Completado

- [x] Rutas públicas y protegidas con React Router.
- [x] Login, registro, refresh token, logout y recuperación/restablecimiento de contraseña conectados al cliente HTTP.
- [x] Estado central de autenticación y permisos funcionales.
- [x] Roles `Administrator`, `Support`, `HomeUser` y `Guest` reflejados en la navegación.
- [x] Hogar activo compartido entre las pantallas que dependen de un hogar.
- [x] Perfil conectado a `/users/me` y actualización de nombre, teléfono y ciudad.
- [x] Cambio de contraseña conectado a `/auth/change-password`.
- [x] Preferencias de idioma y moneda conectadas a `/users/me/preferences`.
- [x] Dashboard, consumo, reportes, metas, alertas, hogares, dispositivos, vacaciones y soporte conectados a sus APIs disponibles.
- [x] Progreso de metas consultado desde `/goals/:goalId/progress`.
- [x] Alertas pendientes consultadas desde `/alerts/home/:homeId/pending`.
- [x] Conteos de hogares y dispositivos cargados desde la API.
- [x] Eliminación de acciones ficticias de sesiones, tokens, exportación, foto, privacidad y reportes.
- [x] Corrección de textos con mojibake en las traducciones históricas.
- [x] Diseño responsive base para escritorio, tablet y móvil web.
- [x] Build de producción verificado con Vite.

## Prioridad alta

- [ ] Probar manualmente login, registro, refresh y logout con los cuatro usuarios funcionales.
- [ ] Probar navegación por permisos con `Administrator`, `Support`, `HomeUser` y `Guest`.
- [ ] Añadir estados visuales consistentes de carga, vacío y error a todas las pantallas.
- [ ] Completar paginación, filtros y ordenamiento visual donde el backend ya envía `pagination`.
- [ ] Revisar textos restantes que aún estén escritos directamente en español en vez de usar i18n.
- [ ] Ejecutar una prueba visual en móvil real o emulador de iPhone y Android.

## Prioridad media

- [ ] Completar la pantalla de gestión de usuarios para `users.manage`.
- [ ] Crear componentes reutilizables para tablas, filtros, estados y formularios repetidos.
- [ ] Incorporar React Query en las consultas que todavía usan `useEffect` manual.
- [ ] Añadir pruebas de componentes y pruebas de rutas protegidas.
- [ ] Mejorar división de bundles mediante carga diferida de features.
- [ ] Revisar accesibilidad con teclado, lector de pantalla, foco visible y contraste.

## Bloqueados por contrato API

- [ ] Sesiones: listado, cierre individual y revocación global.
- [ ] Privacidad/ARCO: consentimientos persistidos, exportación y eliminación de cuenta.
- [ ] Exportación de reportes en CSV/PDF/Excel.
- [ ] Subida y persistencia de foto de perfil.
- [ ] Tiempo real de lecturas y estados MQTT.
- [ ] Comandos de actuadores.

## Criterio para cerrar una tarea

Una tarea frontend se marca como terminada solo cuando:

1. Existe una ruta o contrato API verificable si la función depende del servidor.
2. La pantalla maneja éxito, carga, vacío y error.
3. No contiene datos quemados que aparenten ser datos reales.
4. Respeta los permisos funcionales recibidos.
5. Compila y pasa las pruebas correspondientes.
