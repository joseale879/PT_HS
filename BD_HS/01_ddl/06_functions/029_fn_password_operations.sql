CREATE OR REPLACE FUNCTION user_account.fn_get_credential_for_user(p_user_account_id UUID)
RETURNS TABLE (user_account_id UUID, password_hash TEXT, account_status VARCHAR(20))
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = user_account, public, pg_temp
AS $$
    SELECT ua.user_account_id, uc.password_hash, ua.status
      FROM user_account.user_account ua
      JOIN user_account.user_credential uc ON uc.user_account_id = ua.user_account_id
     WHERE ua.user_account_id = p_user_account_id
       AND ua.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_change_password_hash(
    p_user_account_id UUID,
    p_password_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
BEGIN
    IF user_account.fn_app_current_user_id() IS DISTINCT FROM p_user_account_id THEN
        RAISE EXCEPTION 'La cuenta de sesión no puede modificar estas credenciales';
    END IF;
    IF p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$' THEN
        RAISE EXCEPTION 'La contraseña debe entregarse como hash bcrypt';
    END IF;
    UPDATE user_account.user_credential
       SET password_hash = p_password_hash,
           requires_change = FALSE,
           changed_at = now()
     WHERE user_account_id = p_user_account_id;
    IF NOT FOUND THEN RETURN FALSE; END IF;

    UPDATE user_account.token
       SET status = 'Revoked', revoked_at = now()
     WHERE user_account_id = p_user_account_id AND status = 'Active';
    UPDATE user_account.session
       SET status = 'Closed', ended_at = now()
     WHERE user_account_id = p_user_account_id AND status = 'Active';
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_create_password_reset_token(
    p_login VARCHAR(150),
    p_token_hash TEXT,
    p_expires_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_reset_id UUID;
BEGIN
    SELECT ua.user_account_id INTO v_user_id
      FROM user_account.user_account ua
     WHERE (lower(ua.username) = lower(btrim(p_login))
         OR lower(ua.email) = lower(btrim(p_login)))
       AND ua.status = 'Active'
       AND ua.deleted_at IS NULL
     LIMIT 1;
    IF v_user_id IS NULL THEN RETURN NULL; END IF;
    IF p_token_hash IS NULL OR length(p_token_hash) <> 64 OR p_expires_at <= now() THEN
        RAISE EXCEPTION 'El token de recuperación no es válido';
    END IF;

    UPDATE user_account.password_reset_token
       SET used = TRUE, used_at = now()
     WHERE user_account_id = v_user_id AND used = FALSE;
    INSERT INTO user_account.password_reset_token (user_account_id, token_hash, expires_at)
    VALUES (v_user_id, p_token_hash, p_expires_at)
    RETURNING reset_id INTO v_reset_id;
    RETURN v_reset_id;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_consume_password_reset(
    p_token_hash TEXT,
    p_password_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_reset_id UUID;
    v_user_id UUID;
BEGIN
    IF p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$' THEN
        RAISE EXCEPTION 'La contraseña debe entregarse como hash bcrypt';
    END IF;
    SELECT prt.reset_id, prt.user_account_id
      INTO v_reset_id, v_user_id
      FROM user_account.password_reset_token prt
     WHERE prt.token_hash = p_token_hash
       AND prt.used = FALSE
       AND prt.expires_at > now()
     FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El token de recuperación no es válido o expiró';
    END IF;

    UPDATE user_account.user_credential
       SET password_hash = p_password_hash,
           requires_change = FALSE,
           changed_at = now()
     WHERE user_account_id = v_user_id;
    UPDATE user_account.password_reset_token
       SET used = TRUE, used_at = now()
     WHERE reset_id = v_reset_id;
    UPDATE user_account.token
       SET status = 'Revoked', revoked_at = now()
     WHERE user_account_id = v_user_id AND status = 'Active';
    UPDATE user_account.session
       SET status = 'Closed', ended_at = now()
     WHERE user_account_id = v_user_id AND status = 'Active';
    RETURN v_user_id;
END;
$$;
