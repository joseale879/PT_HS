# Pendientes del proyecto Hidro Smart

Documento consolidado del trabajo pendiente en backend, base de datos, IoT, seguridad e infraestructura.

## Estado general

La arquitectura base, PostgreSQL, Liquibase, RLS, RBAC básico, autenticación inicial y operaciones principales de hogares y dispositivos ya están implementadas.

El backend está conectado a PostgreSQL local y el flujo principal de dispositivos fue validado contra la base de datos real.

## 1. Autenticación y usuarios

- [x] Implementar refresh tokens persistentes.
- [x] Crear endpoint para renovar sesión mediante `POST /api/v1/auth/refresh`.
- [x] Implementar logout.
- [x] Implementar revocación de tokens y sesiones.
- [x] Implementar recuperación de contraseña mediante token de un solo uso.
- [x] Implementar cambio de contraseña autenticado.
- [ ] Implementar verificación de correo.
- [x] Retirar MFA del frontend y del alcance funcional actual.
- [ ] Implementar desactivación o eliminación de cuenta.
- [x] Exponer consulta administrativa paginada de auditoría mediante `audit.read`.
- [ ] Auditar cambios de usuario en todas las operaciones críticas.
- [x] Administrar roles funcionales mediante endpoints protegidos por `roles.manage`.
- [ ] Administrar permisos desde perfiles de administrador.
- [ ] Crear panel interno de `Administrator` para desarrolladores y dueños del proyecto.
- [x] Implementar módulo de tickets para `Support` y creación para `HomeUser`.
- [x] Garantizar que `Guest` sea estrictamente de solo lectura en metas, vacaciones, alertas y demás módulos.

## 2. Hogares

- [x] Actualizar información del hogar mediante `PUT /api/v1/homes/:homeId`.
- [ ] Eliminar o desactivar hogares.
- [ ] Configurar preferencias del hogar.
- [ ] Configurar idioma, moneda y tema.
- [ ] Validar permisos de cada tipo de usuario.
- [ ] Agregar paginación y filtros para miembros.
- [ ] Agregar paginación y filtros para solicitudes.

## 3. Dispositivos

### Ya implementado

- [x] Registrar dispositivos.
- [x] Asociar dispositivos a un hogar.
- [x] Listar dispositivos.
- [x] Consultar un dispositivo.
- [x] Actualizar información del dispositivo.
- [x] Configurar calibración.
- [x] Consultar estado.
- [x] Cambiar estado.
- [x] Registrar cambios de estado en `device.device_history`.

### Pendiente

- [x] Desvincular un dispositivo del hogar mediante `DELETE /api/v1/devices/:deviceId/home/:homeId`.
- [x] Desactivar dispositivos mediante `POST /api/v1/devices/:deviceId/deactivate` usando baja lógica `Suspended`.
- [ ] Reasignar dispositivos entre hogares.
- [ ] Sincronizar firmware.
- [ ] Registrar última telemetría real.
- [ ] Registrar conexión y desconexión real.
- [ ] Actualizar estados automáticamente mediante MQTT.
- [ ] Completar el histórico de telemetría.
- [ ] Probar dispositivos físicos reales.

## 4. MQTT e IoT

- [ ] Configurar broker MQTT.
- [ ] Configurar conexión MQTT segura con TLS.
- [ ] Implementar autenticación de dispositivos.
- [ ] Definir topics oficiales.
- [ ] Implementar parser de mensajes del ESP32.
- [ ] Validar payloads recibidos.
- [ ] Registrar lecturas en `sensor_reading`.
- [ ] Validar la relación dispositivo-hogar antes de insertar lecturas.
- [ ] Rechazar mensajes inválidos.
- [ ] Manejar mensajes duplicados.
- [ ] Manejar dispositivos desconectados.
- [ ] Implementar reintentos.
- [ ] Implementar tolerancia a fallos.
- [ ] Sincronizar estado físico y estado lógico.
- [ ] Integrar firmware del ESP32.

## 5. Consumo

### Ya implementado

- [x] Consultar resumen de consumo por hogar y rango de fechas.
- [x] Validar fechas y UUIDs.

### Pendiente

- [ ] Consultar consumo actual en tiempo real.
- [x] Consultar historial diario mediante `GET /api/v1/consumption/daily`.
- [x] Consultar historial horario mediante `GET /api/v1/consumption/hourly`.
- [x] Consultar historial mensual mediante `GET /api/v1/consumption/monthly`.
- [ ] Comparar periodos.
- [ ] Consultar consumo por dispositivo.
- [ ] Implementar proyecciones de consumo.
- [ ] Implementar predicciones mediante `consumption_prediction`.
- [ ] Completar cálculo de costos.
- [ ] Integrar tarifas por estrato.
- [ ] Agregar paginación y filtros.
- [ ] Actualizar automáticamente los resúmenes.

