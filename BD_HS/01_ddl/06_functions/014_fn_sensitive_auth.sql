CREATE OR REPLACE FUNCTION user_account.fn_get_credential_for_login(
    p_login VARCHAR(150)
)
RETURNS TABLE (
    user_account_id UUID,
    password_hash TEXT,
    account_status VARCHAR(20),
    requires_change BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = user_account, public, pg_temp
AS $$
    SELECT ua.user_account_id,
           uc.password_hash,
           ua.status,
           uc.requires_change
    FROM user_account.user_account ua
    JOIN user_account.user_credential uc
      ON uc.user_account_id = ua.user_account_id
    WHERE (lower(ua.username) = lower(btrim(p_login))
        OR lower(ua.email) = lower(btrim(p_login)))
      AND ua.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_set_password_hash(
    p_user_account_id UUID,
    p_password_hash TEXT,
    p_policy_id UUID DEFAULT NULL,
    p_requires_change BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_credential_id UUID;
BEGIN
    IF user_account.fn_app_current_user_id() IS DISTINCT FROM p_user_account_id THEN
        RAISE EXCEPTION 'La cuenta de sesión no puede modificar estas credenciales';
    END IF;

    IF p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$' THEN
        RAISE EXCEPTION 'La contraseña debe entregarse como hash bcrypt';
    END IF;

    INSERT INTO user_account.user_credential (
        user_account_id, password_hash, policy_id, requires_change, changed_at
    )
    VALUES (
        p_user_account_id, p_password_hash, p_policy_id, p_requires_change, now()
    )
    ON CONFLICT (user_account_id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        policy_id = EXCLUDED.policy_id,
        requires_change = EXCLUDED.requires_change,
        changed_at = now()
    RETURNING credential_id INTO v_credential_id;

    RETURN v_credential_id;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_upsert_mfa(
    p_user_account_id UUID,
    p_method VARCHAR(10),
    p_secret_totp_ciphertext BYTEA,
    p_backup_codes_hashes JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_mfa_id UUID;
BEGIN
    IF user_account.fn_app_current_user_id() IS DISTINCT FROM p_user_account_id THEN
        RAISE EXCEPTION 'La cuenta de sesión no puede modificar este MFA';
    END IF;

    IF p_method = 'TOTP' AND p_secret_totp_ciphertext IS NULL THEN
        RAISE EXCEPTION 'TOTP requiere un secreto cifrado';
    END IF;

    INSERT INTO user_account.user_mfa (
        user_account_id,
        method,
        secret_totp,
        backup_codes,
        secret_totp_ciphertext,
        backup_codes_hashes,
        active,
        verified,
        updated_at
    )
    VALUES (
        p_user_account_id,
        p_method,
        NULL,
        NULL,
        p_secret_totp_ciphertext,
        p_backup_codes_hashes,
        FALSE,
        FALSE,
        now()
    )
    ON CONFLICT (user_account_id) DO UPDATE SET
        method = EXCLUDED.method,
        secret_totp = NULL,
        backup_codes = NULL,
        secret_totp_ciphertext = EXCLUDED.secret_totp_ciphertext,
        backup_codes_hashes = EXCLUDED.backup_codes_hashes,
        active = FALSE,
        verified = FALSE,
        updated_at = now()
    RETURNING mfa_id INTO v_mfa_id;

    RETURN v_mfa_id;
END;
$$;

COMMENT ON FUNCTION user_account.fn_get_credential_for_login(VARCHAR) IS
'Devuelve únicamente al backend el hash bcrypt necesario para autenticar una cuenta.';

COMMENT ON FUNCTION user_account.fn_set_password_hash(UUID, TEXT, UUID, BOOLEAN) IS
'Guarda credenciales usando únicamente hashes bcrypt; nunca recibe contraseñas planas.';

COMMENT ON FUNCTION user_account.fn_upsert_mfa(UUID, VARCHAR, BYTEA, JSONB) IS
'Guarda MFA nuevo con secreto cifrado y códigos de respaldo hasheados.';
