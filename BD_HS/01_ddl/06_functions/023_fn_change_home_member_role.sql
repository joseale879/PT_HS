CREATE OR REPLACE FUNCTION home.fn_change_home_member_role(
    p_home_id UUID,
    p_member_user_id UUID,
    p_home_role VARCHAR(20)
)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR(100),
    email VARCHAR(150),
    full_name VARCHAR(200),
    home_role VARCHAR(20),
    assigned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = home, user_account, public, pg_temp
AS $$
DECLARE
    v_current_user UUID := user_account.fn_app_current_user_id();
BEGIN
    IF v_current_user IS NULL
       OR NOT user_account.fn_app_has_permission('homes.manage')
       OR NOT home.fn_is_home_owner(p_home_id, v_current_user) THEN
        RAISE EXCEPTION 'El usuario no puede administrar este hogar';
    END IF;

    IF p_home_role NOT IN ('Member', 'Guest') THEN
        RAISE EXCEPTION 'El rol del hogar debe ser Member o Guest';
    END IF;

    IF EXISTS (
        SELECT 1 FROM home.home_user
         WHERE home_id = p_home_id
           AND user_account_id = p_member_user_id
           AND home_role = 'Owner'
    ) THEN
        RAISE EXCEPTION 'El propietario no puede cambiarse mediante esta operación';
    END IF;

    UPDATE home.home_user
       SET home_role = p_home_role
     WHERE home_id = p_home_id
       AND user_account_id = p_member_user_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT ua.user_account_id, ua.username, ua.email, up.full_name,
           hu.home_role, hu.assigned_at
      FROM home.home_user hu
      JOIN user_account.user_account ua ON ua.user_account_id = hu.user_account_id
      LEFT JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id
     WHERE hu.home_id = p_home_id
       AND hu.user_account_id = p_member_user_id;
END;
$$;

COMMENT ON FUNCTION home.fn_change_home_member_role(UUID, UUID, VARCHAR) IS
'Cambia Member o Guest en un hogar únicamente por acción de su propietario; no permite modificar Owner.';
