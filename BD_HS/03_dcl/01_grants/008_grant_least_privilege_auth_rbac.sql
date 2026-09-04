-- El backend opera credenciales, MFA, intentos y RBAC mediante funciones controladas.
REVOKE ALL ON user_account.user_credential,
    user_account.password_policy,
    user_account.user_mfa,
    user_account.login_attempt,
    user_account.role,
    user_account.permission,
    user_account.user_role,
    user_account.role_permission
FROM hidro_smart_app;

-- Las tablas de auditoría no deben ser consultadas ni modificadas directamente por la aplicación.
REVOKE ALL ON audit.audit_log, audit.log_error FROM hidro_smart_app;

-- El backend solo necesita consultar catálogos y asignaciones para construir la sesión.
GRANT SELECT ON user_account.role, user_account.permission, user_account.user_role TO hidro_smart_app;

REVOKE ALL ON FUNCTION user_account.fn_get_credential_for_login(VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_set_password_hash(UUID, TEXT, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_upsert_mfa(UUID, VARCHAR, BYTEA, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_user_has_permission(UUID, VARCHAR) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION user_account.fn_get_credential_for_login(VARCHAR) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_set_password_hash(UUID, TEXT, UUID, BOOLEAN) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_upsert_mfa(UUID, VARCHAR, BYTEA, JSONB) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_user_has_permission(UUID, VARCHAR) TO hidro_smart_app;