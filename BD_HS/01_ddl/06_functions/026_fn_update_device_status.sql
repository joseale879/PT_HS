CREATE OR REPLACE FUNCTION device.fn_update_device_status(
    p_device_id UUID,
    p_status VARCHAR(20),
    p_reason VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    device_id UUID,
    code VARCHAR(100),
    name VARCHAR(100),
    type VARCHAR(50),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    umbral_alerta DECIMAL(10,4),
    status VARCHAR(20),
    firmware_version VARCHAR(20),
    last_connection_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = device, home, user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID := user_account.fn_app_current_user_id();
    v_previous_status VARCHAR(20);
BEGIN
    IF NOT user_account.fn_app_has_permission('devices.manage')
       OR NOT device.fn_can_manage_device(p_device_id, v_user_id) THEN
        RAISE EXCEPTION 'La cuenta no puede gestionar este dispositivo';
    END IF;
    IF p_status NOT IN ('Active', 'Suspended', 'Low') THEN
        RAISE EXCEPTION 'El estado del dispositivo no es válido';
    END IF;
    IF p_status = 'Suspended' AND (p_reason IS NULL OR btrim(p_reason) = '') THEN
        RAISE EXCEPTION 'La suspensión requiere un motivo';
    END IF;

    SELECT d.status INTO v_previous_status
      FROM device.device d
     WHERE d.device_id = p_device_id;
    IF NOT FOUND THEN RETURN; END IF;

    UPDATE device.device d
       SET status = p_status,
           suspension_reason = CASE WHEN p_status = 'Suspended' THEN NULLIF(btrim(p_reason), '') ELSE NULL END,
           updated_at = now()
     WHERE d.device_id = p_device_id
     RETURNING d.device_id, d.code, d.name, d.type, d.manufacturer, d.model,
               d.umbral_alerta, d.status, d.firmware_version, d.last_connection_at
      INTO device_id, code, name, type, manufacturer, model, umbral_alerta,
           status, firmware_version, last_connection_at;

    INSERT INTO device.device_history
        (device_id, previous_status, new_status, reason, registered_by)
    VALUES
        (p_device_id, v_previous_status, p_status, NULLIF(btrim(p_reason), ''), v_user_id);

    RETURN NEXT;
END;
$$;
