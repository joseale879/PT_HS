-- ============================================================
-- ENDURECIMIENTO FINAL DE PRIVILEGIOS
-- ============================================================


-- ============================================================
-- 1. CUENTA DE USUARIO
-- ============================================================
-- La aplicacion no modifica directamente la cuenta completa.
-- Las operaciones sensibles deben pasar por funciones/flujos
-- controlados.

REVOKE UPDATE
ON user_account.user_account
FROM hidro_smart_app;


-- ============================================================
-- 2. RBAC
-- ============================================================
-- Las asignaciones de roles no deben consultarse globalmente
-- desde la conexion del backend.
--
-- Contexto propio:
-- fn_get_my_authorization_context()
--
-- Administracion:
-- fn_get_user_roles()
-- fn_assign_user_role()
-- fn_remove_user_role()

REVOKE SELECT
ON user_account.user_role
FROM hidro_smart_app;


-- ============================================================
-- 3. RESPUESTAS DE SOPORTE
-- ============================================================
-- Las respuestas forman parte del historial conversacional.
-- Una vez creadas no deben editarse directamente.

REVOKE UPDATE
ON analytics_support.ticket_response
FROM hidro_smart_app;


-- ============================================================
-- 4. PROCEDIMIENTOS DE MANTENIMIENTO
-- ============================================================
-- PostgreSQL concede EXECUTE a PUBLIC por defecto cuando se crea
-- una funcion/procedimiento.
--
-- Estos procesos internos nunca deben quedar accesibles a PUBLIC.

REVOKE ALL
ON PROCEDURE consumption.prc_generate_daily_summary(DATE)
FROM PUBLIC;


REVOKE ALL
ON PROCEDURE audit.prc_clean_old_audit_logs(INTEGER, INTEGER)
FROM PUBLIC;


REVOKE ALL
ON PROCEDURE analytics_support.prc_archive_closed_tickets(INTEGER, INTEGER)
FROM PUBLIC;