## 6. Alertas

- [x] Crear reglas de alerta por hogar.
- [x] Actualizar reglas.
- [x] Eliminar reglas.
- [x] Configurar umbrales diarios y mensuales por hogar.
- [x] Consultar resumen de alertas pendientes por hogar.
- [x] Marcar alertas como leídas.
- [x] Descartar alertas.
- [x] Detectar fugas mediante trigger de lecturas y regla `leak_detected`.
- [x] Detectar consumo excesivo mediante job periódico y regla `excessive_consumption`.
- [x] Detectar dispositivos sin lecturas mediante reglas `no_reading` y el job periódico.
- [x] Evaluar reglas activas y generar eventos automáticamente mediante PostgreSQL y el job del backend.
- [x] Implementar notificaciones por correo mediante Gmail SMTP.
- [x] Retirar canales push y SMS del alcance actual; se conserva únicamente Gmail SMTP.
- [x] Consultar historial de alertas con filtros y paginación.

## 7. Tarifas

- [x] Consultar tarifa vigente mediante `GET /api/v1/tariffs/home/:homeId`.
- [ ] Crear tarifas.
- [ ] Actualizar tarifas.
- [ ] Administrar tarifas por estrato.
- [ ] Configurar cargo fijo.
- [ ] Configurar rangos de consumo.
- [x] Aplicar tarifas automáticamente al cálculo mediante las funciones de costos existentes en PostgreSQL.
- [x] Consultar el costo total de un periodo mediante `GET /api/v1/consumption/cost`.
- [ ] Versionar tarifas por fecha.
- [x] Validar vigencia de tarifas al consultar y calcular costos.

## 8. Metas de ahorro

- [x] Crear metas.
- [x] Actualizar metas.
- [x] Eliminar metas.
- [x] Consultar progreso.
- [ ] Comparar consumo real contra la meta.
- [ ] Generar recomendaciones.
- [ ] Marcar recomendaciones como aplicadas.
- [ ] Consultar historial de metas.
- [ ] Notificar avances o incumplimientos.

## 9. Modo vacaciones

- [x] Activar modo vacaciones.
- [x] Desactivar modo vacaciones.
- [x] Consultar estado.
- [x] Configurar fecha inicial y final.
- [ ] Aplicar comportamiento especial a las alertas.
- [ ] Aplicar comportamiento especial a los actuadores.
- [ ] Validar fechas y zona horaria.

## 10. Actuadores

- [ ] Modelar electroválvulas.
- [ ] Modelar hidrobombas.
- [ ] Asociar actuadores a hogares.
- [ ] Asociar actuadores a dispositivos.
- [ ] Registrar actuadores.
- [ ] Consultar actuadores.
- [ ] Actualizar actuadores.
- [ ] Activar y desactivar actuadores.
- [ ] Abrir y cerrar electroválvulas.
- [ ] Encender y apagar hidrobombas.
- [ ] Confirmar ejecución física.
- [ ] Manejar comandos pendientes.
- [ ] Manejar errores del ESP32.
- [ ] Registrar historial de comandos.
- [ ] Implementar comandos mediante MQTT.
- [ ] Aplicar permisos especiales para actuadores.
- [ ] Implementar medidas contra activaciones peligrosas.

## 11. Reportes y analítica

- [ ] Generar reportes.
- [ ] Consultar reportes generados.
- [ ] Descargar reportes.
- [ ] Exportar PDF.
- [ ] Exportar Excel.
- [ ] Exportar CSV.
- [ ] Crear reportes de consumo.
- [ ] Crear reportes de costos.
- [ ] Crear reportes de alertas.
- [ ] Crear reportes de ahorro.
- [ ] Generar recomendaciones automáticas.
- [ ] Actualizar vistas materializadas.
- [ ] Crear jobs programados para reportes.

## 12. Soporte y tickets

La base de datos y el backend ya exponen el flujo inicial de tickets; quedan pendientes capacidades avanzadas.

- [x] Crear tickets.
- [x] Consultar tickets.
- [x] Actualizar estado de tickets.
- [x] Responder tickets.
- [x] Cambiar prioridad.
- [x] Cambiar estado.
- [x] Asignar tickets a soporte.
- [ ] Consultar categorías.
- [x] Consultar historial de respuestas autorizado.
- [x] Aplicar permisos para soporte y administradores.

## 13. Privacidad y cumplimiento

- [ ] Gestionar consentimientos.
- [ ] Crear solicitudes ARCO.
- [ ] Exportar datos personales.
- [ ] Corregir datos personales.
- [ ] Eliminar datos personales.
- [ ] Anonimizar datos.
- [ ] Consultar historial de solicitudes.
- [ ] Verificar identidad del solicitante.
- [ ] Definir políticas de retención.
- [x] Retirar campos y pantallas MFA del alcance funcional actual.
- [ ] Definir cifrado gestionado por backend o KMS.

