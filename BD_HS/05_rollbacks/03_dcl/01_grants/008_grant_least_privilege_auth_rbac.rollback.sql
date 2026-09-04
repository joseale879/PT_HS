GRANT SELECT, INSERT, UPDATE, DELETE ON user_account.user_credential,
    user_account.password_policy,
    user_account.user_mfa,
    user_account.login_attempt,
    user_account.role,
    user_account.permission,
    user_account.user_role,
    user_account.role_permission TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit.audit_log, audit.log_error TO hidro_smart_app;
REVOKE SELECT ON user_account.role, user_account.permission, user_account.user_role FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_get_credential_for_login(VARCHAR) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_set_password_hash(UUID, TEXT, UUID, BOOLEAN) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_upsert_mfa(UUID, VARCHAR, BYTEA, JSONB) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_user_has_permission(UUID, VARCHAR) FROM hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_get_credential_for_login(VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_set_password_hash(UUID, TEXT, UUID, BOOLEAN) TO PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_upsert_mfa(UUID, VARCHAR, BYTEA, JSONB) TO PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_user_has_permission(UUID, VARCHAR) TO PUBLIC;