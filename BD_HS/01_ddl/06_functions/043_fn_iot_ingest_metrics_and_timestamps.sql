-- Ingesta IoT completa: metricas, medicion/recepcion, tolerancia temporal y asignacion no ambigua.

CREATE OR REPLACE FUNCTION device.fn_ingest_sensor_reading(
    p_device_code VARCHAR(100),
    p_mqtt_message_id VARCHAR(100),
    p_consumption_liters NUMERIC,
    p_recorded_at TIMESTAMPTZ,
    p_flow_rate_lpm NUMERIC,
    p_total_liters NUMERIC,
    p_pulses INTEGER,
    p_sample_interval_seconds NUMERIC,
    p_wifi_rssi_dbm INTEGER,
    p_signal_quality INTEGER,
    p_battery_level INTEGER,
    p_voltage NUMERIC,
    p_temperature NUMERIC
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
    v_active_assignments INTEGER;
    v_timestamp_suspicious BOOLEAN;
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = ''
       OR p_consumption_liters IS NULL OR p_consumption_liters < 0
       OR p_recorded_at IS NULL THEN
        RAISE EXCEPTION 'La lectura IoT no cumple el contrato minimo';
    END IF;

    IF p_recorded_at > now() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'La lectura IoT tiene un timestamp futuro no permitido';
    END IF;

    IF p_pulses IS NOT NULL AND p_pulses < 0
       OR p_sample_interval_seconds IS NOT NULL
          AND (p_sample_interval_seconds < 0.001 OR p_sample_interval_seconds > 3600)
       OR p_wifi_rssi_dbm IS NOT NULL AND p_wifi_rssi_dbm NOT BETWEEN -127 AND 0
       OR p_signal_quality IS NOT NULL AND p_signal_quality NOT BETWEEN 0 AND 100
       OR p_battery_level IS NOT NULL AND p_battery_level NOT BETWEEN 0 AND 100
       OR p_voltage IS NOT NULL AND p_voltage NOT BETWEEN 0 AND 60
       OR p_temperature IS NOT NULL AND p_temperature NOT BETWEEN -55 AND 125 THEN
        RAISE EXCEPTION 'Las metricas IoT estan fuera de rango';
    END IF;

    SELECT count(*) INTO v_active_assignments
      FROM device.device d
      JOIN home.home_device hd ON hd.device_id = d.device_id
     WHERE d.code = btrim(p_device_code)
       AND d.status = 'Active'
       AND hd.status = 'Active';

    IF v_active_assignments = 0 THEN
        RAISE EXCEPTION 'El dispositivo no esta vinculado a un hogar activo';
    END IF;
    IF v_active_assignments > 1 THEN
        RAISE EXCEPTION 'El dispositivo tiene asignaciones activas ambiguas';
    END IF;

    SELECT d.device_id, hd.home_id INTO v_device_id, v_home_id
      FROM device.device d
      JOIN home.home_device hd ON hd.device_id = d.device_id
     WHERE d.code = btrim(p_device_code)
       AND d.status = 'Active'
       AND hd.status = 'Active';

    v_timestamp_suspicious := p_recorded_at < now() - INTERVAL '90 days';

    INSERT INTO consumption.sensor_reading AS sr
        (device_id, home_id, recorded_at, measured_at, received_at,
         timestamp_suspicious, consumption_liters, mqtt_message_id,
         flow_rate_lpm, total_liters, pulses, sample_interval_seconds,
         wifi_rssi_dbm, signal_quality, battery_level, voltage, temperature)
    VALUES
        (v_device_id, v_home_id, p_recorded_at, p_recorded_at, now(),
         v_timestamp_suspicious, p_consumption_liters,
         NULLIF(btrim(p_mqtt_message_id), ''), p_flow_rate_lpm, p_total_liters,
         p_pulses, p_sample_interval_seconds, p_wifi_rssi_dbm, p_signal_quality,
         p_battery_level, p_voltage, p_temperature)
    ON CONFLICT (device_id, mqtt_message_id) WHERE mqtt_message_id IS NOT NULL DO NOTHING
    RETURNING sr.reading_id INTO v_reading_id;

    RETURN QUERY SELECT v_reading_id IS NOT NULL, v_reading_id, v_home_id;
END;
$$;

CREATE OR REPLACE FUNCTION device.fn_ingest_sensor_reading(
    p_device_code VARCHAR(100),
    p_mqtt_message_id VARCHAR(100),
    p_consumption_liters NUMERIC,
    p_recorded_at TIMESTAMPTZ
)
RETURNS TABLE(inserted BOOLEAN, reading_id UUID, home_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, device, home, consumption, public, pg_temp
AS $$
    SELECT * FROM device.fn_ingest_sensor_reading(
        p_device_code, p_mqtt_message_id, p_consumption_liters, p_recorded_at,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    );
$$;

REVOKE ALL ON FUNCTION device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ, NUMERIC, NUMERIC, INTEGER, NUMERIC, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC) FROM PUBLIC;
