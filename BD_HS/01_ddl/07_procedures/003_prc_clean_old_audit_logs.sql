-- ============================================================
-- PROCEDIMIENTO: prc_clean_old_audit_logs
-- DOMINIO: audit
-- PROPÓSITO: Elimina registros antiguos de auditoría y logs
-- ============================================================
CREATE OR REPLACE PROCEDURE audit.prc_clean_old_audit_logs(
    p_retention_days INTEGER DEFAULT 365,
    p_batch_size INTEGER DEFAULT 1000
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = audit, public, pg_temp
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_total_deleted INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando limpieza de auditoría con retención de % días...', p_retention_days;

    -- Eliminar registros de audit_log más antiguos que p_retention_days
    LOOP
        WITH rows_to_delete AS (
            SELECT audit_id
            FROM audit_log
            WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
            ORDER BY created_at
            LIMIT p_batch_size
        ), deleted AS (
            DELETE FROM audit_log al
            USING rows_to_delete r
            WHERE al.audit_id = r.audit_id
            RETURNING al.audit_id
        )
        SELECT COUNT(*) INTO v_deleted_count FROM deleted;

        v_total_deleted := v_total_deleted + v_deleted_count;

        IF v_deleted_count < p_batch_size THEN
            EXIT;
        END IF;

        -- Pequeña pausa para evitar bloqueos largos
        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE '✅ Eliminados % registros de audit_log.', v_total_deleted;

    -- Limpiar logs de errores con más de 90 días (por defecto)
    WITH deleted_errors AS (
        DELETE FROM log_error
        WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted_errors;

    RAISE NOTICE '✅ Eliminados % registros de log_error.', v_deleted_count;
END;
$$;

COMMENT ON PROCEDURE audit.prc_clean_old_audit_logs(INTEGER, INTEGER) IS
'Elimina registros antiguos de auditoría y logs según el período de retención configurado.
Parámetros:
- p_retention_days: Número de días a mantener (por defecto 365 días = 1 año)
- p_batch_size: Tamaño de lote para eliminación (por defecto 1000)
Este procedimiento debe ejecutarse mensualmente mediante un job programado.';
