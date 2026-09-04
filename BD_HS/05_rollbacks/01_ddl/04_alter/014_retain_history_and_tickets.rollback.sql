ALTER TABLE analytics_support.ticket_response
    DROP CONSTRAINT IF EXISTS ticket_response_ticket_id_fkey,
    DROP CONSTRAINT IF EXISTS ticket_response_user_account_id_fkey;
ALTER TABLE analytics_support.ticket_response
    ALTER COLUMN user_account_id SET NOT NULL;
ALTER TABLE analytics_support.ticket_response
    ADD CONSTRAINT ticket_response_ticket_id_fkey
        FOREIGN KEY (ticket_id) REFERENCES analytics_support.ticket(ticket_id) ON DELETE CASCADE,
    ADD CONSTRAINT ticket_response_user_account_id_fkey
        FOREIGN KEY (user_account_id) REFERENCES user_account.user_account(user_account_id) ON DELETE CASCADE;

ALTER TABLE analytics_support.ticket
    DROP CONSTRAINT IF EXISTS ticket_user_account_id_fkey;
ALTER TABLE analytics_support.ticket
    ALTER COLUMN user_account_id SET NOT NULL;
ALTER TABLE analytics_support.ticket
    ADD CONSTRAINT ticket_user_account_id_fkey
        FOREIGN KEY (user_account_id) REFERENCES user_account.user_account(user_account_id) ON DELETE CASCADE;

ALTER TABLE device.device_telemetry_history DROP CONSTRAINT IF EXISTS device_telemetry_history_device_id_fkey;
ALTER TABLE device.device_telemetry_history ADD CONSTRAINT device_telemetry_history_device_id_fkey FOREIGN KEY (device_id) REFERENCES device.device(device_id) ON DELETE CASCADE;
ALTER TABLE device.device_history DROP CONSTRAINT IF EXISTS device_history_device_id_fkey;
ALTER TABLE device.device_history ADD CONSTRAINT device_history_device_id_fkey FOREIGN KEY (device_id) REFERENCES device.device(device_id) ON DELETE CASCADE;
ALTER TABLE device.calibration_history DROP CONSTRAINT IF EXISTS calibration_history_device_id_fkey;
ALTER TABLE device.calibration_history ADD CONSTRAINT calibration_history_device_id_fkey FOREIGN KEY (device_id) REFERENCES device.device(device_id) ON DELETE CASCADE;
ALTER TABLE consumption.consumption_prediction DROP CONSTRAINT IF EXISTS consumption_prediction_home_id_fkey;
ALTER TABLE consumption.consumption_prediction ADD CONSTRAINT consumption_prediction_home_id_fkey FOREIGN KEY (home_id) REFERENCES home.home(home_id) ON DELETE CASCADE;
ALTER TABLE consumption.monthly_consumption_history DROP CONSTRAINT IF EXISTS monthly_consumption_history_home_id_fkey;
ALTER TABLE consumption.monthly_consumption_history ADD CONSTRAINT monthly_consumption_history_home_id_fkey FOREIGN KEY (home_id) REFERENCES home.home(home_id) ON DELETE CASCADE;
ALTER TABLE consumption.hourly_consumption_history DROP CONSTRAINT IF EXISTS hourly_consumption_history_home_id_fkey;
ALTER TABLE consumption.hourly_consumption_history ADD CONSTRAINT hourly_consumption_history_home_id_fkey FOREIGN KEY (home_id) REFERENCES home.home(home_id) ON DELETE CASCADE;
ALTER TABLE consumption.daily_consumption_summary DROP CONSTRAINT IF EXISTS daily_consumption_summary_home_id_fkey;
ALTER TABLE consumption.daily_consumption_summary ADD CONSTRAINT daily_consumption_summary_home_id_fkey FOREIGN KEY (home_id) REFERENCES home.home(home_id) ON DELETE CASCADE;
ALTER TABLE consumption.sensor_reading DROP CONSTRAINT IF EXISTS sensor_reading_device_id_fkey, DROP CONSTRAINT IF EXISTS sensor_reading_home_id_fkey;
ALTER TABLE consumption.sensor_reading
    ADD CONSTRAINT sensor_reading_device_id_fkey FOREIGN KEY (device_id) REFERENCES device.device(device_id) ON DELETE CASCADE,
    ADD CONSTRAINT sensor_reading_home_id_fkey FOREIGN KEY (home_id) REFERENCES home.home(home_id) ON DELETE CASCADE;