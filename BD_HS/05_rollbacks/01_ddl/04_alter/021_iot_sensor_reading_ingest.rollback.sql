-- No existen vistas dependientes de mqtt_message_id; el rollback es directo.
DROP INDEX IF EXISTS consumption.uq_sensor_reading_mqtt_message;
ALTER TABLE consumption.sensor_reading
    DROP CONSTRAINT IF EXISTS ck_sensor_reading_mqtt_message_id;
ALTER TABLE consumption.sensor_reading
    DROP COLUMN IF EXISTS mqtt_message_id;
