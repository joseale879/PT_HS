-- ============================================================
-- ÍNDICES - DOMINIO: preference
-- ============================================================
CREATE INDEX idx_language_code ON preference.language(code);
CREATE INDEX idx_language_active ON preference.language(active);

CREATE INDEX idx_currency_code ON preference.currency(code);
CREATE INDEX idx_currency_active ON preference.currency(active);

CREATE INDEX idx_theme_mode_active ON preference.theme(mode, active);
CREATE INDEX idx_theme_is_default ON preference.theme(is_default) WHERE is_default = TRUE;

CREATE INDEX idx_user_preference_language ON preference.user_preference(language_id);
CREATE INDEX idx_user_preference_currency ON preference.user_preference(currency_id);
CREATE INDEX idx_user_preference_theme ON preference.user_preference(theme_id);