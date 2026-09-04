-- ============================================================
-- FUNCIONES DE AYUDA PARA ANÁLISIS Y REPORTES
-- DOMINIO: analytics_support
-- ============================================================

-- ============================================================
-- 1. Calcular el progreso de una meta de ahorro
-- ============================================================
CREATE OR REPLACE FUNCTION analytics_support.fn_get_goal_progress(
    p_goal_id UUID
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = analytics_support, consumption, public, pg_temp
AS $$
DECLARE
    v_goal RECORD;
    v_consumed DECIMAL(10,4);
    v_progress DECIMAL(5,2);
BEGIN
    -- Obtener la meta
    SELECT home_id, target_m3, period_start, period_end
    INTO v_goal
    FROM home.saving_goal
    WHERE goal_id = p_goal_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Calcular el consumo en el período
    SELECT COALESCE(SUM(consumption_m3), 0)
    INTO v_consumed
    FROM consumption.sensor_reading
    WHERE home_id = v_goal.home_id
      AND recorded_at::DATE BETWEEN v_goal.period_start AND COALESCE(v_goal.period_end, CURRENT_DATE);

    -- Calcular porcentaje
    IF v_goal.target_m3 > 0 THEN
        v_progress := (v_consumed / v_goal.target_m3) * 100;
        IF v_progress > 100 THEN
            v_progress := 100;
        END IF;
    ELSE
        v_progress := 0;
    END IF;

    RETURN v_progress;
END;
$$;

COMMENT ON FUNCTION analytics_support.fn_get_goal_progress(UUID) IS
'Calcula el porcentaje de progreso de una meta de ahorro basado en el consumo real.
Utilizado para mostrar el progreso en la pantalla de Metas RF5.7.';
