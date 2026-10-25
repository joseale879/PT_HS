CREATE OR REPLACE FUNCTION device.fn_ingest_sensor_reading(
    p_device_code VARCHAR(100),
    p_mqtt_message_id VARCHAR(100),
    p_consumption_liters NUMERIC,
    p_recorded_at TIMESTAMPTZ
)
RETURNS TABLE(inserted BOOLEAN, reading_id UUID, home_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, home, consumption, public, pg_temp
AS $$
DECLARE
    v_device_id UUID;
    v_home_id UUID;
    v_reading_id UUID;
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = ''
       OR p_consumption_liters IS NULL OR p_consumption_liters < 0
       OR p_recorded_at IS NULL THEN
        RAISE EXCEPTION 'La lectura IoT no cumple el contrato minimo';
    END IF;

    SELECT d.device_id, hd.home_id INTO v_device_id, v_home_id
      FROM device.device d
      JOIN home.home_device hd ON hd.device_id = d.device_id
     WHERE d.code = btrim(p_device_code)
       AND d.status = 'Active'
       AND hd.status = 'Active'
     ORDER BY hd.installed_at DESC
     LIMIT 1;
    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'El dispositivo no esta vinculado a un hogar activo';
    END IF;

    INSERT INTO consumption.sensor_reading AS sr
        (device_id, home_id, recorded_at, consumption_liters, mqtt_message_id)
    VALUES
        (v_device_id, v_home_id, p_recorded_at, p_consumption_liters, NULLIF(btrim(p_mqtt_message_id), ''))
    ON CONFLICT (device_id, mqtt_message_id) WHERE mqtt_message_id IS NOT NULL DO NOTHING
    RETURNING sr.reading_id INTO v_reading_id;

    RETURN QUERY SELECT v_reading_id IS NOT NULL, v_reading_id, v_home_id;
END;
$$;