## 14. Auditoría

- [ ] Implementar auditoría general de operaciones.
- [ ] Auditar cambios de usuarios.
- [ ] Auditar cambios de hogares.
- [ ] Auditar cambios de dispositivos.
- [ ] Auditar configuraciones.
- [ ] Auditar alertas.
- [ ] Auditar actuadores.
- [ ] Auditar accesos.
- [ ] Centralizar errores.
- [ ] Completar la trazabilidad de operaciones críticas.

## 15. Calidad técnica

- [x] Crear pruebas de integración HTTP.
- [x] Crear pruebas de integración con PostgreSQL.
- [x] Validar RLS para un `HomeUser` existente sobre hogares, membresías y dispositivos.
- [ ] Probar RLS con cada rol.
- [ ] Crear pruebas negativas de autorización.
- [ ] Crear pruebas MQTT.
- [ ] Probar con datos reales del ESP32.
- [ ] Ejecutar pruebas de carga.
- [ ] Ejecutar pruebas de concurrencia.
- [ ] Publicar documentación OpenAPI/Swagger.
- [x] Uniformar respuestas de error con `error.code`, `error.message` y `meta.requestId`.
- [x] Agregar paginación compatible (`data` + `pagination`) donde corresponde.
- [x] Agregar filtros y ordenamiento seguro por campos permitidos.
- [x] Agregar rate limiting para las rutas de autenticacion.
- [ ] Proteger la API contra abuso.
- [ ] Completar la validación de payloads.
- [ ] Implementar logs estructurados.
- [ ] Implementar métricas.
- [ ] Implementar monitoreo.
- [ ] Crear health check de MQTT.
- [ ] Crear health check de Redis, si se incorpora.

## 16. Infraestructura y producción

- [ ] Separar ambientes de desarrollo, pruebas y producción.
- [ ] Rotar las contraseñas temporales.
- [ ] Configurar gestión segura de secretos.
- [ ] Configurar HTTPS.
- [ ] Configurar dominio.
- [ ] Crear pipeline CI/CD.
- [ ] Configurar backups automáticos de PostgreSQL.
- [ ] Probar restauración de backups.
- [ ] Definir migraciones controladas en producción.
- [ ] Incorporar Redis/Bull para trabajos asíncronos, si aplica.
- [ ] Implementar sistema de colas.
- [ ] Preparar escalamiento del backend.
- [ ] Monitorear contenedores.
- [ ] Configurar alertas operativas.
- [ ] Definir recuperación ante desastres.

## Resumen por área

| Área | Estado |
|---|---|
| Arquitectura base | Implementada |
| PostgreSQL y Liquibase | Implementados y funcionando |
| RLS y RBAC base | Implementados parcialmente |
| Autenticación básica | Implementada |
| Usuarios | Parcial |
| Hogares | Parcial |
| Dispositivos | Funcional en operaciones principales |
| Consumo | Parcial; históricos, costos por periodo y tarifa vigente implementados |
| MQTT y ESP32 | Pendiente |
| Alertas | Reglas, umbrales y generación automática de eventos implementados; notificaciones y telemetría avanzada pendientes |
| Tarifas | Consulta vigente y cálculo de costos implementados |
| Metas de ahorro | CRUD y progreso implementados; recomendaciones pendientes |
| Modo vacaciones | Configuración, estado y activación implementados; integración con alertas/actuadores pendiente |
| Actuadores | Pendiente |
| Reportes | Pendiente |
| Tickets | Flujo inicial implementado; asignación, prioridad, historial y catálogo implementados |
| Privacidad ARCO | Pendiente |
| Pruebas de integración | Implementadas para conexión, salud HTTP, rutas protegidas y RLS de `HomeUser`; otros roles pendientes |
| Producción | Pendiente |

## Orden recomendado para completar el MVP

1. Probar RLS con cada rol funcional; `HomeUser` ya está validado.
2. Completar detección avanzada de alertas.
3. Implementar notificaciones de alertas.
4. Completar recomendaciones de ahorro e integración de vacaciones con alertas/actuadores.
5. Definir MQTT y telemetría real.
6. Implementar actuadores.
7. Implementar reportes.
8. Completar seguridad y despliegue productivo.

## Priorización de ejecución

Esta es la secuencia recomendada considerando lo que ya existe en `BK_HS` y `BD_HS`.

### Fase 0 — Se puede hacer inmediatamente

Estas tareas no dependen de MQTT ni de hardware externo:

