REVOKE EXECUTE ON FUNCTION device.fn_can_ingest_reading(UUID, UUID) FROM hidro_smart_ingest;
REVOKE REFERENCES ON device.device, home.home FROM hidro_smart_ingest;
REVOKE USAGE ON SCHEMA device, home FROM hidro_smart_ingest;