REVOKE ALL ON FUNCTION device.fn_can_ingest_reading(UUID, UUID) FROM PUBLIC;
DROP FUNCTION IF EXISTS device.fn_can_ingest_reading(UUID, UUID);