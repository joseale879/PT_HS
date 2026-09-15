-- Series avanzadas de consumo para dashboard, consumo y reportes.
-- La funcion conserva la autorizacion del hogar en PostgreSQL y evita que el
-- frontend tenga que sumar lecturas individuales.
CREATE OR REPLACE FUNCTION consumption.fn_get_consumption_series(
    p_home_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_group_by VARCHAR(20) DEFAULT 'daily'
)
RETURNS TABLE (
    group_key VARCHAR(120),
    bucket_date DATE,
    bucket_hour INTEGER,
    location VARCHAR(120),
    consumption_liters NUMERIC,
    consumption_m3 NUMERIC,
    reading_count BIGINT,
    average_flow_lpm NUMERIC,
    peak_flow_lpm NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, device, home, user_account, public, pg_temp
AS $$
DECLARE
    v_group_by VARCHAR(20) := lower(btrim(COALESCE(p_group_by, 'daily')));
BEGIN
    PERFORM user_account.fn_assert_app_home_access(p_home_id, 'consumption.read');

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date THEN
        RAISE EXCEPTION 'El rango de fechas no es valido';
    END IF;

    IF v_group_by NOT IN ('daily', 'hourly', 'monthly', 'location') THEN
        RAISE EXCEPTION 'groupBy no es valido';
    END IF;

    IF v_group_by = 'daily' THEN
        RETURN QUERY
        SELECT to_char(sr.recorded_at::date, 'YYYY-MM-DD')::VARCHAR(120),
               sr.recorded_at::date,
               NULL::INTEGER,
               NULL::VARCHAR(120),
               COALESCE(SUM(sr.consumption_liters), 0)::NUMERIC,
               COALESCE(SUM(sr.consumption_m3), 0)::NUMERIC,
               COUNT(*)::BIGINT,
               ROUND(AVG(sr.flow_rate_lpm)::NUMERIC, 3),
               ROUND(MAX(sr.flow_rate_lpm)::NUMERIC, 3)
          FROM consumption.sensor_reading sr
         WHERE sr.home_id = p_home_id
           AND sr.recorded_at >= p_start_date::TIMESTAMP
           AND sr.recorded_at < (p_end_date + 1)::TIMESTAMP
         GROUP BY sr.recorded_at::date
         ORDER BY sr.recorded_at::date;
    ELSIF v_group_by = 'hourly' THEN
        RETURN QUERY
        SELECT lpad(EXTRACT(HOUR FROM sr.recorded_at)::INTEGER::TEXT, 2, '0')::VARCHAR(120),
               NULL::DATE,
               EXTRACT(HOUR FROM sr.recorded_at)::INTEGER,
               NULL::VARCHAR(120),
               COALESCE(SUM(sr.consumption_liters), 0)::NUMERIC,
               COALESCE(SUM(sr.consumption_m3), 0)::NUMERIC,
               COUNT(*)::BIGINT,
               ROUND(AVG(sr.flow_rate_lpm)::NUMERIC, 3),
               ROUND(MAX(sr.flow_rate_lpm)::NUMERIC, 3)
          FROM consumption.sensor_reading sr
         WHERE sr.home_id = p_home_id
           AND sr.recorded_at >= p_start_date::TIMESTAMP
           AND sr.recorded_at < (p_end_date + 1)::TIMESTAMP
         GROUP BY EXTRACT(HOUR FROM sr.recorded_at)::INTEGER
         ORDER BY EXTRACT(HOUR FROM sr.recorded_at)::INTEGER;
    ELSIF v_group_by = 'monthly' THEN
        RETURN QUERY
        SELECT to_char(date_trunc('month', sr.recorded_at)::date, 'YYYY-MM')::VARCHAR(120),
               date_trunc('month', sr.recorded_at)::date,
               NULL::INTEGER,
               NULL::VARCHAR(120),
               COALESCE(SUM(sr.consumption_liters), 0)::NUMERIC,
               COALESCE(SUM(sr.consumption_m3), 0)::NUMERIC,
               COUNT(*)::BIGINT,
               ROUND(AVG(sr.flow_rate_lpm)::NUMERIC, 3),
               ROUND(MAX(sr.flow_rate_lpm)::NUMERIC, 3)
          FROM consumption.sensor_reading sr
         WHERE sr.home_id = p_home_id
           AND sr.recorded_at >= p_start_date::TIMESTAMP
           AND sr.recorded_at < (p_end_date + 1)::TIMESTAMP
         GROUP BY date_trunc('month', sr.recorded_at)::date
         ORDER BY date_trunc('month', sr.recorded_at)::date;
    ELSE
        RETURN QUERY
        SELECT COALESCE(NULLIF(btrim(d.location), ''), 'Sin ubicacion')::VARCHAR(120),
               NULL::DATE,
               NULL::INTEGER,
               COALESCE(NULLIF(btrim(d.location), ''), 'Sin ubicacion')::VARCHAR(120),
               COALESCE(SUM(sr.consumption_liters), 0)::NUMERIC,
               COALESCE(SUM(sr.consumption_m3), 0)::NUMERIC,
               COUNT(*)::BIGINT,
               ROUND(AVG(sr.flow_rate_lpm)::NUMERIC, 3),
               ROUND(MAX(sr.flow_rate_lpm)::NUMERIC, 3)
          FROM consumption.sensor_reading sr
          JOIN device.device d ON d.device_id = sr.device_id
         WHERE sr.home_id = p_home_id
           AND sr.recorded_at >= p_start_date::TIMESTAMP
           AND sr.recorded_at < (p_end_date + 1)::TIMESTAMP
         GROUP BY COALESCE(NULLIF(btrim(d.location), ''), 'Sin ubicacion')
         ORDER BY COALESCE(NULLIF(btrim(d.location), ''), 'Sin ubicacion');
    END IF;
END;
$$;

COMMENT ON FUNCTION consumption.fn_get_consumption_series(UUID, DATE, DATE, VARCHAR) IS
'Devuelve series de consumo autorizadas agrupadas por dia, hora, mes o ubicacion.';
