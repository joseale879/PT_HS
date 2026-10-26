-- Persiste el estado reportado por el ESP32 y cierra el comando asociado.

CREATE OR REPLACE FUNCTION device.fn_record_actuator_status(
    p_device_code VARCHAR(100),
    p_actuator VARCHAR(20),
    p_status VARCHAR(20),
    p_correlation_id UUID DEFAULT NULL,
    p_reported_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
    device_id UUID,
    home_id UUID,
    actuator VARCHAR(20),
    status VARCHAR(20),
    command_id UUID,
    command_status VARCHAR(20),
    reported_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, home, user_account, public, pg_temp
AS $$
DECLARE
    v_device_id UUID;
    v_home_id UUID;
    v_actuator VARCHAR(20) := upper(btrim(p_actuator));
    v_status VARCHAR(20) := upper(btrim(p_status));
    v_reported_at TIMESTAMPTZ := COALESCE(p_reported_at, now());
    v_command_id UUID;
    v_command_status VARCHAR(20);
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = ''
       OR v_actuator NOT IN ('VALVE', 'PUMP') THEN
        RAISE EXCEPTION 'El estado de actuador no cumple el contrato';
    END IF;

    IF (v_actuator = 'VALVE' AND v_status NOT IN ('OPEN', 'CLOSED'))
       OR (v_actuator = 'PUMP' AND v_status NOT IN ('ON', 'OFF')) THEN
        RAISE EXCEPTION 'El estado no es válido para el actuador';
    END IF;

    IF v_reported_at > now() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'El estado de actuador tiene un timestamp futuro no permitido';
    END IF;

    SELECT d.device_id, hd.home_id
      INTO v_device_id, v_home_id
      FROM device.device d
      JOIN home.home_device hd ON hd.device_id = d.device_id
     WHERE d.code = btrim(p_device_code)
       AND hd.status = 'Active'
     ORDER BY hd.installed_at DESC
     LIMIT 1;

    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'El dispositivo no está vinculado a un hogar activo';
    END IF;

    INSERT INTO device.actuator_state
        (device_id, home_id, actuator, status, last_reported_at, updated_at)
    VALUES
        (v_device_id, v_home_id, v_actuator, v_status, v_reported_at, now())
    ON CONFLICT (device_id, actuator) DO UPDATE
       SET home_id = EXCLUDED.home_id,
           status = EXCLUDED.status,
           last_reported_at = EXCLUDED.last_reported_at,
           updated_at = now()
     WHERE device.actuator_state.last_reported_at <= EXCLUDED.last_reported_at;

    IF p_correlation_id IS NOT NULL THEN
        SELECT ac.command_id
          INTO v_command_id
          FROM device.actuator_command ac
         WHERE ac.device_id = v_device_id
           AND ac.actuator = v_actuator
           AND ac.correlation_id = p_correlation_id
         LIMIT 1;

        IF v_command_id IS NOT NULL THEN
            UPDATE device.actuator_command
               SET status = CASE
                                WHEN status IN ('Pending', 'Published') THEN 'Acknowledged'
                                ELSE status
                            END,
                   acknowledged_at = CASE
                                        WHEN status IN ('Pending', 'Published')
                                          THEN COALESCE(acknowledged_at, v_reported_at)
                                        ELSE acknowledged_at
                                    END,
                   completed_at = CASE
                                    WHEN status IN ('Pending', 'Published')
                                      THEN COALESCE(completed_at, v_reported_at)
                                    ELSE completed_at
                                  END
             WHERE command_id = v_command_id;
        END IF;
    END IF;

    IF v_command_id IS NOT NULL THEN
        SELECT ac.status INTO v_command_status
          FROM device.actuator_command ac
         WHERE ac.command_id = v_command_id;
    END IF;

    RETURN QUERY
    SELECT v_device_id, v_home_id, v_actuator, v_status,
           v_command_id, v_command_status, v_reported_at;
END;
$$;

REVOKE ALL ON FUNCTION device.fn_record_actuator_status(VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMPTZ) FROM PUBLIC;
