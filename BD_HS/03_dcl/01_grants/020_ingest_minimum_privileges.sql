-- Permisos minimos para que PostgreSQL valide FKs y el rol invoque la funcion.
GRANT USAGE ON SCHEMA device, home TO hidro_smart_ingest;
GRANT REFERENCES ON device.device, home.home TO hidro_smart_ingest;
GRANT EXECUTE ON FUNCTION device.fn_can_ingest_reading(UUID, UUID) TO hidro_smart_ingest;

-- Revoca cualquier permiso amplio que haya quedado de una instalacion manual.
REVOKE SELECT ON device.device FROM hidro_smart_ingest;
REVOKE SELECT ON home.home_device FROM hidro_smart_ingest;