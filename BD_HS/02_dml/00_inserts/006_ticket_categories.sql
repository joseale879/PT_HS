-- ============================================================
-- DATOS INICIALES: CATEGORÍAS DE TICKETS
-- ============================================================
INSERT INTO analytics_support.ticket_category (category_id, name, active) VALUES
    (gen_random_uuid(), 'Dispositivo', TRUE),
    (gen_random_uuid(), 'Reportes', TRUE),
    (gen_random_uuid(), 'Tarifas', TRUE),
    (gen_random_uuid(), 'Detección', TRUE),
    (gen_random_uuid(), 'Otros', TRUE);