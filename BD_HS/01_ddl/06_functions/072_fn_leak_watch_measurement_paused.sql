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
    ),
    current_mode AS (
        SELECT d.measurement_enabled, d.measurement_updated_at
          FROM device.device d, guard
         WHERE d.device_id = p_device_id
    ),
    active_readings AS (
        SELECT sr.device_id, sr.recorded_at
          FROM consumption.sensor_reading sr
          JOIN current_mode cm ON TRUE
         WHERE sr.device_id = p_device_id
           AND sr.recorded_at <= p_reading_time
           AND sr.recorded_at >= p_reading_time - (p_min_duration_minutes * INTERVAL '1 minute')
           AND (
                (cm.measurement_enabled AND sr.consumption_liters > 0.1)
                OR
                (
                    NOT cm.measurement_enabled
                    AND sr.recorded_at >= COALESCE(
                        cm.measurement_updated_at,
                        p_reading_time - (p_min_duration_minutes * INTERVAL '1 minute')
                    )
                    AND (COALESCE(sr.flow_rate_lpm, 0) > 0 OR COALESCE(sr.pulses, 0) > 0)
                )
           )
    )
    SELECT EXISTS (
        SELECT 1
          FROM active_readings sr
         GROUP BY sr.device_id
        HAVING COUNT(*) > 1
           AND MAX(sr.recorded_at) - MIN(sr.recorded_at) >=
               p_min_duration_minutes * INTERVAL '1 minute'
    );
$$;

COMMENT ON FUNCTION alert_rate.fn_is_leak_detected(UUID, TIMESTAMPTZ, INTEGER) IS
'Detecta flujo continuo en medicion normal y pulsos/caudal durante el modo de vigilancia con consumo contabilizado pausado.';

COMMENT ON COLUMN device.device.measurement_enabled IS
'TRUE contabiliza los litros en el total del hogar; FALSE pausa ese conteo, pero mantiene telemetria de caudal/pulsos para detectar fugas.';
