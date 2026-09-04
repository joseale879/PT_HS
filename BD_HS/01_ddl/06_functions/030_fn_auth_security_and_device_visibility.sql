CREATE OR REPLACE FUNCTION user_account.fn_get_login_security_state(p_user_account_id UUID)
RETURNS TABLE (
    blocked_until TIMESTAMPTZ,
    requires_change BOOLEAN,
    password_changed_at TIMESTAMPTZ,
    expiration_days INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = user_account, public, pg_temp
AS $$
    SELECT la.blocked_until,
           COALESCE(uc.requires_change, FALSE),
           uc.changed_at,
           COALESCE(pp.expiration_days, 0)
      FROM user_account.user_account ua
      LEFT JOIN user_account.login_attempt la ON la.user_account_id = ua.user_account_id
      LEFT JOIN user_account.user_credential uc ON uc.user_account_id = ua.user_account_id
      LEFT JOIN user_account.password_policy pp ON pp.policy_id = uc.policy_id
     WHERE ua.user_account_id = p_user_account_id
     LIMIT 1;
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
    v_policy_id UUID;
BEGIN
    IF user_account.fn_app_current_user_id() IS DISTINCT FROM p_user_account_id THEN
        RAISE EXCEPTION 'La cuenta de sesión no puede modificar estas credenciales';
    END IF;
    IF p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$' THEN
        RAISE EXCEPTION 'La contraseña debe entregarse como hash bcrypt';
    END IF;
    SELECT COALESCE(p_policy_id, pp.policy_id)
      INTO v_policy_id
      FROM user_account.password_policy pp
     WHERE p_policy_id IS NOT NULL OR pp.active = TRUE
     ORDER BY pp.created_at DESC
     LIMIT 1;
    INSERT INTO user_account.user_credential (user_account_id, password_hash, policy_id, requires_change, changed_at)
    VALUES (p_user_account_id, p_password_hash, v_policy_id, p_requires_change, now())
    ON CONFLICT (user_account_id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        policy_id = EXCLUDED.policy_id,
        requires_change = EXCLUDED.requires_change,
        changed_at = now()
    RETURNING credential_id INTO v_credential_id;
    RETURN v_credential_id;
END;
$$;

CREATE OR REPLACE FUNCTION device.fn_can_access_device(p_device_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = device, home, user_account, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM device.device d
          JOIN home.home_device hd ON hd.device_id = d.device_id
          JOIN home.home h ON h.home_id = hd.home_id
          JOIN home.home_user hu ON hu.home_id = hd.home_id
          JOIN user_account.user_account ua ON ua.user_account_id = hu.user_account_id
         WHERE d.device_id = p_device_id
           AND hd.status = 'Active'
           AND h.status = 'Active'
           AND h.deleted_at IS NULL
           AND hu.user_account_id = p_user_id
           AND ua.status = 'Active'
           AND ua.deleted_at IS NULL
    );
$$;

COMMENT ON FUNCTION device.fn_can_access_device(UUID, UUID) IS
'Permite visualizar dispositivos por pertenencia al hogar, independientemente de su estado operativo.';
