-- Restore the previous optimized trigger. The next update reuses the prior definition.
CREATE OR REPLACE FUNCTION consumption.fn_after_reading_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, alert_rate, home, public, pg_temp
AS $$
DECLARE
    v_daily_limit DECIMAL(10,2);
    v_monthly_limit DECIMAL(10,2);
    v_daily_consumption DECIMAL(10,2);
    v_monthly_consumption DECIMAL(10,2);
    v_is_vacation BOOLEAN;
    v_daily_rule_id UUID;
    v_monthly_rule_id UUID;
    v_leak_rule_id UUID;
    v_day_start TIMESTAMPTZ;
    v_day_end TIMESTAMPTZ;
BEGIN
    v_day_start := date_trunc('day', NEW.recorded_at);
    v_day_end := v_day_start + INTERVAL '1 day';
    v_is_vacation := home.fn_is_vacation_active(NEW.home_id, (NEW.recorded_at AT TIME ZONE current_setting('TimeZone'))::date);

    IF NOT v_is_vacation THEN
        SELECT daily_limit, monthly_limit INTO v_daily_limit, v_monthly_limit
        FROM alert_rate.threshold_configuration WHERE home_id = NEW.home_id AND active = TRUE;

        SELECT rule_id INTO v_daily_rule_id FROM alert_rate.alert_rule
        WHERE home_id = NEW.home_id AND alert_type = 'daily_limit' AND active = TRUE LIMIT 1;

        IF v_daily_limit IS NOT NULL AND v_daily_rule_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM alert_rate.alert_event ae
            WHERE ae.rule_id = v_daily_rule_id AND ae.home_id = NEW.home_id
              AND ae.status = 'Pending' AND ae.generated_at >= v_day_start AND ae.generated_at < v_day_end
        ) THEN
            v_daily_consumption := consumption.fn_get_daily_consumption(NEW.home_id, (NEW.recorded_at AT TIME ZONE current_setting('TimeZone'))::date) / 1000.0;
            IF v_daily_consumption > v_daily_limit THEN
                INSERT INTO alert_rate.alert_event (event_id, rule_id, home_id, message, detected_value, status)
                VALUES (gen_random_uuid(), v_daily_rule_id, NEW.home_id, 'Tope diario de consumo superado.', v_daily_consumption, 'Pending');
            END IF;
        END IF;

        SELECT rule_id INTO v_monthly_rule_id FROM alert_rate.alert_rule
        WHERE home_id = NEW.home_id AND alert_type = 'monthly_limit' AND active = TRUE LIMIT 1;

        IF v_monthly_limit IS NOT NULL AND v_monthly_rule_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM alert_rate.alert_event ae
            WHERE ae.rule_id = v_monthly_rule_id AND ae.home_id = NEW.home_id
              AND ae.status = 'Pending' AND ae.generated_at >= v_day_start AND ae.generated_at < v_day_end
        ) THEN
            v_monthly_consumption := consumption.fn_get_monthly_consumption(NEW.home_id, EXTRACT(YEAR FROM NEW.recorded_at)::INTEGER, EXTRACT(MONTH FROM NEW.recorded_at)::INTEGER) / 1000.0;
            IF v_monthly_consumption > v_monthly_limit THEN
                INSERT INTO alert_rate.alert_event (event_id, rule_id, home_id, message, detected_value, status)
                VALUES (gen_random_uuid(), v_monthly_rule_id, NEW.home_id, 'Tope mensual de consumo superado.', v_monthly_consumption, 'Pending');
            END IF;
        END IF;

        SELECT rule_id INTO v_leak_rule_id FROM alert_rate.alert_rule
        WHERE home_id = NEW.home_id AND alert_type = 'leak_detected' AND active = TRUE LIMIT 1;

        IF v_leak_rule_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM alert_rate.alert_event ae
            WHERE ae.rule_id = v_leak_rule_id AND ae.home_id = NEW.home_id
              AND ae.status = 'Pending' AND ae.generated_at >= v_day_start AND ae.generated_at < v_day_end
        ) AND alert_rate.fn_is_leak_detected(NEW.device_id, NEW.recorded_at, 30) THEN
            INSERT INTO alert_rate.alert_event (event_id, rule_id, home_id, message, detected_value, status)
            VALUES (gen_random_uuid(), v_leak_rule_id, NEW.home_id, 'Posible fuga detectada.', NEW.consumption_m3, 'Pending');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;