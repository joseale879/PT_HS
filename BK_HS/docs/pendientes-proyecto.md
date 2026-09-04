# Pendientes del proyecto HidroSmart

Fecha de revisión: 2026-09-04.

Este checklist reemplaza estados anteriores que marcaban MQTT como inexistente. La arquitectura ya está creada; lo pendiente es cerrar la integración funcional y verificar cada pantalla con datos reales.

## Completado y verificado

- [x] Docker Compose integrado para PostgreSQL, Liquibase, backend, frontend, Mailpit y Mosquitto.
- [x] Liquibase validado y base local actualizada.
- [x] Roles de base de datos, grants, RLS, funciones, procedimientos, triggers y vistas aplicados.
- [x] Registro, login, JWT, refresh persistente, logout, cambio y recuperación de contraseña.
- [x] Rutas de hogares, miembros, dispositivos, consumo, tarifas, alertas, metas, vacaciones, soporte, roles y auditoría.
- [x] Cliente HTTP centralizado en frontend y proxy Nginx hacia `/api/v1`.
- [x] Cliente MQTT, publisher, subscriber, topics, parser y handlers básicos.
- [x] Recepción y normalización local de una telemetría compatible con el YF-S201.
- [x] Formato del frontend, build web y pruebas unitarias del backend.

## Prioridad 1: cerrar MQTT con PostgreSQL

- [ ] Implementar `ReceiveReading` o caso de uso equivalente.
- [ ] Crear el repositorio de ingestión PostgreSQL.
- [ ] Resolver `deviceCode -> device_id -> home_id` y rechazar dispositivos desconocidos/inactivos.
- [ ] Definir la conexión del backend con el rol de ingestión y sus permisos mínimos.
- [ ] Otorgar, mediante Liquibase, solo los permisos necesarios para lecturas e historial de telemetría.
- [ ] Definir idempotencia y deduplicación para QoS 1.
- [ ] Validar límites de caudal, consumo, pulsos y timestamp.
- [ ] Corregir la precisión de `consumption_liters` antes de almacenar muestras de un segundo.
- [ ] Agregar pruebas de integración MQTT -> PostgreSQL.
- [ ] Comparar el protocolo con el código real del ESP32 cuando sea entregado.

## Prioridad 2: cerrar actuadores

- [ ] Definir topics finales de comandos y respuestas.
- [ ] Crear casos de uso para válvula y bomba.
- [ ] Exponer rutas REST de actuadores solo después de definir permisos y auditoría.
- [ ] Invocar `MqttPublisher` desde una operación de negocio.
- [ ] Persistir estado y confirmar timeout, reintentos y respuesta del dispositivo.

Los endpoints de actuadores que aparecen como propuesta en documentos antiguos no están montados actualmente.

## Prioridad 3: frontend real

- [ ] Sustituir datos de presentación del dashboard por respuestas reales.
- [ ] Conectar y probar estados de carga, vacío y error en hogares, dispositivos, reportes, alertas, metas, vacaciones, soporte y auditoría.
- [ ] Reemplazar el rol fijo del frontend por roles de sesión entregados por backend.
- [ ] Decidir e implementar navegación por URL/deep links si se necesita compartir vistas.
- [ ] Mostrar telemetría reciente mediante endpoint persistido o canal en tiempo real después de cerrar MQTT.
- [ ] Mantener validaciones de formularios alineadas con los DTO y validadores del backend.

## Prioridad 4: base de datos y operación

- [ ] Crear cambios Liquibase nuevos; no modificar changesets ya aplicados.
- [ ] Revisar la retención/particionado de `sensor_reading` y `device_telemetry_history` cuando aumente el volumen.
- [ ] Definir índices para consultas por dispositivo y rango temporal.
- [ ] Completar auditoría de operaciones críticas.
- [ ] Habilitar autenticación, ACL y TLS de Mosquitto fuera del entorno local.
- [ ] Configurar secretos fuera del repositorio y rotarlos antes de cualquier despliegue.

## Pruebas actuales

- Backend: 82 pruebas unitarias aprobadas.
- Backend: chequeo de sintaxis aprobado.
- Frontend: formato y build aprobados.
- BD: `liquibase validate` y `status --verbose` aprobados.
- MQTT: recepción y parsing verificados; persistencia aún no verificada.
- Integración externa: se ejecuta solo al configurar sus credenciales.
