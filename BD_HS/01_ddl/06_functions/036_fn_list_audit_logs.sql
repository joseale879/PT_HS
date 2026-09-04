CREATE OR REPLACE FUNCTION user_account.fn_list_audit_logs(
    p_action VARCHAR DEFAULT NULL,
    p_table_name VARCHAR DEFAULT NULL,
    p_from TIMESTAMPTZ DEFAULT NULL,
    p_to TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    audit_id UUID,
    user_account_id UUID,
    action VARCHAR,
    table_name VARCHAR,
    record_id TEXT,
    old_value JSONB,
    new_value JSONB,
    description VARCHAR,
    source_ip VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, audit, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('audit.read') THEN
        RAISE EXCEPTION 'La cuenta no tiene permiso para consultar auditoria';
    END IF;

    RETURN QUERY
    SELECT al.audit_id,
           al.user_account_id,
           al.action,
           al.table_name,
           al.record_id,
           al.old_value,
           al.new_value,
           al.description,
           al.source_ip,
           al.user_agent,
           al.created_at,
           COUNT(*) OVER() AS total_count
      FROM audit.audit_log al
     WHERE (p_action IS NULL OR al.action = upper(btrim(p_action)))
       AND (p_table_name IS NULL OR lower(al.table_name) = lower(btrim(p_table_name)))
       AND (p_from IS NULL OR al.created_at >= p_from)
       AND (p_to IS NULL OR al.created_at < p_to)
     ORDER BY al.created_at DESC, al.audit_id DESC
     LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

COMMENT ON FUNCTION user_account.fn_list_audit_logs(VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) IS
'Consulta paginada y autorizada de auditoria administrativa. No concede acceso directo a audit.audit_log.';
