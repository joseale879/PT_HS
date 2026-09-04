-- ============================================================
-- FUNCIONES DE CÁLCULO DE CONSUMO Y COSTOS
-- DOMINIO: consumption
-- ============================================================

-- ============================================================
-- 1. Calcular consumo total en un rango de fechas
-- ============================================================
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
    RETURN QUERY
    SELECT
        COALESCE(SUM(sr.consumption_m3), 0)::DECIMAL(10,4),
        COALESCE(SUM(sr.consumption_liters), 0)::DECIMAL(10,2),
        COALESCE(SUM(sr.estimated_cost), 0)::DECIMAL(10,2),
        COUNT(*)::INTEGER
    FROM sensor_reading sr
    WHERE sr.home_id = p_home_id
      AND sr.recorded_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$;

COMMENT ON FUNCTION consumption.fn_calculate_consumption(UUID, DATE, DATE) IS
'Calcula el consumo total (m³, litros y costo estimado) de un hogar en un rango de fechas.
Utilizado para reportes RF5.1 y para el cálculo de metas RF5.7.';

-- ============================================================
-- 2. Calcular costo estimado de un consumo dado
-- ============================================================
CREATE OR REPLACE FUNCTION consumption.fn_calculate_cost(
    p_consumption_m3 DECIMAL,
    p_home_id UUID,
    p_date DATE
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, alert_rate, public, pg_temp
AS $$
DECLARE
    v_rate DECIMAL(12,4);
    v_fixed_charge DECIMAL(12,2);
    v_cost DECIMAL(12,2);
BEGIN
    -- Obtener la tarifa vigente en la fecha
    SELECT hr.m3_value, hr.fixed_charge
    INTO v_rate, v_fixed_charge
    FROM home_rate hr
    WHERE hr.home_id = p_home_id
      AND hr.valid_from <= p_date
      AND (hr.valid_until IS NULL OR hr.valid_until >= p_date)
    ORDER BY hr.valid_from DESC
    LIMIT 1;

    -- Si no hay tarifa, devolver NULL
    IF v_rate IS NULL THEN
        RETURN NULL;
    END IF;

    v_cost := (p_consumption_m3 * v_rate) + v_fixed_charge;
    RETURN v_cost;
END;
$$;

COMMENT ON FUNCTION consumption.fn_calculate_cost(DECIMAL, UUID, DATE) IS
'Calcula el costo estimado de un consumo en m³ aplicando la tarifa vigente del hogar en la fecha indicada.
Utilizado al insertar lecturas en sensor_reading y para proyecciones RF5.3.';

-- ============================================================
-- 3. Obtener consumo diario de un hogar
-- ============================================================
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
      AND recorded_at::DATE = p_date;
$$;

COMMENT ON FUNCTION consumption.fn_get_daily_consumption(UUID, DATE) IS
'Retorna el consumo total en litros de un hogar en un día específico.
Utilizado para evaluar topes diarios RF4.1.';

-- ============================================================
-- 4. Obtener consumo mensual de un hogar
-- ============================================================
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
      AND EXTRACT(YEAR FROM recorded_at) = p_year
      AND EXTRACT(MONTH FROM recorded_at) = p_month;
$$;

COMMENT ON FUNCTION consumption.fn_get_monthly_consumption(UUID, INTEGER, INTEGER) IS
'Retorna el consumo total en litros de un hogar en un mes específico.
Utilizado para evaluar topes mensuales RF4.1 y metas RF5.7.';