REVOKE ALL
ON FUNCTION user_account.fn_get_my_authorization_context()
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION user_account.fn_get_my_authorization_context()
TO hidro_smart_app;