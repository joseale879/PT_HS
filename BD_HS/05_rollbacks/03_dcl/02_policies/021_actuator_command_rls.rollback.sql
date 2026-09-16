DROP POLICY IF EXISTS actuator_command_member_update ON device.actuator_command;
DROP POLICY IF EXISTS actuator_command_member_insert ON device.actuator_command;
DROP POLICY IF EXISTS actuator_command_member_select ON device.actuator_command;
DROP POLICY IF EXISTS actuator_state_member_select ON device.actuator_state;
ALTER TABLE device.actuator_command DISABLE ROW LEVEL SECURITY;
ALTER TABLE device.actuator_state DISABLE ROW LEVEL SECURITY;
