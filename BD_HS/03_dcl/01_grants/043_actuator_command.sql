REVOKE ALL ON device.actuator_command, device.actuator_state FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_record_actuator_status(VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMPTZ) FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON device.actuator_command TO hidro_smart_app;
GRANT SELECT ON device.actuator_state TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION device.fn_record_actuator_status(VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMPTZ) TO hidro_smart_app;
