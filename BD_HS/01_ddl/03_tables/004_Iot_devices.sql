-- ============================================================
-- DOMINIO 4: DISPOSITIVOS IoT (device)
-- ============================================================

-- 25. device — Datos del dispositivo IoT (ESP32)
SET search_path TO device, user_account, home, preference, consumption, alert_rate, analytics_support, audit, privacy, public;

CREATE TABLE device (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    firmware_version VARCHAR(20) NULL,
    umbral_alerta DECIMAL(10,4) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Low')),
    suspension_reason VARCHAR(255) NULL,
    changed_at_status TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_connection_at TIMESTAMPTZ NULL,
    calibration_factor DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    calibration_offset DECIMAL(10,4) NOT NULL DEFAULT 0.0,
    last_calibration_at TIMESTAMPTZ NULL,
    signal_quality INTEGER NULL CHECK (signal_quality BETWEEN 0 AND 100),
    battery_level INTEGER NULL CHECK (battery_level BETWEEN 0 AND 100),
    voltage DECIMAL(5,2) NULL CHECK (voltage >= 0),
    temperature DECIMAL(5,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_device_code_length CHECK (char_length(code) >= 3),
    CONSTRAINT ck_device_status_suspension CHECK (
        status = 'Active' OR suspension_reason IS NOT NULL
    )
);

-- 26. device_history — Historial de cambios de estado del dispositivo
CREATE TABLE device_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason TEXT NULL,
    registered_by UUID NULL REFERENCES user_account(user_account_id),

    CONSTRAINT ck_device_history_status CHECK (new_status IN ('Active', 'Suspended', 'Low', 'Maintenance'))
);

-- 27. calibration_history — Historial de calibraciones (factor K y offset)
CREATE TABLE calibration_history (
    calibration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    previous_factor DECIMAL(10,4) NULL,
    new_factor DECIMAL(10,4) NOT NULL,
    previous_offset DECIMAL(10,4) NULL,
    new_offset DECIMAL(10,4) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    performed_by UUID NULL REFERENCES user_account(user_account_id),
    calibrated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 28. device_telemetry_history — Historial de conectividad
CREATE TABLE device_telemetry_history (
    telemetry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    signal_quality INTEGER NULL CHECK (signal_quality BETWEEN 0 AND 100),
    battery_level INTEGER NULL CHECK (battery_level BETWEEN 0 AND 100),
    voltage DECIMAL(5,2) NULL CHECK (voltage >= 0),
    temperature DECIMAL(5,2) NULL
);
