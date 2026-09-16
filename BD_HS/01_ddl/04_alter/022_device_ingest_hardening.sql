-- Endurece la integridad de asignaciones y conserva las metricas de cada lectura IoT.

CREATE UNIQUE INDEX IF NOT EXISTS uq_home_device_one_active_device
    ON home.home_device(device_id)
    WHERE status = 'Active';

ALTER TABLE device.device
    ADD COLUMN IF NOT EXISTS wifi_rssi_dbm INTEGER;

ALTER TABLE device.device_telemetry_history
    ADD COLUMN IF NOT EXISTS wifi_rssi_dbm INTEGER;

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_wifi_rssi_dbm,
    DROP CONSTRAINT IF EXISTS ck_device_voltage_physical,
    DROP CONSTRAINT IF EXISTS ck_device_temperature_physical;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_wifi_rssi_dbm
        CHECK (wifi_rssi_dbm IS NULL OR wifi_rssi_dbm BETWEEN -127 AND 0) NOT VALID,
    ADD CONSTRAINT ck_device_voltage_physical
        CHECK (voltage IS NULL OR voltage BETWEEN 0 AND 60) NOT VALID,
    ADD CONSTRAINT ck_device_temperature_physical
        CHECK (temperature IS NULL OR temperature BETWEEN -55 AND 125) NOT VALID;

ALTER TABLE device.device_telemetry_history
    DROP CONSTRAINT IF EXISTS ck_device_telemetry_wifi_rssi_dbm,
    DROP CONSTRAINT IF EXISTS ck_device_telemetry_voltage_physical,
    DROP CONSTRAINT IF EXISTS ck_device_telemetry_temperature_physical;

ALTER TABLE device.device_telemetry_history
    ADD CONSTRAINT ck_device_telemetry_wifi_rssi_dbm
        CHECK (wifi_rssi_dbm IS NULL OR wifi_rssi_dbm BETWEEN -127 AND 0) NOT VALID,
    ADD CONSTRAINT ck_device_telemetry_voltage_physical
        CHECK (voltage IS NULL OR voltage BETWEEN 0 AND 60) NOT VALID,
    ADD CONSTRAINT ck_device_telemetry_temperature_physical
        CHECK (temperature IS NULL OR temperature BETWEEN -55 AND 125) NOT VALID;

ALTER TABLE consumption.sensor_reading
    ADD COLUMN IF NOT EXISTS measured_at TIMESTAMPTZ(3),
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS timestamp_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS flow_rate_lpm DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS total_liters DECIMAL(14,3),
    ADD COLUMN IF NOT EXISTS pulses INTEGER,
    ADD COLUMN IF NOT EXISTS sample_interval_seconds DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS wifi_rssi_dbm INTEGER,
    ADD COLUMN IF NOT EXISTS signal_quality INTEGER,
    ADD COLUMN IF NOT EXISTS battery_level INTEGER,
    ADD COLUMN IF NOT EXISTS voltage DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS temperature DECIMAL(5,2);

UPDATE consumption.sensor_reading
   SET measured_at = COALESCE(measured_at, recorded_at),
       received_at = COALESCE(received_at, created_at);

ALTER TABLE consumption.sensor_reading
    ALTER COLUMN measured_at SET NOT NULL;

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
    ADD CONSTRAINT ck_sensor_reading_flow_rate
        CHECK (flow_rate_lpm IS NULL OR flow_rate_lpm >= 0) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_total_liters
        CHECK (total_liters IS NULL OR total_liters >= 0) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_pulses
        CHECK (pulses IS NULL OR pulses >= 0) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_sample_interval
        CHECK (sample_interval_seconds IS NULL OR sample_interval_seconds BETWEEN 0.001 AND 3600) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_wifi_rssi
        CHECK (wifi_rssi_dbm IS NULL OR wifi_rssi_dbm BETWEEN -127 AND 0) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_signal_quality
        CHECK (signal_quality IS NULL OR signal_quality BETWEEN 0 AND 100) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_battery_level
        CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_voltage
        CHECK (voltage IS NULL OR voltage BETWEEN 0 AND 60) NOT VALID,
    ADD CONSTRAINT ck_sensor_reading_temperature
        CHECK (temperature IS NULL OR temperature BETWEEN -55 AND 125) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_sensor_reading_device_measured_at
    ON consumption.sensor_reading(device_id, measured_at DESC);

COMMENT ON COLUMN consumption.sensor_reading.measured_at IS
    'Instante informado por el sensor; recorded_at se conserva por compatibilidad.';
COMMENT ON COLUMN consumption.sensor_reading.received_at IS
    'Instante generado por PostgreSQL al recibir la lectura.';
