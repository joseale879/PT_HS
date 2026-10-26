# Pendientes exclusivos del frontend

Ãšltima revisiÃ³n: 2026-09-14.

Este archivo contiene Ãºnicamente trabajo del cliente `FT_HS/frontend`. Las tareas de backend, base de datos, SMTP, MQTT e IoT se documentan en sus respectivos proyectos.

## Completado

- [x] Rutas pÃºblicas y protegidas con React Router.
- [x] Login, registro, refresh token, logout y recuperaciÃ³n/restablecimiento de contraseÃ±a conectados al cliente HTTP, incluyendo validaciÃ³n del contexto del token.
- [x] Estado central de autenticaciÃ³n y permisos funcionales.
- [x] Roles `Administrator`, `Support`, `HomeUser` y `Guest` reflejados en la navegaciÃ³n.
- [x] Hogar activo compartido entre las pantallas que dependen de un hogar.
- [x] Perfil conectado a `/users/me` y actualizaciÃ³n de nombre, telÃ©fono y ciudad.
- [x] Cambio de contraseÃ±a conectado a `/auth/change-password`.
- [x] Preferencias de idioma y moneda conectadas a `/users/me/preferences`.
- [x] Preferencias de notificaciones conectadas a `/users/me/notifications` y ubicadas dentro de Configuración; el canal operativo disponible es Gmail.
- [x] Dashboard, consumo, reportes, metas, alertas, hogares, dispositivos, vacaciones y soporte conectados a sus APIs disponibles; recomendaciones se presenta como contenido visual.
- [x] Progreso de metas consultado desde `/goals/:goalId/progress`.
- [x] Alertas pendientes consultadas desde `/alerts/home/:homeId/pending`.
- [x] Conteos de hogares y dispositivos cargados desde la API.
- [x] EliminaciÃ³n de acciones ficticias de sesiones, tokens, exportaciÃ³n, foto, privacidad y reportes.
- [x] CorrecciÃ³n de textos con mojibake en las traducciones histÃ³ricas.
- [x] DiseÃ±o responsive base para escritorio, tablet y mÃ³vil web.
- [x] Build de producciÃ³n verificado con Vite.
- [x] Seguridad consulta `/auth/sessions` y permite revocar una sesiÃ³n, las demÃ¡s o todas.
- [x] GestiÃ³n de usuarios consume `/users` con bÃºsqueda, filtro, paginaciÃ³n y acciones de estado.
- [x] Dispositivos consume el contrato paginado del backend con ordenamiento, estados de carga/error/vacÃ­o y reintento.
- [x] Hogares muestra estados de carga, vacÃ­o y error con reintento; los miembros tienen su propio estado de carga/error.
- [x] Hogares oculta creaciÃ³n, gestiÃ³n de miembros y solicitudes a roles sin `homes.manage`, manteniendo la consulta visual.
- [x] Hogares presenta las tarjetas en un carrusel horizontal responsive con controles de navegación.
- [x] Las vistas protegidas validan el permiso tambiÃ©n al entrar por URL directa.
- [x] El menÃº separa el panel de `Administrator` y `Support` de las vistas del hogar.
- [x] `Administrator` queda limitado a Panel Administrador, GestiÃ³n de Usuarios, AuditorÃ­a y ConfiguraciÃ³n; `Support` queda limitado a Panel de Soporte y ConfiguraciÃ³n.
- [x] Dispositivos permite registrar `location`, editar nombre/ubicaciÃ³n y vincular un dispositivo existente por su cÃ³digo tÃ©cnico.
- [x] `HomeUser` y `Guest` gestionan sus preferencias de notificaciones desde Configuración y pueden abrir sus tickets propios en `/app/support`.
- [x] `Administrator` accede a `/app/admin`, `/app/users` y `/app/audit`; `Support` accede a `/app/support/management`, la bandeja de tickets recibidos.
- [x] AdministraciÃ³n de roles funcionales desde `/app/users` mediante `rolesApi`, con asignaciÃ³n y retiro de roles.
- [x] Soporte: abrir detalle, consultar historial, enviar respuestas y actualizar estados desde el panel de `Administrator`/`Support`.
- [x] Soporte: pantalla de tickets propios para usuarios autenticados, con creación, filtros, detalle, respuestas y estados.
- [x] Soporte: paginación real del listado, filtro por prioridad y ordenamiento por fecha, título, prioridad o estado; incluye carga y controles accesibles.
- [x] Vista `/app/consumption` conectada a resumen, lecturas diarias, promedios horarios y costo del backend.
- [x] Dashboard, Consumo y Reportes usan `/consumption/advanced` para series horarias, diarias, mensuales y por ubicación; no agregan lecturas individuales en el navegador.
- [x] Privacidad: descarga de exportaciÃ³n JSON propia, creaciÃ³n y consulta de solicitudes ARCO desde configuraciÃ³n.
- [x] Reportes: descarga PDF y Excel resumida del consumo actual desde endpoints protegidos del backend.
- [x] Recomendaciones: tarjetas informativas visuales sin datos quemados, estados ni acciones persistidas.
- [x] NavegaciÃ³n autenticada: las subrutas `/app/*` cargan el layout en lugar de caer en â€œPÃ¡gina no encontradaâ€.
- [x] Layout: menÃº lateral colapsable, selector de colores retirado del encabezado y correo oculto en el acceso al perfil.
- [x] Actuadores: estados del hogar y controles de vÃ¡lvula/bomba conectados a `/api/v1/actuators`; las acciones se muestran solo con `actuators.manage`.

