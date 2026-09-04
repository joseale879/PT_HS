-- ============================================================
-- DOMINIO 2: PREFERENCIAS Y PERSONALIZACIÓN (preference)
-- ============================================================

-- 14. language — Catálogo de idiomas disponibles
SET search_path TO preference, user_account, home, device, consumption, alert_rate, analytics_support, audit, privacy, public;

CREATE TABLE language (
    language_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_language_code_length CHECK (char_length(code) BETWEEN 2 AND 10)
);

-- 15. currency — Catálogo de monedas disponibles
CREATE TABLE currency (
    currency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(5) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_currency_code_length CHECK (char_length(code) BETWEEN 2 AND 10)
);

-- 16. theme — Catálogo de temas visuales (Light, Dark, High Contrast)
CREATE TABLE theme (
    theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    primary_color VARCHAR(7) NOT NULL,
    secondary_color VARCHAR(7) NULL,
    accent_color VARCHAR(7) NULL,
    background_color VARCHAR(7) NULL,
    text_color VARCHAR(7) NULL,
    mode VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (mode IN ('light', 'dark', 'system')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_theme_primary_color CHECK (primary_color ~* '^#[0-9A-F]{6}$'),
    CONSTRAINT ck_theme_secondary_color CHECK (secondary_color IS NULL OR secondary_color ~* '^#[0-9A-F]{6}$'),
    CONSTRAINT ck_theme_accent_color CHECK (accent_color IS NULL OR accent_color ~* '^#[0-9A-F]{6}$'),
    CONSTRAINT ck_theme_background_color CHECK (background_color IS NULL OR background_color ~* '^#[0-9A-F]{6}$'),
    CONSTRAINT ck_theme_text_color CHECK (text_color IS NULL OR text_color ~* '^#[0-9A-F]{6}$')
);

-- 17. user_preference — Preferencias del usuario (idioma, moneda, tema, FCM, notificaciones)
CREATE TABLE user_preference (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL UNIQUE REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    language_id UUID NULL REFERENCES language(language_id),
    currency_id UUID NULL REFERENCES currency(currency_id),
    theme_id UUID NULL REFERENCES theme(theme_id),
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_channel VARCHAR(20) NOT NULL DEFAULT 'Email' CHECK (preferred_channel IN ('Email', 'SMS', 'Push', 'All')),
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    fcm_token TEXT NULL,
    fcm_token_updated_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_user_preference_notification_json CHECK (jsonb_typeof(notification_preferences) = 'object'),
    CONSTRAINT ck_user_preference_fcm_token CHECK (
        fcm_token IS NULL OR fcm_token_updated_at IS NOT NULL
    )
);
