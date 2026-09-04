-- ============================================================
-- ÍNDICES - DOMINIO: device
-- ============================================================
CREATE INDEX idx_device_status ON device.device(status);
CREATE INDEX idx_device_type ON device.device(type);
CREATE INDEX idx_device_code ON device.device(code);
CREATE INDEX idx_device_last_connection_at ON device.device(last_connection_at) WHERE status = 'Active';
CREATE INDEX idx_device_umbral_alerta ON device.device(umbral_alerta) WHERE umbral_alerta IS NOT NULL;

CREATE INDEX idx_device_history_device_id ON device.device_history(device_id);
CREATE INDEX idx_device_history_changed_at ON device.device_history(changed_at);

CREATE INDEX idx_calibration_history_device_id ON device.calibration_history(device_id);
CREATE INDEX idx_calibration_history_date ON device.calibration_history(calibrated_at);

CREATE INDEX idx_device_telemetry_device_id ON device.device_telemetry_history(device_id);
CREATE INDEX idx_device_telemetry_recorded_at ON device.device_telemetry_history(recorded_at DESC);