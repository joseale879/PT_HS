-- ============================================================
-- DOMINIO 6: ALERTAS, TARIFAS Y CONTROL (alert_rate)
-- ============================================================

-- 34. threshold_configuration — Configuración de topes de consumo (diario y mensual)
SET search_path TO alert_rate, home, user_account, device, consumption, preference, analytics_support, audit, privacy, public;

CREATE TABLE threshold_configuration (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL UNIQUE REFERENCES home(home_id) ON DELETE CASCADE,
    monthly_limit DECIMAL(10,2) NULL CHECK (monthly_limit >= 0),
    daily_limit DECIMAL(10,2) NULL CHECK (daily_limit >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NULL REFERENCES user_account(user_account_id),

    CONSTRAINT ck_threshold_configuration_at_least_one_limit CHECK (
        monthly_limit IS NOT NULL OR daily_limit IS NOT NULL
    )
);

-- 35. alert_rule — Reglas de alerta personalizadas
CREATE TABLE alert_rule (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (
        alert_type IN (
            'excessive_consumption',
            'leak_detected',
            'monthly_limit',
            'daily_limit',
            'no_reading'
        )
    ),
    threshold DECIMAL(10,4) NOT NULL CHECK (threshold >= 0),
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('m3_day', 'm3_month', 'lpm')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    created_by UUID NULL REFERENCES user_account(user_account_id)
);

-- 36. alert_event — Eventos de alerta generados
CREATE TABLE alert_event (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rule(rule_id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    message VARCHAR(500) NOT NULL,
    detected_value DECIMAL(10,4) NULL CHECK (detected_value >= 0),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Read', 'Dismissed')),
    read_at TIMESTAMPTZ NULL,
    dismissed_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_alert_event_read CHECK (status <> 'Read' OR read_at IS NOT NULL),
    CONSTRAINT ck_alert_event_dismissed CHECK (status <> 'Dismissed' OR dismissed_at IS NOT NULL)
);

-- 37. alert_notification — Notificaciones enviadas por cada evento
CREATE TABLE alert_notification (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES alert_event(event_id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('Email', 'SMS', 'Push')),
    recipient VARCHAR(200) NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NULL,
    send_error TEXT NULL,
    push_message_id TEXT NULL,

    CONSTRAINT ck_alert_notification_send CHECK (sent = FALSE OR sent_at IS NOT NULL)
);

-- 38. home_rate — Tarifas de agua (valor por m³ y cargo fijo) con vigencia
CREATE TABLE home_rate (
    rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    tier SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 6),
    m3_value DECIMAL(12,4) NOT NULL CHECK (m3_value >= 0),
    fixed_charge DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (fixed_charge >= 0),
    valid_from DATE NOT NULL,
    valid_until DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT uq_home_rate_tier_valid_from UNIQUE (home_id, tier, valid_from),
    CONSTRAINT ck_home_rate_validity CHECK (valid_until IS NULL OR valid_until >= valid_from),
    CONSTRAINT no_overlapping_rate EXCLUDE USING gist (
        home_id WITH =,
        daterange(valid_from, COALESCE(valid_until, 'infinity'), '[)') WITH &&
    )
);

-- 39. estratos — Catálogo de estratos socioeconómicos (1-6) con valores base y subsidios
CREATE TABLE estratos (
    estrato_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_estrato INTEGER NOT NULL UNIQUE CHECK (numero_estrato BETWEEN 1 AND 6),
    descripcion VARCHAR(100) NULL,
    valor_base_m3 DECIMAL(10,2) NOT NULL,
    subsidio_porcentaje DECIMAL(5,2) NULL,
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    estado BOOLEAN DEFAULT TRUE
);
