CREATE OR REPLACE FUNCTION device.fn_can_manage_device(
    p_device_id UUID,
    p_user_id UUID
)
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

COMMENT ON FUNCTION device.fn_can_manage_device(UUID, UUID) IS
'Comprueba si un usuario activo pertenece a un hogar activo asociado al dispositivo, sin depender del estado operativo del dispositivo.';