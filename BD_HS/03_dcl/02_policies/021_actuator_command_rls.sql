ALTER TABLE device.actuator_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE device.actuator_command ENABLE ROW LEVEL SECURITY;

CREATE POLICY actuator_state_member_select
ON device.actuator_state
FOR SELECT TO hidro_smart_app
USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY actuator_command_member_select
ON device.actuator_command
FOR SELECT TO hidro_smart_app
USING (
    user_account.fn_app_has_permission('actuators.manage')
    AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id())
);

CREATE POLICY actuator_command_member_insert
ON device.actuator_command
FOR INSERT TO hidro_smart_app
WITH CHECK (
    user_account.fn_app_has_permission('actuators.manage')
    AND requested_by = user_account.fn_app_current_user_id()
    AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id())
);

CREATE POLICY actuator_command_member_update
ON device.actuator_command
FOR UPDATE TO hidro_smart_app
USING (
    user_account.fn_app_has_permission('actuators.manage')
    AND requested_by = user_account.fn_app_current_user_id()
    AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id())
)
WITH CHECK (
    user_account.fn_app_has_permission('actuators.manage')
    AND requested_by = user_account.fn_app_current_user_id()
    AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id())
);
