ALTER TABLE device.actuator_command
    DROP CONSTRAINT IF EXISTS ck_actuator_command_pair,
    ADD CONSTRAINT ck_actuator_command_pair CHECK (
        (actuator = 'VALVE' AND command IN ('OPEN', 'CLOSED'))
        OR (actuator = 'PUMP' AND command IN ('ON', 'OFF'))
    );
