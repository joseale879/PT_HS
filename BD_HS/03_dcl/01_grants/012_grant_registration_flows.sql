-- The application uses controlled functions for registration flows.
REVOKE INSERT ON device.device FROM hidro_smart_app;

REVOKE ALL ON FUNCTION user_account.fn_assign_default_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_register_device(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) FROM PUBLIC;

-- fn_assign_default_role is intentionally not granted directly: only fn_register_user invokes it.
GRANT EXECUTE ON FUNCTION user_account.fn_register_user(VARCHAR, VARCHAR) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION device.fn_register_device(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) TO hidro_smart_app;