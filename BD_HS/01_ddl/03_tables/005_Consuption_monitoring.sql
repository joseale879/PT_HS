-- ============================================================
-- DOMINIO 5: CONSUMO Y MONITOREO (consumption)
-- ============================================================

-- 29. sensor_reading — Lecturas individuales de consumo
SET search_path TO consumption, device, home, user_account, preference, alert_rate, analytics_support, audit, privacy, public;

CREATE TABLE sensor_reading (
    reading_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ(3) NOT NULL,
    consumption_liters DECIMAL(10,2) NOT NULL CHECK (consumption_liters >= 0),
    consumption_m3 DECIMAL(10,4) GENERATED ALWAYS AS (consumption_liters / 1000) STORED,
    activity VARCHAR(20) NOT NULL DEFAULT 'General' CHECK (activity IN ('Shower', 'Laundry', 'Kitchen', 'Cleaning', 'Other', 'General')),
    estimated_cost DECIMAL(10,2) NULL CHECK (estimated_cost >= 0),
    applied_rate DECIMAL(10,4) NULL CHECK (applied_rate >= 0),
    cost_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()

    -- La validacion de fechas futuras se realiza en la capa de aplicacion.
);

-- 30. daily_consumption_summary — Resumen diario de consumo por hogar
CREATE TABLE daily_consumption_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_consumption_m3 DECIMAL(10,4) NOT NULL CHECK (total_consumption_m3 >= 0),
    total_consumption_liters DECIMAL(10,2) NOT NULL CHECK (total_consumption_liters >= 0),
    reading_count INTEGER NOT NULL DEFAULT 0 CHECK (reading_count >= 0),
    total_cost DECIMAL(10,2) NULL CHECK (total_cost >= 0),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_daily_consumption_summary UNIQUE (home_id, date)
);

-- 31. hourly_consumption_history — Resumen horario de consumo por hogar
CREATE TABLE hourly_consumption_history (
    hourly_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
    consumption_liters DECIMAL(10,2) NOT NULL CHECK (consumption_liters >= 0),
    consumption_m3 DECIMAL(10,4) NOT NULL CHECK (consumption_m3 >= 0),
    reading_count INTEGER NOT NULL DEFAULT 0 CHECK (reading_count >= 0),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_hourly_consumption_history UNIQUE (home_id, date, hour)
);

-- 32. monthly_consumption_history — Resumen mensual de consumo por hogar
CREATE TABLE monthly_consumption_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_consumption_m3 DECIMAL(10,4) NOT NULL CHECK (total_consumption_m3 >= 0),
    total_cost DECIMAL(12,2) NULL CHECK (total_cost >= 0),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_monthly_consumption_history UNIQUE (home_id, year, month)
);

-- 33. consumption_prediction — Predicciones de consumo
CREATE TABLE consumption_prediction (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    estimated_consumption_m3 DECIMAL(10,4) NOT NULL CHECK (estimated_consumption_m3 >= 0),
    estimated_cost DECIMAL(12,2) NULL CHECK (estimated_cost >= 0),
    confidence DECIMAL(5,2) NULL CHECK (confidence BETWEEN 0 AND 100),
    model_version VARCHAR(50) NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_prediction_period CHECK (period_end > period_start)
);
