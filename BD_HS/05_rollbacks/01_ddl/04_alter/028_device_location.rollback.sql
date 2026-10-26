ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_location_length;

ALTER TABLE device.device
    DROP COLUMN IF EXISTS location;
