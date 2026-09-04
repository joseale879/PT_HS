ALTER TABLE IF EXISTS home.home_device DROP CONSTRAINT IF EXISTS fk_home_device_device;
ALTER TABLE IF EXISTS device.calibration_history DROP CONSTRAINT IF EXISTS fk_calibration_performed_by;
ALTER TABLE IF EXISTS device.device_history DROP CONSTRAINT IF EXISTS fk_device_history_registered_by;
