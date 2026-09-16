-- Metadatos no sensibles de la red activa del ESP32.
-- Nunca se almacena la contraseña Wi-Fi.

ALTER TABLE device.device
    ADD COLUMN IF NOT EXISTS wifi_ssid VARCHAR(32) NULL;

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_wifi_ssid;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_wifi_ssid
        CHECK (wifi_ssid IS NULL OR char_length(wifi_ssid) BETWEEN 1 AND 32);

CREATE OR REPLACE FUNCTION device.fn_record_device_wifi_ssid(
    p_device_code VARCHAR(100),
    p_wifi_ssid VARCHAR(32)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, public, pg_temp
AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = '' THEN
        RAISE EXCEPTION 'El código del dispositivo es obligatorio';
    END IF;

    IF p_wifi_ssid IS NOT NULL AND char_length(btrim(p_wifi_ssid)) > 32 THEN
        RAISE EXCEPTION 'El SSID no puede superar 32 caracteres';
    END IF;

    UPDATE device.device
       SET wifi_ssid = NULLIF(btrim(p_wifi_ssid), ''),
           updated_at = now()
     WHERE code = btrim(p_device_code);

    v_updated := FOUND;
    RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION device.fn_record_device_wifi_ssid(VARCHAR, VARCHAR) FROM PUBLIC;
