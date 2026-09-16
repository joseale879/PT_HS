CREATE OR REPLACE FUNCTION user_account.fn_list_owned_sessions(
    p_user_account_id UUID,
    p_current_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    status VARCHAR,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    source_ip VARCHAR,
    user_agent TEXT,
    refresh_expires_at TIMESTAMPTZ,
    is_current BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
    SELECT s.session_id,
           s.status,
           s.started_at,
           s.ended_at,
           s.source_ip,
           s.user_agent,
           t.expires_at,
           s.session_id = p_current_session_id
      FROM user_account.session s
      LEFT JOIN user_account.token t ON t.token_id = s.token_id AND t.type = 'refresh'
     WHERE s.user_account_id = p_user_account_id
       AND p_user_account_id = user_account.fn_app_current_user_id()
     ORDER BY CASE WHEN s.status = 'Active' THEN 0 ELSE 1 END,
              s.started_at DESC;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_revoke_owned_session(
    p_user_account_id UUID,
    p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_token_id UUID;
BEGIN
    IF p_user_account_id IS DISTINCT FROM user_account.fn_app_current_user_id() THEN
        RAISE EXCEPTION 'La cuenta de sesión no coincide con el usuario';
    END IF;

    SELECT s.token_id INTO v_token_id
      FROM user_account.session s
     WHERE s.session_id = p_session_id
       AND s.user_account_id = p_user_account_id
       AND s.status = 'Active'
     FOR UPDATE;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    IF v_token_id IS NOT NULL THEN
        UPDATE user_account.token
           SET status = 'Revoked', revoked_at = now()
         WHERE token_id = v_token_id AND status = 'Active';
    END IF;
    UPDATE user_account.session
       SET status = 'Closed', ended_at = now()
     WHERE session_id = p_session_id AND status = 'Active';
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_revoke_other_sessions(
    p_user_account_id UUID,
    p_current_session_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_user_account_id IS DISTINCT FROM user_account.fn_app_current_user_id() THEN
        RAISE EXCEPTION 'La cuenta de sesión no coincide con el usuario';
    END IF;
    SELECT count(*)::INTEGER INTO v_count
      FROM user_account.session
     WHERE user_account_id = p_user_account_id
       AND status = 'Active'
       AND session_id <> p_current_session_id;

    UPDATE user_account.token t
       SET status = 'Revoked', revoked_at = now()
     WHERE t.token_id IN (
         SELECT s.token_id
           FROM user_account.session s
          WHERE s.user_account_id = p_user_account_id
            AND s.status = 'Active'
            AND s.session_id <> p_current_session_id
            AND s.token_id IS NOT NULL
     );
    UPDATE user_account.session
       SET status = 'Closed', ended_at = now()
     WHERE user_account_id = p_user_account_id
       AND status = 'Active'
       AND session_id <> p_current_session_id;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_revoke_all_sessions(
    p_user_account_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_user_account_id IS DISTINCT FROM user_account.fn_app_current_user_id() THEN
        RAISE EXCEPTION 'La cuenta de sesión no coincide con el usuario';
    END IF;
    SELECT count(*)::INTEGER INTO v_count
      FROM user_account.session
     WHERE user_account_id = p_user_account_id AND status = 'Active';

    UPDATE user_account.token t
       SET status = 'Revoked', revoked_at = now()
     WHERE t.token_id IN (
         SELECT s.token_id
           FROM user_account.session s
          WHERE s.user_account_id = p_user_account_id
            AND s.status = 'Active'
            AND s.token_id IS NOT NULL
     );
    UPDATE user_account.session
       SET status = 'Closed', ended_at = now()
     WHERE user_account_id = p_user_account_id AND status = 'Active';
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION user_account.fn_list_owned_sessions(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_revoke_owned_session(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_revoke_other_sessions(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_revoke_all_sessions(UUID) FROM PUBLIC;
