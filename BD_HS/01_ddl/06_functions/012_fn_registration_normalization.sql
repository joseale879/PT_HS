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
        RAISE EXCEPTION 'El correo electrónico no tiene un formato válido';
    END IF;

    INSERT INTO user_account.user_account (username, email)
    VALUES (v_username, v_email)
    RETURNING user_account_id INTO v_user_account_id;

    RETURN v_user_account_id;
END;
$$;
