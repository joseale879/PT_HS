-- Catálogo de monedas seleccionables en preferencias.
INSERT INTO preference.currency (currency_id, code, name, symbol, active) VALUES
    (gen_random_uuid(), 'COP', 'Peso colombiano', '$', TRUE),
    (gen_random_uuid(), 'USD', 'United States Dollar', 'US$', TRUE),
    (gen_random_uuid(), 'EUR', 'Euro', '€', TRUE),
    (gen_random_uuid(), 'BRL', 'Real brasileiro', 'R$', TRUE),
    (gen_random_uuid(), 'MXN', 'Peso mexicano', '$', FALSE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    active = EXCLUDED.active;
