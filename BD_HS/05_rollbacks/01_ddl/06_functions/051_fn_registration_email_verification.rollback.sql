CREATE OR REPLACE FUNCTION user_account.fn_register_user(
    p_username VARCHAR(100),
    p_email VARCHAR(150)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_account_id UUID;
    v_username VARCHAR(100) := lower(btrim(p_username));
    v_email VARCHAR(150) := lower(btrim(p_email));
BEGIN
    IF v_username IS NULL OR char_length(v_username) < 4 THEN
        RAISE EXCEPTION 'El nombre de usuario debe tener al menos 4 caracteres';
    END IF;
    IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
        RAISE EXCEPTION 'El correo electronico no tiene un formato valido';
    END IF;

    INSERT INTO user_account.user_account (username, email)
    VALUES (v_username, v_email)
    RETURNING user_account_id INTO v_user_account_id;

    PERFORM user_account.fn_assign_default_role(v_user_account_id);
    RETURN v_user_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_consume_email_verification(p_token_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_verification_id UUID;
BEGIN
    SELECT verification_id, user_account_id
      INTO v_verification_id, v_user_id
      FROM user_account.email_verification_token
     WHERE token_hash = p_token_hash AND used = FALSE AND expires_at > now()
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'El token de verificacion no es valido o expiro'; END IF;
    UPDATE user_account.email_verification_token SET used = TRUE, used_at = now()
     WHERE verification_id = v_verification_id;
    UPDATE user_account.user_account SET email_verified_at = now(), updated_at = now()
     WHERE user_account_id = v_user_id;
    RETURN v_user_id;
END;
$$;
