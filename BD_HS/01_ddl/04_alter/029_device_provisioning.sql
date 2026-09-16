-- Identidad física y estado de provisionamiento del ESP32.
-- No se almacenan SSID ni contraseñas Wi-Fi.

ALTER TABLE device.device
    ADD COLUMN IF NOT EXISTS hardware_id VARCHAR(32) NULL,
    ADD COLUMN IF NOT EXISTS provisioning_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS provisioning_error VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS provisioning_updated_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ NULL;

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_hardware_id,
    DROP CONSTRAINT IF EXISTS ck_device_provisioning_status;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_hardware_id
        CHECK (hardware_id IS NULL OR hardware_id ~ '^[A-Za-z0-9_-]{3,32}$'),
    ADD CONSTRAINT ck_device_provisioning_status
        CHECK (provisioning_status IN ('PENDING', 'BLE_READY', 'WIFI_CONNECTED', 'MQTT_CONNECTED', 'COMPLETE', 'FAILED'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_device_hardware_id
    ON device.device(hardware_id)
    WHERE hardware_id IS NOT NULL;

-- Registro explícito del hardwareId generado por el ESP32.
CREATE OR REPLACE FUNCTION device.fn_register_device_with_provisioning(
    p_code VARCHAR(100),
    p_name VARCHAR(100),
    p_type VARCHAR(50),
    p_hardware_id VARCHAR(32),
    p_location VARCHAR(120),
    p_manufacturer VARCHAR(100),
    p_model VARCHAR(100),
    p_umbral_alerta DECIMAL(10,4)
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

    IF p_hardware_id IS NOT NULL
       AND btrim(p_hardware_id) !~ '^[A-Za-z0-9_-]{3,32}$' THEN
        RAISE EXCEPTION 'hardwareId debe tener entre 3 y 32 caracteres seguros';
    END IF;

    INSERT INTO device.device (
        code,
        name,
        type,
        hardware_id,
        location,
        manufacturer,
        model,
        umbral_alerta
    )
    VALUES (
        btrim(p_code),
        btrim(p_name),
        btrim(p_type),
        NULLIF(btrim(p_hardware_id), ''),
        NULLIF(btrim(p_location), ''),
        NULLIF(btrim(p_manufacturer), ''),
        NULLIF(btrim(p_model), ''),
        p_umbral_alerta
    )
    RETURNING device_id INTO v_device_id;

    RETURN v_device_id;
END;
$$;

COMMENT ON FUNCTION device.fn_register_device_with_provisioning(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) IS
'Registra un dispositivo IoT con hardwareId y ubicación sin almacenar credenciales Wi-Fi.';

-- Actualización autorizada desde la pantalla/app de provisionamiento.
CREATE OR REPLACE FUNCTION device.fn_update_device_provisioning(
    p_device_id UUID,
    p_hardware_id VARCHAR(32) DEFAULT NULL,
    p_provisioning_status VARCHAR(24) DEFAULT NULL,
    p_provisioning_error VARCHAR(255) DEFAULT NULL
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
SET search_path = device, user_account, home, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_status VARCHAR(24);
BEGIN
    v_user_id := user_account.fn_app_current_user_id();
    v_status := NULLIF(upper(btrim(p_provisioning_status)), '');

    IF v_user_id IS NULL OR NOT user_account.fn_app_has_permission('devices.manage')
       OR NOT device.fn_can_manage_device(p_device_id, v_user_id) THEN
        RAISE EXCEPTION 'La cuenta no puede modificar el provisionamiento de este dispositivo'
            USING ERRCODE = '42501';
    END IF;

    IF v_status IS NULL OR v_status NOT IN ('PENDING', 'BLE_READY', 'WIFI_CONNECTED', 'MQTT_CONNECTED', 'COMPLETE', 'FAILED') THEN
        RAISE EXCEPTION 'provisioningStatus no es valido';
    END IF;

    IF p_hardware_id IS NOT NULL
       AND NULLIF(btrim(p_hardware_id), '') IS NOT NULL
       AND btrim(p_hardware_id) !~ '^[A-Za-z0-9_-]{3,32}$' THEN
        RAISE EXCEPTION 'hardwareId debe tener entre 3 y 32 caracteres seguros';
    END IF;

    RETURN QUERY
    UPDATE device.device d
       SET hardware_id = COALESCE(NULLIF(btrim(p_hardware_id), ''), d.hardware_id),
           provisioning_status = v_status,
           provisioning_error = CASE WHEN v_status = 'FAILED' THEN NULLIF(btrim(p_provisioning_error), '') ELSE NULL END,
           provisioning_updated_at = now(),
           provisioned_at = CASE WHEN v_status = 'COMPLETE' THEN COALESCE(d.provisioned_at, now()) ELSE d.provisioned_at END,
           updated_at = now()
     WHERE d.device_id = p_device_id
     RETURNING d.device_id, d.code, d.name, d.type, d.location, d.manufacturer,
               d.model, d.umbral_alerta, d.status, d.hardware_id, d.provisioning_status,
               d.provisioning_error, d.provisioning_updated_at, d.provisioned_at;
END;
$$;

-- Consumido por el backend para que el ONLINE retenido del ESP32 deje su
-- identidad física y el estado de provisionamiento en la misma fila.
CREATE OR REPLACE FUNCTION device.fn_record_device_status(
    p_device_code VARCHAR(100),
    p_connectivity_status VARCHAR(20),
    p_event_at TIMESTAMPTZ,
    p_firmware_version VARCHAR(20),
    p_wifi_rssi_dbm INTEGER,
    p_signal_quality INTEGER,
    p_battery_level INTEGER,
    p_last_ip VARCHAR(45),
    p_hardware_id VARCHAR(32),
    p_provisioning_status VARCHAR(24)
)
RETURNS TABLE(
    device_id UUID,
    code VARCHAR(100),
    administrative_status VARCHAR(20),
    connectivity_status VARCHAR(20),
    last_connection_at TIMESTAMPTZ,
    hardware_id VARCHAR(32),
    provisioning_status VARCHAR(24),
    provisioning_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, home, user_account, public, pg_temp
AS $$
DECLARE
    v_event_at TIMESTAMPTZ := COALESCE(p_event_at, now());
    v_provisioning_status VARCHAR(24) := NULLIF(upper(btrim(p_provisioning_status)), '');
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = ''
       OR p_connectivity_status NOT IN ('ONLINE', 'OFFLINE', 'ERROR') THEN
        RAISE EXCEPTION 'El estado MQTT no cumple el contrato';
    END IF;
    IF v_event_at > now() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'El estado MQTT tiene un timestamp futuro no permitido';
    END IF;
    IF v_provisioning_status IS NOT NULL
       AND v_provisioning_status NOT IN ('PENDING', 'BLE_READY', 'WIFI_CONNECTED', 'MQTT_CONNECTED', 'COMPLETE', 'FAILED') THEN
        RAISE EXCEPTION 'El estado de provisionamiento no cumple el contrato';
    END IF;
    IF p_hardware_id IS NOT NULL
       AND NULLIF(btrim(p_hardware_id), '') IS NOT NULL
       AND btrim(p_hardware_id) !~ '^[A-Za-z0-9_-]{3,32}$' THEN
        RAISE EXCEPTION 'hardwareId no cumple el contrato';
    END IF;
    IF p_wifi_rssi_dbm IS NOT NULL AND p_wifi_rssi_dbm NOT BETWEEN -127 AND 0
       OR p_signal_quality IS NOT NULL AND p_signal_quality NOT BETWEEN 0 AND 100
       OR p_battery_level IS NOT NULL AND p_battery_level NOT BETWEEN 0 AND 100 THEN
        RAISE EXCEPTION 'Las metricas de conectividad estan fuera de rango';
    END IF;

    RETURN QUERY
    UPDATE device.device d
       SET connectivity_status = CASE WHEN p_connectivity_status = 'ONLINE' THEN 'ONLINE'
                                       WHEN p_connectivity_status = 'ERROR' THEN 'DEGRADED'
                                       ELSE 'OFFLINE' END,
           last_connection_at = CASE WHEN p_connectivity_status = 'ONLINE' THEN v_event_at ELSE d.last_connection_at END,
           firmware_version = COALESCE(NULLIF(btrim(p_firmware_version), ''), d.firmware_version),
           wifi_rssi_dbm = COALESCE(p_wifi_rssi_dbm, d.wifi_rssi_dbm),
           signal_quality = COALESCE(p_signal_quality, d.signal_quality),
           battery_level = COALESCE(p_battery_level, d.battery_level),
           last_ip = COALESCE(NULLIF(btrim(p_last_ip), ''), d.last_ip),
           hardware_id = COALESCE(NULLIF(btrim(p_hardware_id), ''), d.hardware_id),
           provisioning_status = COALESCE(
               v_provisioning_status,
               CASE WHEN p_connectivity_status = 'ONLINE' AND d.provisioning_status = 'PENDING'
                    THEN 'MQTT_CONNECTED' ELSE d.provisioning_status END
           ),
           provisioning_updated_at = CASE
               WHEN v_provisioning_status IS NOT NULL
                    OR NULLIF(btrim(p_hardware_id), '') IS NOT NULL
                    OR p_connectivity_status = 'ONLINE' THEN now()
               ELSE d.provisioning_updated_at END,
           provisioned_at = CASE WHEN v_provisioning_status = 'COMPLETE'
                                 THEN COALESCE(d.provisioned_at, now()) ELSE d.provisioned_at END,
           updated_at = now()
     WHERE d.code = btrim(p_device_code)
     RETURNING d.device_id, d.code, d.status, d.connectivity_status,
               d.last_connection_at, d.hardware_id, d.provisioning_status,
               d.provisioning_updated_at;

    IF FOUND THEN
        INSERT INTO device.device_telemetry_history
            (device_id, recorded_at, wifi_rssi_dbm, signal_quality, battery_level)
        SELECT d2.device_id, now(), p_wifi_rssi_dbm, p_signal_quality, p_battery_level
          FROM device.device d2
         WHERE d2.code = btrim(p_device_code);
    END IF;
END;
$$;

-- Variante de ingesta para el payload nuevo del firmware. Reutiliza todas las
-- validaciones/idempotencia existentes y solo agrega la identidad del hardware.
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
    p_temperature NUMERIC,
    p_hardware_id VARCHAR(32)
)
RETURNS TABLE(inserted BOOLEAN, reading_id UUID, home_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, home, consumption, public, pg_temp
AS $$
DECLARE
    v_inserted BOOLEAN;
    v_reading_id UUID;
    v_home_id UUID;
BEGIN
    IF p_hardware_id IS NOT NULL
       AND NULLIF(btrim(p_hardware_id), '') IS NOT NULL
       AND btrim(p_hardware_id) !~ '^[A-Za-z0-9_-]{3,32}$' THEN
        RAISE EXCEPTION 'hardwareId no cumple el contrato';
    END IF;

    SELECT r.inserted, r.reading_id, r.home_id
      INTO v_inserted, v_reading_id, v_home_id
      FROM device.fn_ingest_sensor_reading(
          p_device_code, p_mqtt_message_id, p_consumption_liters, p_recorded_at,
          p_flow_rate_lpm, p_total_liters, p_pulses, p_sample_interval_seconds,
          p_wifi_rssi_dbm, p_signal_quality, p_battery_level, p_voltage, p_temperature
      ) r;

    UPDATE device.device d
       SET hardware_id = COALESCE(NULLIF(btrim(p_hardware_id), ''), d.hardware_id),
           provisioning_status = CASE WHEN d.provisioning_status = 'PENDING' THEN 'MQTT_CONNECTED' ELSE d.provisioning_status END,
           provisioning_updated_at = CASE WHEN NULLIF(btrim(p_hardware_id), '') IS NOT NULL THEN now() ELSE d.provisioning_updated_at END,
           updated_at = now()
     WHERE d.code = btrim(p_device_code);

    RETURN QUERY SELECT v_inserted, v_reading_id, v_home_id;
END;
$$;

REVOKE ALL ON FUNCTION device.fn_record_device_status(VARCHAR, VARCHAR, TIMESTAMPTZ, VARCHAR, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_register_device_with_provisioning(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_update_device_provisioning(UUID, VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ, NUMERIC, NUMERIC, INTEGER, NUMERIC, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, VARCHAR) FROM PUBLIC;
