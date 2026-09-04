ALTER TABLE IF EXISTS alert_rate.threshold_configuration DROP CONSTRAINT IF EXISTS fk_threshold_updated_by;
ALTER TABLE IF EXISTS alert_rate.alert_rule DROP CONSTRAINT IF EXISTS fk_alert_rule_created_by;
