CREATE OR REPLACE FUNCTION user_account.fn_create_session(
    p_user_account_id UUID,
    p_refresh_token_hash TEXT,
    p_refresh_expires_at TIMESTAMPTZ,
    p_source_ip VARCHAR(50) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (session_id UUID, refresh_token_id UUID, refresh_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_token_id UUID;
    v_session_id UUID;
BEGIN
    IF user_account.fn_app_current_user_id() IS DISTINCT FROM p_user_account_id THEN
        RAISE EXCEPTION 'La cuenta de sesión no coincide con el usuario';
    END IF;
    IF p_refresh_token_hash IS NULL OR length(p_refresh_token_hash) <> 64 THEN
        RAISE EXCEPTION 'El hash del refresh token no es válido';
    END IF;
    IF p_refresh_expires_at <= now() THEN
        RAISE EXCEPTION 'El refresh token debe tener una expiración futura';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM user_account.user_account
         WHERE user_account_id = p_user_account_id AND status = 'Active' AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'La cuenta no está activa';
    END IF;

    INSERT INTO user_account.token (user_account_id, type, token_hash, expires_at, source_ip, user_agent)
    VALUES (p_user_account_id, 'refresh', p_refresh_token_hash, p_refresh_expires_at, p_source_ip, p_user_agent)
    RETURNING token_id INTO v_token_id;

    INSERT INTO user_account.session (user_account_id, token_id, source_ip, user_agent)
    VALUES (p_user_account_id, v_token_id, p_source_ip, p_user_agent)
    RETURNING session.session_id INTO v_session_id;

    RETURN QUERY SELECT v_session_id, v_token_id, p_refresh_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_rotate_refresh_token(
    p_refresh_token_hash TEXT,
    p_new_refresh_token_hash TEXT,
    p_new_refresh_expires_at TIMESTAMPTZ,
    p_source_ip VARCHAR(50) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (user_id UUID, session_id UUID, refresh_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_old_token_id UUID;
    v_user_id UUID;
    v_session_id UUID;
    v_new_token_id UUID;
BEGIN
    SELECT t.token_id, t.user_account_id, s.session_id
      INTO v_old_token_id, v_user_id, v_session_id
      FROM user_account.token t
      JOIN user_account.session s ON s.token_id = t.token_id
     WHERE t.token_hash = p_refresh_token_hash
       AND t.type = 'refresh'
       AND t.status = 'Active'
       AND t.expires_at > now()
       AND s.status = 'Active'
     FOR UPDATE OF t, s;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El refresh token no es válido o ya fue revocado';
    END IF;
    IF p_new_refresh_token_hash IS NULL OR length(p_new_refresh_token_hash) <> 64 THEN
        RAISE EXCEPTION 'El nuevo refresh token no es válido';
    END IF;
    IF p_new_refresh_expires_at <= now() THEN
        RAISE EXCEPTION 'El refresh token debe tener una expiración futura';
    END IF;

    UPDATE user_account.token
       SET status = 'Revoked', revoked_at = now()
     WHERE token_id = v_old_token_id;

    INSERT INTO user_account.token (user_account_id, type, token_hash, parent_id, expires_at, source_ip, user_agent)
    VALUES (v_user_id, 'refresh', p_new_refresh_token_hash, v_old_token_id, p_new_refresh_expires_at, p_source_ip, p_user_agent)
    RETURNING token_id INTO v_new_token_id;

    UPDATE user_account.session
       SET token_id = v_new_token_id, source_ip = p_source_ip, user_agent = p_user_agent
     WHERE user_account.session.session_id = v_session_id;

    RETURN QUERY SELECT v_user_id, v_session_id, p_new_refresh_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_revoke_refresh_session(p_refresh_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    SELECT s.session_id INTO v_session_id
      FROM user_account.token t
      JOIN user_account.session s ON s.token_id = t.token_id
     WHERE t.token_hash = p_refresh_token_hash
       AND t.type = 'refresh'
       AND s.status = 'Active'
     FOR UPDATE OF t, s;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    UPDATE user_account.token SET status = 'Revoked', revoked_at = now()
     WHERE token_hash = p_refresh_token_hash AND status = 'Active';
    UPDATE user_account.session SET status = 'Closed', ended_at = now()
     WHERE session_id = v_session_id AND status = 'Active';
    RETURN TRUE;
END;
$$;
