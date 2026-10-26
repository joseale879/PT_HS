REVOKE EXECUTE ON FUNCTION device.fn_record_actuator_status(VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMPTZ) FROM hidro_smart_app;
REVOKE SELECT, INSERT, UPDATE ON device.actuator_command FROM hidro_smart_app;
REVOKE SELECT ON device.actuator_state FROM hidro_smart_app;
