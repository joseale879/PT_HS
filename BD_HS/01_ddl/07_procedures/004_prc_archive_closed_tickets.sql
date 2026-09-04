-- ============================================================
-- PROCEDIMIENTO: prc_archive_closed_tickets
-- DOMINIO: analytics_support
-- PROPÓSITO: Archiva tickets cerrados después de 30 días
-- ============================================================
CREATE OR REPLACE PROCEDURE analytics_support.prc_archive_closed_tickets(
    p_archive_days INTEGER DEFAULT 30,
    p_batch_size INTEGER DEFAULT 100
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics_support, public, pg_temp
AS $$
DECLARE
    v_archived_count INTEGER := 0;
    v_total_archived INTEGER := 0;
BEGIN
    RAISE NOTICE 'Archivando tickets cerrados hace más de % días...', p_archive_days;

    -- En este ejemplo, "archivar" significa marcar como archivados o mover a una tabla de historial.
    -- Como no tenemos una tabla de historial de tickets, marcamos un flag virtual.
    -- En una implementación real, podrías mover los tickets a una tabla ticket_archive.

    -- Actualizar tickets cerrados para marcar como "archivados" (soft delete virtual)
    LOOP
        WITH candidates AS (
            SELECT ticket_id
            FROM ticket
            WHERE status_id = (SELECT status_id FROM ticket_status WHERE name = 'Cerrado')
              AND closed_at < NOW() - (p_archive_days || ' days')::INTERVAL
              AND closed_at IS NOT NULL
              AND archived_at IS NULL
            ORDER BY closed_at
            LIMIT p_batch_size
        ), archived AS (
            UPDATE ticket t
            SET archived_at = NOW()
            FROM candidates c
            WHERE t.ticket_id = c.ticket_id
            RETURNING t.ticket_id
        )
        SELECT COUNT(*) INTO v_archived_count FROM archived;

        v_total_archived := v_total_archived + v_archived_count;

        IF v_archived_count < p_batch_size THEN
            EXIT;
        END IF;

        PERFORM pg_sleep(0.1);
    END LOOP;

    RAISE NOTICE '✅ % tickets archivados.', v_total_archived;
END;
$$;

COMMENT ON PROCEDURE analytics_support.prc_archive_closed_tickets(INTEGER, INTEGER) IS
'Archiva tickets cerrados que han superado el período de retención configurado.
Parámetros:
- p_archive_days: Días a mantener cerrados antes de archivar (por defecto 30 días)
- p_batch_size: Tamaño de lote para archivado (por defecto 100)
Este procedimiento debe ejecutarse semanalmente mediante un job programado.';
