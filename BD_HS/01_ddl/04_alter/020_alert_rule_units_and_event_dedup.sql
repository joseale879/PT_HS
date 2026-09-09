-- ============================================================
-- ALERTAS: contrato de unidades + idempotencia de eventos
-- ============================================================

ALTER TABLE alert_rate.alert_rule
    DROP CONSTRAINT IF EXISTS alert_rule_unit_check,
    DROP CONSTRAINT IF EXISTS ck_alert_rule_type_unit;

UPDATE alert_rate.alert_rule
SET unit = CASE alert_type
    WHEN 'daily_limit' THEN 'm3_day'
    WHEN 'monthly_limit' THEN 'm3_month'
    WHEN 'excessive_consumption' THEN 'm3_day'
    WHEN 'leak_detected' THEN 'minutes'
    WHEN 'no_reading' THEN 'minutes'
    ELSE unit
END;

ALTER TABLE alert_rate.alert_rule
    ADD CONSTRAINT ck_alert_rule_type_unit CHECK (
        (alert_type = 'daily_limit' AND unit = 'm3_day')
        OR (alert_type = 'monthly_limit' AND unit = 'm3_month')
        OR (alert_type = 'excessive_consumption' AND unit = 'm3_day')
        OR (alert_type = 'leak_detected' AND unit = 'minutes')
        OR (alert_type = 'no_reading' AND unit = 'minutes')
    ),
    ADD CONSTRAINT ck_alert_rule_duration_positive CHECK (
        alert_type NOT IN ('no_reading', 'leak_detected')
        OR threshold > 0
    );

ALTER TABLE alert_rate.alert_event
    ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(160) NULL;

ALTER TABLE alert_rate.alert_event
    DROP CONSTRAINT IF EXISTS ck_alert_event_dedup_key_not_blank;

ALTER TABLE alert_rate.alert_event
    ADD CONSTRAINT ck_alert_event_dedup_key_not_blank CHECK (
        dedup_key IS NULL OR btrim(dedup_key) <> ''
    );