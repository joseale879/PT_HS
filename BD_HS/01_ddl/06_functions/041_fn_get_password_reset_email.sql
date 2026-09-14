CREATE OR REPLACE FUNCTION user_account.fn_get_password_reset_email(p_token_hash TEXT)
RETURNS VARCHAR(150)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = user_account, public, pg_temp
AS $$
    SELECT ua.email
      FROM user_account.password_reset_token prt
      JOIN user_account.user_account ua ON ua.user_account_id = prt.user_account_id
     WHERE prt.token_hash = p_token_hash
       AND prt.used = FALSE
       AND prt.expires_at > now()
       AND ua.status = 'Active'
       AND ua.deleted_at IS NULL
     LIMIT 1;
$$;
