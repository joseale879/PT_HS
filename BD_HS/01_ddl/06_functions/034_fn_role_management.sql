CREATE OR REPLACE FUNCTION user_account.fn_get_user_roles(p_target_user_id UUID)
RETURNS TABLE(role_id UUID, role_name VARCHAR, description TEXT, status VARCHAR)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('roles.manage') THEN
        RAISE EXCEPTION 'La cuenta no puede gestionar roles';
    END IF;
    RETURN QUERY
    SELECT r.role_id, r.name, r.description, r.status
      FROM user_account.user_role ur
      JOIN user_account.role r ON r.role_id = ur.role_id
     WHERE ur.user_account_id = p_target_user_id
     ORDER BY r.name;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_assign_user_role(p_target_user_id UUID, p_role_name VARCHAR)
RETURNS TABLE(role_id UUID, role_name VARCHAR, description TEXT, status VARCHAR)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE v_role UUID;
BEGIN
    IF NOT user_account.fn_app_has_permission('roles.manage') THEN RAISE EXCEPTION 'La cuenta no puede gestionar roles'; END IF;
    IF NOT EXISTS (SELECT 1 FROM user_account.user_account WHERE user_account_id=p_target_user_id AND status='Active' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'El usuario no existe o no está activo'; END IF;
    SELECT r.role_id INTO v_role FROM user_account.role r WHERE lower(r.name)=lower(btrim(p_role_name)) AND r.status='Active';
    IF v_role IS NULL THEN RAISE EXCEPTION 'El rol no existe o está inactivo'; END IF;
    INSERT INTO user_account.user_role(user_account_id,role_id,assigned_by) VALUES(p_target_user_id,v_role,user_account.fn_app_current_user_id()) ON CONFLICT DO NOTHING;
    RETURN QUERY SELECT r.role_id,r.name,r.description,r.status FROM user_account.role r WHERE r.role_id=v_role;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_remove_user_role(p_target_user_id UUID, p_role_name VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE v_role UUID; v_admin_count INTEGER;
BEGIN
    IF NOT user_account.fn_app_has_permission('roles.manage') THEN RAISE EXCEPTION 'La cuenta no puede gestionar roles'; END IF;
    SELECT role_id INTO v_role FROM user_account.role WHERE lower(name)=lower(btrim(p_role_name));
    IF v_role IS NULL THEN RAISE EXCEPTION 'El rol no existe'; END IF;
    IF p_target_user_id=user_account.fn_app_current_user_id() AND lower(btrim(p_role_name))='administrator' THEN
        SELECT count(*) INTO v_admin_count FROM user_account.user_role ur JOIN user_account.role r ON r.role_id=ur.role_id JOIN user_account.user_account u ON u.user_account_id=ur.user_account_id WHERE lower(r.name)='administrator' AND r.status='Active' AND u.status='Active' AND u.deleted_at IS NULL;
        IF v_admin_count <= 1 THEN RAISE EXCEPTION 'No se puede retirar el último rol Administrator'; END IF;
    END IF;
    DELETE FROM user_account.user_role WHERE user_account_id=p_target_user_id AND role_id=v_role;
    RETURN FOUND;
END;
$$;
