-- Asocia una placa física a un dispositivo lógico ya registrado.
-- La contraseña Wi-Fi nunca participa en esta operación.
CREATE OR REPLACE FUNCTION device.fn_claim_provisioned_device(
    p_device_id UUID,
    p_hardware_id VARCHAR(32)
)
RETURNS TABLE(
    device_id UUID,
    code VARCHAR(100),
    name VARCHAR(100),
    type VARCHAR(50),
    location VARCHAR(120),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    umbral_alerta DECIMAL(10,4),
    status VARCHAR(20),
    hardware_id VARCHAR(32),
    provisioning_status VARCHAR(24),
    provisioning_error VARCHAR(255),
    provisioning_updated_at TIMESTAMPTZ,
    provisioned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = device, home, user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_hardware_id VARCHAR(32);
    v_existing_device UUID;
BEGIN
    v_user_id := user_account.fn_app_current_user_id();
    v_hardware_id := NULLIF(btrim(p_hardware_id), '');

    IF v_user_id IS NULL
       OR NOT user_account.fn_app_has_permission('devices.manage')
       OR NOT device.fn_can_manage_device(p_device_id, v_user_id) THEN
        RAISE EXCEPTION 'La cuenta no puede asociar hardware a este dispositivo'
            USING ERRCODE = '42501';
    END IF;

    IF v_hardware_id IS NULL OR v_hardware_id !~ '^[A-Za-z0-9_-]{3,32}$' THEN
        RAISE EXCEPTION 'hardwareId debe tener entre 3 y 32 caracteres seguros';
    END IF;

    SELECT d.device_id
      INTO v_existing_device
      FROM device.device d
     WHERE d.hardware_id = v_hardware_id
       AND d.device_id <> p_device_id
     LIMIT 1;

    IF v_existing_device IS NOT NULL THEN
        RAISE EXCEPTION 'El hardware ya esta asociado a otro dispositivo'
            USING ERRCODE = '23505';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM device.device d WHERE d.device_id = p_device_id
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    UPDATE device.device d
       SET hardware_id = v_hardware_id,
           provisioning_status = CASE
               WHEN d.hardware_id IS DISTINCT FROM v_hardware_id THEN 'BLE_READY'
               ELSE d.provisioning_status
           END,
           provisioning_error = NULL,
           provisioning_updated_at = now(),
           updated_at = now()
     WHERE d.device_id = p_device_id
     RETURNING d.device_id, d.code, d.name, d.type, d.location, d.manufacturer,
               d.model, d.umbral_alerta, d.status, d.hardware_id,
               d.provisioning_status, d.provisioning_error,
               d.provisioning_updated_at, d.provisioned_at;
END;
$$;

COMMENT ON FUNCTION device.fn_claim_provisioned_device(UUID, VARCHAR) IS
'Asocia de forma autorizada un hardwareId físico único con un dispositivo lógico.';
