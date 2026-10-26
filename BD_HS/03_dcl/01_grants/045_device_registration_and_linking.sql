REVOKE ALL ON FUNCTION device.fn_register_device_with_location(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION device.fn_register_device_with_location(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) TO hidro_smart_app;

REVOKE ALL ON FUNCTION device.fn_link_device_to_home(VARCHAR, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION device.fn_link_device_to_home(VARCHAR, UUID) TO hidro_smart_app;
