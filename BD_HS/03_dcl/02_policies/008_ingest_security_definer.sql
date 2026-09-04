-- Reemplaza la validacion directa de RLS por una funcion SECURITY DEFINER.
-- Tambien elimina las politicas temporales que exponian todas las filas a ingest.
DROP POLICY IF EXISTS home_device_ingest_select ON home.home_device;
DROP POLICY IF EXISTS device_ingest_select ON device.device;
DROP POLICY IF EXISTS sensor_reading_ingest_insert ON consumption.sensor_reading;

CREATE POLICY sensor_reading_ingest_insert ON consumption.sensor_reading
    FOR INSERT
    TO hidro_smart_ingest
    WITH CHECK (
        device.fn_can_ingest_reading(device_id, home_id)
    );