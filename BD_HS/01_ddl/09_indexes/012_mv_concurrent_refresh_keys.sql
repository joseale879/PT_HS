CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_pending_alerts_home
    ON alert_rate.mv_pending_alerts (home_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_active_devices_home
    ON device.mv_active_devices (home_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_recommendation_summary_home
    ON analytics_support.mv_recommendation_summary (home_id);