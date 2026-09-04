ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_status_suspension;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_status_suspension CHECK (
        status <> 'Suspended' OR suspension_reason IS NOT NULL
    );