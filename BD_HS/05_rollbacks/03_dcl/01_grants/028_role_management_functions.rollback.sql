REVOKE EXECUTE ON FUNCTION user_account.fn_get_user_roles(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_assign_user_role(UUID,VARCHAR) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_remove_user_role(UUID,VARCHAR) FROM hidro_smart_app;
