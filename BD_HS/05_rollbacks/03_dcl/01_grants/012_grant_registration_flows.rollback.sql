REVOKE EXECUTE ON FUNCTION user_account.fn_assign_default_role(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION device.fn_register_device(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) FROM hidro_smart_app;
GRANT INSERT ON device.device TO hidro_smart_app;