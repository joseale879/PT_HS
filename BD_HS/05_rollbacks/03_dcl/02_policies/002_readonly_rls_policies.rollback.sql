DROP POLICY IF EXISTS user_account_readonly_select ON user_account.user_account;
DROP POLICY IF EXISTS home_readonly_select ON home.home;
DROP POLICY IF EXISTS home_device_readonly_select ON home.home_device;
DROP POLICY IF EXISTS device_readonly_select ON device.device;
DROP POLICY IF EXISTS sensor_reading_readonly_select ON consumption.sensor_reading;
DROP POLICY IF EXISTS audit_log_readonly_select ON audit.audit_log;
