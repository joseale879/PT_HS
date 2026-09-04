CREATE OR REPLACE FUNCTION alert_rate.fn_generate_alert_events(p_target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = alert_rate, consumption, home, public, pg_temp
AS $$
DECLARE
    v_rule RECORD;
    v_value DECIMAL(14,4);
    v_created INTEGER := 0;
BEGIN
    FOR v_rule IN
        SELECT rule_id, home_id, alert_type, threshold, unit
        FROM alert_rate.alert_rule
        WHERE active = TRUE
          AND alert_type IN ('daily_limit', 'monthly_limit', 'excessive_consumption')
    LOOP
        v_value := NULL;

        IF v_rule.alert_type IN ('daily_limit', 'excessive_consumption') THEN
            SELECT COALESCE(SUM(sr.consumption_m3), 0)
              INTO v_value
              FROM consumption.sensor_reading sr
             WHERE sr.home_id = v_rule.home_id
               AND sr.recorded_at >= p_target_date::timestamp
               AND sr.recorded_at < (p_target_date + 1)::timestamp;
        ELSIF v_rule.alert_type = 'monthly_limit' THEN
            SELECT COALESCE(SUM(sr.consumption_m3), 0)
              INTO v_value
              FROM consumption.sensor_reading sr
             WHERE sr.home_id = v_rule.home_id
               AND sr.recorded_at >= date_trunc('month', p_target_date::timestamp)
               AND sr.recorded_at < date_trunc('month', p_target_date::timestamp) + INTERVAL '1 month';
        END IF;

        IF v_value > v_rule.threshold
           AND NOT EXISTS (
               SELECT 1
                 FROM alert_rate.alert_event e
                WHERE e.rule_id = v_rule.rule_id
                  AND e.home_id = v_rule.home_id
                  AND e.generated_at >= p_target_date::timestamp
                  AND e.generated_at < (p_target_date + 1)::timestamp
           ) THEN
            INSERT INTO alert_rate.alert_event (rule_id, home_id, message, detected_value)
            VALUES (
                v_rule.rule_id,
                v_rule.home_id,
                format('La regla %s superó el umbral configurado de %s', v_rule.alert_type, v_rule.threshold),
                v_value
            );
            v_created := v_created + 1;
        END IF;
    END LOOP;

    RETURN v_created;
END;
$$;

COMMENT ON FUNCTION alert_rate.fn_generate_alert_events(DATE) IS
'Evalúa reglas activas de consumo diario y mensual e inserta eventos idempotentes para la fecha indicada.';
