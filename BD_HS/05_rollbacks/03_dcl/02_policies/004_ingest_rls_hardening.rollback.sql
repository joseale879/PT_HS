DROP POLICY IF EXISTS sensor_reading_ingest_insert ON consumption.sensor_reading;
CREATE POLICY sensor_reading_ingest_insert ON consumption.sensor_reading FOR INSERT TO hidro_smart_ingest WITH CHECK (TRUE);
