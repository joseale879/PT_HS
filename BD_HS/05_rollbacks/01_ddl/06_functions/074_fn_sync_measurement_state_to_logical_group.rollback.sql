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
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = '' OR p_measurement_enabled IS NULL THEN
        RAISE EXCEPTION 'El estado de medicion MQTT no cumple el contrato';
    END IF;
    IF v_event_at > now() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'El estado de medicion tiene un timestamp futuro no permitido';
    END IF;

    RETURN QUERY
    UPDATE device.device d
       SET measurement_enabled = p_measurement_enabled,
           measurement_updated_at = v_event_at,
           updated_at = now()
     WHERE d.code = btrim(p_device_code)
       AND d.status = 'Active'
       AND (d.measurement_updated_at IS NULL OR v_event_at >= d.measurement_updated_at)
    RETURNING d.device_id, d.measurement_enabled, d.measurement_updated_at;
END;
$$;

REVOKE ALL ON FUNCTION device.fn_record_device_measurement_state(VARCHAR, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC;
