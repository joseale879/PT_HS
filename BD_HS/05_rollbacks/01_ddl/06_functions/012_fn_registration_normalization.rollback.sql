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
BEGIN
    INSERT INTO user_account.user_account (username, email)
    VALUES (p_username, p_email)
    RETURNING user_account_id INTO v_user_account_id;
    RETURN v_user_account_id;
END;
$$;
