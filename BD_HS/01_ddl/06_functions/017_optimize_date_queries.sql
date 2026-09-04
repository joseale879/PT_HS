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