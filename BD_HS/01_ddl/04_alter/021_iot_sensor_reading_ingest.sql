ALTER TABLE consumption.sensor_reading
  ALTER COLUMN consumption_liters TYPE NUMERIC(14,5);

ALTER TABLE consumption.sensor_reading
  ALTER COLUMN consumption_m3 TYPE NUMERIC(14,8);

ALTER TABLE consumption.sensor_reading
  ADD COLUMN IF NOT EXISTS flow_rate_lpm NUMERIC(10,3) NULL,
  ADD COLUMN IF NOT EXISTS total_liters NUMERIC(14,5) NULL,
  ADD COLUMN IF NOT EXISTS pulses INTEGER NULL CHECK (pulses IS NULL OR pulses >= 0),
  ADD COLUMN IF NOT EXISTS sample_interval_seconds NUMERIC(10,3) NULL CHECK (
    sample_interval_seconds IS NULL OR sample_interval_seconds > 0
  ),
  ADD COLUMN IF NOT EXISTS mqtt_message_id VARCHAR(100) NULL;