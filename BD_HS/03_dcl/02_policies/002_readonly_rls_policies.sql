-- ============================================================
-- POLÍTICAS RLS PARA REPORTES
-- ============================================================

CREATE POLICY user_account_readonly_select ON user_account.user_account
    FOR SELECT
    TO hidro_smart_readonly
    USING (TRUE);

CREATE POLICY home_readonly_select ON home.home
    FOR SELECT
    TO hidro_smart_readonly
    USING (TRUE);

CREATE POLICY home_device_readonly_select ON home.home_device
    FOR SELECT
    TO hidro_smart_readonly
    USING (TRUE);

CREATE POLICY device_readonly_select ON device.device
    FOR SELECT
    TO hidro_smart_readonly
    USING (TRUE);

CREATE POLICY sensor_reading_readonly_select ON consumption.sensor_reading
    FOR SELECT
    TO hidro_smart_readonly
    USING (TRUE);

CREATE POLICY audit_log_readonly_select ON audit.audit_log
    FOR SELECT
    TO hidro_smart_readonly
    USING (TRUE);
