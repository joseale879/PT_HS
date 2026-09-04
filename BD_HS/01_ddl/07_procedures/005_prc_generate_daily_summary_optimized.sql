CREATE OR REPLACE PROCEDURE consumption.prc_generate_daily_summary(
    p_target_date DATE DEFAULT CURRENT_DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, public, pg_temp
AS $$
DECLARE
    v_home RECORD;
    v_consumption RECORD;
BEGIN
    FOR v_home IN (
        SELECT home_id
        FROM home.home
        WHERE status = 'Active'
    ) LOOP
        SELECT
            COALESCE(SUM(sr.consumption_m3), 0) AS total_consumption_m3,
            COALESCE(SUM(sr.consumption_liters), 0) AS total_consumption_liters,
            COUNT(*) AS reading_count,
            COALESCE(SUM(sr.estimated_cost), 0) AS total_cost
        INTO v_consumption
        FROM sensor_reading sr
        WHERE sr.home_id = v_home.home_id
          AND sr.recorded_at >= p_target_date::timestamp
          AND sr.recorded_at < (p_target_date + 1)::timestamp;

        INSERT INTO daily_consumption_summary (
            summary_id, home_id, date, total_consumption_m3,
            total_consumption_liters, reading_count, total_cost, generated_at
        ) VALUES (
            gen_random_uuid(), v_home.home_id, p_target_date,
            v_consumption.total_consumption_m3,
            v_consumption.total_consumption_liters,
            v_consumption.reading_count,
            v_consumption.total_cost,
            NOW()
        )
        ON CONFLICT (home_id, date) DO UPDATE SET
            total_consumption_m3 = EXCLUDED.total_consumption_m3,
            total_consumption_liters = EXCLUDED.total_consumption_liters,
            reading_count = EXCLUDED.reading_count,
            total_cost = EXCLUDED.total_cost,
            generated_at = NOW();
    END LOOP;
END;
$$;