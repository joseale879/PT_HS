-- Catálogo de idiomas admitidos por la aplicación.
INSERT INTO preference.language (language_id, code, name, active) VALUES
    (gen_random_uuid(), 'es', 'Español', TRUE),
    (gen_random_uuid(), 'en', 'English', TRUE),
    (gen_random_uuid(), 'pt', 'Português', TRUE),
    (gen_random_uuid(), 'it', 'Italiano', TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    active = EXCLUDED.active;
