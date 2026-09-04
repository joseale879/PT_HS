DROP POLICY IF EXISTS sensor_reading_ingest_insert ON consumption.sensor_reading;

CREATE POLICY sensor_reading_ingest_insert ON consumption.sensor_reading
    FOR INSERT TO hidro_smart_ingest
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM home.home_device hd
            JOIN device.device d ON d.device_id = hd.device_id
            WHERE hd.home_id = sensor_reading.home_id
              AND hd.device_id = sensor_reading.device_id
              AND hd.status = 'Active'
              AND d.status = 'Active'
        )
    );