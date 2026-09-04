REVOKE ALL ON FUNCTION alert_rate.fn_generate_alert_events(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION alert_rate.fn_generate_alert_events(DATE) TO hidro_smart_app;
