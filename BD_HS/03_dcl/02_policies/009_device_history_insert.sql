DROP POLICY IF EXISTS device_history_manager_insert ON device.device_history;

CREATE POLICY device_history_manager_insert ON device.device_history
    FOR INSERT TO hidro_smart_app
    WITH CHECK (
        user_account.fn_app_has_permission('devices.manage')
        AND device.fn_can_manage_device(device_id, user_account.fn_app_current_user_id())
        AND registered_by = user_account.fn_app_current_user_id()
    );
