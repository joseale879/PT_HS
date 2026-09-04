-- Registration flows that must not depend on RLS visibility of a newly-created row.

CREATE OR REPLACE FUNCTION user_account.fn_assign_default_role(
    p_user_account_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_role_id UUID;
BEGIN
    IF p_user_account_id IS NULL THEN
        RAISE EXCEPTION 'El usuario es obligatorio';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM user_account.user_account ua
        WHERE ua.user_account_id = p_user_account_id
    ) THEN
        RAISE EXCEPTION 'La cuenta de usuario no existe';
    END IF;

    SELECT r.role_id
      INTO v_role_id
      FROM user_account.role r
     WHERE lower(r.name) = 'homeuser'
       AND r.status = 'Active'
     LIMIT 1;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'No existe un rol HomeUser activo';
    END IF;

    INSERT INTO user_account.user_role (user_account_id, role_id)
    VALUES (p_user_account_id, v_role_id)
    ON CONFLICT DO NOTHING;

    RETURN p_user_account_id;
END;
$$;

COMMENT ON FUNCTION user_account.fn_assign_default_role(UUID) IS
'Asigna exclusivamente el rol HomeUser activo a una cuenta recién registrada.';

CREATE OR REPLACE FUNCTION user_account.fn_register_user(
    p_username VARCHAR(100),
    p_email VARCHAR(150)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_account_id UUID;
    v_username VARCHAR(100) := lower(btrim(p_username));
    v_email VARCHAR(150) := lower(btrim(p_email));
BEGIN
    IF v_username IS NULL OR char_length(v_username) < 4 THEN
        RAISE EXCEPTION 'El nombre de usuario debe tener al menos 4 caracteres';
    END IF;

    IF v_email IS NULL OR v_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
        RAISE EXCEPTION 'El correo electronico no tiene un formato valido';
    END IF;

    INSERT INTO user_account.user_account (username, email)
    VALUES (v_username, v_email)
    RETURNING user_account_id INTO v_user_account_id;

    PERFORM user_account.fn_assign_default_role(v_user_account_id);
    RETURN v_user_account_id;
END;
$$;

COMMENT ON FUNCTION user_account.fn_register_user(VARCHAR, VARCHAR) IS
'Registra una cuenta, asigna HomeUser y devuelve su UUID sin exigir app.user_id durante el alta.';

CREATE OR REPLACE FUNCTION device.fn_register_device(
    p_code VARCHAR(100),
    p_name VARCHAR(100),
    p_type VARCHAR(50),
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
        manufacturer,
        model,
        umbral_alerta
    )
    VALUES (
        btrim(p_code),
        btrim(p_name),
        btrim(p_type),
        NULLIF(btrim(p_manufacturer), ''),
        NULLIF(btrim(p_model), ''),
        p_umbral_alerta
    )
    RETURNING device_id INTO v_device_id;

    RETURN v_device_id;
END;
$$;

COMMENT ON FUNCTION device.fn_register_device(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) IS
'Registra un dispositivo y devuelve su UUID sin depender de la politica SELECT de un dispositivo aun no vinculado a un hogar.';