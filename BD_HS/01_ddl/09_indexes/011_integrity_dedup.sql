CREATE UNIQUE INDEX uq_home_member_request_pending
    ON home.home_member_request (home_id, user_account_id)
    WHERE status = 'Pending';

CREATE UNIQUE INDEX uq_alert_rule_home_type_active
    ON alert_rate.alert_rule (home_id, alert_type)
    WHERE active = TRUE;

CREATE INDEX idx_alert_event_dedup_lookup
    ON alert_rate.alert_event (rule_id, home_id, status, generated_at DESC);