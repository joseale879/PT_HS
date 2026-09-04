-- ============================================================
-- TRIGGER: trg_after_alert_insert
-- DOMINIO: alert_rate
-- PROPÓSITO: Mantenido desactivado por seguridad operacional
-- ============================================================

-- ============================================================
-- 1. Función placeholder para compatibilidad
-- ============================================================
-- La actualización de vistas materializadas no se hace dentro del trigger
-- porque `REFRESH MATERIALIZED VIEW CONCURRENTLY` no puede ejecutarse dentro
-- de una transacción activa. El refresco se realiza mediante el procedimiento
-- programado `analytics_support.prc_refresh_materialized_views()`.
CREATE OR REPLACE FUNCTION alert_rate.fn_after_alert_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = alert_rate, public, pg_temp
AS $$
BEGIN
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION alert_rate.fn_after_alert_insert() IS
'Función de compatibilidad para el trigger desactivado. El refresco real de la vista materializada se ejecuta por job programado.';

-- ============================================================
-- 2. Trigger desactivado por diseño
-- ============================================================
-- CREATE TRIGGER trg_after_alert_insert
--     AFTER INSERT ON alert_rate.alert_event
--     FOR EACH ROW
--     EXECUTE FUNCTION alert_rate.fn_after_alert_insert();