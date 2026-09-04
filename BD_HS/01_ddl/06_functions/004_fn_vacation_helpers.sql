-- ============================================================
-- FUNCIONES DE AYUDA PARA MODO VACACIONES
-- DOMINIO: home
-- ============================================================

-- ============================================================
-- 1. Verificar si el modo vacaciones está activo
-- ============================================================
CREATE OR REPLACE FUNCTION home.fn_is_vacation_active(
    p_home_id UUID,
    p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = home, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM vacation_mode
        WHERE home_id = p_home_id
          AND active = TRUE
          AND p_check_date BETWEEN started_at AND ended_at
    );
$$;

COMMENT ON FUNCTION home.fn_is_vacation_active(UUID, DATE) IS
'Verifica si el modo vacaciones está activo para un hogar en una fecha específica.
Utilizado para determinar si se deben enviar notificaciones no críticas RF4.7.';