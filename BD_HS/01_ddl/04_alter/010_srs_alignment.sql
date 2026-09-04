-- Ajustes de modelo posteriores al despliegue inicial.

ALTER TABLE user_account.user_profile
    DROP CONSTRAINT IF EXISTS user_profile_document_type_check;

ALTER TABLE user_account.user_profile
    ADD CONSTRAINT ck_user_profile_document_type
    CHECK (document_type IN ('CC', 'CE', 'NIT', 'Passport'));

ALTER TABLE user_account.user_profile
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL;

ALTER TABLE home.home
    ADD COLUMN IF NOT EXISTS suspended_by UUID NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_home_suspended_by'
          AND conrelid = 'home.home'::regclass
    ) THEN
        ALTER TABLE home.home
            ADD CONSTRAINT fk_home_suspended_by
            FOREIGN KEY (suspended_by)
            REFERENCES user_account.user_account(user_account_id);
    END IF;
END $$;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_calibration_factor_positive
    CHECK (calibration_factor > 0) NOT VALID;

ALTER TABLE device.device
    ADD CONSTRAINT ck_device_umbral_alerta_positive
    CHECK (umbral_alerta IS NULL OR umbral_alerta > 0) NOT VALID;

ALTER TABLE device.calibration_history
    ADD CONSTRAINT ck_calibration_new_factor_positive
    CHECK (new_factor > 0) NOT VALID;

ALTER TABLE user_account.password_policy
    ALTER COLUMN lockout_minutes SET DEFAULT 15;

ALTER TABLE device.device VALIDATE CONSTRAINT ck_device_calibration_factor_positive;
ALTER TABLE device.device VALIDATE CONSTRAINT ck_device_umbral_alerta_positive;
ALTER TABLE device.calibration_history VALIDATE CONSTRAINT ck_calibration_new_factor_positive;
