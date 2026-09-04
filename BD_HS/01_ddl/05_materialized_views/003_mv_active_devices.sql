-- ============================================================
-- VISTA MATERIALIZADA: mv_active_devices
-- DOMINIO: device + home
-- PROPÓSITO: Resumen de dispositivos activos por hogar
-- ============================================================
CREATE MATERIALIZED VIEW device.mv_active_devices AS
SELECT
    hd.home_id,
    COUNT(DISTINCT d.device_id) AS total_devices,
    COUNT(DISTINCT d.device_id) FILTER (WHERE d.status = 'Active') AS active_devices,
    COUNT(DISTINCT d.device_id) FILTER (WHERE d.status = 'Suspended') AS suspended_devices,
    COUNT(DISTINCT d.device_id) FILTER (WHERE d.status = 'Low') AS low_battery_devices,
    MAX(d.last_connection_at) AS last_connection_at,
    NOW() AS refreshed_at
FROM device.device d
JOIN home.home_device hd ON d.device_id = hd.device_id
WHERE hd.status = 'Active'
GROUP BY hd.home_id;

COMMENT ON MATERIALIZED VIEW device.mv_active_devices IS
'Resumen de dispositivos activos por hogar. Utilizado para el dashboard y gestión de hogares (RF2, RF5.6).';

CREATE INDEX idx_mv_active_devices_home
    ON device.mv_active_devices (home_id);
CREATE INDEX idx_mv_active_devices_active
    ON device.mv_active_devices (active_devices DESC);