CREATE OR REPLACE FUNCTION user_account.fn_list_managed_users(
    p_search VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_sort VARCHAR DEFAULT 'createdAt',
    p_order VARCHAR DEFAULT 'desc',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_account_id UUID,
    username VARCHAR,
    email VARCHAR,
    status VARCHAR,
    suspension_reason VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    full_name VARCHAR,
    document_type VARCHAR,
    document_number VARCHAR,
    roles TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_search VARCHAR := NULLIF(btrim(p_search), '');
BEGIN
    IF NOT user_account.fn_app_has_permission('users.manage') THEN
        RAISE EXCEPTION 'La cuenta no puede gestionar usuarios';
    END IF;
    IF p_status IS NOT NULL AND p_status NOT IN ('Active', 'Suspended', 'Blocked') THEN
        RAISE EXCEPTION 'El estado de cuenta no es válido';
    END IF;
    IF p_sort NOT IN ('createdAt', 'username', 'email', 'status') THEN
        RAISE EXCEPTION 'El campo de ordenamiento no es válido';
    END IF;
    IF p_order NOT IN ('asc', 'desc') THEN
        RAISE EXCEPTION 'El orden debe ser asc o desc';
    END IF;
    IF p_limit < 1 OR p_limit > 100 OR p_offset < 0 THEN
        RAISE EXCEPTION 'Los límites de paginación no son válidos';
    END IF;

    RETURN QUERY
    SELECT ua.user_account_id,
           ua.username,
           ua.email,
           ua.status,
           ua.suspension_reason,
           ua.created_at,
           ua.updated_at,
           up.full_name,
           up.document_type,
           up.document_number,
           COALESCE(string_agg(r.name, ', ' ORDER BY r.name), '')::TEXT,
           count(*) OVER ()
      FROM user_account.user_account ua
      LEFT JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id
      LEFT JOIN user_account.user_role ur ON ur.user_account_id = ua.user_account_id
      LEFT JOIN user_account.role r ON r.role_id = ur.role_id AND r.status = 'Active'
     WHERE ua.deleted_at IS NULL
       AND (p_status IS NULL OR ua.status = p_status)
       AND (
           v_search IS NULL
           OR ua.username ILIKE '%' || v_search || '%'
           OR ua.email ILIKE '%' || v_search || '%'
           OR COALESCE(up.full_name, '') ILIKE '%' || v_search || '%'
       )
     GROUP BY ua.user_account_id, up.user_account_id
     ORDER BY
       CASE WHEN p_sort = 'createdAt' AND p_order = 'asc' THEN ua.created_at END ASC,
       CASE WHEN p_sort = 'createdAt' AND p_order = 'desc' THEN ua.created_at END DESC,
       CASE WHEN p_sort = 'username' AND p_order = 'asc' THEN ua.username END ASC,
       CASE WHEN p_sort = 'username' AND p_order = 'desc' THEN ua.username END DESC,
       CASE WHEN p_sort = 'email' AND p_order = 'asc' THEN ua.email END ASC,
       CASE WHEN p_sort = 'email' AND p_order = 'desc' THEN ua.email END DESC,
       CASE WHEN p_sort = 'status' AND p_order = 'asc' THEN ua.status END ASC,
       CASE WHEN p_sort = 'status' AND p_order = 'desc' THEN ua.status END DESC,
       ua.user_account_id
     LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION user_account.fn_list_managed_users(VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER) FROM PUBLIC;
