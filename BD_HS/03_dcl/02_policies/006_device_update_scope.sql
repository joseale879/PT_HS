DROP POLICY IF EXISTS device_backend_update ON device.device;

CREATE POLICY device_backend_update ON device.device
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('devices.manage')
        AND device.fn_can_manage_device(
            device_id,
            user_account.fn_app_current_user_id()
        )
    )
    WITH CHECK (
        user_account.fn_app_has_permission('devices.manage')
        AND device.fn_can_manage_device(
            device_id,
            user_account.fn_app_current_user_id()
        )
    );