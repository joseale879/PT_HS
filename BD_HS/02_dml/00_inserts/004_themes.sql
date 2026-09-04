-- ============================================================
-- DATOS INICIALES: TEMAS VISUALES
-- ============================================================
INSERT INTO preference.theme (theme_id, name, primary_color, secondary_color, accent_color, background_color, text_color, mode, active, is_default) VALUES
    (gen_random_uuid(), 'Light', '#1F4E79', '#E0E0E0', '#00A859', '#FFFFFF', '#333333', 'light', TRUE, TRUE),
    (gen_random_uuid(), 'Dark', '#2E86C1', '#424949', '#1ABC9C', '#121212', '#F5F5F5', 'dark', TRUE, FALSE),
    (gen_random_uuid(), 'High Contrast', '#FFFF00', '#000000', '#FF0000', '#000000', '#FFFFFF', 'system', TRUE, FALSE);