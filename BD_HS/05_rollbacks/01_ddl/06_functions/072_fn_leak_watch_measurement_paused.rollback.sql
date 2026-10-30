CREATE OR REPLACE FUNCTION alert_rate.fn_is_leak_detected(
    p_device_id UUID,
    p_reading_time TIMESTAMPTZ,
    p_min_duration_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = consumption, user_account, home, device, public, pg_temp
AS $$
    WITH guard AS (
        SELECT user_account.fn_assert_app_device_access(p_device_id, 'devices.manage')
    )
    SELECT EXISTS (
        SELECT 1
        FROM guard, consumption.sensor_reading sr
        WHERE sr.device_id = p_device_id
          AND sr.recorded_at >= p_reading_time - (p_min_duration_minutes * INTERVAL '1 minute')
          AND sr.consumption_liters > 0.1
        GROUP BY sr.device_id
        HAVING COUNT(*) > 1
           AND MAX(sr.recorded_at) - MIN(sr.recorded_at) >= p_min_duration_minutes * INTERVAL '1 minute'
    );
$$;

COMMENT ON FUNCTION alert_rate.fn_is_leak_detected(UUID, TIMESTAMPTZ, INTEGER) IS
'Detecta si hay un flujo continuo por encima de 0.1 litros por lectura durante la duración indicada.';

COMMENT ON COLUMN device.device.measurement_enabled IS
'Last measurement state confirmed by the physical IoT device.';
