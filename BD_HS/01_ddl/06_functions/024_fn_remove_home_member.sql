CREATE OR REPLACE FUNCTION home.fn_remove_home_member(
    p_home_id UUID,
    p_member_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = home, user_account, public, pg_temp
AS $$
DECLARE
    v_current_user UUID := user_account.fn_app_current_user_id();
    v_deleted_count INTEGER;
BEGIN
    IF v_current_user IS NULL
       OR NOT user_account.fn_app_has_permission('homes.manage')
       OR NOT home.fn_is_home_owner(p_home_id, v_current_user) THEN
        RAISE EXCEPTION 'El usuario no puede administrar este hogar';
    END IF;
    IF EXISTS (SELECT 1 FROM home.home_user WHERE home_id = p_home_id AND user_account_id = p_member_user_id AND home_role = 'Owner') THEN
        RAISE EXCEPTION 'El propietario no puede retirarse mediante esta operación';
    END IF;
    DELETE FROM home.home_user WHERE home_id = p_home_id AND user_account_id = p_member_user_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count > 0;
END;
$$;

COMMENT ON FUNCTION home.fn_remove_home_member(UUID, UUID) IS
'Retira un miembro de un hogar únicamente por acción de su propietario; no permite retirar al Owner.';
