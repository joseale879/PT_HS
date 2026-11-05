-- Add a working leak rule for every existing home that has no active rule.
INSERT INTO alert_rate.alert_rule (
    home_id, alert_type, threshold, unit, active, created_by
)
SELECT h.home_id, 'leak_detected', 30, 'minutes', TRUE, NULL
  FROM home.home h
 WHERE NOT EXISTS (
       SELECT 1
         FROM alert_rate.alert_rule existing_rule
        WHERE existing_rule.home_id = h.home_id
          AND existing_rule.alert_type = 'leak_detected'
          AND existing_rule.active = TRUE
   );

-- Keep the default rule active for homes created after this migration.
CREATE OR REPLACE FUNCTION home.fn_create_home_with_billing_profile(
    p_name VARCHAR(100),
    p_address VARCHAR(255),
    p_city VARCHAR(100),
    p_tier SMALLINT DEFAULT NULL,
    p_user_account_id UUID DEFAULT user_account.fn_app_current_user_id(),
    p_usage_type VARCHAR(20) DEFAULT 'RESIDENTIAL',
    p_altitude_meters INTEGER DEFAULT NULL,
    p_people_count SMALLINT DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = home, alert_rate, user_account, public, pg_temp
AS $$
DECLARE
    v_home_id UUID;
    v_usage_type VARCHAR(20) := upper(btrim(COALESCE(p_usage_type, 'RESIDENTIAL')));
BEGIN
    IF p_user_account_id IS NULL
       OR p_user_account_id <> user_account.fn_app_current_user_id() THEN
        RAISE EXCEPTION 'El propietario debe coincidir con el usuario autenticado';
    END IF;

    IF v_usage_type NOT IN ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL') THEN
        RAISE EXCEPTION 'usage_type debe ser RESIDENTIAL, COMMERCIAL o INDUSTRIAL';
    END IF;

    IF v_usage_type = 'RESIDENTIAL' AND p_tier IS NULL THEN
        RAISE EXCEPTION 'El estrato es obligatorio para un hogar residencial';
    END IF;

    IF v_usage_type IN ('COMMERCIAL', 'INDUSTRIAL') AND p_tier IS NOT NULL THEN
        RAISE EXCEPTION 'Los usos comercial e industrial no tienen estrato';
    END IF;

    IF p_people_count IS NULL OR p_people_count NOT BETWEEN 1 AND 50 THEN
        RAISE EXCEPTION 'people_count debe estar entre 1 y 50';
    END IF;

    INSERT INTO home.home (
        name, address, city, tier, usage_type, altitude_meters, people_count
    )
    VALUES (
        p_name, p_address, p_city, p_tier, v_usage_type, p_altitude_meters, p_people_count
    )
    RETURNING home_id INTO v_home_id;

    INSERT INTO home.home_user (home_id, user_account_id, home_role, added_by)
    VALUES (v_home_id, p_user_account_id, 'Owner', p_user_account_id);

    INSERT INTO alert_rate.threshold_configuration (
        home_id, daily_limit, monthly_limit, active, updated_by
    )
    VALUES (v_home_id, 0.50, 15.00, TRUE, p_user_account_id);

    INSERT INTO alert_rate.alert_rule (
        home_id, alert_type, threshold, unit, active, created_by
    )
    VALUES
        (v_home_id, 'daily_limit', 0.50, 'm3_day', TRUE, p_user_account_id),
        (v_home_id, 'monthly_limit', 15.00, 'm3_month', TRUE, p_user_account_id),
        (v_home_id, 'leak_detected', 30, 'minutes', TRUE, p_user_account_id);

    PERFORM home.fn_sync_home_reference_rate(v_home_id);
    RETURN v_home_id;
END;
$$;

COMMENT ON FUNCTION home.fn_create_home_with_billing_profile(VARCHAR, VARCHAR, VARCHAR, SMALLINT, UUID, VARCHAR, INTEGER, SMALLINT) IS
'Creates a typed home with daily/monthly limits and a 30-minute leak detection rule.';
