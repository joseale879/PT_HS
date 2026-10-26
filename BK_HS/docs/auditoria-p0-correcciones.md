# Correcciones de auditoría P0

Última revisión: 2026-09-13.

Este documento registra la verificación del informe P0 recibido y distingue los hallazgos que aplicaban al árbol actual de los que pertenecían a una versión anterior.

## Resultado

| Hallazgo | Resultado | Corrección/verificación |
|---|---|---|
| Migración 021 crea vistas duplicadas | No aplicaba al árbol actual | La nueva `021_iot_sensor_reading_ingest.sql` solo agrega `mqtt_message_id`; las vistas siguen creadas únicamente por `05_materialized_views`. |
| Rollback de 021 | Corregido | El rollback elimina índice, constraint y columna; no modifica vistas dependientes. |
| Instalación limpia | Verificado | `validate` correcto, `update` correcto y `status up to date`; el estado vigente tiene 217 changesets. El corte original P0 tenía 188. |
| Variables `.env` | Corregido | Se alinearon `DB_INGEST_*`, CORS, URL de frontend, reset URL, issuer y audience en ejemplos y Compose. |
| SMTP bloquea registro/reset | Corregido | Registro y reset no dependen del resultado SMTP; los errores se registran sin filtrar información ni cambiar la respuesta pública. |
| Reenvío de verificación | Implementado | `POST /api/v1/auth/resend-verification` invalida tokens anteriores, crea uno nuevo y responde 202 de forma genérica. También existe `POST /api/v1/auth/verify-email`. |
| Duplicados MQTT QoS 1 | Implementado | `mqttMessageId` viaja por parser, handler y repositorio; la BD tiene índice único parcial y la función usa `ON CONFLICT DO NOTHING`. Prueba real bajo `hidro_smart_app`: 1 inserción y 1 duplicado ignorado. |
| Logout inmediato | Implementado | El middleware valida `sid` contra `user_account.session`; una sesión cerrada responde 401 inmediatamente. |
| Consentimiento | Implementado | Registro exige ambos consentimientos y versión `2026-09`; se guardan tipo, versión, fecha, IP y User-Agent en `privacy.user_consent`. |
| Texto de privacidad | Corregido | Se unificó HidroSmart y se eliminaron promesas de exportación/eliminación automática no implementadas. |
| Mosquitto anónimo | Limitado a desarrollo | `allow_anonymous true` se conserva solo para el entorno local; producción requiere usuarios, ACL y TLS. |
| Persistencia Mosquitto | Implementado | Persistencia habilitada, autosave configurado y volumen Docker `hidro_smart_mosquitto_data`. |

## Comprobaciones ejecutadas

```text
BK_HS: npm run check       OK
BK_HS: npm test             156/156 OK
Liquibase validate          OK
Liquibase update            OK
Liquibase status            up to date
Docker backend health       HTTP 200
Docker frontend             HTTP 200
Registro + consentimiento   OK
GET /users/me sin roles     HTTP 200
Logout                      HTTP 204
Access token revocado       HTTP 401
Reset desconocido           HTTP 202
Reenvío existente/desconocido HTTP 202/202
```

## Pendientes no P0

- Probar la ingesta con un ESP32 real que envíe siempre `mqttMessageId` estable por lectura.
- El backend ya separa el pool de ingesta mediante `DB_INGEST_USER`/`DB_INGEST_PASSWORD`; el rol `hidro_smart_ingest` ejecuta la función `SECURITY DEFINER` versionada por Liquibase y no recibe lectura global.
- Configurar autenticación, ACL y TLS de Mosquitto para producción.
