-- ============================================================
-- FUNCIONES DE SEGURIDAD Y AYUDA PARA RLS
-- DOMINIO: user_account, home
-- ============================================================

-- ============================================================
-- 1. Obtener el ID del usuario actual (para RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION user_account.fn_app_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
BEGIN
    RETURN current_setting('app.user_id', TRUE)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

COMMENT ON FUNCTION user_account.fn_app_current_user_id() IS
'Retorna el UUID del usuario actual desde la variable de sesión app.user_id.
Utilizado en políticas RLS para filtrar datos por usuario autenticado.';

-- ============================================================
-- 2. Verificar si un usuario es miembro de un hogar
-- ============================================================
CREATE OR REPLACE FUNCTION home.fn_is_home_member(
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

COMMENT ON FUNCTION home.fn_is_home_member(UUID, UUID) IS
'Verifica si el usuario p_user_id es miembro (Owner, Member o Guest) del hogar p_home_id.';

-- ============================================================
-- 3. Verificar si un usuario es titular (Owner) de un hogar
-- ============================================================
CREATE OR REPLACE FUNCTION home.fn_is_home_owner(
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

COMMENT ON FUNCTION home.fn_is_home_owner(UUID, UUID) IS
'Verifica si el usuario p_user_id es titular (Owner) del hogar p_home_id.';

-- ============================================================
-- 4. Verificar si un usuario tiene acceso a un dispositivo
-- ============================================================
CREATE OR REPLACE FUNCTION device.fn_can_access_device(
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
        WHERE hd.device_id = p_device_id
          AND hu.user_account_id = p_user_id
    );
$$;

COMMENT ON FUNCTION device.fn_can_access_device(UUID, UUID) IS
'Verifica si el usuario p_user_id tiene acceso al dispositivo p_device_id a través de su hogar.';