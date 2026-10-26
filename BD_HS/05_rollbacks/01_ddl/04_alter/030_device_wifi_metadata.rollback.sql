DROP FUNCTION IF EXISTS device.fn_record_device_wifi_ssid(VARCHAR, VARCHAR);

ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_wifi_ssid,
    DROP COLUMN IF EXISTS wifi_ssid;
