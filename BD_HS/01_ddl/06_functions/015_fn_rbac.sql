CREATE OR REPLACE FUNCTION user_account.fn_user_has_permission(
    p_user_account_id UUID,
    p_permission_name VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_account.user_account ua
        JOIN user_account.user_role ur
          ON ur.user_account_id = ua.user_account_id
        JOIN user_account.role r
          ON r.role_id = ur.role_id
        JOIN user_account.role_permission rp
          ON rp.role_id = r.role_id
        JOIN user_account.permission p
          ON p.permission_id = rp.permission_id
        WHERE ua.user_account_id = p_user_account_id
          AND ua.status = 'Active'
          AND ua.deleted_at IS NULL
          AND r.status = 'Active'
          AND p.status = 'Active'
          AND lower(p.name) = lower(btrim(p_permission_name))
    );
$$;

COMMENT ON FUNCTION user_account.fn_user_has_permission(UUID, VARCHAR) IS
'Consulta si una cuenta activa posee un permiso funcional mediante sus roles.';
