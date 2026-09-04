REVOKE ALL ON FUNCTION device.fn_can_manage_device(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION device.fn_can_manage_device(UUID, UUID) TO hidro_smart_app;