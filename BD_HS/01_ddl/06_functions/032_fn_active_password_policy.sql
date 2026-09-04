CREATE OR REPLACE FUNCTION user_account.fn_get_active_password_policy()
RETURNS TABLE (
    min_length INTEGER,
    requires_uppercase BOOLEAN,
    requires_lowercase BOOLEAN,
    requires_number BOOLEAN,
    requires_symbol BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = user_account, public, pg_temp
AS $$
    SELECT pp.min_length, pp.requires_uppercase, pp.requires_lowercase,
           pp.requires_number, pp.requires_symbol
      FROM user_account.password_policy pp
     WHERE pp.active = TRUE
     ORDER BY pp.created_at DESC
     LIMIT 1;
$$;
