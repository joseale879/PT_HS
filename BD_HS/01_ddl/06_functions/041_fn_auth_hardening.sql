-- Corrige la consulta DISTINCT de autorizacion y encapsula el cierre de sesion.
CREATE OR REPLACE FUNCTION user_account.fn_get_my_authorization_context()
RETURNS TABLE (role_name VARCHAR, permission_name VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
    SELECT DISTINCT r.name::VARCHAR, p.name::VARCHAR
      FROM user_account.user_role ur
      JOIN user_account.role r ON r.role_id = ur.role_id AND r.status = 'Active'
      LEFT JOIN user_account.role_permission rp ON rp.role_id = r.role_id
      LEFT JOIN user_account.permission p ON p.permission_id = rp.permission_id AND p.status = 'Active'
     WHERE ur.user_account_id = user_account.fn_app_current_user_id()
     ORDER BY 1, 2 NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_revoke_owned_refresh_session(
    p_refresh_token_hash TEXT,
    p_user_account_id UUID,
    p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_session_id UUID;
    v_token_id UUID;
BEGIN
    SELECT s.session_id, t.token_id INTO v_session_id, v_token_id
      FROM user_account.token t
      JOIN user_account.session s ON s.token_id = t.token_id
     WHERE t.token_hash = p_refresh_token_hash
       AND t.type = 'refresh'
       AND t.status = 'Active'
       AND s.status = 'Active'
       AND s.session_id = p_session_id
       AND s.user_account_id = p_user_account_id
       AND t.expires_at > now()
     FOR UPDATE OF t, s;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    UPDATE user_account.token SET status = 'Revoked', revoked_at = now()
     WHERE token_id = v_token_id;
    UPDATE user_account.session SET status = 'Closed', ended_at = now()
     WHERE session_id = v_session_id;
    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION user_account.fn_revoke_owned_refresh_session(TEXT, UUID, UUID) FROM PUBLIC;
