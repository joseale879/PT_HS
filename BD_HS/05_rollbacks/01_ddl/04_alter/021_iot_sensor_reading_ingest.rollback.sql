ALTER TABLE consumption.sensor_reading
    DROP COLUMN IF EXISTS mqtt_message_id,
    DROP COLUMN IF EXISTS sample_interval_seconds,
    DROP COLUMN IF EXISTS pulses,
    DROP COLUMN IF EXISTS total_liters,
    DROP COLUMN IF EXISTS flow_rate_lpm;

ALTER TABLE consumption.sensor_reading
    DROP COLUMN consumption_m3;

ALTER TABLE consumption.sensor_reading
    ALTER COLUMN consumption_liters TYPE NUMERIC(10,2);

ALTER TABLE consumption.sensor_reading
    ADD COLUMN consumption_m3 NUMERIC(10,4)
      GENERATED ALWAYS AS ((consumption_liters / 1000::numeric)) STORED;
