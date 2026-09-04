ALTER TABLE device.device
    DROP CONSTRAINT IF EXISTS ck_device_status_suspension;

-- La regla anterior exigía suspension_reason para cualquier estado distinto de Active.
-- Normalizamos primero los registros Low sin motivo para que el rollback sea ejecutable.
UPDATE device.device
SET suspension_reason = 'Legacy non-active device'
WHERE status <> 'Active'
  AND suspension_reason IS NULL;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_status_suspension CHECK (
        status = 'Active' OR suspension_reason IS NOT NULL
    );