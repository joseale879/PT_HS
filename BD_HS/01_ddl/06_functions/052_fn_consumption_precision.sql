-- Devuelve los acumulados sin truncar las lecturas pequenas del caudalimetro.
CREATE OR REPLACE FUNCTION consumption.fn_calculate_consumption(
    p_home_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_m3 NUMERIC,
    total_liters NUMERIC,
    total_cost NUMERIC,
    reading_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, home, user_account, public, pg_temp
AS $$
BEGIN
    PERFORM user_account.fn_assert_app_home_access(p_home_id, 'consumption.read');

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date THEN
        RAISE EXCEPTION 'El rango de fechas no es valido';
    END IF;

    RETURN QUERY
    SELECT COALESCE(SUM(sr.consumption_m3), 0)::NUMERIC,
           COALESCE(SUM(sr.consumption_liters), 0)::NUMERIC,
           COALESCE(SUM(sr.estimated_cost), 0)::NUMERIC,
           COUNT(*)::INTEGER
      FROM consumption.sensor_reading sr
     WHERE sr.home_id = p_home_id
       AND sr.recorded_at >= p_start_date::TIMESTAMP
       AND sr.recorded_at < (p_end_date + 1)::TIMESTAMP;
END;
$$;

COMMENT ON FUNCTION consumption.fn_calculate_consumption(UUID, DATE, DATE) IS
'Calcula consumo y costo sin perder precision de lecturas pequenas del caudalimetro.';
