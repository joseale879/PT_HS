CREATE OR REPLACE FUNCTION user_account.fn_change_account_status(
    p_target_user_id UUID,
    p_status VARCHAR,
    p_reason VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    user_account_id UUID,
    status VARCHAR,
    suspension_reason VARCHAR,
    suspended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_actor UUID := user_account.fn_app_current_user_id();
    v_reason VARCHAR := NULLIF(btrim(p_reason), '');
BEGIN
    IF NOT user_account.fn_app_has_permission('users.manage') THEN
        RAISE EXCEPTION 'La cuenta no puede gestionar usuarios';
    END IF;
    IF p_target_user_id IS NULL OR p_target_user_id = v_actor THEN
        RAISE EXCEPTION 'No se puede cambiar el estado de la cuenta actual';
    END IF;
    IF p_status NOT IN ('Active', 'Suspended', 'Blocked') THEN
        RAISE EXCEPTION 'El estado debe ser Active, Suspended o Blocked';
    END IF;
    IF p_status IN ('Suspended', 'Blocked') AND (v_reason IS NULL OR char_length(v_reason) < 3) THEN
        RAISE EXCEPTION 'El motivo es obligatorio para suspender o bloquear una cuenta';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM user_account.user_account
         WHERE user_account_id = p_target_user_id
           AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'El usuario no existe o ya fue eliminado';
    END IF;

    UPDATE user_account.user_account
       SET status = p_status,
           suspension_reason = CASE WHEN p_status = 'Active' THEN NULL ELSE v_reason END,
           suspended_by = CASE WHEN p_status = 'Active' THEN NULL ELSE v_actor END,
           suspended_at = CASE WHEN p_status = 'Active' THEN NULL ELSE now() END,
           updated_at = now()
     WHERE user_account_id = p_target_user_id
     RETURNING user_account_id, status, suspension_reason, suspended_at, updated_at
      INTO user_account_id, status, suspension_reason, suspended_at, updated_at;

    IF p_status <> 'Active' THEN
        UPDATE user_account.token
           SET status = 'Revoked', revoked_at = now()
         WHERE user_account_id = p_target_user_id
           AND status = 'Active';
        UPDATE user_account.session
           SET status = 'Closed', ended_at = now()
         WHERE user_account_id = p_target_user_id
           AND status = 'Active';
    END IF;
    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_delete_user_account(
    p_target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_actor UUID := user_account.fn_app_current_user_id();
BEGIN
    IF NOT user_account.fn_app_has_permission('users.manage') THEN
        RAISE EXCEPTION 'La cuenta no puede gestionar usuarios';
    END IF;
    IF p_target_user_id IS NULL OR p_target_user_id = v_actor THEN
        RAISE EXCEPTION 'No se puede eliminar la cuenta actual';
    END IF;

    UPDATE user_account.user_account
       SET status = 'Blocked',
           suspension_reason = 'Cuenta eliminada por administración',
           suspended_by = v_actor,
           suspended_at = now(),
           deleted_at = now(),
           updated_at = now()
     WHERE user_account_id = p_target_user_id
       AND deleted_at IS NULL;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    UPDATE user_account.token
       SET status = 'Revoked', revoked_at = now()
     WHERE user_account_id = p_target_user_id
       AND status = 'Active';
    UPDATE user_account.session
       SET status = 'Closed', ended_at = now()
     WHERE user_account_id = p_target_user_id
       AND status = 'Active';
    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION user_account.fn_change_account_status(UUID, VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_delete_user_account(UUID) FROM PUBLIC;
