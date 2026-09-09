CREATE OR REPLACE FUNCTION device.fn_resolve_ingest_device(
    p_device_code VARCHAR
)
RETURNS TABLE (
    device_id UUID,
    home_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, device, home
AS $$
    SELECT d.device_id, hd.home_id
    FROM device.device d
    JOIN home.home_device hd
      ON hd.device_id = d.device_id
    JOIN home.home h
      ON h.home_id = hd.home_id
    WHERE d.code = btrim(p_device_code)
      AND d.status = 'Active'
      AND hd.status = 'Active'
      AND h.status = 'Active'
      AND h.deleted_at IS NULL
    ORDER BY hd.installed_at DESC
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION device.fn_resolve_ingest_device(VARCHAR) FROM PUBLIC;