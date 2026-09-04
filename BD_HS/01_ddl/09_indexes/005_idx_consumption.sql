-- ============================================================
-- ÍNDICES - DOMINIO: consumption
-- ============================================================
CREATE INDEX idx_sensor_reading_device_id ON consumption.sensor_reading(device_id);
CREATE INDEX idx_sensor_reading_home_id ON consumption.sensor_reading(home_id);
CREATE INDEX idx_sensor_reading_recorded_at ON consumption.sensor_reading(recorded_at DESC);
CREATE INDEX idx_sensor_reading_activity ON consumption.sensor_reading(activity);
CREATE INDEX idx_sensor_reading_home_date ON consumption.sensor_reading(home_id, recorded_at DESC);

CREATE INDEX idx_daily_consumption_summary_home_date ON consumption.daily_consumption_summary(home_id, date DESC);

CREATE INDEX idx_hourly_consumption_history_home_date_hour ON consumption.hourly_consumption_history(home_id, date, hour);

CREATE INDEX idx_monthly_consumption_history_home_year_month ON consumption.monthly_consumption_history(home_id, year, month);

CREATE INDEX idx_consumption_prediction_home_period ON consumption.consumption_prediction(home_id, period_start, period_end);