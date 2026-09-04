-- Validacion segura para la ingesta IoT.
-- El rol hidro_smart_ingest no recibe SELECT global sobre device ni home_device.
-- La funcion se ejecuta con los privilegios de su propietario (Liquibase/table owner)
-- y solo devuelve si la pareja dispositivo-hogar puede registrar lecturas.
CREATE OR REPLACE FUNCTION device.fn_can_ingest_reading(
    p_device_id UUID,
    p_home_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, device, home
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM home.home_device hd
        JOIN device.device d
          ON d.device_id = hd.device_id
        WHERE hd.home_id = p_home_id
          AND hd.device_id = p_device_id
          AND hd.status = 'Active'
          AND d.status = 'Active'
    );
$$;

REVOKE ALL ON FUNCTION device.fn_can_ingest_reading(UUID, UUID) FROM PUBLIC;