DROP POLICY IF EXISTS device_backend_update ON device.device;

CREATE POLICY device_backend_update ON device.device
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('devices.manage'))
    WITH CHECK (user_account.fn_app_has_permission('devices.manage'));