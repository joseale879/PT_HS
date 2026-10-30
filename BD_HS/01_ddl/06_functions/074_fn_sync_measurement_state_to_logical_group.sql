CREATE OR REPLACE FUNCTION device.fn_record_device_measurement_state(
    p_device_code VARCHAR(100),
    p_measurement_enabled BOOLEAN,
    p_event_at TIMESTAMPTZ
)
RETURNS TABLE(
    device_id UUID,
    measurement_enabled BOOLEAN,
    measurement_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, public, pg_temp
AS $$
DECLARE
    v_event_at TIMESTAMPTZ := COALESCE(p_event_at, now());
    v_group_key VARCHAR(64);
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = '' OR p_measurement_enabled IS NULL THEN
        RAISE EXCEPTION 'El estado de medicion MQTT no cumple el contrato';
    END IF;
    IF v_event_at > now() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'El estado de medicion tiene un timestamp futuro no permitido';
    END IF;

    SELECT gm.group_key INTO v_group_key
      FROM device.logical_device_group_member gm
      JOIN device.device d ON d.device_id = gm.device_id
     WHERE d.code = btrim(p_device_code)
       AND d.status = 'Active';

    RETURN QUERY
    UPDATE device.device d
       SET measurement_enabled = p_measurement_enabled,
           measurement_updated_at = v_event_at,
           updated_at = now()
      FROM (
            SELECT d2.device_id
              FROM device.device d2
             WHERE d2.code = btrim(p_device_code)
               AND d2.status = 'Active'
            UNION
            SELECT gm.device_id
              FROM device.logical_device_group_member gm
              JOIN device.device grouped_device ON grouped_device.device_id = gm.device_id
             WHERE gm.group_key = v_group_key
               AND grouped_device.status = 'Active'
      ) members
     WHERE d.device_id = members.device_id
       AND (d.measurement_updated_at IS NULL OR v_event_at >= d.measurement_updated_at)
    RETURNING d.device_id, d.measurement_enabled, d.measurement_updated_at;
END;
$$;

REVOKE ALL ON FUNCTION device.fn_record_device_measurement_state(VARCHAR, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC;
