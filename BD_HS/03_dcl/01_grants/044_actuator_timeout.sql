REVOKE ALL ON FUNCTION device.fn_timeout_actuator_commands(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION device.fn_timeout_actuator_commands(INTEGER, INTEGER) TO hidro_smart_app;
