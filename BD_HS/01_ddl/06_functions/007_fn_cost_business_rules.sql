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
