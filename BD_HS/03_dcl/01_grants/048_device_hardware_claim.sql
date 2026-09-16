REVOKE ALL ON FUNCTION device.fn_claim_provisioned_device(UUID, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION device.fn_claim_provisioned_device(UUID, VARCHAR) TO hidro_smart_app;
