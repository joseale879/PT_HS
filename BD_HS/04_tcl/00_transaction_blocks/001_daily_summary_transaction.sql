-- ============================================================
-- TRANSACCIÓN: Generación de resumen diario
-- ============================================================
-- Este bloque se usa en el procedimiento prc_generate_daily_summary
-- Se deja como referencia para operaciones que requieren transacciones
DO $$
BEGIN
    -- Iniciar transacción
    
    -- Eliminar resúmenes antiguos de la fecha (si existen)
    DELETE FROM consumption.daily_consumption_summary
    WHERE date = CURRENT_DATE;
    
    -- Insertar nuevos resúmenes
    INSERT INTO consumption.daily_consumption_summary (
        summary_id,
        home_id,
        date,
        total_consumption_m3,
        total_consumption_liters,
        reading_count,
        total_cost,
        generated_at
    )
    SELECT
        gen_random_uuid(),
        sr.home_id,
        CURRENT_DATE,
        SUM(sr.consumption_m3),
        SUM(sr.consumption_liters),
        COUNT(*),
        SUM(sr.estimated_cost),
        NOW()
    FROM consumption.sensor_reading sr
    WHERE sr.recorded_at::DATE = CURRENT_DATE
    GROUP BY sr.home_id;
    
    -- Confirmar transacción
    
EXCEPTION
    WHEN OTHERS THEN
        -- Revertir en caso de error
        RAISE;
END;
$$;
