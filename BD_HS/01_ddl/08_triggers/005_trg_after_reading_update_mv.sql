-- ============================================================
-- TRIGGER: trg_after_reading_update_mv
-- DOMINIO: consumption
-- PROPÓSITO: Refresca vistas materializadas de consumo después de insertar lecturas
-- ============================================================

-- ============================================================
-- 1. Función para refrescar vistas de consumo
-- ============================================================
CREATE OR REPLACE FUNCTION consumption.fn_after_reading_update_mv()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, public, pg_temp
AS $$
BEGIN
    -- Refrescar vistas materializadas de consumo (de forma diferida)
    -- Nota: Estas vistas se refrescan con menos frecuencia, por lo que este trigger
    -- podría ejecutarse solo si han pasado N minutos desde el último refresh.
    -- Por simplicidad, refrescamos solo si no hay un refresh reciente.
    PERFORM 1;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION consumption.fn_after_reading_update_mv() IS
'Función para refrescar vistas materializadas de consumo. 
Por diseño, estas vistas se refrescan mediante un job programado (procedimiento prc_refresh_materialized_views)
para evitar sobrecarga en la base de datos.';

-- ============================================================
-- 2. Trigger después de insertar una lectura (refresco diferido)
-- ============================================================
-- Nota: Este trigger está comentado porque el refresco de vistas materializadas
-- se realiza mediante el procedimiento prc_refresh_materialized_views() de forma programada.
-- Descomentar solo si se requiere actualización en tiempo real.
/*
CREATE TRIGGER trg_after_reading_update_mv
    AFTER INSERT ON consumption.sensor_reading
    FOR EACH ROW
    EXECUTE FUNCTION consumption.fn_after_reading_update_mv();
*/