-- ============================================================
-- DATOS INICIALES: ESTRATOS SOCIOECONÓMICOS
-- ============================================================
INSERT INTO alert_rate.estratos (estrato_id, numero_estrato, descripcion, valor_base_m3, subsidio_porcentaje) VALUES
    (gen_random_uuid(), 1, 'Estrato 1 - Bajo-Bajo', 1500.00, 70.00),
    (gen_random_uuid(), 2, 'Estrato 2 - Bajo', 1800.00, 60.00),
    (gen_random_uuid(), 3, 'Estrato 3 - Medio-Bajo', 2200.00, 40.00),
    (gen_random_uuid(), 4, 'Estrato 4 - Medio', 3500.00, 0.00),
    (gen_random_uuid(), 5, 'Estrato 5 - Medio-Alto', 4200.00, -20.00),
    (gen_random_uuid(), 6, 'Estrato 6 - Alto', 5000.00, -30.00);