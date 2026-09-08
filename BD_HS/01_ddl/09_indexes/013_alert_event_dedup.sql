CREATE UNIQUE INDEX uq_alert_event_rule_home_dedup
    ON alert_rate.alert_event (
        rule_id,
        home_id,
        dedup_key
    )
    WHERE dedup_key IS NOT NULL;