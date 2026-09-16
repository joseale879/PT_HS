-- Registro con ubicación visible y vinculación segura por código técnico.

CREATE OR REPLACE FUNCTION device.fn_register_device_with_location(
    p_code VARCHAR(100),
    p_name VARCHAR(100),
    p_type VARCHAR(50),
    p_location VARCHAR(120) DEFAULT NULL,
    p_manufacturer VARCHAR(100) DEFAULT NULL,
    p_model VARCHAR(100) DEFAULT NULL,
    p_umbral_alerta DECIMAL(10,4) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = device, user_account, public, pg_temp
AS $$
DECLARE
    v_device_id UUID;
BEGIN
    IF NOT user_account.fn_app_has_permission('devices.manage') THEN
        RAISE EXCEPTION 'La cuenta no tiene permiso para registrar dispositivos';
    END IF;

    IF p_code IS NULL OR btrim(p_code) = ''
       OR p_name IS NULL OR btrim(p_name) = ''
       OR p_type IS NULL OR btrim(p_type) = '' THEN
        RAISE EXCEPTION 'Codigo, nombre y tipo son obligatorios';
    END IF;

    INSERT INTO device.device (
        code,
        name,
        type,
        location,
        manufacturer,
        model,
        umbral_alerta
    )
    VALUES (
        btrim(p_code),
        btrim(p_name),
        btrim(p_type),
        NULLIF(btrim(p_location), ''),
        NULLIF(btrim(p_manufacturer), ''),
        NULLIF(btrim(p_model), ''),
        p_umbral_alerta
    )
    RETURNING device_id INTO v_device_id;

    RETURN v_device_id;
END;
$$;

COMMENT ON FUNCTION device.fn_register_device_with_location(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) IS
'Registra un dispositivo IoT con ubicación visible y devuelve su UUID.';

CREATE OR REPLACE FUNCTION device.fn_link_device_to_home(
    p_code VARCHAR(100),
    p_home_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = device, home, user_account, public, pg_temp
AS $$
DECLARE
    v_device_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := user_account.fn_app_current_user_id();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'El usuario autenticado es obligatorio';
    END IF;

    IF NOT user_account.fn_app_has_permission('devices.manage')
       OR NOT home.fn_is_home_owner(p_home_id, v_user_id) THEN
        RAISE EXCEPTION 'La cuenta no puede vincular dispositivos a este hogar'
            USING ERRCODE = '42501';
    END IF;

    SELECT d.device_id
      INTO v_device_id
      FROM device.device d
     WHERE d.code = btrim(p_code)
       AND d.status = 'Active'
     LIMIT 1;

    IF v_device_id IS NULL THEN
        RETURN NULL;
    END IF;

    INSERT INTO home.home_device (home_id, device_id, status, suspended_at)
    VALUES (p_home_id, v_device_id, 'Active', NULL)
    ON CONFLICT (home_id, device_id)
    DO UPDATE SET status = 'Active', suspended_at = NULL;

    RETURN v_device_id;
END;
$$;

COMMENT ON FUNCTION device.fn_link_device_to_home(VARCHAR, UUID) IS
'Vincula un dispositivo activo existente a un hogar cuyo titular tiene permisos de gestión.';
