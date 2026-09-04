CREATE OR REPLACE FUNCTION home.fn_add_home_member(
    p_home_id UUID,
    p_email VARCHAR(150),
    p_home_role VARCHAR(20) DEFAULT 'Member'
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
    v_member_user UUID;
BEGIN
    IF v_current_user IS NULL
       OR NOT user_account.fn_app_has_permission('homes.manage')
       OR NOT home.fn_is_home_owner(p_home_id, v_current_user) THEN
        RAISE EXCEPTION 'El usuario no puede administrar este hogar';
    END IF;

    IF p_home_role NOT IN ('Member', 'Guest') THEN
        RAISE EXCEPTION 'El rol del hogar debe ser Member o Guest';
    END IF;

    SELECT ua.user_account_id
      INTO v_member_user
      FROM user_account.user_account ua
     WHERE lower(ua.email) = lower(btrim(p_email))
       AND ua.status = 'Active'
       AND ua.deleted_at IS NULL;

    IF v_member_user IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO home.home_user (home_id, user_account_id, home_role, added_by)
    VALUES (p_home_id, v_member_user, p_home_role, v_current_user);

    RETURN QUERY
    SELECT ua.user_account_id, ua.username, ua.email, up.full_name,
           hu.home_role, hu.assigned_at
      FROM home.home_user hu
      JOIN user_account.user_account ua ON ua.user_account_id = hu.user_account_id
      LEFT JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id
     WHERE hu.home_id = p_home_id
       AND hu.user_account_id = v_member_user;
END;
$$;

COMMENT ON FUNCTION home.fn_add_home_member(UUID, VARCHAR, VARCHAR) IS
'Agrega un miembro activo a un hogar únicamente si el usuario autenticado es propietario y tiene homes.manage.';
