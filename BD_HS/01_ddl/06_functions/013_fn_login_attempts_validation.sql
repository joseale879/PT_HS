CREATE OR REPLACE FUNCTION user_account.fn_record_login_failure(
    p_user_account_id UUID,
    p_source_ip VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    failed_attempts INTEGER,
    blocked_until TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_lockout_attempts INTEGER;
    v_lockout_minutes INTEGER;
    v_failed_attempts INTEGER;
    v_blocked_until TIMESTAMPTZ;
BEGIN
    IF p_user_account_id IS NULL
       OR NOT EXISTS (
           SELECT 1
           FROM user_account.user_account
           WHERE user_account_id = p_user_account_id
       ) THEN
        RAISE EXCEPTION 'La cuenta indicada no existe';
    END IF;

    SELECT pp.lockout_attempts, pp.lockout_minutes
    INTO v_lockout_attempts, v_lockout_minutes
    FROM user_account.password_policy pp
    WHERE pp.active = TRUE
    ORDER BY pp.created_at DESC
    LIMIT 1;

    v_lockout_attempts := COALESCE(v_lockout_attempts, 5);
    v_lockout_minutes := COALESCE(v_lockout_minutes, 15);

    SELECT la.failed_attempts, la.blocked_until
    INTO v_failed_attempts, v_blocked_until
    FROM user_account.login_attempt la
    WHERE la.user_account_id = p_user_account_id
    FOR UPDATE;

    IF v_blocked_until IS NOT NULL AND v_blocked_until > now() THEN
        RETURN QUERY SELECT v_failed_attempts, v_blocked_until;
        RETURN;
    END IF;

    v_failed_attempts := CASE
        WHEN v_blocked_until IS NULL THEN COALESCE(v_failed_attempts, 0) + 1
        ELSE 1
    END;

    v_blocked_until := CASE
        WHEN v_failed_attempts >= v_lockout_attempts
            THEN now() + make_interval(mins => v_lockout_minutes)
        ELSE NULL
    END;

    INSERT INTO user_account.login_attempt (
        user_account_id, failed_attempts, blocked_until, last_attempt_at, source_ip
    )
    VALUES (
        p_user_account_id, v_failed_attempts, v_blocked_until, now(), p_source_ip
    )
    ON CONFLICT (user_account_id) DO UPDATE SET
        failed_attempts = EXCLUDED.failed_attempts,
        blocked_until = EXCLUDED.blocked_until,
        last_attempt_at = EXCLUDED.last_attempt_at,
        source_ip = EXCLUDED.source_ip;

    RETURN QUERY SELECT v_failed_attempts, v_blocked_until;
END;
$$;
