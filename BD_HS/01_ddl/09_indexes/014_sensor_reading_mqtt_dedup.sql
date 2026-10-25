CREATE UNIQUE INDEX IF NOT EXISTS uq_sensor_reading_device_mqtt_message
    ON consumption.sensor_reading(device_id, mqtt_message_id)
    WHERE mqtt_message_id IS NOT NULL;
