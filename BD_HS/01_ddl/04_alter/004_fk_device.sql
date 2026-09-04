-- ============================================================
-- LLAVES FORÁNEAS - DOMINIO: device
-- ============================================================
ALTER TABLE device.device_history
    ADD CONSTRAINT fk_device_history_registered_by
    FOREIGN KEY (registered_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE device.calibration_history
    ADD CONSTRAINT fk_calibration_performed_by
    FOREIGN KEY (performed_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE home.home_device
    ADD CONSTRAINT fk_home_device_device
    FOREIGN KEY (device_id) REFERENCES device.device(device_id) ON DELETE CASCADE;
