-- Persiste el estado de conectividad separado del estado administrativo del dispositivo.

ALTER TABLE device.device
    ADD COLUMN IF NOT EXISTS connectivity_status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_connectivity_status,
    ADD CONSTRAINT ck_device_connectivity_status
        CHECK (connectivity_status IN ('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN'));

CREATE OR REPLACE FUNCTION device.fn_record_device_status(
    p_device_code VARCHAR(100),
    p_connectivity_status VARCHAR(20),
    p_event_at TIMESTAMPTZ,
    p_firmware_version VARCHAR(20),
    p_wifi_rssi_dbm INTEGER,
    p_signal_quality INTEGER,
    p_battery_level INTEGER,
    p_last_ip VARCHAR(45)
)
RETURNS TABLE(device_id UUID, code VARCHAR(100), administrative_status VARCHAR(20), connectivity_status VARCHAR(20), last_connection_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, public, pg_temp
AS $$
DECLARE
    v_device_id UUID;
    v_event_at TIMESTAMPTZ := COALESCE(p_event_at, now());
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = ''
       OR p_connectivity_status NOT IN ('ONLINE', 'OFFLINE', 'ERROR') THEN
        RAISE EXCEPTION 'El estado MQTT no cumple el contrato';
    END IF;
    IF v_event_at > now() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'El estado MQTT tiene un timestamp futuro no permitido';
    END IF;
    IF p_wifi_rssi_dbm IS NOT NULL AND p_wifi_rssi_dbm NOT BETWEEN -127 AND 0
       OR p_signal_quality IS NOT NULL AND p_signal_quality NOT BETWEEN 0 AND 100
       OR p_battery_level IS NOT NULL AND p_battery_level NOT BETWEEN 0 AND 100 THEN
        RAISE EXCEPTION 'Las metricas de conectividad estan fuera de rango';
    END IF;

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
           updated_at = now()
     WHERE d.code = btrim(p_device_code)
     RETURNING d.device_id, d.code, d.status, d.connectivity_status, d.last_connection_at
      INTO device_id, code, administrative_status, connectivity_status, last_connection_at;

    IF NOT FOUND THEN RETURN; END IF;
    v_device_id := device_id;

    INSERT INTO device.device_telemetry_history
        (device_id, recorded_at, wifi_rssi_dbm, signal_quality, battery_level)
    VALUES
        (v_device_id, now(), p_wifi_rssi_dbm, p_signal_quality, p_battery_level);
    RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION device.fn_record_device_status(VARCHAR, VARCHAR, TIMESTAMPTZ, VARCHAR, INTEGER, INTEGER, INTEGER, VARCHAR) FROM PUBLIC;
