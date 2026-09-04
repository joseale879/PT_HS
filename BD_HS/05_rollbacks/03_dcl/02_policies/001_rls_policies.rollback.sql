-- ============================================================
-- ROLLBACK: 001_rls_policies.sql
-- ============================================================

DROP POLICY IF EXISTS user_account_self_select_update ON user_account.user_account;
DROP POLICY IF EXISTS user_account_self_update ON user_account.user_account;
ALTER TABLE IF EXISTS user_account.user_account DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_member_select ON home.home;
DROP POLICY IF EXISTS home_owner_update ON home.home;
ALTER TABLE IF EXISTS home.home DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_device_member_select ON home.home_device;
ALTER TABLE IF EXISTS home.home_device DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_member_select ON device.device;
ALTER TABLE IF EXISTS device.device DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sensor_reading_member_select ON consumption.sensor_reading;
ALTER TABLE IF EXISTS consumption.sensor_reading DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_self_select ON audit.audit_log;
ALTER TABLE IF EXISTS audit.audit_log DISABLE ROW LEVEL SECURITY;
