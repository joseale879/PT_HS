ALTER TABLE analytics_support.ticket
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE consumption.sensor_reading
    ADD CONSTRAINT fk_sensor_reading_home_device
    FOREIGN KEY (home_id, device_id)
    REFERENCES home.home_device (home_id, device_id)
    NOT VALID;

ALTER TABLE consumption.sensor_reading
    VALIDATE CONSTRAINT fk_sensor_reading_home_device;
