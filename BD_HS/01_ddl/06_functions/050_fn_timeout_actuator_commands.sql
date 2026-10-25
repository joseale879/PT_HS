CREATE OR REPLACE FUNCTION device.fn_timeout_actuator_commands(
    p_timeout_seconds INTEGER DEFAULT 60,
    p_batch_size INTEGER DEFAULT 100
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = device, audit, pg_catalog
AS $$
DECLARE
    v_command RECORD;
    v_expired INTEGER := 0;
    v_expired_at TIMESTAMPTZ;
BEGIN
    IF p_timeout_seconds < 1 OR p_timeout_seconds > 86400 THEN
        RAISE EXCEPTION 'p_timeout_seconds debe estar entre 1 y 86400';
    END IF;

    IF p_batch_size < 1 OR p_batch_size > 1000 THEN
        RAISE EXCEPTION 'p_batch_size debe estar entre 1 y 1000';
    END IF;

    v_expired_at := clock_timestamp();

    FOR v_command IN
        SELECT command_id, requested_by, status, correlation_id
          FROM device.actuator_command
         WHERE status IN ('Pending', 'Published')
           AND requested_at <= v_expired_at - make_interval(secs => p_timeout_seconds)
         ORDER BY requested_at, command_id
         FOR UPDATE SKIP LOCKED
         LIMIT p_batch_size
    LOOP
        UPDATE device.actuator_command
           SET status = 'TimedOut',
               error_message = 'El comando no recibió ACK dentro del tiempo esperado',
               completed_at = COALESCE(completed_at, v_expired_at)
         WHERE command_id = v_command.command_id
           AND status IN ('Pending', 'Published');

        IF FOUND THEN
            INSERT INTO audit.audit_log (
                user_account_id,
                action,
                table_name,
                record_id,
                old_value,
                new_value,
                description
            ) VALUES (
                NULL,
                'UPDATE',
                'device.actuator_command',
                v_command.command_id::TEXT,
                jsonb_build_object(
                    'status', v_command.status,
                    'correlationId', v_command.correlation_id
                ),
                jsonb_build_object(
                    'status', 'TimedOut',
                    'correlationId', v_command.correlation_id,
                    'completedAt', v_expired_at
                ),
                'Comando de actuador vencido por falta de ACK'
            );

            v_expired := v_expired + 1;
        END IF;
    END LOOP;

    RETURN v_expired;
END;
$$;

COMMENT ON FUNCTION device.fn_timeout_actuator_commands(INTEGER, INTEGER) IS
'Marca como TimedOut los comandos Pending/Published sin ACK y registra la transición en auditoría.';

REVOKE ALL ON FUNCTION device.fn_timeout_actuator_commands(INTEGER, INTEGER) FROM PUBLIC;