## Prioridad alta

- [ ] Probar manualmente login, registro, refresh y logout con los cuatro usuarios funcionales.
- [ ] Probar manualmente navegaciÃ³n y redirecciÃ³n por permisos con `Administrator`, `Support`, `HomeUser` y `Guest`.
- [ ] AÃ±adir estados visuales consistentes de carga, vacÃ­o y error a todas las pantallas.
- [ ] Completar paginaciÃ³n, filtros y ordenamiento visual donde el backend ya envÃ­a `pagination` en las pantallas restantes.
- [ ] Revisar textos restantes que aÃºn estÃ©n escritos directamente en espaÃ±ol en vez de usar i18n.
- [ ] Ejecutar una prueba visual en mÃ³vil real o emulador de iPhone y Android.

## Prioridad media

- [ ] Crear componentes reutilizables para tablas, filtros, estados y formularios repetidos.
- [ ] Incorporar React Query en las consultas que todavÃ­a usan `useEffect` manual.
- [ ] AÃ±adir pruebas de componentes y pruebas de rutas protegidas.
- [x] Mejorar divisiÃ³n de bundles mediante carga diferida de features autenticadas.
- [x] Agregar fallback y recuperaciÃ³n para errores al descargar una pantalla diferida.
- [ ] Revisar accesibilidad con teclado, lector de pantalla, foco visible y contraste.
- [ ] Reducir el chunk principal de producciÃ³n: Vite aÃºn muestra una advertencia por un chunk mayor de 500 kB.

## Bloqueados por contrato API

- [ ] Privacidad: gestionar eliminaciÃ³n/cancelaciÃ³n completa y mostrar el detalle administrativo de una solicitud.
- [x] Historial y descarga de reportes persistidos en PDF/Excel mediante `reportsApi.history` y `reportsApi.downloadStored`.
- [ ] Subida y persistencia de foto de perfil.
- [ ] Tiempo real de lecturas y estados MQTT.
- [x] Comandos de actuadores bÃ¡sicos; quedan pendientes pruebas con ESP32 real y tiempo real MQTT.

## Criterio para cerrar una tarea

Una tarea frontend se marca como terminada solo cuando:

1. Existe una ruta o contrato API verificable si la funciÃ³n depende del servidor.
2. La pantalla maneja Ã©xito, carga, vacÃ­o y error.
3. No contiene datos quemados que aparenten ser datos reales.
4. Respeta los permisos funcionales recibidos.
5. Compila y pasa las pruebas correspondientes.