- [x] Actualizar hogares mediante `PUT /api/v1/homes/:homeId`.
- [x] Desvincular dispositivos mediante `DELETE /api/v1/devices/:deviceId/home/:homeId`.
- [x] Desactivar dispositivos mediante `POST /api/v1/devices/:deviceId/deactivate`.
- [x] Completar cambio y recuperación de contraseña.
- [x] Implementar refresh tokens, logout y revocación de sesiones.
- [x] Completar endpoints de consumo diario, horario y mensual.
- [x] Implementar consulta de tarifas vigente y cálculo de costos.
- [x] Implementar metas de ahorro y progreso.
- [x] Implementar modo vacaciones y estado.
- [x] Crear endpoints básicos de alertas, reglas y umbrales.
- [x] Crear pruebas de integración HTTP y PostgreSQL.
- [x] Probar autorización con los roles funcionales `Administrator`, `Support`, `HomeUser` y `Guest`.
- [x] Uniformar respuestas de error.
- [x] Agregar paginación, filtros y ordenamiento donde sea necesario.
- [x] Actualizar la documentación que indicaba que la integración local estaba pendiente.

### Fase 1 — Siguiente bloque recomendado

Después de cerrar la Fase 0:

- [x] Generar eventos automáticamente a partir de reglas activas y lecturas disponibles.
- [ ] Detectar fugas y consumo excesivo.
- [x] Completar cálculo de costos con tarifas por hogar y estrato.
- [ ] Completar recomendaciones de ahorro automáticas.
- [ ] Crear reportes de consumo, costos y alertas.
- [ ] Exportar reportes a CSV, PDF y Excel.
- [ ] Completar auditoría general.
- [ ] Implementar logs estructurados y métricas.
- [ ] Publicar documentación OpenAPI/Swagger.

### Fase 2 — Requiere definir MQTT y el dispositivo

Estas tareas pueden prepararse en código, pero no se pueden validar completamente sin broker, protocolo y ESP32:

- [ ] Elegir y configurar broker MQTT.
- [ ] Definir topics y formato oficial de mensajes.
- [ ] Implementar autenticación MQTT.
- [ ] Implementar TLS.
- [ ] Implementar parser de telemetría.
- [ ] Insertar lecturas reales en `sensor_reading`.
- [ ] Manejar duplicados, reintentos y desconexiones.
- [ ] Actualizar estados automáticamente.
- [ ] Sincronizar el firmware del ESP32.
- [ ] Validar la comunicación con un dispositivo físico.

### Fase 3 — Actuadores y control físico

No conviene cerrar esta fase antes de definir el hardware y las reglas de seguridad:

- [ ] Definir electroválvulas e hidrobombas.
- [ ] Modelar y registrar actuadores.
- [ ] Crear comandos de apertura, cierre, encendido y apagado.
- [ ] Enviar comandos mediante MQTT.
- [ ] Confirmar la ejecución física.
- [ ] Manejar comandos pendientes y errores.
- [ ] Crear apagado de emergencia.
- [ ] Registrar auditoría de cada comando.
- [ ] Probar con hardware real.

### Fase 4 — Producción

Estas tareas deben hacerse antes de publicar el sistema:

- [ ] Separar desarrollo, pruebas y producción.
- [ ] Rotar todas las credenciales temporales.
- [ ] Configurar secretos seguros.
- [ ] Configurar HTTPS y dominio.
- [ ] Crear pipeline CI/CD.
- [ ] Configurar backups de PostgreSQL.
- [ ] Probar restauración de backups.
- [ ] Definir recuperación ante desastres.
- [ ] Configurar monitoreo y alertas operativas.
- [ ] Ejecutar pruebas de carga y concurrencia.
- [ ] Preparar escalamiento del backend.
- [ ] Configurar Redis/Bull y colas si se necesitan jobs asíncronos.

## Qué conviene hacer ahora

El siguiente bloque de trabajo recomendado es:

1. Completar detección avanzada de alertas y notificaciones.
2. Completar recomendaciones de ahorro e integración de vacaciones con alertas/actuadores.
3. Definir MQTT y telemetría real.

## Qué no conviene empezar todavía

- MQTT productivo, hasta definir broker, topics y formato del ESP32.
- Actuadores, hasta definir hardware, confirmación física y apagado de emergencia.
- Jobs con Redis, hasta tener procesos reales que necesiten ejecución asíncrona.
- Escalamiento productivo, hasta cerrar pruebas de integración y seguridad.
- Reportes PDF/Excel, hasta estabilizar los datos y cálculos de consumo.

## Avances completados en la rectificación

- [x] Refresh tokens persistentes con hash almacenado en PostgreSQL.
- [x] Rotación de refresh tokens de un solo uso.
- [x] Logout con revocación de sesión.
- [x] Desactivación lógica de dispositivos.
- [x] Actualización de hogares.
- [x] Desvinculación de dispositivos de hogares.
- [x] Cambio de contraseña autenticado.
- [x] Recuperación de contraseña con token de un solo uso.
- [x] Endpoints de consumo diario, horario y mensual.
