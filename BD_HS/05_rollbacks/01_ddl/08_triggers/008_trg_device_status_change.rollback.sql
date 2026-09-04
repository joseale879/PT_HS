DROP TRIGGER IF EXISTS trg_device_status_change ON device.device;
DROP FUNCTION IF EXISTS device.fn_track_device_status_change();