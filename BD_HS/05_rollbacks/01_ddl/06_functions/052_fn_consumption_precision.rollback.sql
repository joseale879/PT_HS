-- Restaura el contrato anterior de acumulados de consumo.
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
SET search_path = consumption, home, user_account, public, pg_temp
AS $$
BEGIN
    PERFORM user_account.fn_assert_app_home_access(p_home_id, 'consumption.read');

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date THEN
        RAISE EXCEPTION 'El rango de fechas no es valido';
    END IF;

    RETURN QUERY
    SELECT COALESCE(SUM(sr.consumption_m3), 0)::DECIMAL(10,4),
           COALESCE(SUM(sr.consumption_liters), 0)::DECIMAL(10,2),
           COALESCE(SUM(sr.estimated_cost), 0)::DECIMAL(10,2),
           COUNT(*)::INTEGER
      FROM consumption.sensor_reading sr
     WHERE sr.home_id = p_home_id
       AND sr.recorded_at >= p_start_date::TIMESTAMP
       AND sr.recorded_at < (p_end_date + 1)::TIMESTAMP;
END;
$$;
