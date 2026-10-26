-- ============================================================
-- DOMINIO 10: ESTADO Y COMANDOS DE ACTUADORES (device)
-- ============================================================

SET search_path TO device, home, user_account, public;

CREATE TABLE actuator_state (
    actuator_state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    actuator VARCHAR(20) NOT NULL CHECK (actuator IN ('VALVE', 'PUMP')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'ON', 'OFF', 'UNKNOWN')),
    last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_actuator_state_device_actuator UNIQUE (device_id, actuator)
);

CREATE TABLE actuator_command (
    command_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES user_account(user_account_id),
    actuator VARCHAR(20) NOT NULL CHECK (actuator IN ('VALVE', 'PUMP')),
    command VARCHAR(20) NOT NULL CHECK (command IN ('OPEN', 'CLOSED', 'ON', 'OFF')),
    correlation_id UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Published', 'Acknowledged', 'Failed', 'TimedOut', 'Cancelled')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ NULL,
    acknowledged_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    error_message VARCHAR(500) NULL,
    CONSTRAINT ck_actuator_command_published CHECK (
        status <> 'Published' OR published_at IS NOT NULL
    ),
    CONSTRAINT ck_actuator_command_acknowledged CHECK (
        status <> 'Acknowledged' OR acknowledged_at IS NOT NULL
    ),
    CONSTRAINT ck_actuator_command_failed CHECK (
        status <> 'Failed' OR error_message IS NOT NULL
    )
);
