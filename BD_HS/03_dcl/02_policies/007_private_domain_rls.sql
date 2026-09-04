-- RLS para tablas privadas que reciben privilegios directos de la aplicacion.

ALTER TABLE user_account.user_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_profile_self_select ON user_account.user_profile;
DROP POLICY IF EXISTS user_profile_self_insert ON user_account.user_profile;
DROP POLICY IF EXISTS user_profile_self_update ON user_account.user_profile;
CREATE POLICY user_profile_self_select ON user_account.user_profile
    FOR SELECT TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY user_profile_self_insert ON user_account.user_profile
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY user_profile_self_update ON user_account.user_profile
    FOR UPDATE TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

ALTER TABLE home.home_user_function ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS home_user_function_member_select ON home.home_user_function;
DROP POLICY IF EXISTS home_user_function_owner_insert ON home.home_user_function;
DROP POLICY IF EXISTS home_user_function_owner_update ON home.home_user_function;
DROP POLICY IF EXISTS home_user_function_owner_delete ON home.home_user_function;
CREATE POLICY home_user_function_member_select ON home.home_user_function
    FOR SELECT TO hidro_smart_app
    USING (EXISTS (
        SELECT 1
        FROM home.home_user hu
        WHERE hu.home_user_id = home.home_user_function.home_user_id
          AND home.fn_is_home_member(hu.home_id, user_account.fn_app_current_user_id())
    ));
CREATE POLICY home_user_function_owner_insert ON home.home_user_function
    FOR INSERT TO hidro_smart_app
    WITH CHECK (
        user_account.fn_app_has_permission('homes.manage')
        AND EXISTS (
            SELECT 1
            FROM home.home_user hu
            WHERE hu.home_user_id = home.home_user_function.home_user_id
              AND home.fn_is_home_owner(hu.home_id, user_account.fn_app_current_user_id())
        )
    );
CREATE POLICY home_user_function_owner_update ON home.home_user_function
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('homes.manage')
        AND EXISTS (
            SELECT 1
            FROM home.home_user hu
            WHERE hu.home_user_id = home.home_user_function.home_user_id
              AND home.fn_is_home_owner(hu.home_id, user_account.fn_app_current_user_id())
        )
    )
    WITH CHECK (
        user_account.fn_app_has_permission('homes.manage')
        AND EXISTS (
            SELECT 1
            FROM home.home_user hu
            WHERE hu.home_user_id = home.home_user_function.home_user_id
              AND home.fn_is_home_owner(hu.home_id, user_account.fn_app_current_user_id())
        )
    );
CREATE POLICY home_user_function_owner_delete ON home.home_user_function
    FOR DELETE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('homes.manage')
        AND EXISTS (
            SELECT 1
            FROM home.home_user hu
            WHERE hu.home_user_id = home.home_user_function.home_user_id
              AND home.fn_is_home_owner(hu.home_id, user_account.fn_app_current_user_id())
        )
    );

ALTER TABLE home.home_member_request ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS home_member_request_select ON home.home_member_request;
DROP POLICY IF EXISTS home_member_request_insert ON home.home_member_request;
DROP POLICY IF EXISTS home_member_request_owner_update ON home.home_member_request;
DROP POLICY IF EXISTS home_member_request_delete ON home.home_member_request;
CREATE POLICY home_member_request_select ON home.home_member_request
    FOR SELECT TO hidro_smart_app
    USING (
        user_account_id = user_account.fn_app_current_user_id()
        OR (
            user_account.fn_app_has_permission('homes.manage')
            AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
        )
    );
CREATE POLICY home_member_request_insert ON home.home_member_request
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY home_member_request_owner_update ON home.home_member_request
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    )
    WITH CHECK (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );
CREATE POLICY home_member_request_delete ON home.home_member_request
    FOR DELETE TO hidro_smart_app
    USING (
        (
            user_account.fn_app_has_permission('homes.manage')
            AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
        )
        OR (user_account_id = user_account.fn_app_current_user_id() AND status = 'Pending')
    );

ALTER TABLE device.device_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS device_history_member_select ON device.device_history;
CREATE POLICY device_history_member_select ON device.device_history
    FOR SELECT TO hidro_smart_app
    USING (device.fn_can_access_device(device_id, user_account.fn_app_current_user_id()));

ALTER TABLE device.calibration_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calibration_history_member_select ON device.calibration_history;
DROP POLICY IF EXISTS calibration_history_manager_insert ON device.calibration_history;
CREATE POLICY calibration_history_member_select ON device.calibration_history
    FOR SELECT TO hidro_smart_app
    USING (device.fn_can_access_device(device_id, user_account.fn_app_current_user_id()));
CREATE POLICY calibration_history_manager_insert ON device.calibration_history
    FOR INSERT TO hidro_smart_app
    WITH CHECK (
        user_account.fn_app_has_permission('devices.manage')
        AND device.fn_can_manage_device(device_id, user_account.fn_app_current_user_id())
    );

ALTER TABLE device.device_telemetry_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS device_telemetry_member_select ON device.device_telemetry_history;
CREATE POLICY device_telemetry_member_select ON device.device_telemetry_history
    FOR SELECT TO hidro_smart_app
    USING (device.fn_can_access_device(device_id, user_account.fn_app_current_user_id()));

ALTER TABLE privacy.user_consent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_consent_self_select ON privacy.user_consent;
DROP POLICY IF EXISTS user_consent_self_insert ON privacy.user_consent;
CREATE POLICY user_consent_self_select ON privacy.user_consent
    FOR SELECT TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY user_consent_self_insert ON privacy.user_consent
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

ALTER TABLE privacy.arco_request ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arco_request_self_select ON privacy.arco_request;
DROP POLICY IF EXISTS arco_request_self_insert ON privacy.arco_request;
DROP POLICY IF EXISTS arco_request_self_update ON privacy.arco_request;
CREATE POLICY arco_request_self_select ON privacy.arco_request
    FOR SELECT TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY arco_request_self_insert ON privacy.arco_request
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY arco_request_self_update ON privacy.arco_request
    FOR UPDATE TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());