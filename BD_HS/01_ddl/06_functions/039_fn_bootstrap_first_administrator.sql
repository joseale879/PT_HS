CREATE OR REPLACE FUNCTION
user_account.fn_bootstrap_first_administrator(
    p_target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_admin_role_id UUID;
BEGIN
    IF p_target_user_id IS NULL THEN
        RAISE EXCEPTION
            'p_target_user_id no puede ser NULL';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM user_account.user_role ur
        JOIN user_account.role r
          ON r.role_id = ur.role_id
        JOIN user_account.user_account ua
          ON ua.user_account_id = ur.user_account_id

        WHERE lower(r.name) = 'administrator'
          AND r.status = 'Active'
          AND ua.status = 'Active'
          AND ua.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'Bootstrap cerrado: ya existe un Administrator activo';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM user_account.user_account ua
        WHERE ua.user_account_id = p_target_user_id
          AND ua.status = 'Active'
          AND ua.deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'El usuario objetivo no existe o no esta activo';
    END IF;

    SELECT r.role_id
    INTO v_admin_role_id
    FROM user_account.role r
    WHERE lower(r.name) = 'administrator'
      AND r.status = 'Active'
    LIMIT 1;

    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION
            'No existe un rol Administrator activo';
    END IF;

    INSERT INTO user_account.user_role (
        user_account_id,
        role_id,
        assigned_by
    )
    VALUES (
        p_target_user_id,
        v_admin_role_id,
        NULL
    )
    ON CONFLICT (user_account_id, role_id)
    DO NOTHING;

    RETURN TRUE;
END;
$$;

REVOKE ALL
ON FUNCTION
user_account.fn_bootstrap_first_administrator(UUID)
FROM PUBLIC;

COMMENT ON FUNCTION
user_account.fn_bootstrap_first_administrator(UUID)
IS
'Permite asignar el primer Administrator una sola vez. No debe concederse a hidro_smart_app.';