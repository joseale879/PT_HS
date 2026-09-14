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
    v_total_audit_deleted BIGINT := 0;
    v_total_error_deleted BIGINT := 0;
BEGIN
    IF p_retention_days IS NULL OR p_retention_days <= 0 THEN
        RAISE EXCEPTION 'p_retention_days debe ser mayor que cero';
    END IF;

    IF p_batch_size IS NULL OR p_batch_size <= 0 THEN
        RAISE EXCEPTION 'p_batch_size debe ser mayor que cero';
    END IF;

    LOOP
        WITH rows_to_delete AS (
            SELECT al.audit_id
            FROM audit.audit_log al
            WHERE al.created_at
                < now() - make_interval(days => p_retention_days)
            ORDER BY al.created_at, al.audit_id
            LIMIT p_batch_size
        ),
        deleted AS (
            DELETE FROM audit.audit_log al
            USING rows_to_delete r
            WHERE al.audit_id = r.audit_id
            RETURNING al.audit_id
        )
        SELECT count(*)::INTEGER
        INTO v_deleted_count
        FROM deleted;

        v_total_audit_deleted :=
            v_total_audit_deleted + v_deleted_count;

        EXIT WHEN v_deleted_count < p_batch_size;
    END LOOP;

    LOOP
        WITH rows_to_delete AS (
            SELECT le.log_error_id
            FROM audit.log_error le
            WHERE le.created_at
                < now() - make_interval(days => p_retention_days)
            ORDER BY le.created_at, le.log_error_id
            LIMIT p_batch_size
        ),
        deleted_errors AS (
            DELETE FROM audit.log_error le
            USING rows_to_delete r
            WHERE le.log_error_id = r.log_error_id
            RETURNING le.log_error_id
        )
        SELECT count(*)::INTEGER
        INTO v_deleted_count
        FROM deleted_errors;

        v_total_error_deleted :=
            v_total_error_deleted + v_deleted_count;

        EXIT WHEN v_deleted_count < p_batch_size;
    END LOOP;

    RAISE NOTICE
        'Limpieza completada: audit_log=%, log_error=%',
        v_total_audit_deleted,
        v_total_error_deleted;
END;
$$;

COMMENT ON PROCEDURE
    audit.prc_clean_old_audit_logs(INTEGER, INTEGER)
IS
'Elimina audit_log y log_error anteriores a p_retention_days en lotes de p_batch_size. Valida parametros y cuenta correctamente las filas eliminadas.';