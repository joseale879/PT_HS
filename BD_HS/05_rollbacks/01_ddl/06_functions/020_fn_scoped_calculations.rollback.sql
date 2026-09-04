CREATE OR REPLACE FUNCTION consumption.fn_calculate_cost(
    p_consumption_m3 DECIMAL,
    p_home_id UUID,
    p_date DATE
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, alert_rate, home, public, pg_temp
AS $$
DECLARE
    v_rate DECIMAL(12,4);
    v_home_tier SMALLINT;
BEGIN
    SELECT h.tier INTO v_home_tier FROM home h WHERE h.home_id = p_home_id;

    SELECT hr.m3_value
    INTO v_rate
    FROM alert_rate.home_rate hr
    WHERE hr.home_id = p_home_id
      AND hr.tier = v_home_tier
      AND hr.valid_from <= p_date
      AND (hr.valid_until IS NULL OR hr.valid_until >= p_date)
    ORDER BY hr.valid_from DESC
    LIMIT 1;

    IF v_rate IS NULL THEN
        RETURN NULL;
    END IF;

    -- fixed_charge es mensual y no se cobra nuevamente por cada lectura.
    RETURN ROUND(p_consumption_m3 * v_rate, 2);
END;
$$;

COMMENT ON FUNCTION consumption.fn_calculate_cost(DECIMAL, UUID, DATE) IS
'Calcula únicamente el costo variable por consumo. El fixed_charge mensual se liquida en el resumen del período.';

CREATE OR REPLACE FUNCTION consumption.fn_calculate_consumption(
    p_home_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_m3 DECIMAL(10,4),
    total_liters DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reading_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, home, public, pg_temp
AS $$
BEGIN
    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date THEN
        RAISE EXCEPTION 'El rango de fechas no es valido';
    END IF;

    RETURN QUERY
    SELECT
        COALESCE(SUM(sr.consumption_m3), 0)::DECIMAL(10,4),
        COALESCE(SUM(sr.consumption_liters), 0)::DECIMAL(10,2),
        COALESCE(SUM(sr.estimated_cost), 0)::DECIMAL(10,2),
        COUNT(*)::INTEGER
    FROM sensor_reading sr
    WHERE sr.home_id = p_home_id
      AND sr.recorded_at >= p_start_date::timestamp
      AND sr.recorded_at < (p_end_date + 1)::timestamp;
END;
$$;

CREATE OR REPLACE FUNCTION consumption.fn_get_daily_consumption(
    p_home_id UUID,
    p_date DATE
)
RETURNS DECIMAL(10,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = consumption, public, pg_temp
AS $$
    SELECT COALESCE(SUM(consumption_liters), 0)
    FROM sensor_reading
    WHERE home_id = p_home_id
      AND recorded_at >= p_date::timestamp
      AND recorded_at < (p_date + 1)::timestamp;
$$;

CREATE OR REPLACE FUNCTION consumption.fn_get_monthly_consumption(
    p_home_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS DECIMAL(10,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = consumption, public, pg_temp
AS $$
    SELECT COALESCE(SUM(consumption_liters), 0)
    FROM sensor_reading
    WHERE home_id = p_home_id
      AND recorded_at >= make_date(p_year, p_month, 1)::timestamp
      AND recorded_at < (make_date(p_year, p_month, 1) + INTERVAL '1 month')::timestamp;
$$;
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
    v_end_date DATE;
BEGIN
    SELECT home_id, target_m3, period_start, period_end
    INTO v_goal
    FROM home.saving_goal
    WHERE goal_id = p_goal_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_end_date := COALESCE(v_goal.period_end, CURRENT_DATE);

    SELECT COALESCE(SUM(consumption_m3), 0)
    INTO v_consumed
    FROM consumption.sensor_reading
    WHERE home_id = v_goal.home_id
      AND recorded_at >= v_goal.period_start::timestamp
      AND recorded_at < (v_end_date + 1)::timestamp;

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
CREATE OR REPLACE FUNCTION consumption.fn_calculate_period_cost(
    p_home_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, alert_rate, home, public, pg_temp
AS $$
DECLARE
    v_variable_cost DECIMAL(14,2);
    v_fixed_charge DECIMAL(12,2);
    v_unpriced_readings INTEGER;
BEGIN
    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date THEN
        RAISE EXCEPTION 'El rango de fechas del periodo no es valido';
    END IF;

    SELECT
        COALESCE(SUM(sr.consumption_m3 * hr.m3_value), 0)::DECIMAL(14,2),
        COUNT(*) FILTER (WHERE hr.rate_id IS NULL)::INTEGER
    INTO v_variable_cost, v_unpriced_readings
    FROM consumption.sensor_reading sr
    JOIN home.home h ON h.home_id = sr.home_id
    LEFT JOIN LATERAL (
        SELECT r.rate_id, r.m3_value
        FROM alert_rate.home_rate r
        WHERE r.home_id = sr.home_id
          AND r.tier = h.tier
          AND r.valid_from::timestamp <= (sr.recorded_at AT TIME ZONE current_setting('TimeZone'))
          AND (r.valid_until IS NULL OR (r.valid_until + 1)::timestamp > (sr.recorded_at AT TIME ZONE current_setting('TimeZone')))
        ORDER BY r.valid_from DESC
        LIMIT 1
    ) hr ON TRUE
    WHERE sr.home_id = p_home_id
      AND sr.recorded_at >= p_start_date::timestamp
      AND sr.recorded_at < (p_end_date + 1)::timestamp;

    IF v_unpriced_readings > 0 THEN
        RETURN NULL;
    END IF;

    SELECT r.fixed_charge
    INTO v_fixed_charge
    FROM alert_rate.home_rate r
    JOIN home.home h ON h.home_id = p_home_id
    WHERE r.home_id = p_home_id
      AND r.tier = h.tier
      AND r.valid_from <= p_start_date
      AND (r.valid_until IS NULL OR r.valid_until >= p_start_date)
    ORDER BY r.valid_from DESC
    LIMIT 1;

    IF v_fixed_charge IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN ROUND(v_variable_cost + v_fixed_charge, 2);
END;
$$;
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

DROP FUNCTION IF EXISTS user_account.fn_assert_app_device_access(UUID, VARCHAR);
DROP FUNCTION IF EXISTS user_account.fn_assert_app_home_access(UUID, VARCHAR);
