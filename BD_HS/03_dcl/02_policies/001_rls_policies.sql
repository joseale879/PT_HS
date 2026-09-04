-- ============================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================

-- ============================================================
-- 1. USER_ACCOUNT — Usuarios solo ven sus propios datos
-- ============================================================
ALTER TABLE user_account.user_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_account_self_select_update ON user_account.user_account
    FOR SELECT
    TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id());

CREATE POLICY user_account_self_update ON user_account.user_account
    FOR UPDATE
    TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

-- ============================================================
-- 2. HOME — Usuarios solo ven hogares donde son miembros
-- ============================================================
ALTER TABLE home.home ENABLE ROW LEVEL SECURITY;

CREATE POLICY home_member_select ON home.home
    FOR SELECT
    TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY home_owner_update ON home.home
    FOR UPDATE
    TO hidro_smart_app
    USING (home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id()));

-- ============================================================
-- 3. HOME_DEVICE — Usuarios solo ven dispositivos de sus hogares
-- ============================================================
ALTER TABLE home.home_device ENABLE ROW LEVEL SECURITY;

CREATE POLICY home_device_member_select ON home.home_device
    FOR SELECT
    TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

-- ============================================================
-- 4. DEVICE — Usuarios solo ven dispositivos a los que tienen acceso
-- ============================================================
ALTER TABLE device.device ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_member_select ON device.device
    FOR SELECT
    TO hidro_smart_app
    USING (device.fn_can_access_device(device_id, user_account.fn_app_current_user_id()));

-- ============================================================
-- 5. SENSOR_READING — Usuarios solo ven lecturas de sus hogares
-- ============================================================
ALTER TABLE consumption.sensor_reading ENABLE ROW LEVEL SECURITY;

CREATE POLICY sensor_reading_member_select ON consumption.sensor_reading
    FOR SELECT
    TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

-- ============================================================
-- 6. AUDIT_LOG — Usuarios solo ven sus propias auditorías (administradores ven todo)
-- ============================================================
ALTER TABLE audit.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_self_select ON audit.audit_log
    FOR SELECT
    TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id());

-- Los administradores pueden ver todo (se configura mediante un rol aparte)
-- CREATE POLICY audit_log_admin_select ON audit.audit_log
--     FOR SELECT
--     TO role_admin
--     USING (TRUE);