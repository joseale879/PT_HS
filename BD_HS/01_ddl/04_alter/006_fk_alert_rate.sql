-- ============================================================
-- LLAVES FORÁNEAS - DOMINIO: alert_rate
-- ============================================================
ALTER TABLE alert_rate.threshold_configuration
    ADD CONSTRAINT fk_threshold_updated_by
    FOREIGN KEY (updated_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE alert_rate.alert_rule
    ADD CONSTRAINT fk_alert_rule_created_by
    FOREIGN KEY (created_by) REFERENCES user_account.user_account(user_account_id);