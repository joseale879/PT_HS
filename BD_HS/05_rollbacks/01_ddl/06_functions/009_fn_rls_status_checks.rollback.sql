DROP FUNCTION IF EXISTS home.fn_is_home_member(UUID, UUID);
DROP FUNCTION IF EXISTS home.fn_is_home_owner(UUID, UUID);
DROP FUNCTION IF EXISTS device.fn_can_access_device(UUID, UUID);

CREATE FUNCTION home.fn_is_home_member(
    p_home_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = home, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM home_user hu
        WHERE hu.home_id = p_home_id
          AND hu.user_account_id = p_user_id
    );
$$;

CREATE FUNCTION home.fn_is_home_owner(
    p_home_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = home, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM home_user hu
        WHERE hu.home_id = p_home_id
          AND hu.user_account_id = p_user_id
          AND hu.home_role = 'Owner'
    );
$$;

CREATE FUNCTION device.fn_can_access_device(
    p_device_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = device, home, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM home_device hd
        JOIN home_user hu ON hu.home_id = hd.home_id
        WHERE hd.device_id = $1
          AND hu.user_account_id = $2
    );
$$;