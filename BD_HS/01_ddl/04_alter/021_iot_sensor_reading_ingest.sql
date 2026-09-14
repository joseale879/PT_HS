-- Idempotencia de lecturas IoT.
-- Esta migracion no crea vistas materializadas; cada vista se crea una sola vez
-- en 01_ddl/05_materialized_views.
ALTER TABLE consumption.sensor_reading
    ADD COLUMN IF NOT EXISTS mqtt_message_id VARCHAR(100) NULL;

ALTER TABLE consumption.sensor_reading
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_mqtt_message_id;

ALTER TABLE consumption.sensor_reading
    ADD CONSTRAINT ck_sensor_reading_mqtt_message_id
    CHECK (mqtt_message_id IS NULL OR btrim(mqtt_message_id) <> '');

CREATE UNIQUE INDEX IF NOT EXISTS uq_sensor_reading_mqtt_message
    ON consumption.sensor_reading(device_id, mqtt_message_id)
    WHERE mqtt_message_id IS NOT NULL;
