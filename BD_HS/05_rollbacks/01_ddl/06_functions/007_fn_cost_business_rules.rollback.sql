DROP FUNCTION IF EXISTS consumption.fn_calculate_cost(DECIMAL, UUID, DATE);
CREATE FUNCTION consumption.fn_calculate_cost(
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
    SELECT hr.m3_value, hr.fixed_charge
    INTO v_rate, v_fixed_charge
    FROM alert_rate.home_rate hr
    WHERE hr.home_id = p_home_id
      AND hr.valid_from <= p_date
      AND (hr.valid_until IS NULL OR hr.valid_until >= p_date)
    ORDER BY hr.valid_from DESC
    LIMIT 1;
    IF v_rate IS NULL THEN
        RETURN NULL;
    END IF;
    v_cost := (p_consumption_m3 * v_rate) + v_fixed_charge;
    RETURN v_cost;
END;
$$;