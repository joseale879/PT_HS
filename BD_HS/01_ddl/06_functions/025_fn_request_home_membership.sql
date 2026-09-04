CREATE OR REPLACE FUNCTION home.fn_request_home_membership(p_home_id UUID)
RETURNS TABLE (request_id UUID, home_id UUID, user_id UUID, status VARCHAR(20), requested_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = home, user_account, public, pg_temp
AS $$
DECLARE v_user_id UUID := user_account.fn_app_current_user_id();
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'El usuario autenticado es obligatorio'; END IF;
    IF NOT EXISTS (SELECT 1 FROM home.home WHERE home_id = p_home_id AND status = 'Active' AND deleted_at IS NULL) THEN RETURN; END IF;
    IF home.fn_is_home_member(p_home_id, v_user_id) THEN RAISE EXCEPTION 'El usuario ya pertenece al hogar'; END IF;
    INSERT INTO home.home_member_request (home_id, user_account_id)
    VALUES (p_home_id, v_user_id)
    RETURNING home_member_request.request_id, home_member_request.home_id,
              home_member_request.user_account_id, home_member_request.status,
              home_member_request.requested_at
    INTO request_id, home_id, user_id, status, requested_at;
    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION home.fn_answer_home_membership_request(p_request_id UUID, p_status VARCHAR(20))
RETURNS TABLE (request_id UUID, home_id UUID, user_id UUID, status VARCHAR(20), requested_at TIMESTAMPTZ, answered_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = home, user_account, public, pg_temp
AS $$
DECLARE v_current_user UUID := user_account.fn_app_current_user_id(); v_home_id UUID; v_user_id UUID; v_requested_at TIMESTAMPTZ; v_answered_at TIMESTAMPTZ;
BEGIN
    IF p_status NOT IN ('Approved', 'Rejected') THEN RAISE EXCEPTION 'El estado debe ser Approved o Rejected'; END IF;
    SELECT hmr.home_id, hmr.user_account_id, hmr.requested_at INTO v_home_id, v_user_id, v_requested_at
      FROM home.home_member_request hmr WHERE hmr.request_id = p_request_id AND hmr.status = 'Pending' FOR UPDATE;
    IF v_home_id IS NULL THEN RETURN; END IF;
    IF v_current_user IS NULL OR NOT user_account.fn_app_has_permission('homes.manage') OR NOT home.fn_is_home_owner(v_home_id, v_current_user) THEN
        RAISE EXCEPTION 'El usuario no puede responder esta solicitud';
    END IF;
    v_answered_at := now();
    UPDATE home.home_member_request SET status = p_status, answered_at = v_answered_at, answered_by = v_current_user WHERE request_id = p_request_id;
    IF p_status = 'Approved' THEN
        INSERT INTO home.home_user (home_id, user_account_id, home_role, added_by)
        VALUES (v_home_id, v_user_id, 'Member', v_current_user);
    END IF;
    RETURN QUERY SELECT p_request_id, v_home_id, v_user_id, p_status, v_requested_at, v_answered_at;
END;
$$;

COMMENT ON FUNCTION home.fn_request_home_membership(UUID) IS 'Crea una solicitud de ingreso para el usuario autenticado.';
COMMENT ON FUNCTION home.fn_answer_home_membership_request(UUID, VARCHAR) IS 'Aprueba o rechaza una solicitud; al aprobar agrega al usuario como Member.';
