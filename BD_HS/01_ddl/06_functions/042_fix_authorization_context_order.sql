CREATE OR REPLACE FUNCTION user_account.fn_get_my_authorization_context()
RETURNS TABLE (
    role_name VARCHAR,
    permission_name VARCHAR
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID := user_account.fn_app_current_user_id();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No existe un usuario autenticado en app.user_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM user_account.user_account ua
         WHERE ua.user_account_id = v_user_id
           AND ua.status = 'Active'
           AND ua.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'La cuenta autenticada no esta activa';
    END IF;

    RETURN QUERY
    SELECT DISTINCT
        r.name::VARCHAR AS role_name,
        p.name::VARCHAR AS permission_name
      FROM user_account.user_role ur
      JOIN user_account.role r
        ON r.role_id = ur.role_id
       AND r.status = 'Active'
      LEFT JOIN user_account.role_permission rp ON rp.role_id = r.role_id
      LEFT JOIN user_account.permission p
        ON p.permission_id = rp.permission_id
       AND p.status = 'Active'
     WHERE ur.user_account_id = v_user_id
     ORDER BY role_name, permission_name NULLS LAST;
END;
$$;
