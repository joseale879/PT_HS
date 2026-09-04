-- ============================================================
-- ÍNDICES - DOMINIO: alert_rate
-- ============================================================
CREATE INDEX idx_threshold_configuration_home ON alert_rate.threshold_configuration(home_id);

CREATE INDEX idx_alert_rule_home_id ON alert_rate.alert_rule(home_id);
CREATE INDEX idx_alert_rule_type_active ON alert_rate.alert_rule(alert_type, active);

CREATE INDEX idx_alert_event_rule_id ON alert_rate.alert_event(rule_id);
CREATE INDEX idx_alert_event_home_id ON alert_rate.alert_event(home_id);
CREATE INDEX idx_alert_event_status_date ON alert_rate.alert_event(status, generated_at);
CREATE INDEX idx_alert_event_generated_at ON alert_rate.alert_event(generated_at DESC);

CREATE INDEX idx_alert_notification_event_id ON alert_rate.alert_notification(event_id);
CREATE INDEX idx_alert_notification_sent ON alert_rate.alert_notification(sent) WHERE sent = FALSE;

CREATE INDEX idx_home_rate_home_id ON alert_rate.home_rate(home_id);
CREATE INDEX idx_home_rate_vigente ON alert_rate.home_rate(valid_from, valid_until);
CREATE INDEX idx_home_rate_tier ON alert_rate.home_rate(tier);

CREATE INDEX idx_estratos_numero ON alert_rate.estratos(numero_estrato);