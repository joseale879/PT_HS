DROP INDEX IF EXISTS home.uq_home_device_one_active_device;
DROP INDEX IF EXISTS consumption.idx_sensor_reading_device_measured_at;

ALTER TABLE consumption.sensor_reading
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_flow_rate,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_total_liters,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_pulses,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_sample_interval,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_wifi_rssi,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_signal_quality,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_battery_level,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_voltage,
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_temperature;

ALTER TABLE consumption.sensor_reading
    DROP COLUMN IF EXISTS measured_at,
    DROP COLUMN IF EXISTS received_at,
    DROP COLUMN IF EXISTS timestamp_suspicious,
    DROP COLUMN IF EXISTS flow_rate_lpm,
    DROP COLUMN IF EXISTS total_liters,
    DROP COLUMN IF EXISTS pulses,
    DROP COLUMN IF EXISTS sample_interval_seconds,
    DROP COLUMN IF EXISTS wifi_rssi_dbm,
    DROP COLUMN IF EXISTS signal_quality,
    DROP COLUMN IF EXISTS battery_level,
    DROP COLUMN IF EXISTS voltage,
    DROP COLUMN IF EXISTS temperature;

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_wifi_rssi_dbm,
    DROP CONSTRAINT IF EXISTS ck_device_voltage_physical,
    DROP CONSTRAINT IF EXISTS ck_device_temperature_physical,
    DROP COLUMN IF EXISTS wifi_rssi_dbm;

ALTER TABLE device.device_telemetry_history
    DROP CONSTRAINT IF EXISTS ck_device_telemetry_wifi_rssi_dbm,
    DROP CONSTRAINT IF EXISTS ck_device_telemetry_voltage_physical,
    DROP CONSTRAINT IF EXISTS ck_device_telemetry_temperature_physical,
    DROP COLUMN IF EXISTS wifi_rssi_dbm;
