-- Ubicación visible del dispositivo dentro del hogar (baño, cocina, jardín, etc.).
ALTER TABLE device.device
    ADD COLUMN IF NOT EXISTS location VARCHAR(120) NULL;

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_location_length;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_location_length
    CHECK (location IS NULL OR char_length(btrim(location)) BETWEEN 1 AND 120);
