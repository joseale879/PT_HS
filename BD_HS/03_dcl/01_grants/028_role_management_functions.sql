REVOKE ALL ON FUNCTION user_account.fn_get_user_roles(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_assign_user_role(UUID,VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_remove_user_role(UUID,VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_get_user_roles(UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_assign_user_role(UUID,VARCHAR) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_remove_user_role(UUID,VARCHAR) TO hidro_smart_app;
