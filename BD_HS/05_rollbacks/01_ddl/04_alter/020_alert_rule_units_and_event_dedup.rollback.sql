DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM alert_rate.alert_rule
        WHERE unit = 'minutes'
    ) THEN
        RAISE EXCEPTION
            'Rollback bloqueado: existen reglas con unit=minutes. Migre o elimine esas reglas antes de volver al contrato anterior.';
    END IF;
END;
$$;

ALTER TABLE alert_rate.alert_rule
    DROP CONSTRAINT IF EXISTS ck_alert_rule_duration_positive,
    DROP CONSTRAINT IF EXISTS ck_alert_rule_type_unit;

ALTER TABLE alert_rate.alert_rule
    ADD CONSTRAINT alert_rule_unit_check
    CHECK (unit IN ('m3_day', 'm3_month', 'lpm'));

ALTER TABLE alert_rate.alert_event
    DROP CONSTRAINT IF EXISTS ck_alert_event_dedup_key_not_blank,
    DROP COLUMN IF EXISTS dedup_key;