-- ============================================================
-- DOMINIO 7: REPORTES, ANÁLISIS Y SOPORTE (analytics_support)
-- ============================================================

-- ============================================================
-- PARTE 1: RECOMENDACIONES Y REPORTES (original)
-- ============================================================

-- 40. recommendation_category — Catálogo de categorías de recomendaciones de ahorro
SET search_path TO analytics_support, user_account, home, device, consumption, alert_rate, preference, audit, privacy, public;

CREATE TABLE recommendation_category (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_recommendation_category_name CHECK (char_length(name) >= 3)
);

-- 41. recommendation — Recomendaciones de ahorro
CREATE TABLE recommendation (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES recommendation_category(category_id),
    activation_threshold DECIMAL(10,4) NULL CHECK (activation_threshold >= 0),
    threshold_unit VARCHAR(20) NULL CHECK (threshold_unit IN ('m3_day', 'm3_month', 'lpm', 'percentage')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NULL REFERENCES user_account(user_account_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_recommendation_title CHECK (char_length(title) >= 3),
    CONSTRAINT ck_recommendation_threshold_unit CHECK (
        activation_threshold IS NULL OR threshold_unit IS NOT NULL
    )
);

-- 42. user_recommendation — Recomendaciones asignadas a usuarios
CREATE TABLE user_recommendation (
    user_recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES recommendation(recommendation_id) ON DELETE CASCADE,
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    home_id UUID NULL REFERENCES home(home_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Read', 'Dismissed', 'Applied')),
    usefulness BOOLEAN NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_user_recommendation_reading CHECK (
        status <> 'Read' OR read_at IS NOT NULL
    )
);

-- 43. generated_report — Reportes generados (PDF/Excel)
CREATE TABLE generated_report (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    home_id UUID NULL REFERENCES home(home_id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('pdf', 'excel')),
    category VARCHAR(30) NOT NULL CHECK (
        category IN (
            'daily_consumption',
            'weekly_consumption',
            'monthly_consumption',
            'annual_consumption',
            'consumption_habits',
            'prediction',
            'general',
            'alert',
            'recommendation'
        )
    ),
    period_start DATE NULL,
    period_end DATE NULL,
    include_charts BOOLEAN NOT NULL DEFAULT TRUE,
    storage_path VARCHAR(500) NULL,
    size_bytes INTEGER NULL CHECK (size_bytes >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Generating' CHECK (status IN ('Generating', 'Ready', 'Error')),
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Se usa DEFAULT porque una columna generada debe ser IMMUTABLE y created_at usa now().
    available_until TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),

    CONSTRAINT ck_report_period CHECK (
        period_start IS NULL OR period_end IS NULL OR period_end >= period_start
    ),
    CONSTRAINT ck_report_storage_ready CHECK (
        status <> 'Ready' OR storage_path IS NOT NULL
    ),
    CONSTRAINT ck_report_error CHECK (
        status <> 'Error' OR error_message IS NOT NULL
    )
);

-- ============================================================
-- PARTE 2: SOPORTE TÉCNICO (TICKETS) — 🆕 NUEVO
-- ============================================================

-- 44. ticket_category — Catálogo de categorías de tickets
CREATE TABLE ticket_category (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 45. ticket_priority — Catálogo de prioridades
CREATE TABLE ticket_priority (
    priority_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL UNIQUE,
    level INTEGER NOT NULL UNIQUE
);

-- 46. ticket_status — Catálogo de estados
CREATE TABLE ticket_status (
    status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL UNIQUE
);

-- 47. ticket — Tickets de soporte
CREATE TABLE ticket (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES ticket_category(category_id),
    priority_id UUID NOT NULL REFERENCES ticket_priority(priority_id),
    status_id UUID NOT NULL REFERENCES ticket_status(status_id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    resolved_at TIMESTAMPTZ NULL,
    closed_at TIMESTAMPTZ NULL,
    attachment_url VARCHAR(500) NULL
);

-- 48. ticket_response — Respuestas a tickets
CREATE TABLE ticket_response (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
