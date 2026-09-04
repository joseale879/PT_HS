-- ============================================================
-- FUNCIONES DE VALIDACIÓN DE ALERTAS
-- DOMINIO: alert_rate
-- ============================================================

-- ============================================================
-- 1. Verificar si un consumo supera el tope configurado
-- ============================================================
CREATE OR REPLACE FUNCTION alert_rate.fn_check_threshold(
    p_consumption_m3 DECIMAL,
    p_home_id UUID,
    p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = alert_rate, public, pg_temp
AS $$
DECLARE
    v_daily_limit DECIMAL(10,2);
    v_monthly_limit DECIMAL(10,2);
    v_consumption_day DECIMAL(10,2);
    v_consumption_month DECIMAL(10,2);
BEGIN
    -- Obtener los topes configurados
    SELECT daily_limit, monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM threshold_configuration
    WHERE home_id = p_home_id AND active = TRUE;

    -- Verificar tope diario
    IF v_daily_limit IS NOT NULL THEN
        v_consumption_day := consumption.fn_get_daily_consumption(p_home_id, p_date) / 1000.0;
        IF v_consumption_day > v_daily_limit THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Verificar tope mensual
    IF v_monthly_limit IS NOT NULL THEN
        v_consumption_month := consumption.fn_get_monthly_consumption(
            p_home_id,
            EXTRACT(YEAR FROM p_date)::INTEGER,
            EXTRACT(MONTH FROM p_date)::INTEGER
        ) / 1000.0;
        IF v_consumption_month > v_monthly_limit THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION alert_rate.fn_check_threshold(DECIMAL, UUID, DATE) IS
'Verifica si el consumo del día o mes supera los topes configurados para el hogar.
Retorna TRUE si se supera algún tope, FALSE en caso contrario.
Utilizado en triggers y jobs de evaluación de alertas RF4.1 y RF4.2.';

-- ============================================================
-- 2. Detectar posible fuga (flujo continuo)
-- ============================================================
CREATE OR REPLACE FUNCTION alert_rate.fn_is_leak_detected(
    p_device_id UUID,
    p_reading_time TIMESTAMPTZ,
    p_min_duration_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = consumption, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM sensor_reading sr
        WHERE sr.device_id = p_device_id
          AND sr.recorded_at >= p_reading_time - (p_min_duration_minutes * INTERVAL '1 minute')
          AND sr.consumption_liters > 0.1
        GROUP BY sr.device_id
        HAVING COUNT(*) > 1
           AND MAX(sr.recorded_at) - MIN(sr.recorded_at) >=
               p_min_duration_minutes * INTERVAL '1 minute'
    );
$$;

COMMENT ON FUNCTION alert_rate.fn_is_leak_detected(UUID, TIMESTAMPTZ, INTEGER) IS
'Detecta si hay un flujo continuo de agua durante más de p_min_duration_minutes minutos en el dispositivo.
Utilizado para detectar fugas RF2 y generar alertas RF5.4.';
