DROP POLICY IF EXISTS arco_request_self_update ON privacy.arco_request;
DROP POLICY IF EXISTS arco_request_self_insert ON privacy.arco_request;
DROP POLICY IF EXISTS arco_request_self_select ON privacy.arco_request;
ALTER TABLE privacy.arco_request DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_consent_self_insert ON privacy.user_consent;
DROP POLICY IF EXISTS user_consent_self_select ON privacy.user_consent;
ALTER TABLE privacy.user_consent DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_telemetry_member_select ON device.device_telemetry_history;
ALTER TABLE device.device_telemetry_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calibration_history_manager_insert ON device.calibration_history;
DROP POLICY IF EXISTS calibration_history_member_select ON device.calibration_history;
ALTER TABLE device.calibration_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_history_member_select ON device.device_history;
ALTER TABLE device.device_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_member_request_delete ON home.home_member_request;
DROP POLICY IF EXISTS home_member_request_owner_update ON home.home_member_request;
DROP POLICY IF EXISTS home_member_request_insert ON home.home_member_request;
DROP POLICY IF EXISTS home_member_request_select ON home.home_member_request;
ALTER TABLE home.home_member_request DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_user_function_owner_delete ON home.home_user_function;
DROP POLICY IF EXISTS home_user_function_owner_update ON home.home_user_function;
DROP POLICY IF EXISTS home_user_function_owner_insert ON home.home_user_function;
DROP POLICY IF EXISTS home_user_function_member_select ON home.home_user_function;
ALTER TABLE home.home_user_function DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profile_self_update ON user_account.user_profile;
DROP POLICY IF EXISTS user_profile_self_insert ON user_account.user_profile;
DROP POLICY IF EXISTS user_profile_self_select ON user_account.user_profile;
ALTER TABLE user_account.user_profile DISABLE ROW LEVEL SECURITY;