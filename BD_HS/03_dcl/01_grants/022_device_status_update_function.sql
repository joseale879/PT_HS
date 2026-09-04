REVOKE ALL ON FUNCTION device.fn_update_device_status(UUID, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION device.fn_update_device_status(UUID, VARCHAR, VARCHAR) TO hidro_smart_app;
