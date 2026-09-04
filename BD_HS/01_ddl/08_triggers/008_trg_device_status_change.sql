CREATE OR REPLACE FUNCTION device.fn_track_device_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = device, public, pg_temp
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.changed_at_status := now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_device_status_change ON device.device;

CREATE TRIGGER trg_device_status_change
    BEFORE UPDATE OF status ON device.device
    FOR EACH ROW
    EXECUTE FUNCTION device.fn_track_device_status_change();

COMMENT ON FUNCTION device.fn_track_device_status_change() IS
'Actualiza changed_at_status cada vez que cambia el estado operativo del dispositivo.';