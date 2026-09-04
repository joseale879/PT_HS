CREATE OR REPLACE FUNCTION home.fn_create_home_with_owner(
    p_name VARCHAR(100),
    p_address VARCHAR(255),
    p_city VARCHAR(100),
    p_tier SMALLINT DEFAULT NULL,
    p_user_account_id UUID DEFAULT user_account.fn_app_current_user_id()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = home, user_account, public, pg_temp
AS $$
DECLARE v_home_id UUID;
BEGIN
    IF p_user_account_id IS NULL OR p_user_account_id <> user_account.fn_app_current_user_id() THEN
        RAISE EXCEPTION 'El propietario debe coincidir con el usuario autenticado';
    END IF;
    INSERT INTO home.home (name, address, city, tier)
    VALUES (p_name, p_address, p_city, p_tier)
    RETURNING home_id INTO v_home_id;
    INSERT INTO home.home_user (home_id, user_account_id, home_role, added_by)
    VALUES (v_home_id, p_user_account_id, 'Owner', p_user_account_id);
    RETURN v_home_id;
END;
$$;

COMMENT ON FUNCTION home.fn_create_home_with_owner(VARCHAR, VARCHAR, VARCHAR, SMALLINT, UUID) IS
'Crea un hogar y su primer miembro propietario en una operación controlada.';
